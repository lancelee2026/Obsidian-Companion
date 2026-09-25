# Agent snapshot

## Start here

Read `PRODUCT.md`, `documentation/README.md`, `documentation/system-design.md`, then the area SSOT.

## Status

- `Implemented`: HTTP companion, pairing, vault ports, plugin UI locale from Obsidian language (**en / zh-Hans / zh-Hant**), protocol package, folder list, attachment counts, wiki embeds via `getFirstLinkpathDest`, common leftovers included (Word, spreadsheet, slides, text, mp3/m4a/wav, mp4/webm/mov), reads rejected above 2 GB before load, vault trial watermark + computer seat file, `GET`/`POST /v1/local-license`, `pnpm build` also writes `dist/noteferry-companion.zip`. Settings Help / Privacy / Contact open `https://noteferry.dev`. Settings title uses `Setting.setHeading()`. Plugin **0.1.5**.
- `Verified`: `pnpm typecheck`, `pnpm test` (20), `pnpm build` (includes `dist/noteferry-companion.zip`) after listing review Error fixes.
- `Implemented`: MIT `LICENSE` at the repo root for the Companion source. It does not license the paid activation key. Root `README.md` is the community-directory page and discloses the on-computer connection. Root `manifest.json` is the listing file community.obsidian.md reads. `versions.json` maps `0.1.5` to Obsidian `1.5.0`.
- `Proposed`: Community Plugin listing.
- `Implemented`: GitHub Release `0.1.5` with `main.js` and `manifest.json` (listing review of `0.1.4` / `5a46514` had two Errors: root manifest missing on that commit, settings `h2`).
- `Unverified`: live Obsidian Desktop restart self-heal after Allow; macOS/Windows release packaging; zip install path on a clean vault; ordinary Companion uninstall/reinstall restore of trial and shop key (see noteferry `e2e-cases.md` D2).

## Next safe actions

1. `pnpm build` writes `dist/` including `noteferry-companion.zip` and copies `main.js` into the open vault plugin folder when present. Disable/enable the plugin in Obsidian after build.
2. On [community.obsidian.md](https://community.obsidian.md) open NoteFerry Companion, **Check for new releases** for `0.1.5`, then wait for review. Node `fs` / loopback HTTP warnings stay: this plugin is desktop-only and needs the computer seat file.
3. Keep protocol changes synchronized with [noteferry](https://github.com/lancelee2026/noteferry). Dual-plugin reinstall cases live in that repo’s `documentation/e2e-cases.md`.

## Out of scope here

Picker UI, provider adapters, website, Worker admin mint forms.
