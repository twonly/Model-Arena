import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import sharp from "sharp";

const read = path => readFileSync(new URL("../" + path, import.meta.url));
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const page = read("app/[lang]/guides/longcat-2-5/page.tsx").toString();
const sources = JSON.parse(read("public/evaluations/longcat-2-5/sources.json"));
const frontend = JSON.parse(read("public/evaluations/longcat-2-5-20261026-frontend.json"));

test("LongCat 2.5 analysis identifies the tested Preview and preserves the earlier review", () => {
  assert.match(page, /const pathname = "\/guides\/longcat-2-5"/);
  assert.match(page, /LongCat-2\.5-Preview/);
  assert.match(page, /At the October 26 check, public documentation and our requests identified LongCat-2\.5-Preview/);
  assert.match(page, /localizedPath\("\/guides\/longcat-2-5-release", locale\)/);
  assert.match(page, /const publishedAt = "2026-10-26T16:00:41Z"/);
  assert.match(page, /相同公开数字可见于 2\.0/);
  assert.match(page, /Quick Start: 128K/);
  assert.match(page, /Parameter reference: 256K/);
  assert.match(page, /temperature of 0 is overridden/);
  assert.match(page, /no separate omitted-switch group/);
  assert.match(page, /does not establish.*|do not establish.*|not establish.*|cannot establish.*/);
  assert.match(page, /Chat Completions，该接口文档描述 thinking 开关/);
  assert.match(page, /Responses.*none\/minimal\/low\/medium\/high\/xhigh/);
  assert.match(page, /docs \+ "\/api\/responses"/);
  assert.match(page, /并发本地测试的单次记录/);
  assert.doesNotMatch(page, /dangerouslySetInnerHTML|<iframe\b|<svg\b/);
  assert.match(page, /htmlPath\} download/);
  assert.match(page, /localizedPath\("\/guides\/longcat-2-5-preview", locale\)/);
  const historical = read("app/[lang]/guides/longcat-2-5-preview/page.tsx").toString();
  assert.match(historical, /localizedPath\("\/guides\/longcat-2-5", locale\)/);
  assert.match(historical, /datePublished: review\.publishedAt/);
});

test("LongCat bilingual article exposes navigation, search metadata and linked evidence", () => {
  assert.match(page, /sidebar=\{<ArticleNavigation sections=\{navigation\} en=\{en\}/);
  for (const id of ["verdict", "brief-reading", "model-details", "test-method", "text-code-tests", "frontend-tests", "responses-tests", "visual-findings", "historical-benchmarks", "evidence", "faq", "sources"]) assert.ok(page.includes(`id="${id}"`), id);
  assert.match(page, /没有无图对照，也没有重复运行/);
  assert.match(page, /memorization cannot be excluded/);
  for (const type of ["TechArticle", "Dataset", "FAQPage", "BreadcrumbList"]) assert.ok(page.includes(`"@type": "${type}"`));
  assert.match(page, /infoMetadata\(locale, pathname, title, description\)/);
  assert.match(page, /datePublished: publishedAt, dateModified: articleModifiedAt/);
  assert.match(page, /twitter:.*images:/);
  assert.match(page, /VisualEvaluation data=\{visuals\}/);
  assert.match(page, /kind === "official-page-capture"/);
  assert.match(page, /kind\.startsWith\("historical-"\)/);
  const sitemap = read("app/sitemap.ts").toString();
  assert.match(sitemap, /allLocales\("\/guides\/longcat-2-5"/);
  assert.match(sitemap, /longcatSources\.images\.map/);
  const reports = read("app/[lang]/reports/page.tsx").toString();
  assert.match(reports, /localizedPath\("\/guides\/longcat-2-5", locale\)/);
});

test("official captures and historical benchmark originals retain bytes, attribution and version scope", async () => {
  assert.equal(sources.model, "LongCat-2.5-Preview");
  assert.match(sources.benchmarkStatus, /No model-specific 2\.5 benchmark/);
  assert.equal(sources.images.length, 6);
  for (const image of sources.images) {
    const bytes = read("public" + image.path);
    assert.equal(hash(bytes), image.sha256);
    assert.equal(bytes.byteLength, image.bytes);
    const metadata = await sharp(bytes).metadata();
    assert.equal(metadata.width, image.width);
    assert.equal(metadata.height, image.height);
    assert.equal(image.visuallyInspected, true);
    assert.equal(image.independentlyReproducedByTokrace, false);
    for (const key of ["titleZh", "titleEn", "altZh", "altEn", "captionZh", "captionEn", "credit"]) assert.ok(image[key], `${image.id}: ${key}`);
    assert.equal(new URL(image.sourceUrl).protocol, "https:");
    if (image.kind === "official-page-capture") {
      assert.equal(image.originalBytes, false);
      assert.equal(image.modelScope, "LongCat-2.5-Preview");
      assert.match(image.captionEn, /not a benchmark/i);
    } else {
      assert.equal(image.originalBytes, true);
      assert.equal(image.modelScope, "LongCat-2.0 only");
      assert.match(image.captionEn, /cannot be assigned to 2\.5|neither a 2\.5/);
      assert.equal(image.sourcePublishedAt, "2026-06-30");
    }
  }
});

test("frontend publication uses original non-executable HTML downloads and desktop/mobile screenshots", async () => {
  assert.equal(frontend.attempts.length, 2);
  assert.deepEqual(new Set(frontend.attempts.map(attempt => attempt.mode)), new Set(["default", "disabled"]));
  for (const attempt of frontend.attempts) {
    assert.match(attempt.htmlPath, /\.html\.txt$/);
    const html = read("public" + attempt.htmlPath);
    assert.equal(hash(html), attempt.htmlSha256);
    assert.match(html.toString(), /<html\b/i);
    assert.ok(attempt.assessmentZh && attempt.assessmentEn);
    assert.ok(attempt.checks.length > 0);
    for (const viewport of ["desktop", "mobile"]) {
      const screenshot = attempt.screenshots[viewport];
      const bytes = read("public" + screenshot.path);
      if (screenshot.sha256) assert.equal(hash(bytes), screenshot.sha256);
      const metadata = await sharp(bytes).metadata();
      assert.equal(metadata.width, screenshot.width);
      assert.equal(metadata.height, screenshot.height);
      assert.equal(screenshot.width, viewport === "desktop" ? 1440 : 390);
    }
  }
});
