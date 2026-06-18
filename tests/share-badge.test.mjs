import assert from "node:assert/strict";
import test from "node:test";

import {
  compareBadge,
  escapeSvgText,
  markdownBadge,
  renderBadgeSvg,
  truncateBadgeText,
} from "../lib/badge.ts";
import {
  buildSharePostText,
  githubLinkMarkdown,
  socialShareTargets,
} from "../lib/social-share.ts";

test("social share targets build platform URLs without mutating the source URL", () => {
  const url = "https://tokrace.com/en/r/abc123?ref=invite";
  const targets = socialShareTargets({
    url,
    title: "Step 3.7 Flash: 171 tok/s on TOKRACE",
    hashtags: ["TOKRACE"],
  });
  assert.equal(targets.length, 4);
  assert.ok(targets.find((t) => t.id === "x")?.href.startsWith("https://twitter.com/intent/tweet?"));
  assert.ok(targets.find((t) => t.id === "facebook")?.href.includes("facebook.com/sharer/sharer.php"));
  assert.ok(targets.find((t) => t.id === "weibo")?.href.includes("service.weibo.com/share/share.php"));
  assert.ok(targets.find((t) => t.id === "linkedin")?.href.includes("linkedin.com/sharing/share-offsite/"));
  assert.ok(targets.every((t) => decodeURIComponent(t.href).includes(url)));
});

test("github markdown copy is explicit instead of pretending GitHub has a social share endpoint", () => {
  assert.equal(
    githubLinkMarkdown({
      title: "DeepSeek ] result",
      url: "https://tokrace.com/en/model/deepseek-v4-flash",
    }),
    "[DeepSeek \\] result](https://tokrace.com/en/model/deepseek-v4-flash)"
  );
});

test("badge SVG escapes text and caps long messages", () => {
  assert.equal(escapeSvgText(`a<b>&"'`), "a&lt;b&gt;&amp;&quot;&apos;");
  assert.equal(truncateBadgeText("abcdef", 4), "abc…");
  const svg = renderBadgeSvg({
    label: "TOKRACE",
    message: `x <script>alert("bad")</script> & 171 tok/s`,
  });
  assert.match(svg, /x &lt;script&gt;alert\(&quot;bad&quot;\)&lt;\/script&gt; &amp; 171 tok\/s/);
  assert.doesNotMatch(svg, /<script>/);
});

test("compare badge includes both compared models and speeds", () => {
  const a = {
    model: "deepseek-v4-flash",
    provider: "deepseek",
    samples: 49,
    avgContentTps: 132,
    medianContentTps: 139,
    avgTtftMs: 710,
    maxPeakTps: 346,
    avgOutputTokens: 1000,
    lastAt: "2026-06-18T00:00:00Z",
  };
  const b = {
    model: "step-3.7-flash",
    provider: "stepfun",
    samples: 34,
    avgContentTps: 181,
    medianContentTps: 171,
    avgTtftMs: 1490,
    maxPeakTps: 528,
    avgOutputTokens: 1000,
    lastAt: "2026-06-18T00:00:00Z",
  };
  const badge = compareBadge(a, b, "en");
  assert.match(badge.message, /deepseek-v4-flash 139/);
  assert.match(badge.message, /step-3\.7-flash 171/);
});

test("default share post copy lists concrete models and rerun highlights", () => {
  const copy = buildSharePostText({
    title: "长文生成速度对比",
    locale: "zh-CN",
    models: [
      "deepseek-v4-flash",
      "step-3.7-flash",
      "kimi-for-coding",
      "mimo-v2.5",
      "deepseek-v4-pro",
    ],
  });
  assert.match(copy, /首 Token 体感 · 模型评测/);
  assert.match(copy, /deepseek-v4-flash、step-3\.7-flash、kimi-for-coding、mimo-v2\.5、deepseek-v4-pro（5 个模型）/);
  assert.match(copy, /TTFT、输出 tok\/s、峰值速度、模型原文/);
  assert.match(copy, /一键复跑/);
});

test("markdown badge escapes alt text closing brackets", () => {
  assert.equal(
    markdownBadge({
      alt: "Model ] speed",
      badgeUrl: "https://tokrace.com/api/badge/model/step-3-7-flash",
      targetUrl: "https://tokrace.com/en/model/step-3-7-flash",
    }),
    "[![Model \\] speed](https://tokrace.com/api/badge/model/step-3-7-flash)](https://tokrace.com/en/model/step-3-7-flash)"
  );
});
