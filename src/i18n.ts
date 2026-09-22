export type Locale = "en" | "zh-Hans";

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
  }
} as const;

export type CopyKey = keyof typeof copy.en;

export function detectLocale(language = ""): Locale {
  return language.toLowerCase().startsWith("zh") ? "zh-Hans" : "en";
}

export function t(key: CopyKey, locale: Locale): string {
  return copy[locale][key];
}

export function interpolate(template: string, name: string): string {
  return template.replaceAll("{name}", name);
}
