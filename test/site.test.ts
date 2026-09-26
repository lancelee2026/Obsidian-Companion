import {describe, expect, it} from "vitest";
import {companionSiteUrl, SITE_ORIGIN} from "../src/site";

describe("companion site urls", () => {
  it("omits Help Privacy Contact when the public origin is empty", () => {
    expect(SITE_ORIGIN).toBe("https://noteferry.dev");
    expect(companionSiteUrl("zh-Hans", "/help")).toBe("https://noteferry.dev/zh/help");
    expect(companionSiteUrl("en", "/install")).toBe("https://noteferry.dev/en/install");
    expect(companionSiteUrl("zh-Hans", "/install")).toBe("https://noteferry.dev/zh/install");
    expect(companionSiteUrl("en", "/privacy")).toBe("https://noteferry.dev/en/privacy");
    expect(companionSiteUrl("zh-Hant", "/contact")).toBe("https://noteferry.dev/zht/contact");
  });
});
