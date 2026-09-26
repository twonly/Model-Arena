import {
  benchmarkCase,
  checkCase,
  type TaskIdentity,
} from "./benchmark-suite.ts";
export interface GradeResult {
  pass: boolean;
  label: string;
}

/** Grade only an explicitly selected, unchanged, versioned case. Never infer a task from keywords. */
export function grade(
  prompt: string,
  text: string,
  identity?: TaskIdentity,
): GradeResult | null {
  const c = benchmarkCase(identity);
  if (!c || prompt !== c.prompt || !text) return null;
  return { pass: checkCase(c, text), label: c.title };
}
export function isGradable(prompt: string, identity?: TaskIdentity): boolean {
  return benchmarkCase(identity)?.prompt === prompt;
}
