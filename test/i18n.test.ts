import {describe, expect, it} from "vitest";
import {detectLocale, interpolate, t} from "../src/i18n";

describe("companion locale", () => {
  it("follows Obsidian zh as simplified Chinese", () => {
    expect(detectLocale("zh")).toBe("zh-Hans");
    expect(detectLocale("zh-cn")).toBe("zh-Hans");
    expect(detectLocale("en")).toBe("en");
    expect(detectLocale("zh-tw")).toBe("zh-Hant");
    expect(t("allow", "zh-Hant")).toBe("允許");
    expect(t("allow", "zh-Hans")).toBe("允许");
    expect(t("allow", "zh-Hans")).toBe("允许");
    expect(t("deny", "zh-Hans")).toBe("拒绝");
    expect(t("allow", "en")).toBe("Allow");
    expect(interpolate(t("pairBody", "zh-Hans"), "NoteFerry")).toContain("只读");
    expect(t("pairBody", "zh-Hans")).not.toContain("离开这台电脑");
    expect(t("noticeReadyNew", "en")).toContain("website");
    expect(t("noticeReadyNew", "zh-Hans")).toContain("官网");
    expect(t("settingsGetExtensionCta", "en")).toBe("Open the website");
    expect(t("settingsGetExtensionCta", "zh-Hans")).toBe("打开官网");
    expect(t("settingsGetExtensionHint", "en")).not.toMatch(/localhost|127\.0\.0\.1|port|token/i);
    expect(t("settingsLead", "en") + t("noticeReadyNew", "en")).not.toMatch(/localhost|127\.0\.0\.1/i);
  });
});
