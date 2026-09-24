import {describe, expect, it} from "vitest";
import {companionSiteUrl, SITE_ORIGIN} from "../src/site";

describe("companion site urls", () => {
  it("omits Help Privacy Contact when the public origin is empty", () => {
    expect(SITE_ORIGIN).toBe("");
    expect(companionSiteUrl("zh-Hans", "/help")).toBe("");
    expect(companionSiteUrl("en", "/privacy")).toBe("");
    expect(companionSiteUrl("zh-Hant", "/contact")).toBe("");
  });
});
