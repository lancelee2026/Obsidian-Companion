import type {Locale} from "./i18n";

/** Public site. No trailing slash. */
export const SITE_ORIGIN = "https://noteferry.dev";

function siteLocale(locale: Locale): "en" | "zh" | "zht" {
  if (locale === "zh-Hans") return "zh";
  if (locale === "zh-Hant") return "zht";
  return "en";
}

export function companionSiteUrl(locale: Locale, path: string): string {
  const base = SITE_ORIGIN.trim().replace(/\/$/, "");
  if (!base) return "";
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}/${siteLocale(locale)}${suffix}`;
}
