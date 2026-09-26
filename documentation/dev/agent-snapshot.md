# Agent snapshot

## Start here

Read `PRODUCT.md`, `documentation/README.md`, `documentation/system-design.md`, then the area SSOT.

## Status

- `Implemented`: HTTP companion, pairing, vault ports, plugin UI locale from Obsidian language (**en / zh-Hans / zh-Hant**), protocol package, folder list, attachment counts, wiki embeds via `getFirstLinkpathDest`, common leftovers included (Word, spreadsheet, slides, text, mp3/m4a/wav, mp4/webm/mov), reads rejected above 2 GB before load, vault trial watermark + computer seat file, `GET`/`POST /v1/local-license`, `pnpm build` also writes `dist/noteferry-companion.zip` with a Node zip (no `zip` binary). Settings open the website install page first (`setCta`), then Help / Privacy / Contact. Settings title uses `Setting.setHeading()`. Locale uses `getLanguage()`. Disconnect uses `setWarning()`. Settings tab uses `display()`. Plugin **0.1.10**, `minAppVersion` **1.8.7**. Root README is customer-only (no pnpm) and sends readers to `noteferry.dev` for the browser extension. Listing short description is English only and names `noteferry.dev`.
- `Verified`: `pnpm typecheck`, `pnpm test` (20), `pnpm build` (includes `dist/noteferry-companion.zip`) after dropping `setDestructive` / `getSettingDefinitions` / `PluginSettingTab.update` so listing review `no-unsupported-api` matches `minAppVersion` 1.8.7.
- `Implemented`: MIT `LICENSE` at the repo root for the Companion source. It does not license the paid activation key. Root `README.md` is the community-directory page, names the browser extension as the next step, and discloses the on-computer connection. Root `manifest.json` is the listing file community.obsidian.md reads. `versions.json` maps `0.1.10` to Obsidian `1.8.7`. `images/icon.png` is the 256px NoteFerry mark; the community Edit listing form uses a Lucide picker, not this PNG.
- `Implemented`: Public listing at `https://community.obsidian.md/plugins/noteferry-companion`. Automated review of `0.1.7` Completed. `0.1.8` Failed on APIs newer than 1.8.7. `0.1.9` removes those call sites. `0.1.10` is the listing/settings handoff to the website. `fs` and vault-list disclosures stay: desktop seat file and note list.
- `Unverified`: live Obsidian Desktop restart self-heal after Allow; macOS/Windows release packaging; zip install path on a clean vault; ordinary Companion uninstall/reinstall restore of trial and shop key (see noteferry `e2e-cases.md` D2).

## Next safe actions

1. `pnpm build` writes `dist/` including `noteferry-companion.zip` and copies `main.js` into the open vault plugin folder when present. Disable/enable the plugin in Obsidian after build.
2. After GitHub Release `0.1.10` is up, community.obsidian.md scans it automatically. Listing icon, author name, and payment type are dashboard fields, not this repo. `fs` and vault-list disclosures stay: desktop seat file and note list. `setWarning` / `display` deprecation Recommendations remain until `minAppVersion` can move to 1.13.
3. Keep protocol changes synchronized with [noteferry](https://github.com/lancelee2026/noteferry). Dual-plugin reinstall cases live in that repo’s `documentation/e2e-cases.md`.

## Out of scope here

Picker UI, provider adapters, website, Worker admin mint forms.
