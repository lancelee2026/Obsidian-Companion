# NoteFerry Companion

**NoteFerry Companion** is the required Obsidian plugin for the [NoteFerry](https://noteferry.dev/) browser extension.

Together, they allow you to securely browse your local Obsidian vault inside your browser and attach your notes and images directly to ChatGPT, Claude, or Gemini chats—without any cloud syncing or third-party accounts.

<br>

**NoteFerry 伴侣** 是 [NoteFerry](https://noteferry.dev/zh) 浏览器扩展专用的 Obsidian 本地辅助插件。

配合浏览器扩展使用，你可以直接在浏览器侧边栏安全地浏览本地 Obsidian 笔记，并一键将笔记和图片发送到 ChatGPT、Claude 或 Gemini 对话中——全程无需云端同步，不依赖任何第三方账户。

---

## 🛠 Setup / 如何使用

### English
1. Install the **NoteFerry** extension from the Chrome Web Store or Edge Add-ons.
2. Install and enable this **NoteFerry Companion** plugin in Obsidian.
3. Open the NoteFerry extension in your browser, and follow the prompts to allow the local connection between your browser and Obsidian.
4. Open ChatGPT, Claude, or Gemini, and use NoteFerry to select and attach your notes!

*Note: Your vault data stays strictly on your device. The connection is entirely local (localhost) and only activated when you explicitly choose to attach a note.*

### 中文
1. 在 Chrome 或 Edge 扩展商店安装 **NoteFerry** 浏览器扩展。
2. 在 Obsidian 社区插件市场中安装并启用本插件 (**NoteFerry Companion**)。
3. 在浏览器中打开 NoteFerry 扩展，根据提示在浏览器和 Obsidian 中分别点击允许，完成本地配对。
4. 打开 ChatGPT、Claude 或 Gemini 网页，即可使用 NoteFerry 选择并添加你的笔记！

*注：你的笔记数据将严格保留在本地。两者之间的连接完全基于本地网络（localhost），并且只有在你主动选择添加某篇笔记时，内容才会被读取。*

---

## 💻 Development / 开发者信息

- Technical SSOT for this repo: [`documentation/README.md`](documentation/README.md).
- To build locally: `pnpm install` → `pnpm build`
- To test locally: Copy/symlink `dist/` into your Obsidian vault: `<vault>/.obsidian/plugins/noteferry-companion/`
