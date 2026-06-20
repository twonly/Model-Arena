import assert from "node:assert/strict";
import test from "node:test";

import {
  extractHtmlDoc,
  extractSvgs,
  looksLikeHtmlAttempt,
  svgDataUrl,
} from "../lib/svg.ts";

test("extracts complete HTML documents from fenced model output", () => {
  const html = extractHtmlDoc(
    "```html\n<!doctype html><html><body><canvas id=\"c\"></canvas><script>requestAnimationFrame(()=>{})</script></body></html>\n```"
  );
  assert.ok(html?.startsWith("<!doctype html>"));
  assert.match(html ?? "", /<canvas id="c">/);
  assert.match(html ?? "", /data-tokrace-preview-error-handler/);
});

test("wraps runnable canvas fragments for sandbox preview", () => {
  const html = extractHtmlDoc(
    '<canvas id="scene"></canvas><script>const c=document.getElementById("scene"); requestAnimationFrame(()=>{});</script>'
  );
  assert.match(html ?? "", /<!doctype html>/);
  assert.match(html ?? "", /<canvas id="scene">/);
  assert.match(html ?? "", /requestAnimationFrame/);
  assert.match(html ?? "", /Preview script error/);
});

test("injects a visible error handler before user scripts in complete html", () => {
  const html = extractHtmlDoc(
    '<!doctype html><html><head><script>throw new Error("early")</script></head><body></body></html>'
  );
  assert.match(html ?? "", /data-tokrace-preview-error-handler/);
  assert.ok(
    (html ?? "").indexOf("data-tokrace-preview-error-handler") <
      (html ?? "").indexOf('throw new Error("early")')
  );
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

test("injects a storage shim before user scripts so null-origin localStorage doesn't crash", () => {
  const html = extractHtmlDoc(
    '<!doctype html><html><head></head><body><script>localStorage.setItem("k","1")</script></body></html>'
  );
  // Shim is present and lands before the user script that touches storage.
  assert.match(html ?? "", /data-tokrace-preview-storage-shim/);
  assert.ok(
    (html ?? "").indexOf("data-tokrace-preview-storage-shim") <
      (html ?? "").indexOf('localStorage.setItem("k","1")')
  );
  // Error handler still comes first (must register before everything else).
  assert.ok(
    (html ?? "").indexOf("data-tokrace-preview-error-handler") <
      (html ?? "").indexOf("data-tokrace-preview-storage-shim")
  );
});

test("looksLikeHtmlAttempt flags web/canvas output but not plain prose", () => {
  assert.ok(looksLikeHtmlAttempt("<!doctype html><html>...</html>"));
  assert.ok(looksLikeHtmlAttempt("here is a <canvas id='c'></canvas> snippet"));
  assert.ok(looksLikeHtmlAttempt("```html\n<div>hi</div>\n```"));
  assert.equal(looksLikeHtmlAttempt("Just a normal essay about speed."), false);
  assert.equal(looksLikeHtmlAttempt(""), false);
});
