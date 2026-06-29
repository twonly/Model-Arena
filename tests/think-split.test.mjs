import assert from "node:assert/strict";
import test from "node:test";

import { createThinkSplitter } from "../lib/think-split.ts";

/** 把若干 content 片段喂进拆分器，聚合（含 flush）后返回 {text, reasoning} */
function run(chunks) {
  const s = createThinkSplitter();
  let text = "";
  let reasoning = "";
  for (const c of chunks) {
    const r = s.push(c);
    text += r.text;
    reasoning += r.reasoning;
  }
  const f = s.flush();
  text += f.text;
  reasoning += f.reasoning;
  return { text, reasoning };
}

test("inline <think>…</think> in a single chunk splits cleanly", () => {
  const { text, reasoning } = run(["<think>weighing options</think>final answer"]);
  assert.equal(reasoning, "weighing options");
  assert.equal(text, "final answer");
});

test("real MiniMax-M3 two-chunk shape", () => {
  const { text, reasoning } = run([
    "<think>\n9",
    ".11 vs 9.9. Clearly 9.9 is larger.\n</think>\n9.9 更大。",
  ]);
  assert.equal(reasoning, "\n9.11 vs 9.9. Clearly 9.9 is larger.\n");
  assert.equal(text, "\n9.9 更大。");
});

test("open tag split across many deltas", () => {
  const { text, reasoning } = run(["<", "th", "ink", ">", "thought", "</think>", "ans"]);
  assert.equal(reasoning, "thought");
  assert.equal(text, "ans");
});

test("close tag split across deltas (partial tail buffered, not leaked)", () => {
  const s = createThinkSplitter();
  const a = s.push("<think>reason");
  assert.equal(a.reasoning, "reason");
  assert.equal(a.text, "");
  const b = s.push("ing</"); // 末尾 "</" 可能是 </think> 半截 → 不能漏进 reasoning
  assert.equal(b.reasoning, "ing");
  assert.equal(b.text, "");
  const c = s.push("think>visible");
  assert.equal(c.reasoning, "");
  assert.equal(c.text, "visible");
});

test("plain content with no think tag passes through as text", () => {
  const { text, reasoning } = run(["9.9 ", "更大。"]);
  assert.equal(reasoning, "");
  assert.equal(text, "9.9 更大。");
});

test("leading whitespace before <think> is dropped, trailing answer kept", () => {
  const { text, reasoning } = run(["\n\n<think>r</think>", "ans"]);
  assert.equal(reasoning, "r");
  assert.equal(text, "ans");
});

test("content starting with a different tag is treated as text", () => {
  const { text, reasoning } = run(["<html>", "<body>hi</body></html>"]);
  assert.equal(reasoning, "");
  assert.equal(text, "<html><body>hi</body></html>");
});

test("leading whitespace then normal text is preserved", () => {
  const { text, reasoning } = run(["\n", "Hello world"]);
  assert.equal(reasoning, "");
  assert.equal(text, "\nHello world");
});

test("unclosed <think> at end is flushed as reasoning", () => {
  const { text, reasoning } = run(["<think>still thinking when stream ended"]);
  assert.equal(reasoning, "still thinking when stream ended");
  assert.equal(text, "");
});

test("a stray <think> mid-answer is NOT treated as reasoning", () => {
  // 开头已是正文 → 后续 <think> 只当普通文本
  const { text, reasoning } = run(["Here is code: ", "<think>note</think> done"]);
  assert.equal(reasoning, "");
  assert.equal(text, "Here is code: <think>note</think> done");
});

test("bare < that never becomes a tag flushes as text", () => {
  const { text, reasoning } = run(["<"]);
  assert.equal(reasoning, "");
  assert.equal(text, "<");
});
