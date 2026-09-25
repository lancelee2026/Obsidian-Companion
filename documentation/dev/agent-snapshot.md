# Agent snapshot

## Start here

Read `PRODUCT.md`, `documentation/README.md`, `documentation/system-design.md`, then the area SSOT.

## Status

- `Implemented`: HTTP companion, pairing, vault ports, plugin UI locale from Obsidian language (**en / zh-Hans / zh-Hant**), protocol package, folder list, attachment counts, wiki embeds via `getFirstLinkpathDest`, common leftovers included (Word, spreadsheet, slides, text, mp3/m4a/wav, mp4/webm/mov), reads rejected above 2 GB before load, vault trial watermark + computer seat file, `GET`/`POST /v1/local-license`, `pnpm build` also writes `dist/noteferry-companion.zip` with a Node zip (no `zip` binary). Settings Help / Privacy / Contact open `https://noteferry.dev`. Settings title uses `Setting.setHeading()`. Locale uses `getLanguage()`. Settings tab implements `getSettingDefinitions()` and keeps `display()` for Obsidian before 1.13. Plugin **0.1.8**, `minAppVersion` **1.8.7**. Root README is customer-only (no pnpm). Listing short description is English only.
- `Verified`: `pnpm typecheck`, `pnpm test` (20), `pnpm build` (includes `dist/noteferry-companion.zip`) after `0.1.8` listing-review Warning fixes that do not change the desktop seat file or vault list.
- `Implemented`: MIT `LICENSE` at the repo root for the Companion source. It does not license the paid activation key. Root `README.md` is the community-directory page and discloses the on-computer connection. Root `manifest.json` is the listing file community.obsidian.md reads. `versions.json` maps `0.1.8` to Obsidian `1.8.7`. `images/icon.png` is the 256px NoteFerry mark for the listing icon upload.
- `Implemented`: Public listing at `https://community.obsidian.md/plugins/noteferry-companion`. Automated review of `0.1.6` Completed. GitHub Release `0.1.8` addresses listing-review Warnings that can change without dropping Obsidian 1.8.7 or the computer seat file.
- `Unverified`: live Obsidian Desktop restart self-heal after Allow; macOS/Windows release packaging; zip install path on a clean vault; ordinary Companion uninstall/reinstall restore of trial and shop key (see noteferry `e2e-cases.md` D2).

## Next safe actions

1. `pnpm build` writes `dist/` including `noteferry-companion.zip` and copies `main.js` into the open vault plugin folder when present. Disable/enable the plugin in Obsidian after build.
2. After GitHub Release `0.1.8` is up, on [community.obsidian.md](https://community.obsidian.md) **Check for new releases**. Upload `images/icon.png` in **Edit listing**. Listing author name and payment type are dashboard fields, not this repo. `fs` and vault-list disclosures stay: desktop seat file and note list.
3. Keep protocol changes synchronized with [noteferry](https://github.com/lancelee2026/noteferry). Dual-plugin reinstall cases live in that repo’s `documentation/e2e-cases.md`.

## Out of scope here

Picker UI, provider adapters, website, Worker admin mint forms.
