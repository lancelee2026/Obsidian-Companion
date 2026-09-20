# Agent snapshot

## Start here

Read `PRODUCT.md`, `documentation/README.md`, `documentation/system-design.md`, then the area SSOT.

## Status

- `Implemented`: HTTP companion, pairing with durable client-hash persistence, vault ports, Obsidian plugin shell, protocol package, documentation set.
- `Verified`: `pnpm build`, `pnpm typecheck`, `pnpm test` (path, pairing + restore, status, resolve/read).
- `Proposed`: Community Plugin listing polish, deeper packaging docs, `POST /v1/folder/list` + optional `attachmentCount` (NoteFerry Picker pack slice).
- `Unverified`: live Obsidian Desktop restart self-heal after Allow; macOS/Windows release packaging.

## Next safe actions

1. `pnpm build` writes `dist/` and copies `main.js` into the open vault plugin folder `Documents/Obsidian Vault/.obsidian/plugins/noteferry-companion` (pairing `data.json` is left untouched). Disable/enable the plugin in Obsidian after build.
2. Record live evidence in `tests.md` only from observation.
3. Keep protocol changes synchronized with [noteferry](https://github.com/lancelee2026/noteferry).

## Out of scope here

Picker UI, provider adapters, website, Worker, Lifetime license forms.
