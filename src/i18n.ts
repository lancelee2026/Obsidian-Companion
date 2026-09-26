export type Locale = "en" | "zh-Hans" | "zh-Hant";

const copy = {
  en: {
    pairTitle: "Allow NoteFerry?",
    pairBody:
      "{name} wants to read notes you choose and attach them in ChatGPT, Claude, or Gemini. Access is read-only and will not change or damage your vault.",
    deny: "Deny",
    allow: "Allow",
    noticeReadyPaired: "NoteFerry is ready. Your browser stays connected.",
    noticeReadyNew: "NoteFerry Companion is on. Install the browser extension from the website, then connect.",
    noticeStartFail: "NoteFerry could not start. Quit other copies of Obsidian and try again.",
    noticeNotRunning: "NoteFerry is not running.",
    noticeRevoked: "NoteFerry browser access cleared. Pair again from the extension if needed.",
    commandRevoke: "NoteFerry: Disconnect browser access",
    settingsTitle: "NoteFerry",
    settingsLead:
      "This plugin stays in Obsidian. Install the NoteFerry browser extension next, then connect once. Access is read-only and will not change or damage your vault.",
    settingsGetExtension: "Browser extension",
    settingsGetExtensionHint: "Open the website to install NoteFerry. This plugin does not add notes by itself.",
    settingsGetExtensionCta: "Open the website",
    settingsAccess: "Browser access",
    settingsAccessHint: "Clear saved browser pairing on this computer.",
    settingsDisconnect: "Disconnect browser",
    settingsHelp: "Help",
    settingsPrivacy: "Privacy",
    settingsContact: "Contact",
    settingsOpen: "Open"
  },
  "zh-Hans": {
    pairTitle: "允许 NoteFerry？",
    pairBody:
      "{name} 想读取你选的笔记，并添加到 ChatGPT、Claude 或 Gemini。只读访问，不会改动或损坏本地库。",
    deny: "拒绝",
    allow: "允许",
    noticeReadyPaired: "NoteFerry 已就绪。浏览器保持连接。",
    noticeReadyNew: "NoteFerry Companion 已启用。请到官网安装浏览器扩展，再连接。",
    noticeStartFail: "NoteFerry 未能启动。请退出其他 Obsidian 窗口后再试。",
    noticeNotRunning: "NoteFerry 未在运行。",
    noticeRevoked: "已清除浏览器访问。如需使用，请在扩展里重新连接。",
    commandRevoke: "NoteFerry: 断开浏览器访问",
    settingsTitle: "NoteFerry",
    settingsLead:
      "这个插件留在 Obsidian。请先安装 NoteFerry 浏览器扩展，再连接一次。只读访问，不会改动或损坏本地库。",
    settingsGetExtension: "浏览器扩展",
    settingsGetExtensionHint: "打开官网安装 NoteFerry。只装这个插件无法在对话里添加笔记。",
    settingsGetExtensionCta: "打开官网",
    settingsAccess: "浏览器访问",
    settingsAccessHint: "清除这台电脑上已保存的浏览器配对。",
    settingsDisconnect: "断开浏览器",
    settingsHelp: "帮助",
    settingsPrivacy: "隐私",
    settingsContact: "联系",
    settingsOpen: "打开"
  },
  "zh-Hant": {
    pairTitle: "允許 NoteFerry？",
    pairBody:
      "{name} 想讀取你選的筆記，並加入 ChatGPT、Claude 或 Gemini。唯讀存取，不會改動或損壞本機庫。",
    deny: "拒絕",
    allow: "允許",
    noticeReadyPaired: "NoteFerry 已就緒。瀏覽器保持連線。",
    noticeReadyNew: "NoteFerry Companion 已啟用。請到官網安裝瀏覽器擴充功能，再連線。",
    noticeStartFail: "NoteFerry 未能啟動。請退出其他 Obsidian 視窗後再試。",
    noticeNotRunning: "NoteFerry 未在執行。",
    noticeRevoked: "已清除瀏覽器存取。如需使用，請在擴充功能裡重新連線。",
    commandRevoke: "NoteFerry: 中斷瀏覽器存取",
    settingsTitle: "NoteFerry",
    settingsLead:
      "這個外掛留在 Obsidian。請先安裝 NoteFerry 瀏覽器擴充功能，再連線一次。唯讀存取，不會改動或損壞本機庫。",
    settingsGetExtension: "瀏覽器擴充功能",
    settingsGetExtensionHint: "打開官網安裝 NoteFerry。只裝這個外掛無法在對話裡加入筆記。",
    settingsGetExtensionCta: "打開官網",
    settingsAccess: "瀏覽器存取",
    settingsAccessHint: "清除這台電腦上已儲存的瀏覽器配對。",
    settingsDisconnect: "中斷瀏覽器",
    settingsHelp: "說明",
    settingsPrivacy: "隱私權",
    settingsContact: "聯絡",
    settingsOpen: "開啟"
  }
} as const;

export type CopyKey = keyof typeof copy.en;

export function detectLocale(language = ""): Locale {
  const nav = language.toLowerCase();
  if (nav.startsWith("zh-tw") || nav.startsWith("zh-hk") || nav.startsWith("zh-mo") || nav.startsWith("zh-hant")) {
    return "zh-Hant";
  }
  return nav.startsWith("zh") ? "zh-Hans" : "en";
}

export function t(key: CopyKey, locale: Locale): string {
  return copy[locale][key];
}

export function interpolate(template: string, name: string): string {
  return template.replaceAll("{name}", name);
}
