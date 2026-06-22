import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { DATASET_LICENSE_URL } from "../lib/structured-data.ts";

const datasetPages = [
  "app/model/[slug]/page.tsx",
  "app/pricing/page.tsx",
  "app/stats/page.tsx",
];

test("Dataset JSON-LD pages use the shared license URL", () => {
  for (const file of datasetPages) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /DATASET_LICENSE_URL/, `${file} should include a Dataset license`);
  }
});

test("Dataset license is a concrete HTTPS license document", () => {
  assert.match(DATASET_LICENSE_URL, /^https:\/\//);
  assert.match(DATASET_LICENSE_URL, /creativecommons\.org\/licenses\//);
});

