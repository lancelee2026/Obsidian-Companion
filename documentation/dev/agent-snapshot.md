# Agent snapshot

## Start here

Read `PRODUCT.md`, `documentation/README.md`, `documentation/system-design.md`, then the area SSOT.

## Status

- `Implemented`: HTTP companion, pairing, vault ports, plugin UI locale from Obsidian language (**en / zh-Hans / zh-Hant**), protocol package, folder list, attachment counts, wiki embeds via `getFirstLinkpathDest`, common leftovers included (Word, spreadsheet, slides, text, mp3/m4a/wav, mp4/webm/mov), reads rejected above 2 GB before load, vault trial watermark + computer seat file, `GET`/`POST /v1/local-license`, `pnpm build` also writes `dist/noteferry-companion.zip`. Settings Help / Privacy / Contact open the public site when `SITE_ORIGIN` is set and stay omitted when it is empty. Plugin **0.1.4**.
- `Verified`: `pnpm typecheck`, `pnpm test` (20), `pnpm build` (includes `dist/noteferry-companion.zip`) after Help / Privacy / Contact settings links (omitted while `SITE_ORIGIN` is empty).
- `Proposed`: Community Plugin listing. GitHub Release of the zip (human unless `gh` is authorized).
- `Unverified`: live Obsidian Desktop restart self-heal after Allow; macOS/Windows release packaging; zip install path on a clean vault.

## Next safe actions

1. `pnpm build` writes `dist/` including `noteferry-companion.zip` and copies `main.js` into the open vault plugin folder when present. Disable/enable the plugin in Obsidian after build.
2. Publish a GitHub Release with that zip when ready.
3. Keep protocol changes synchronized with [noteferry](https://github.com/lancelee2026/noteferry).

## Out of scope here

Picker UI, provider adapters, website, Worker admin mint forms.
