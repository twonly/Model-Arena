/** Keep the concrete observations on the card; full notes remain in its details. */
export function reviewExcerpt(text: string, en: boolean) {
  const parts = en ? text.split(/(?<=[.!?])\s+(?=[A-Z])/u) : text.split(/。/u).filter(Boolean).map(s => s + "。");
  const notes = parts.filter(s => !/(?:不代表|不能据此|不能泛化|不是物理|不构成|不能称|不等于|未独立验证|这只是|首轮|独立重试|此前失败|此前大量失败|完整重试历史|not a statistical|not a general|cannot be generalized|does not establish|not independently|no independent|This is a qualitative|After increasing|successful retry|retry succeeded)/iu.test(s));
  return (notes.length ? notes : parts).slice(0, 2).join(en ? " " : "");
}
