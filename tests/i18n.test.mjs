import assert from "node:assert/strict";
import test from "node:test";

import {
  localizedPath,
  localeFromSource,
  normalizeLocale,
  parseAcceptLanguage,
  resolveLocale,
  stripLocalePrefix,
} from "../lib/i18n.ts";

test("normalizes supported locale aliases", () => {
  assert.equal(normalizeLocale("zh"), "zh-CN");
  assert.equal(normalizeLocale("zh_CN"), "zh-CN");
  assert.equal(normalizeLocale("en-US"), "en");
  assert.equal(normalizeLocale("fr"), null);
});

test("adds and replaces locale path prefixes", () => {
  assert.equal(localizedPath("/", "en"), "/en");
  assert.equal(localizedPath("/stats", "en"), "/en/stats");
  assert.equal(localizedPath("/zh-CN/stats?x=1#top", "en"), "/en/stats?x=1#top");
  assert.deepEqual(stripLocalePrefix("/zh-CN/r/abc"), {
    locale: "zh-CN",
    pathname: "/r/abc",
  });
});

test("maps explicit source and referrer without using referral code", () => {
  assert.equal(localeFromSource({ utmSource: "producthunt" }), "en");
  assert.equal(localeFromSource({ source: "xhs" }), "zh-CN");
  assert.equal(localeFromSource({ referrer: "https://www.zhihu.com/question/1" }), "zh-CN");
  assert.equal(resolveLocale({ lang: null, locale: null, source: null, utmSource: null, referrer: null, acceptLanguage: null }), "zh-CN");
  assert.equal(
    resolveLocale({
      // Existing invite/referral param is intentionally not part of locale resolution.
      acceptLanguage: "en-US,en;q=0.8",
    }),
    "en"
  );
});

test("accept-language honors q ordering", () => {
  assert.equal(parseAcceptLanguage("zh-CN;q=0.4,en-US;q=0.9"), "en");
  assert.equal(parseAcceptLanguage("fr-FR,zh-CN;q=0.7"), "zh-CN");
});

test("locale resolution priority is path, query, cookie, source, accept-language, default", () => {
  assert.equal(
    resolveLocale({
      pathname: "/en/stats",
      lang: "zh-CN",
      cookieLocale: "zh-CN",
      utmSource: "xhs",
      acceptLanguage: "zh-CN",
    }),
    "en"
  );
  assert.equal(resolveLocale({ lang: "en", cookieLocale: "zh-CN" }), "en");
  assert.equal(resolveLocale({ cookieLocale: "en", utmSource: "xhs" }), "en");
  assert.equal(resolveLocale({ utmSource: "github", acceptLanguage: "zh-CN" }), "en");
});
