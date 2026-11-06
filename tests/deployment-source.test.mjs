import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("deployment build rejects missing or empty locale proxy before running Next.js", (t) => {
  const dockerfile = readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
  const build = dockerfile.match(/^RUN (.*\bnpm run build.*)$/m);
  assert.ok(build, "Dockerfile must build the production app");
  const copyIndex = dockerfile.indexOf("COPY . .");
  assert.ok(copyIndex >= 0 && copyIndex < build.index, "source must be copied before validation");

  const dir = mkdtempSync(join(tmpdir(), "tokrace-deployment-source-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const bin = join(dir, "bin");
  mkdirSync(bin);
  writeFileSync(join(bin, "npm"), "#!/bin/sh\nprintf built > build-ran\n", { mode: 0o755 });
  const run = () => spawnSync("sh", ["-c", build[1]], {
    cwd: dir,
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
    encoding: "utf8",
  });

  assert.notEqual(run().status, 0, "missing proxy must fail the image build");
  assert.equal(existsSync(join(dir, "build-ran")), false);
  writeFileSync(join(dir, "proxy.ts"), "");
  assert.notEqual(run().status, 0, "empty proxy must fail the image build");
  assert.equal(existsSync(join(dir, "build-ran")), false);
  writeFileSync(join(dir, "proxy.ts"), "export function proxy() {}\n");
  assert.equal(run().status, 0, "nonempty proxy must allow the Next.js build");
  assert.equal(readFileSync(join(dir, "build-ran"), "utf8"), "built");
});
