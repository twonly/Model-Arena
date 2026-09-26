import type { RunParams } from "./types.ts";

export const SUITE_VERSION = "tasks-2026-09-26.1";
export const BENCHMARK_REGION = "hkg1";
export const BENCHMARK_PARAMS: RunParams = {
  systemPrompt: "",
  temperature: "0",
  maxTokens: "2048",
};
export type TaskCategory = "extraction" | "instruction" | "grounded-qa";
export interface BenchmarkCase {
  id: string;
  version: string;
  category: TaskCategory;
  title: string;
  titleEn: string;
  prompt: string;
  expected: unknown;
}
export interface TaskIdentity {
  caseId: string;
  version: string;
}

const people = [
  { name: "林桐", age: 28, city: "杭州", email: null },
  { name: "李明", age: 36, city: "成都", email: "li@example.test" },
  { name: "陈夏", age: 22, city: "南京", email: null },
  { name: "周舟", age: 41, city: "苏州", email: "zhou@example.test" },
  { name: "吴雨", age: 30, city: "武汉", email: null },
];
const extraction: BenchmarkCase[] = people.map((p, i) => ({
  id: `extract-${i + 1}`,
  version: SUITE_VERSION,
  category: "extraction",
  title: `联系信息抽取 ${i + 1}`,
  titleEn: `Contact extraction ${i + 1}`,
  prompt: `从以下资料提取联系信息。只输出一个 JSON 对象，恰好包含 name、age、city、email 四个字段；age 为数字，未提供的 email 为 null。不要 Markdown 或解释。\n资料：${p.name}，${p.age} 岁，目前居住在${p.city}。${p.email ? `电子邮件为 ${p.email}。` : "未提供电子邮件。"}历史备注提到曾在北京出差，不是现居城市。`,
  expected: p,
}));
const instruction: BenchmarkCase[] = [
  {
    id: "format-1",
    title: "保序去重",
    titleEn: "Stable deduplication",
    prompt:
      "把以下编号去重并保持首次出现的顺序：B2,A1,B2,C3,A1,D4。只输出用英文逗号连接的编号，不要空格、标题或解释。",
    expected: "B2,A1,C3,D4",
  },
  {
    id: "format-2",
    title: "限定字段",
    titleEn: "Exact fields",
    prompt:
      '仅输出 JSON 对象，且恰好包含 status 和 count 两个字段。status 的值必须为字符串 "ready"，count 必须为数字 3。不要 Markdown、解释或额外字段。',
    expected: { status: "ready", count: 3 },
  },
  {
    id: "format-3",
    title: "严格排序",
    titleEn: "Ordered output",
    prompt:
      "将数值 12、3、25、8 按从小到大排序。只输出 JSON 数组，元素为数字。不要解释或代码围栏。",
    expected: [3, 8, 12, 25],
  },
  {
    id: "format-4",
    title: "大小写与换行",
    titleEn: "Case and line breaks",
    prompt:
      "按原顺序将 apple、pear、plum 转为英文大写，每行一个单词。总共三行，不要编号、标点、空行或解释。",
    expected: "APPLE\nPEAR\nPLUM",
  },
  {
    id: "format-5",
    title: "指定分隔符",
    titleEn: "Required delimiter",
    prompt:
      "提取下面三个工单号，保持顺序：工单 TX-103 已关闭；工单 TX-207 正在处理；工单 TX-309 待分配。只用英文竖线连接三个编号，不要空格或解释。",
    expected: "TX-103|TX-207|TX-309",
  },
].map((c) => ({ ...c, category: "instruction", version: SUITE_VERSION }));
const facts = [
  ["北区", 12, 3, "周二"],
  ["南区", 20, 4, "周三"],
  ["东区", 18, 6, "周四"],
  ["西区", 25, 5, "周五"],
  ["中区", 16, 2, "周一"],
] as const;
const grounded: BenchmarkCase[] = facts.map(
  ([region, received, damaged, day], i) => ({
    id: `grounded-${i + 1}`,
    version: SUITE_VERSION,
    category: "grounded-qa",
    title: `材料问答 ${i + 1}`,
    titleEn: `Grounded question answering ${i + 1}`,
    prompt: `只根据以下材料回答。输出恰好包含 usable、nextDelivery、manager 三个字段的 JSON 对象，不要额外文字。usable 是可用件数（数字），nextDelivery 是下一次送货时间（字符串），材料未说明的信息用 null，不能猜测。\n材料：${region}仓库今天收到 ${received} 件货物，其中 ${damaged} 件损坏，不可使用。下一次送货安排在${day}。仓库负责人姓名没有记载。旧计划曾写周日，已作废。`,
    expected: { usable: received - damaged, nextDelivery: day, manager: null },
  }),
);
export const BENCHMARK_CASES: BenchmarkCase[] = [
  ...extraction,
  ...instruction,
  ...grounded,
];
export const TASK_LABELS = {
  extraction: { "zh-CN": "JSON 信息抽取", en: "JSON extraction" },
  instruction: { "zh-CN": "指令约束遵循", en: "Instruction following" },
  "grounded-qa": { "zh-CN": "基于材料的问答", en: "Grounded QA" },
};
export function benchmarkCase(
  identity?: TaskIdentity,
): BenchmarkCase | undefined {
  return (
    identity &&
    BENCHMARK_CASES.find(
      (c) => c.id === identity.caseId && c.version === identity.version,
    )
  );
}
function equal(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (
    !a ||
    !b ||
    typeof a !== "object" ||
    typeof b !== "object" ||
    Array.isArray(a) !== Array.isArray(b)
  )
    return false;
  const aa = a as Record<string, unknown>,
    bb = b as Record<string, unknown>;
  return (
    Object.keys(aa).length === Object.keys(bb).length &&
    Object.keys(bb).every((k) => Object.hasOwn(aa, k) && equal(aa[k], bb[k]))
  );
}
export function checkCase(c: BenchmarkCase, output: string): boolean {
  const text = output.trim().replace(/\r\n/g, "\n");
  if (typeof c.expected === "string") return text === c.expected;
  try {
    return equal(JSON.parse(text), c.expected);
  } catch {
    return false;
  }
}
