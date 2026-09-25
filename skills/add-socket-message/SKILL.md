---
name: add-socket-message
description: Use when adding a new Socket.IO message or event to the Snakenet project. Covers the end-to-end wiring required to keep the client and server in sync: server handler in src/server/controller/controller.ts, the send helper in src/server/model/socketMessage.ts, the client emit/listen in src/client/js/controller/controller.js, and (when user-triggerable) the Observable wiring in src/client/js/view/view.js. Do not use for pure model changes with no networking.
---

# Adding a Socket Message

The socket message names are the contract between client and server. Both sides must stay in sync; a message added on one side only is a bug. All server-emitted messages go through the single class `src/server/model/socketMessage.ts`.

## Message naming

- Client -> Server: name starts with `SN_CLIENT_` (e.g. `SN_CLIENT_DIRECTION`).
- Server -> Client: name starts with `SN_SERVER_` (e.g. `SN_SERVER_MESSAGE`).
- Payload style follows existing messages:
  - Game state / options use a JSON string (`JSON.stringify` on the sender, `JSON.parse` on the receiver) — see `SN_SERVER_MESSAGE` and `SN_SERVER_OPTIONS`.
  - Chat uses three separate arguments `(playerName, playerColor, message)` — see `SN_SERVER_CHAT_MESSAGE`.

## Server side

### 1. Handler in `src/server/controller/controller.ts`

Register inside `io.on('connection', (socket) => { ... })`, alongside the existing `socket.on('SN_CLIENT_*')` handlers:

```ts
socket.on('SN_CLIENT_MY_NEW_MESSAGE', (arg: number) => {
    this._game.doThing(socket.id, arg);
});
```

- The handler is a thin dispatch: it delegates to `this._game` (see `Game.setDirection`, `Game.setPause`).
- Annotate the listener parameters - the Socket.IO default event map leaves them untyped, so an explicit annotation is what makes the handler type-checked. Add the name to `ClientMessage`/`ServerMessage` in `src/types/protocol.d.ts`.
- If the message requires creator rights, guard with `this._game.isCreator(socket.id)` exactly like `SN_CLIENT_OPTIONS_LOAD`/`SN_CLIENT_OPTIONS_SAVE`/`SN_CLIENT_RESET_POINTS` do.
- If socket.id is needed for lookup, use it as the first argument (all existing game methods take `socketId`).

### 2. Model method on `Game` (`src/server/model/game.ts`, optional)

Add a `doThing(socketId, ...)` method. Existing pattern (note the single `get`: TypeScript cannot narrow `Map.get` through `has`):

```ts
doThing(socketId: string, value: number): void {
    const player = this._socketIndex.get(socketId);

    if (player !== undefined) {
        player.setSomething(value);
    }
}
```

- Player lookup goes through the `this._socketIndex` Map (`Game.addPlayer` populates it).
- If the game state machine must be respected, early-return on status like `Game.setDirection` does (`this._gameStatus !== Constants.GAME_RUN`).

### 3. Emit via `src/server/model/socketMessage.ts`

Do NOT `io.emit` from the controller or model. Add a method here (the only file that emits):

```ts
sendMyData(data: GameState): void {
    this._io.emit('SN_SERVER_MY_NEW_MESSAGE', JSON.stringify(data));
}
```

- Broadcast to all: `this._io.emit(...)`.
- To one client only: `this._io.to(socketId).emit(...)` (see `sendCreatorInfo`).

### 4. Game state payload (if you added fields)

Update `Game.getSocketData()` (`src/server/model/game.ts`) so the new data reaches clients through `SN_SERVER_MESSAGE`. Keep tuples positional: `data.player` is `[index, colorId, name, points]`; `data.tiles` carries the tile count from `Config.tiles`, and `data.field` is a flat sequence `[tileIndex, colorId, tileIndex, colorId, ...]` where `tileIndex = row * tiles + col`.

## Client side

### 5. Listener / emitter in `src/client/js/controller/controller.js`

For a server-initiated message, register the listener inside `connectAction` where the other `this.socket.on('SN_SERVER_*')` handlers live:

```js
this.socket.on('SN_SERVER_MY_NEW_MESSAGE', (msg) => {
    // TODO VALIDATION
    const data = JSON.parse(msg);

    this.view.showMyData(data);
});
```

For a client-initiated message, add a method mirroring `sendDirectionAction`:

```js
sendMyAction() {
    this.socket.emit('SN_CLIENT_MY_NEW_MESSAGE');
}
```

### 6. Observable wiring in `src/client/js/controller/controller.js` `init()`

If the action is user-triggerable, add both sides of the Observable pattern:

- Register the callback in `Controller.init()`:
  ```js
  this.view.addCallback('sendMyAction', this.sendMyAction.bind(this));
  ```
- Emit the token from `src/client/js/view/view.js` at the user-trigger point (input event or `window.addEventListener('keydown', ...)`):
  ```js
  this.emit('sendMyAction', { 'someArg': value });
  ```

The token is camelCase ending in `Action` (existing tokens: `'connectAction'`, `'sendDirectionAction'`, `'sendPauseAction'`, `'sendStartAction'`, `'sendChatMessageAction'`, `'loadOptionsAction'`, `'saveOptionsAction'`, `'resetPointsAction'`).

### 7. Colors (if the message introduces a new display color)

Add the integer ID in `src/server/model/constants.ts` (e.g. `COLOR_MY_THING: 30`) and a matching case in `View.getColorById()` at `src/client/js/view/view.js`. Keep the number ranges separate per type (colors currently: 1-8 players, 10 tail, 11 wall, 20 text).

## Verification

Run the build-verify workflow (`skills/build-verify/SKILL.md`): `npm run build-prod`, `npm run start`, manual two-client smoke test checking the new message flows both ways.