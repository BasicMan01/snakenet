---
name: build-verify
description: Use after any change to verify the Snakenet project still builds and runs. Covers building the client bundle with webpack, starting the Socket.IO server, and confirming the client-server handshake. Do not use for writing features - only for verification.
---

# Build & Verify Workflow

Verify Snakenet changes manually. There is no test suite and no formatter. `npm run typecheck` / `npm run lint` cover the TypeScript server sources; the client is still plain JavaScript, so its changes are verified by the steps below (see the "TypeScript" section in `AGENTS.md`).

## When to use

- After any change to `src/server/**` or `src/client/**`, unless the user explicitly skipped verification.
- After adding dependencies (`npm install <pkg>`).

## Steps

### 1. Type-check and lint the server

```powershell
npm run typecheck
npm run lint
```

- Both are expected to pass at any time. They only see `src/server/**/*.ts`; a client `.js` file is invisible to them, so a green run is **not** evidence that a client change is correct - steps 2-4 still apply.

### 2. Build the client

The client must be rebuilt whenever `src/client/**` changes; `client/` is generated and gitignored.

```powershell
npm run build-prod
```

- Expect `client/js/app.js`, `client/index.html`, `client/css/global.css` to be produced/updated from `src/client/*` (`webpack.config.js` uses `copy-webpack-plugin`).
- `npm run build-dev` produces the non-minified bundle for development.
- The build reads `.env` (`SERVER_PORT`, see "Port configuration" in `AGENTS.md`) and inlines it into the bundle; a missing/invalid `.env` aborts the build with `.env not readable, copy .env.template to .env` or `SERVER_PORT in .env must be an integer between 1 and 65535`.
- Never edit `client/` by hand; only the webpack output matters.

### 3. Start the server

```powershell
npm run start
```

- Entry point: the compiled `server/server.js` (`npm run start` runs `tsc` via `prestart`, then `node server/server`; the source is `src/server/server.ts`).
- The server reads the port from `.env` at startup (`dotenv` in `src/server/controller/controller.ts`), so it must be started from the repo root. Console prints `listening on *:<SERVER_PORT>` (`*:3000` with the default `.env`).
- Confirm Socket.IO is WebSocket-only (`transports: ['websocket']`).

### 4. Manual smoke test (optional, requires the built client)

- Serve `client/` over HTTP (project uses Apache; `.htaccess` allows localhost and the `192.168.178` subnet). README URL: `http://127.0.0.1/snakenet/client/`.
- Open two browser tabs, enter a nickname and connect to `127.0.0.1` plus the port from `.env` (default `127.0.0.1:3000`). The port is baked into the bundle at build time, so a changed `.env` needs a rebuild before the browser picks it up.
- Expected: both connect; the first player receives `SN_SERVER_IS_CREATOR` = `1`, the second `0`. Creator-only UI (`iconOptions`) is shown via `View.show('iconOptions', ...)` in `src/client/js/controller/controller.js:69`.
- Chat join messages ("... joined the game") appear in the chat list (`Game.setPlayerName` broadcasts via `SN_SERVER_CHAT_MESSAGE`).

### 5. Report

State exactly what was run and the observed output (e.g. build success, `listening on *:3000`, connection handshake). Do not claim success without seeing it.