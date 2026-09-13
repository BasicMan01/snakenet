---
name: build-verify
description: Use after any change to verify the Snakenet project still builds and runs. Covers building the client bundle with webpack, starting the Socket.IO server, and confirming the client-server handshake. Do not use for writing features - only for verification.
---

# Build & Verify Workflow

Verify Snakenet changes manually. There is no test suite and no linter/formatter (no `devDependencies` in `package.json`), so this is the only verification path.

## When to use

- After any change to `src/server/**` or `src/client/**`, unless the user explicitly skipped verification.
- After adding dependencies (`npm install <pkg>`).

## Steps

### 1. Optionally syntax-check server files

`node -c <file>` (Node's syntax check) works per file on Windows/PowerShell. Node is required for the project anyway.

### 2. Build the client

The client must be rebuilt whenever `src/client/**` changes; `client/` is generated and gitignored.

```powershell
npm run prod
```

- Expect `client/js/app.js`, `client/index.html`, `client/css/global.css` to be produced/updated from `src/client/*` (`webpack.config.js` uses `copy-webpack-plugin`).
- `npm run dev` produces the non-minified bundle for development.
- Never edit `client/` by hand; only the webpack output matters.

### 3. Start the server

```powershell
npm run start
```

- Entry point: `src/server/server.js` (`node src/server/server`).
- Server binds port 3000 (`http.listen(3000, ...)` in `src/server/controller/controller.js:98`); console prints `listening on *:3000`.
- Confirm Socket.IO is WebSocket-only (`transports: ['websocket']`).

### 4. Manual smoke test (optional, requires the built client)

- Serve `client/` over HTTP (project uses Apache; `.htaccess` allows localhost and the `192.168.178` subnet). README URL: `http://127.0.0.1/snakenet/client/`.
- Open two browser tabs, enter a nickname and connect to `127.0.0.1:3000`.
- Expected: both connect; the first player receives `SN_SERVER_IS_CREATOR` = `1`, the second `0`. Creator-only UI (`iconOptions`) is shown via `View.show('iconOptions', ...)` in `src/client/js/controller/controller.js:69`.
- Chat join messages ("... joined the game") appear in the chat list (`Game.setPlayerName` broadcasts via `SN_SERVER_CHAT_MESSAGE`).

### 5. Report

State exactly what was run and the observed output (e.g. build success, `listening on *:3000`, connection handshake). Do not claim success without seeing it.