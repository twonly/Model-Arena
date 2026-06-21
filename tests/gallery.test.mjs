import assert from "node:assert/strict";
import test from "node:test";

import { visualFromText } from "../lib/share-server.ts";

test("visualFromText extracts SVG", () => {
  const v = visualFromText('here: <svg viewBox="0 0 10 10"><circle r="5"/></svg> done');
  assert.equal(v?.kind, "svg");
  assert.match(v.svg, /^data:image\/svg\+xml/);
});

test("visualFromText extracts runnable HTML/Canvas", () => {
  const v = visualFromText(
    "```html\n<!doctype html><html><body><canvas id=c></canvas><script>requestAnimationFrame(()=>{})</script></body></html>\n```"
  );
  assert.equal(v?.kind, "html");
  assert.match(v.html, /<canvas/);
});

test("visualFromText returns null for plain prose", () => {
  assert.equal(visualFromText("这是一段普通的文字回答，没有任何可视化内容。"), null);
});
