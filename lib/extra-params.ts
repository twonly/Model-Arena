/** Change only effort; preserve token budgets and all other provider options. */
export function withThinkingEffort(json: string, key: "reasoning" | "reasoning_effort", effort: string): string {
  const extra = JSON.parse(json.trim() || "{}");
  if (!extra || typeof extra !== "object" || Array.isArray(extra)) throw new Error("Expected a JSON object");
  delete extra.reasoning_effort;
  if (extra.reasoning && typeof extra.reasoning === "object" && !Array.isArray(extra.reasoning)) {
    delete extra.reasoning.effort;
    if (!Object.keys(extra.reasoning).length) delete extra.reasoning;
  }
  if (effort) {
    if (key === "reasoning") {
      const reasoning = extra.reasoning;
      extra.reasoning = {
        ...(reasoning && typeof reasoning === "object" && !Array.isArray(reasoning) ? reasoning : {}),
        effort,
      };
    } else extra.reasoning_effort = effort;
  }
  return Object.keys(extra).length ? JSON.stringify(extra, null, 2) : "";
}
