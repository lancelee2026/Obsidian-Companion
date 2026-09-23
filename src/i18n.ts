export type Locale = "en" | "zh-Hans" | "zh-Hant";

const copy = {
  en: {
    pairTitle: "Allow NoteFerry?",
    pairBody:
      "{name} wants to read notes you choose and attach them in ChatGPT, Claude, or Gemini. Access is read-only and will not change or damage your vault.",
    deny: "Deny",
    allow: "Allow",
    noticeReadyPaired: "NoteFerry is ready. Your browser stays connected.",
    noticeReadyNew: "NoteFerry is ready to connect from your browser.",
    noticeStartFail: "NoteFerry could not start. Quit other copies of Obsidian and try again.",
    noticeNotRunning: "NoteFerry is not running.",
    noticeRevoked: "NoteFerry browser access cleared. Pair again from the extension if needed.",
    commandRevoke: "NoteFerry: Disconnect browser access",
    settingsTitle: "NoteFerry",
    settingsLead:
      "Connect the NoteFerry browser extension once. Access is read-only and will not change or damage your vault.",
    settingsAccess: "Browser access",
    settingsAccessHint: "Clear saved browser pairing on this computer.",
    settingsDisconnect: "Disconnect browser"
  },
  "zh-Hans": {
    pairTitle: "允许 NoteFerry？",
    pairBody:
      "{name} 想读取你选的笔记，并添加到 ChatGPT、Claude 或 Gemini。只读访问，不会改动或损坏本地库。",
    deny: "拒绝",
    allow: "允许",
    noticeReadyPaired: "NoteFerry 已就绪。浏览器保持连接。",
    noticeReadyNew: "NoteFerry 已就绪，可从浏览器连接。",
    noticeStartFail: "NoteFerry 未能启动。请退出其他 Obsidian 窗口后再试。",
    noticeNotRunning: "NoteFerry 未在运行。",
    noticeRevoked: "已清除浏览器访问。如需使用，请在扩展里重新连接。",
    commandRevoke: "NoteFerry: 断开浏览器访问",
    settingsTitle: "NoteFerry",
    settingsLead:
      "用 NoteFerry 浏览器扩展连接一次。只读访问，不会改动或损坏本地库。",
    settingsAccess: "浏览器访问",
    settingsAccessHint: "清除这台电脑上已保存的浏览器配对。",
    settingsDisconnect: "断开浏览器"
  },
  "zh-Hant": {
    pairTitle: "允許 NoteFerry？",
    pairBody:
      "{name} 想讀取你選的筆記，並加入 ChatGPT、Claude 或 Gemini。唯讀存取，不會改動或損壞本機庫。",
    deny: "拒絕",
    allow: "允許",
    noticeReadyPaired: "NoteFerry 已就緒。瀏覽器保持連線。",
    noticeReadyNew: "NoteFerry 已就緒，可從瀏覽器連線。",
    noticeStartFail: "NoteFerry 未能啟動。請退出其他 Obsidian 視窗後再試。",
    noticeNotRunning: "NoteFerry 未在執行。",
    noticeRevoked: "已清除瀏覽器存取。如需使用，請在擴充功能裡重新連線。",
    commandRevoke: "NoteFerry: 中斷瀏覽器存取",
    settingsTitle: "NoteFerry",
    settingsLead:
      "用 NoteFerry 瀏覽器擴充功能連線一次。唯讀存取，不會改動或損壞本機庫。",
    settingsAccess: "瀏覽器存取",
    settingsAccessHint: "清除這台電腦上已儲存的瀏覽器配對。",
    settingsDisconnect: "中斷瀏覽器"
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
