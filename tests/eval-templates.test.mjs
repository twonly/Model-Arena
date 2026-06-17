import assert from "node:assert/strict";
import test from "node:test";

import {
  OFFICIAL_EVAL_TEMPLATES,
  buildTemplateArenaSeed,
  customPromptToEvalTemplate,
  templateConfidenceLabel,
  templateHistoryCounts,
} from "../lib/eval-templates.ts";

test("official eval templates are unique and cover core categories", () => {
  assert.ok(OFFICIAL_EVAL_TEMPLATES.length >= 10);
  const ids = OFFICIAL_EVAL_TEMPLATES.map((template) => template.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(OFFICIAL_EVAL_TEMPLATES.some((template) => template.category === "speed"));
  assert.ok(OFFICIAL_EVAL_TEMPLATES.some((template) => template.category === "coding"));
  assert.ok(OFFICIAL_EVAL_TEMPLATES.some((template) => template.category === "instruction"));
  assert.ok(OFFICIAL_EVAL_TEMPLATES.every((template) => template.publicSamples === 0));
});

test("template arena seed only carries prompt and template metadata", () => {
  const template = OFFICIAL_EVAL_TEMPLATES[0];
  const seed = buildTemplateArenaSeed(template);

  assert.equal(seed.mode, "share-prompt");
  assert.equal(seed.prompt, template.prompt);
  assert.equal(seed.templateId, template.id);
  assert.equal(seed.templateTitle, template.title);
  assert.equal(seed.models, undefined);
  assert.match(seed.notes ?? "", /可自己编辑/);
});

test("custom prompt templates have stable ids and default scoring", () => {
  const a = customPromptToEvalTemplate(
    { label: "我的客服评测", text: "请回答一个售后问题。" },
    0
  );
  const b = customPromptToEvalTemplate(
    { label: "我的客服评测", text: "请回答一个售后问题。" },
    3
  );

  assert.equal(a.id, b.id);
  assert.equal(a.source, "custom");
  assert.equal(a.title, "我的客服评测");
  assert.ok(a.scoring.includes("速度表现"));
});

test("template history counts only entries with template ids", () => {
  const counts = templateHistoryCounts([
    { id: "1", at: 1, title: "", notes: "", prompt: "", templateId: "a", results: [] },
    { id: "2", at: 2, title: "", notes: "", prompt: "", templateId: "a", results: [] },
    { id: "3", at: 3, title: "", notes: "", prompt: "", templateId: "b", results: [] },
    { id: "4", at: 4, title: "", notes: "", prompt: "", results: [] },
  ]);

  assert.deepEqual(counts, { a: 2, b: 1 });
});

test("template confidence can be lifted by local samples", () => {
  assert.equal(templateConfidenceLabel(0, 0).tone, "low");
  assert.equal(templateConfidenceLabel(0, 12).tone, "medium");
  assert.equal(templateConfidenceLabel(0, 55).tone, "high");
});
