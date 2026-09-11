import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const layout = readFileSync(new URL("../app/[lang]/layout.tsx", import.meta.url), "utf8");
const adsTxt = readFileSync(new URL("../public/ads.txt", import.meta.url), "utf8");

test("AdSense site verification and ads.txt use the same publisher account", () => {
  const publisherId = layout.match(/"google-adsense-account": "ca-(pub-\d{16})"/)?.[1];
  assert.equal(publisherId, "pub-3004733289316212");
  assert.equal(adsTxt, `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`);
});

test("site verification does not enable global advertising scripts", () => {
  assert.doesNotMatch(layout, /adsbygoogle\.js|googlesyndication\.com|fundingchoicesmessages\.google\.com/);
});
