/**
 * 流式 `<think>…</think>` 拆分器（兜底）。
 *
 * 用于「把思考内联在正文 content 里、不走独立 reasoning 字段」的模型——例如 MiniMax-M3
 * 走 OpenAI 兼容接口、部分 Qwen / 本地模型 / 聚合网关。OpenAI 协议下这类模型把
 * `<think>…</think>` 直接塞进 `delta.content`，proxy 若只认 reasoning_content 字段，
 * 思考就会漏进正文、且思考统计 / TPS 拆分全失效。
 *
 * 设计要点：
 * - **只在正文「开头」（允许前导空白）就是 `<think>` 时才启用**，避免把正文/代码里偶然出现的
 *   `<think>` 误判为思考。一旦判定不是思考开头，后续 content 一律原样当正文。
 * - **标签可能被切在多个 delta 里**（`<`、`th`、`ink>` 分到不同块），故用 pending 缓冲 + 状态机，
 *   末尾可能是半截标签时先留住、不急着输出。
 * - 纯函数 / 无副作用，便于单测；调用方（route.ts OpenAI 分支）在「本轮从未出现独立 reasoning
 *   字段」时才喂给它，已用字段的规矩模型（DeepSeek 等）完全不受影响。
 */

export type ThinkSplitState = "undecided" | "in_think" | "done";

const OPEN = "<think>";
const CLOSE = "</think>";

export interface ThinkChunk {
  text: string;
  reasoning: string;
}

const EMPTY: ThinkChunk = { text: "", reasoning: "" };

/** s 的最长「同时是 tag 前缀」的后缀长度（用于判断 pending 末尾是否可能是半截标签） */
function partialTagTailLen(s: string, tag: string): number {
  const max = Math.min(s.length, tag.length - 1);
  for (let n = max; n > 0; n--) {
    if (tag.startsWith(s.slice(s.length - n))) return n;
  }
  return 0;
}

export function createThinkSplitter() {
  let state: ThinkSplitState = "undecided";
  let pending = "";
  let leadingWs = ""; // undecided 阶段暂存的前导空白（确认非思考时还给正文）

  function processInThink(): ThinkChunk {
    const idx = pending.indexOf(CLOSE);
    if (idx >= 0) {
      const reasoning = pending.slice(0, idx);
      const rest = pending.slice(idx + CLOSE.length);
      pending = "";
      state = "done";
      return { text: rest, reasoning };
    }
    // 未闭合：除「末尾可能是半截 </think>」外都作为思考输出
    const keep = partialTagTailLen(pending, CLOSE);
    const reasoning = keep > 0 ? pending.slice(0, pending.length - keep) : pending;
    pending = keep > 0 ? pending.slice(pending.length - keep) : "";
    return { text: "", reasoning };
  }

  function decide(): ThinkChunk {
    // 暂存并剥离前导空白
    const m = pending.match(/^\s+/);
    if (m) {
      leadingWs += m[0];
      pending = pending.slice(m[0].length);
    }
    if (pending === "") return EMPTY; // 目前只有空白，继续等

    if (pending[0] !== "<") {
      // 明确不是 <think>：前导空白 + 内容全部当正文
      const text = leadingWs + pending;
      leadingWs = "";
      pending = "";
      state = "done";
      return { text, reasoning: "" };
    }

    if (pending.length < OPEN.length) {
      // 还不够长：是 <think> 的前缀就继续等，否则是别的标签（<html> 等）
      if (OPEN.startsWith(pending)) return EMPTY;
      const text = leadingWs + pending;
      leadingWs = "";
      pending = "";
      state = "done";
      return { text, reasoning: "" };
    }

    if (pending.startsWith(OPEN)) {
      pending = pending.slice(OPEN.length);
      leadingWs = ""; // 思考块外的前导空白丢弃
      state = "in_think";
      return processInThink();
    }

    // 够长但不是 <think>（如 <thinx / <html…）
    const text = leadingWs + pending;
    leadingWs = "";
    pending = "";
    state = "done";
    return { text, reasoning: "" };
  }

  return {
    /** 喂一段 content，返回这段能确定归类的 text / reasoning（半截标签会被缓冲，可能返回空） */
    push(content: string): ThinkChunk {
      if (!content) return EMPTY;
      pending += content;
      if (state === "undecided") return decide();
      if (state === "in_think") return processInThink();
      const text = pending;
      pending = "";
      return { text, reasoning: "" };
    },
    /** 流结束时冲刷缓冲：in_think 未闭合→剩余算思考；其余算正文 */
    flush(): ThinkChunk {
      let out: ThinkChunk;
      if (state === "in_think") out = { text: "", reasoning: pending };
      else out = { text: leadingWs + pending, reasoning: "" };
      pending = "";
      leadingWs = "";
      return out;
    },
  };
}
