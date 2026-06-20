/**
 * 客观题自动判定（尽力而为）。
 * 仅对有「唯一可校验答案」的经典题判对错；其余返回 null（不判）。
 * 判定保守：不确定时宁可不判，也不误报「对」。UI 须标注「自动判定，可能误判」。
 */

export interface GradeResult {
  pass: boolean;
  /** 题目短标签，如「数 r」「比大小」 */
  label: string;
}

interface Grader {
  label: string;
  /** 命中此题（按 prompt 内容判断） */
  match: (prompt: string) => boolean;
  /** 判定模型输出是否正确 */
  check: (text: string) => boolean;
}

const has = (re: RegExp) => (s: string) => re.test(s);

/** 抽取文本中最后一个 JSON 对象并解析 */
function extractJson(text: string): Record<string, unknown> | null {
  const fences = text.replace(/```(?:json)?/gi, "");
  const matches = fences.match(/\{[\s\S]*?\}/g);
  if (!matches) return null;
  for (let i = matches.length - 1; i >= 0; i--) {
    try {
      const o = JSON.parse(matches[i]);
      if (o && typeof o === "object") return o as Record<string, unknown>;
    } catch {
      /* 继续试上一个 */
    }
  }
  return null;
}

const GRADERS: Grader[] = [
  {
    label: "数 r (strawberry)",
    match: has(/strawberry/i),
    // 答案 3：明确说 3 / 三 / three，且没有把答案说成 2
    check: (t) => {
      const tail = t.slice(-400);
      const says3 = /([^0-9]|^)3([^0-9]|$)|三个|\bthree\b/i.test(tail);
      const says2 = /([^0-9]|^)2([^0-9]|$)\s*个?\s*r|两个\s*r|\btwo\b\s*r/i.test(tail);
      return says3 && !says2;
    },
  },
  {
    label: "比大小 9.11/9.9",
    match: has(/9\.11/),
    check: (t) => {
      // 正确：9.9 更大 / 9.11 更小
      return (
        /9\.9\b[^。.\n]{0,16}(更大|较大|大于|larger|bigger|greater|>)/i.test(t) ||
        /(更大|较大|larger|bigger)[^。.\n]{0,16}9\.9\b/i.test(t) ||
        /9\.11[^。.\n]{0,16}(更小|较小|小于|smaller|less than|<)/i.test(t)
      );
    },
  },
  {
    label: "反转字符串",
    match: has(/human-level/i),
    check: has(/level-namuh/i),
  },
  {
    label: "JSON 抽取",
    match: (p) => /只输出\s*JSON|output only JSON|字段：?name|fields?\s+name/i.test(p) && /张伟|Zhang Wei/i.test(p),
    check: (t) => {
      const o = extractJson(t);
      if (!o) return false;
      const name = String(o.name ?? "");
      const city = String(o.city ?? "");
      const age = Number(o.age);
      return /张伟|Zhang ?Wei/i.test(name) && age === 28 && /杭州|Hangzhou/i.test(city);
    },
  },
  {
    label: "鸡兔同笼",
    match: (p) => /鸡.*兔|兔.*鸡|chickens?.*rabbits?/i.test(p) && /35/.test(p) && /94/.test(p),
    // 答案：鸡 23、兔 12
    check: (t) => /([^0-9]|^)23([^0-9]|$)/.test(t) && /([^0-9]|^)12([^0-9]|$)/.test(t),
  },
  {
    label: "折扣叠加",
    match: (p) => /200/.test(p) && /(8\s*折|打\s*8|20%)/.test(p) && /(满\s*100\s*减\s*20|coupon)/i.test(p),
    // 答案：140
    check: (t) => /([^0-9]|^)140([^0-9]|$)/.test(t.slice(-300)),
  },
  {
    label: "互质计数",
    match: (p) => /互质|coprime/i.test(p) && /1000/.test(p),
    // 答案：400
    check: (t) => /([^0-9]|^)400([^0-9]|$)/.test(t.slice(-300)),
  },
];

/** 判定一道题；不可判返回 null */
export function grade(prompt: string, text: string): GradeResult | null {
  if (!prompt || !text) return null;
  const g = GRADERS.find((x) => x.match(prompt));
  if (!g) return null;
  return { pass: g.check(text), label: g.label };
}

/** 该 prompt 是否属于可自动判定的客观题 */
export function isGradable(prompt: string): boolean {
  return GRADERS.some((x) => x.match(prompt));
}
