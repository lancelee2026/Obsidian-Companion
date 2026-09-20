# NoteFerry Obsidian Companion

Thin Obsidian Desktop plugin that lets the [NoteFerry](https://github.com/lancelee2026/noteferry) Chrome extension read notes you choose and attach them to ChatGPT, Claude, or Gemini.

Vault data stays on this computer until you attach it. There is no NoteFerry account and no cloud vault sync.

## Install (development)

1. `pnpm install`
2. `pnpm build`
3. Copy or symlink `dist/` into your Obsidian vault:
   `<vault>/.obsidian/plugins/noteferry-companion/`
   (needs `main.js` + `manifest.json`)
4. Enable **NoteFerry** in Obsidian community/plugin settings
5. Pair from the NoteFerry browser extension popup

## Scripts

- `pnpm build` — Obsidian `main.js` + `manifest.json`
- `pnpm typecheck`
- `pnpm test` — pairing, path containment, status has no vault fields

## Protocol

Shares `@noteferry/protocol` with the extension repo. Keep versions aligned when changing endpoints.

Technical SSOT for this repo: [`documentation/README.md`](documentation/README.md).

Related: [noteferry](https://github.com/lancelee2026/noteferry) · [noteferry-landingpage](https://github.com/lancelee2026/noteferry-landingpage)
