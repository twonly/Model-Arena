/**
 * 客户端 token 估算（无官方 usage 时的兜底）。
 * 经验值：CJK 字符约 0.7 token/字，其余按 4 字符/token。
 * 最终统计永远优先采用厂商返回的官方 usage，本估算只用于
 * 流式过程中的实时速度显示与缺失 usage 时的兜底。
 */
const CJK_RE =
  /[一-鿿㐀-䶿　-〿＀-￯぀-ヿ가-힯]/;

export function estimateTokens(text: string): number {
  if (!text) return 0;
  let cjk = 0;
  let other = 0;
  for (const ch of text) {
    if (CJK_RE.test(ch)) cjk++;
    else other++;
  }
  return Math.round(cjk * 0.7 + other / 4);
}
