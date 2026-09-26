---
name: performance
description: Use when working on Snakenet performance - tick cost, broadcast volume, canvas rendering or WebSocket compression - or when judging whether an optimization is worth it. Covers the hot paths, the measurement harness for this repo (there is no test framework), the measured baseline numbers, and the pitfalls that silently reintroduce per-tick full-board work. Do not use for features that are not performance-related.
---

# Performance Work

The runtime invariants that must not regress live in `AGENTS.md` ("Runtime contracts that must not regress"). This skill covers the hot paths, how to measure without a test framework, the measured baseline, and the known traps.

## When to use

- Profiling or optimizing the game loop, the field, the socket payload or `View.draw()`.
- Judging whether a suspected hot spot is worth changing.
- A change could reintroduce per-tick full-board work (e.g. a new loop over all 2500 blocks) or add a state change that must set `sendBroadcast`.
- Re-measuring after changes to the wire format, the tick rate or the player count.

## Hot paths

- `Game.animation()` -> `move()` -> `Player.move()`: cost = tick rate (interval slider 30-500 ms, default 100 ms) x players x body length. Body is a ring buffer, no `unshift`/`pop`.
- `Field.reset()` + `applyBodyToField()`: must touch only occupied cells (`occupiedCells`), never a full 2500-block scan.
- `Game.getSocketData()` -> `Field.getSocketData(full)`: serialization plus `JSON.stringify`; full snapshots only on join, deltas otherwise.
- `View.draw()`: canvas ops per cell; only redraw the cells a delta carries, cache `fillStyle`, one global border.
- Transport: bytes per message. No compression is negotiated (see Pitfalls).

## Measuring (there is no test framework)

All harnesses are throwaway `node -e` snippets or temp scripts outside the repo; never commit them. `Game` logs to the console (`Game::addPlayer`, `Player N is dead ...`), which is normal.

### 1. Payload size per tick (server)

Drive the real model with a stub `SocketMessage` and measure the exact strings that would be emitted. Run `npm run build` first, then the snippet from the repo root - the server is TypeScript, so require the **compiled** output in `server/`, not `src/`:

```js
const zlib = require('zlib');
const Config = require('./server/model/config.js');
const Game = require('./server/model/game.js');

const config = new Config();
config.setWalls(true);
const stub = { sendGameData: () => {}, sendChatMessage: () => {} };
const game = new Game(config, stub);
for (let i = 0; i < 8; i++) { game.addPlayer('s' + i); }

const full = JSON.stringify(game.getSocketData(true));
console.log('full', Buffer.byteLength(full), 'B, deflate proxy',
	zlib.deflateRawSync(Buffer.from(full, 'utf8')).length, 'B');

game.setStart('s0');
game.startTimeCountdown = Date.now() - 1;
for (let i = 0; i < 30; i++) {
	game.move();
	console.log('delta', Buffer.byteLength(JSON.stringify(game.getSocketData(false))), 'B');
}
```

- Measure the full snapshot **right after `addPlayer`** (before any `move()`). With 8 players the initial directions are random, so in some runs all of them die on the first tick and every number looks unrealistically small - check that the tick loop actually produced 30 payloads before trusting the statistics.
- Use 2-3 players for delta statistics and report min/avg/max plus how many deltas exceed 1024 B.
- `zlib.deflateRawSync` is only a size proxy for `permessage-deflate` (same codec, no framing), not a wire measurement.
- `getSocketData()` empties the dirty set, so take the full snapshot first and the deltas afterwards.

### 2. Tick cost (server)

Skip `setInterval` and drive the loop directly: `const t = process.hrtime.bigint(); for (let i = 0; i < 10000; i++) { game.move(); }`. Report absolute time per tick together with the tick rate and player count it was measured at; the slider goes down to 30 ms (~33 ticks/s), so multiply accordingly.

### 3. Canvas ops (client)

Instantiate `View` with a stub canvas/context and count `clearRect`, `fillRect`, `strokeRect` and `fillStyle` assignments for one full snapshot and one delta. Expected: a delta touches only the cells it carries, sets `fillStyle` only on a real color change, and issues exactly one `strokeRect` for the border.

### 4. Transport negotiation

To see whether permessage-deflate is actually negotiated, start a real server on port 0 and inspect both sides instead of reasoning from the sources:

```js
const server = require('http').createServer();
const io = require('socket.io')(server, { transports: ['websocket'] });
io.engine.on('connection', (es) => console.log('server-ext', Object.keys(es.transport.socket._extensions)));
// client: socket.io-client with { transports: ['websocket'] }
// client-ext: Object.keys(client.io.engine.transport.ws._extensions)
```

`[]` on both sides means nothing is compressed. Add `perMessageDeflate: { threshold: 0 }` to compare.

## Baseline (measured 2026-09-25, 8 players, 50x50, growth 5)

- Per-tick delta: 93-300 B, avg ~105-220 B -> ~1-2 KB/s per client at 10 ticks/s.
- Full snapshot: ~500 B without walls, ~1.9 KB with walls (raw deflate: 218 B / 611 B).
- Own-body collision lookup: 2 million lookups on a 50-segment body took 6.9 ms with the body bitmask vs 57.3 ms with the previous linear scan.
- Traffic is ~1 KB/s per client; on a LAN this is not a bottleneck, so transport-level tricks are not worth their risk.

## Pitfalls

- **Do not enable `perMessageDeflate`.** Nothing is compressed today: neither side sets the option and `ws`'s `WebSocketServer` defaults to `perMessageDeflate: false`, so the client's offer is never accepted. Even enabled it would only shrink the join snapshot (~1.9 KB -> 0.6 KB, once), because all per-tick deltas (93-300 B) stay below `ws`'s 1024 B `threshold`. Reconsider only if per-tick payloads grow past the threshold.
- **Do not reintroduce a reused output array in `Field.getSocketData()`.** It was implemented and then removed again: `SocketMessage.sendGameData()` serializes synchronously, so reuse is safe, but `result.length = 0` does not guarantee that the engine reuses the backing store, so the win is unproven. `Game.getSocketData()` still allocates the small `data`/`player` objects per broadcast; they are not a bottleneck.
- **Do not add a per-tick loop over all 2500 blocks** in `reset()`, `getSocketData()` or the client grid. Track only what changed.
- **Do not linear-scan the own body for collision.** `Field.hasBody()` (body bitmask) is O(1); `Block.isBitSetOnly()` is only for foreign snakes, and shared cells must not unmark too early.
- **Do not forget `sendBroadcast`** in a new state-changing `Game` method. Symptom: the client silently keeps the old state (no error, no crash). See the list in `AGENTS.md`.
- **Change the wire format on both sides at once**: `Field.getSocketData()`, `Game.getSocketData()`, `src/client/js/controller/controller.js` and `View.draw()` (see `skills/add-socket-message/SKILL.md`).
- **Do not trust docs that claim compression is on by default.** That assumption was wrong and led to a wrong conclusion; verify with harness 4 above.

## Verification

Run the build-verify workflow (`skills/build-verify/SKILL.md`) after any change, and hand the user the numbers (before/after, tick rate, player count) together with the commit message - commits are done by humans, and a performance claim without a measurement is not a result.
