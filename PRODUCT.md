# Product — NoteFerry Obsidian Companion

## What this is

A thin Obsidian Desktop plugin that exposes a local, read-only vault service so the NoteFerry Chrome extension can list Current / Recent / Search notes, optionally browse one folder at a time, resolve included vs skipped attachments, and read chosen file bytes.

## What this is not

- Not a NoteFerry desktop application or second Obsidian.
- Not a cloud vault, sync service, or AI chat inside Obsidian.
- Not Local REST API / E2N rebranded.

## Users

People who keep notes in Obsidian Desktop on the same machine as Chrome, and use NoteFerry to attach a deliberate selection into ChatGPT, Claude, or Gemini.

## Operating context

- Obsidian Desktop (macOS / Windows release targets; Linux welcome but Unverified).
- Loopback HTTP on `127.0.0.1:27125` only.
- Extension initiates pairing; user approves or denies inside Obsidian with plain language.
- Vault data never leaves the machine through this plugin’s cloud path — there is no Companion cloud.

## Capabilities (V1)

- Status without vault metadata.
- Short-lived pairing with one-time secret return; Companion stores hashes only and keeps approved clients across Obsidian restarts until the user disconnects.
- Authenticated: session, current note, recent notes, filename/path search, context resolve, file read, client revoke.
- **Proposed:** `POST /v1/folder/list` (one directory, containment-checked) and optional `attachmentCount` on note summaries from `metadataCache` embeds — so the extension can show counts before resolve. Not Local REST. Not an E2N folder IPC clone.
- Attachment classification: image, pdf, and mp4/webm/mov video included; audio, nested-md, unknown, and other video skipped with reasons.

## Constraints

- Read-only vault access.
- No client telemetry.
- No semantic search / embeddings.
- No recursive linked-note expansion in V1.
- Protocol version must match the extension (`PROTOCOL_VERSION`).

## Sibling products

- Chrome extension: [noteferry](https://github.com/lancelee2026/noteferry)
- Public website: [noteferry-landingpage](https://github.com/lancelee2026/noteferry-landingpage)
