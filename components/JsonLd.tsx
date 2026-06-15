/**
 * 注入 JSON-LD 结构化数据（schema.org）。
 * 供搜索引擎与生成式引擎（GEO）理解站点 / 榜单内容并引用。
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // 数据由本站构造，非用户输入；JSON.stringify 已转义
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
