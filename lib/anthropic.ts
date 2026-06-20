export const DEFAULT_ANTHROPIC_MAX_TOKENS = 32000;
export const THINK_DEFAULT_MAX_TOKENS = 256000;
export const THINK_ANSWER_RESERVE = 32000;
export const THINK_DEFAULT_BUDGET_TOKENS =
  THINK_DEFAULT_MAX_TOKENS - THINK_ANSWER_RESERVE;

const MIN_THINKING_BUDGET = 1024;

function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}

function budgetBelowMax(maxTokens: number): number {
  if (maxTokens - THINK_ANSWER_RESERVE >= MIN_THINKING_BUDGET) {
    return maxTokens - THINK_ANSWER_RESERVE;
  }
  const proportional = Math.floor(maxTokens * 0.8);
  if (proportional >= MIN_THINKING_BUDGET && proportional < maxTokens) {
    return proportional;
  }
  return Math.max(1, maxTokens - 1);
}

export function normalizeAnthropicThinkingPayload(
  payload: Record<string, unknown>,
  {
    formMax,
    extra,
  }: {
    formMax?: number;
    extra: Record<string, unknown>;
  }
): boolean {
  const thinking = asRecord(payload.thinking);
  if (thinking?.type !== "enabled") return false;

  const explicitMax = formMax != null || isNumber(extra.max_tokens);
  const explicitBudget = isNumber(thinking.budget_tokens);

  if (!explicitMax && !explicitBudget) {
    payload.max_tokens = THINK_DEFAULT_MAX_TOKENS;
    payload.thinking = {
      ...thinking,
      budget_tokens: THINK_DEFAULT_BUDGET_TOKENS,
    };
    return true;
  }

  if (!explicitBudget) {
    const maxTokens = isNumber(payload.max_tokens)
      ? payload.max_tokens
      : DEFAULT_ANTHROPIC_MAX_TOKENS;
    let budget = budgetBelowMax(maxTokens);
    if (budget < MIN_THINKING_BUDGET) {
      payload.max_tokens = MIN_THINKING_BUDGET + THINK_ANSWER_RESERVE;
      budget = MIN_THINKING_BUDGET;
    }
    payload.thinking = { ...thinking, budget_tokens: budget };
    return true;
  }

  if (!explicitMax) {
    payload.max_tokens =
      (thinking.budget_tokens as number) + THINK_ANSWER_RESERVE;
    return true;
  }

  if (
    isNumber(payload.max_tokens) &&
    (thinking.budget_tokens as number) >= payload.max_tokens
  ) {
    let budget = budgetBelowMax(payload.max_tokens);
    if (budget < MIN_THINKING_BUDGET) {
      payload.max_tokens = MIN_THINKING_BUDGET + THINK_ANSWER_RESERVE;
      budget = MIN_THINKING_BUDGET;
    }
    payload.thinking = { ...thinking, budget_tokens: budget };
  }

  return true;
}

export function anthropicThinkingMaxTokenErrorMessage(maxTokens: unknown) {
  return (
    `思考阶段用满了 max_tokens（${String(maxTokens)}）就被截断，没有产出正文。` +
    `请增大 max_tokens 并设置 thinking.budget_tokens——到「模型配置 → 额外请求参数」填入：` +
    `{"max_tokens": ${THINK_DEFAULT_MAX_TOKENS}, "thinking": {"type": "enabled", "budget_tokens": ${THINK_DEFAULT_BUDGET_TOKENS}}}`
  );
}
