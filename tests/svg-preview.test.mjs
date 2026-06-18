import assert from "node:assert/strict";
import test from "node:test";

import { extractHtmlDoc, extractSvgs, svgDataUrl } from "../lib/svg.ts";

test("extracts complete HTML documents from fenced model output", () => {
  const html = extractHtmlDoc(
    "```html\n<!doctype html><html><body><canvas id=\"c\"></canvas><script>requestAnimationFrame(()=>{})</script></body></html>\n```"
  );
  assert.ok(html?.startsWith("<!doctype html>"));
  assert.match(html ?? "", /<canvas id="c">/);
});

test("wraps runnable canvas fragments for sandbox preview", () => {
  const html = extractHtmlDoc(
    '<canvas id="scene"></canvas><script>const c=document.getElementById("scene"); requestAnimationFrame(()=>{});</script>'
  );
  assert.match(html ?? "", /<!doctype html>/);
  assert.match(html ?? "", /<canvas id="scene">/);
  assert.match(html ?? "", /requestAnimationFrame/);
});

test("wraps css animation fragments for sandbox preview", () => {
  const html = extractHtmlDoc(
    "```html\n<style>@keyframes spin{to{transform:rotate(360deg)}}</style><div class=\"orb\"></div>\n```"
  );
  assert.match(html ?? "", /<!doctype html>/);
  assert.match(html ?? "", /@keyframes spin/);
});

test("keeps svg extraction as inert image previews", () => {
  const svgs = extractSvgs('<svg viewBox="0 0 10 10"><script>alert(1)</script></svg>');
  assert.equal(svgs.length, 1);
  assert.match(svgDataUrl(svgs[0]), /^data:image\/svg\+xml;charset=utf-8,/);
});
