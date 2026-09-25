# NoteFerry Companion

NoteFerry Companion is the Obsidian Desktop plugin for [NoteFerry](https://noteferry.dev). NoteFerry is a browser extension. This plugin is the part that stays inside Obsidian.

Use it to add notes you choose from your vault into ChatGPT, Claude, or Gemini. The plugin only reads those notes. It does not edit or delete them.

## Install

1. In Obsidian, open **Settings → Community plugins**, turn off Restricted mode, and install **NoteFerry Companion**.
2. Enable the plugin.
3. Install the NoteFerry browser extension and choose **Connect Obsidian**. When Obsidian asks, choose **Allow**.

After that, open the chat’s **+** menu and choose **Add from Obsidian**.

## What it does

- Lists the note you are editing, recent notes, and search results for the extension.
- Reads only the notes and attachments you choose to add.
- Keeps that access read-only.

The connection stays on this computer, between Obsidian and the NoteFerry extension. Notes are not uploaded to NoteFerry. There is no account and no telemetry. A note leaves this computer only when you add it to the AI chat you are using.

You can disconnect the browser from the plugin settings.

## 说明

NoteFerry Companion 是 [NoteFerry](https://noteferry.dev) 浏览器扩展在 Obsidian 桌面端的伴侣插件。它让你把选中的笔记加入 ChatGPT、Claude 或 Gemini。插件只读取这些笔记，不修改、不删除。

在 Obsidian 的社区插件中安装并启用后，从浏览器扩展里选择连接 Obsidian，并在提示中允许。之后可在对话的 **+** 菜单里选择从 Obsidian 添加。

连接只发生在这台电脑上的 Obsidian 与 NoteFerry 扩展之间。笔记不会上传到 NoteFerry。没有账号，也没有遥测。只有当你把笔记加入正在使用的 AI 对话时，内容才会离开这台电脑。可在插件设置里断开浏览器。

## Development

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
```

`pnpm build` writes `dist/main.js` and `dist/manifest.json` from the repo-root `manifest.json`. Technical notes live in [`documentation/README.md`](documentation/README.md).

This plugin is licensed under the [MIT License](LICENSE).
