import assert from "node:assert/strict";
import test from "node:test";

import {
  isOpenCodeFence,
  openFenceContent,
  splitMarkdownBlocks,
} from "../lib/markdown-blocks.ts";

test("splits paragraphs on blank lines", () => {
  assert.deepEqual(splitMarkdownBlocks("a\n\nb\n\nc"), ["a", "b", "c"]);
});

test("ignores blank-only runs and trailing whitespace", () => {
  assert.deepEqual(splitMarkdownBlocks("a\n\n\n\nb\n\n"), ["a", "b"]);
});

test("keeps a fenced code block intact even with blank lines inside", () => {
  const text = "intro\n\n```js\nconst a = 1;\n\nconst b = 2;\n```\n\nafter";
  assert.deepEqual(splitMarkdownBlocks(text), [
    "intro",
    "```js\nconst a = 1;\n\nconst b = 2;\n```",
    "after",
  ]);
});

test("keeps a list as a single block", () => {
  assert.deepEqual(splitMarkdownBlocks("- a\n- b\n- c"), ["- a\n- b\n- c"]);
});

test("an unterminated fence is detected as open (the streaming HTML case)", () => {
  const tail = "```html\n<!doctype html>\n<html><body>hi";
  const blocks = splitMarkdownBlocks(tail);
  assert.equal(blocks.length, 1);
  assert.equal(isOpenCodeFence(blocks[0]), true);
});

test("a closed fence is not flagged open", () => {
  assert.equal(isOpenCodeFence("```js\nconst a = 1;\n```"), false);
});

test("~~~ and ``` fences do not cross-close each other", () => {
  // 开 ``` 内部出现 ~~~ 不应被当作闭合
  assert.equal(isOpenCodeFence("```\n~~~\nstill open"), true);
});

test("plain prose is never an open fence", () => {
  assert.equal(isOpenCodeFence("just a paragraph"), false);
});

test("openFenceContent strips the opening fence and reads the language", () => {
  assert.deepEqual(openFenceContent("```html\n<div>hi</div>\nmore"), {
    lang: "html",
    code: "<div>hi</div>\nmore",
  });
  assert.deepEqual(openFenceContent("```\nno lang"), { lang: "", code: "no lang" });
});

test("only the trailing block grows while earlier blocks stay byte-identical", () => {
  // memo 依赖：已完成块文本恒定，新增内容只进末块
  const a = splitMarkdownBlocks("# Title\n\nfirst para\n\nsecond par");
  const b = splitMarkdownBlocks("# Title\n\nfirst para\n\nsecond paragraph is");
  assert.equal(a[0], b[0]);
  assert.equal(a[1], b[1]);
  assert.notEqual(a[2], b[2]);
});
