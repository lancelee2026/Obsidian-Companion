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
  });
});
