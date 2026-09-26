---
name: create-model-class
description: Use when adding a new state/data model class to the Snakenet server (a file under src/server/model/, like Field, Player, Block, Config, SocketMessage). Covers the observed TypeScript class conventions, private members, getter/setter guards, constructor dependency injection, and the Field/Block bitmask interface for anything grid-related. Do not use for client view classes or wiring.
---

# Creating a Server Model Class

Follow the exact conventions used by every class under `src/server/model/` (`config.ts`, `field.ts`, `block.ts`, `player.ts`, `game.ts`, `socketMessage.ts`) and `src/server/classes/vector2.ts`. The server is TypeScript; new server files are `.ts` (the client under `src/client/` is still JavaScript).

## File skeleton (observed everywhere)

```ts
import type Config = require('./config');

class MyClass {
	private config: Config;

	constructor(config: Config) {
		this.config = config;
	}

	// methods... every parameter and return value is typed

	getName(): string {
		return this.name;
	}
}

export = MyClass;
```

- CommonJS module style, because the emit target is CommonJS: `export = MyClass;` at the end, `import X = require('./x');` at the top. Never `export default` / ESM `import ... from` in the server.
- A dependency used only as a type (`Config`, `Field`, `SocketMessage`) is imported with `import type X = require('./x');` so no `require` is emitted for it.
- Declare every field with an explicit type and assign it in the constructor - no field initializers (`useDefineForClassFields` is `false`, so initializers would move ahead of the constructor body).
- One class per file. The file path is the class home (do not put a second class in the same file; `Field` uses `Block` via `import Block = require('./block')`, `Player` uses `Vector2` via `import Vector2 = require('../classes/vector2')`).

## Conventions to apply

### Naming and privacy
- Visibility is expressed with TypeScript's `private` keyword. Private members have **no** underscore prefix: `config`, `field`, `name`, `directionQueue`. The `_` prefix from the JavaScript era is gone by user decision - do not reintroduce it. No `#private` syntax anywhere in the codebase.
- Methods are camelCase, with or without `private` (`Field.init`, `Player.initPlayerByIndex`, `Player.collideWall`, `SocketMessage.parseChatMessage`, `Game.init` is public but the pattern is the same).
- Prefer concrete types over `any`: collections are typed (`Block[][]`, `Set<number>`, `Map<string, Player>`), and optional wire fields are `field?: boolean` rather than `any`.

### Getter/setter pairs with range guards
Where a value is user-configurable, expose `getX()` / `setX(value)` and guard the range exactly like `Config` does (`src/server/model/config.ts`):

```ts
getGrowth(): number {
    return this.growth;
}

setGrowth(value: number): void {
    if (value >= 0 && value <= 50) {
        this.growth = value;
    }
}
```

Ranges must match the UI sliders in `src/client/index.html` (growth min 0 max 50, interval 30-500, startLength 3-10). `setWalls` takes the boolean the wire contract declares (`GameOptionsInput.walls: boolean`) and assigns it directly.

Simple read-only / non-configurable values use plain getters without setters (`Player.getColor()`, `Player.getIndex()`).

### Constructor dependency injection
Inject collaborators via the constructor, never instantiate them as module singletons. The chain in `src/server/controller/controller.ts` is `new Controller()` -> `new Game(this.config, this.socketMessage)` -> `new Field(this.config)`, `new Player(this.config, socketId, i + 1)`. A new model that needs options receives `config: Config`; one that needs to emit receives `socketMessage: SocketMessage`.

Keep same-file imports as classes: `import Constants = require('./constants')` for the `Object.freeze`-constants, `import Block = require('./block')` / `import Vector2 = require('../classes/vector2')` for helpers.

### Wire payloads
Anything sent to clients goes through `SocketMessage` and must match `src/types/protocol.d.ts` (`GameState`, `GameOptions`, `GameOptionsInput`). Type the emit site instead of re-declaring a payload shape; see the "Socket message protocol" section in `AGENTS.md`.

### Constants
New magic numbers with semantic meaning belong in `src/server/model/constants.ts` (an `Object.freeze({ ... } as const)` module export, not a class). Existing groups: `START_COUNTDOWN`/`STOP_COUNTDOWN` (ms), `GAME_*` statuses, `LEFT/UP/RIGHT/DOWN` directions, `COLOR_*` color IDs. Do not put shared constants inside a class.

## Grid-related model: use the Field/Block interface

Any model that touches the play grid must go through `Field` (`src/server/model/field.ts`), which delegates to `Block` (`src/server/model/block.ts`). `x` = column, `y` = row (the grid is `field[y][x]`), the flat cell index is `row * tiles + col`.

- Write a head cell: `field.setIndex(x, y, value, index)` — `value` is a color ID, `index` is the player index (1..8).
- Write a body/tail cell: `field.setBodyIndex(x, y, Constants.COLOR_TAIL, index)`.
- Clear a cell: `field.resetIndex(x, y, index)` / `field.resetBodyIndex(x, y, index)`.
- Own-body lookup (O(1) bitmask): `field.hasBody(x, y, index)` (wraps `Block.isBodyBitSet`). This is what `Player.collideSnake` uses.
- Foreign-snake lookup: `field.collideSnake(x, y, index)` (wraps `Block.isBitSetOnly`).
- Whole-grid snapshot for the wire: `Field.getSocketData(full: boolean): number[]` returns the flat `[tileIndex, value, tileIndex, value, …]` sequence.
  - `full === true`: every cell with `getValue() > 0`.
  - `full === false` (delta): **every dirty cell, including `value === 0`** — the zero is how the client deletes a cell. Do not filter it out, and do not emit a full board from here.
  - The call empties the dirty set, so a harness must take the full snapshot before the deltas.

Do not store `Block` objects outside `Field`'s `field` array, and never touch the grid directly from a model: `Player` reaches the grid exclusively through the `Field` methods above. (Its own `applyBodyToField(field)`, `applyHeadToField(field)`, `cleanUp(field)` and `collide(field)` are the *caller* side of that contract, not `Field` methods.)

## Verification

- `npm run typecheck` and `npm run lint` must stay green; a new server class is not covered until it type-checks. Neither tool sees `src/client/`, so a client-side change is not covered here either.
- If it participates in the game loop or game state, run the build-verify workflow (`skills/build-verify/SKILL.md`) — that is the only path that actually exercises the client.
- If it adds a **state-changing method on `Game`**, that method must set `this.sendBroadcast = true` - otherwise the client silently keeps the old state. See "Tick loop and broadcast gating" in `AGENTS.md`.
