---
name: create-model-class
description: Use when adding a new state/data model class to the Snakenet server (a file under src/server/model/, like Field, Player, Block, Config, SocketMessage). Covers the observed CommonJS class conventions, private members, getter/setter guards, constructor dependency injection, and the Field/Block bitmask interface for anything grid-related. Do not use for client view classes or wiring.
---

# Creating a Server Model Class

Follow the exact conventions used by every class under `src/server/model/` (`config.js`, `field.js`, `block.js`, `player.js`, `game.js`, `socketMessage.js`) and `src/server/classes/vector2.js`.

## File skeleton (observed everywhere)

```js
class MyClass {
    constructor(config) {
        this._config = config;
    }

    // methods...

    getName() {
        return this._name;
    }
}

module.exports = MyClass;
```

- CommonJS: `require(...)` at top, `module.exports = MyClass;` at the end. Never `export` / ESM.
- One class per file. The file path is the class home (do not put a second class in the same file; `Field` uses `Block` via `require('./block')`, `Player` uses `Vector2` via `require('../classes/vector2')`).

## Conventions to apply

### Naming and privacy
- Private members prefixed with `_`: `_config`, `_field`, `_name`, `_directionQueue`. No `#private` syntax anywhere in the codebase.
- Methods are camelCase. Multi-word private methods also use `_` (`Field._init`, `Player._initPlayerByIndex`, `Player._collideWall`, `SocketMessage._parseChatMessage`, `Game.init` is public but the pattern is the same).

### Getter/setter pairs with range guards
Where a value is user-configurable, expose `getX()` / `setX(value)` and guard the range exactly like `Config` does (`src/server/model/config.js`):

```js
getGrowth() {
    return this._growth;
}

setGrowth(value) {
    if (value >= 0 && value <= 50) {
        this._growth = value;
    }
}
```

Ranges must match the UI sliders in `src/client/index.html` (growth min 0 max 50, interval 30-500, startLength 3-10). `setWalls` normalizes input to a boolean (`this._walls = (value > 0);`).

Simple read-only / non-configurable values use plain getters without setters (`Player.getColor()`, `Player.getIndex()`).

### Constructor dependency injection
Inject collaborators via the constructor, never instantiate them as module singletons. The chain in `src/server/controller/controller.js` is `new Controller()` -> `new Game(this._config, this._socketMessage)` -> `new Field(this._config)`, `new Player(this._config, socketId, i + 1)`. A new model that needs options receives `config`; one that needs to emit receives `socketMessage`.

Keep same-file requires as classes: `require('./constants')` for `Object.freeze`-constants, `require('./block')` / `require('../classes/vector2')` for helpers.

### Constants
New magic numbers with semantic meaning belong in `src/server/model/constants.js` (an `Object.freeze({ ... })` module export, not a class). Existing groups: `START_COUNTDOWN`/`STOP_COUNTDOWN` (ms), `GAME_*` statuses, `LEFT/UP/RIGHT/DOWN` directions, `COLOR_*` color IDs. Do not put shared constants inside a class.

## Grid-related model: use the Field/Block interface

Any model that touches the play grid must go through `Field` (`src/server/model/field.js`), which delegates to `Block` (`src/server/model/block.js`):

- Read/write a cell: `field.setIndex(x, y, value, index)` / `field.resetIndex(x, y, index)` — `x`=col, `y`=row, `value` is a color ID, `index` is the player index (1..8).
- Check head-vs-body-on-head: `field.collideSnake(x, y, index)` (wraps `Block.isBitSetOnly(index)`).
- Whole-grid snapshot for the wire: `Field.getSocketData()` returns `[row, col, value]` triples (row first, col second) — only cells with `getValue() > 0`.

Do not store `Block` objects outside `Field`'s `_field`; `Player` never accesses `Block` directly, it calls `Field` methods (`applyBodyToField`, `cleanUp`, `collide`).

## Verification

- Syntax check the new file: `node -c src/server/model/<file>.js`.
- If it participates in the game loop or game state, run the build-verify workflow (`skills/build-verify/SKILL.md`).