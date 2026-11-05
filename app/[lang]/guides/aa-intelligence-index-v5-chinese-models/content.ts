// Generated from /workspace/aa-v5/article (article.md / article_en.md, svg/, svg_en/) by build_content.py. Edit the sources, then regenerate.
export type Block =
  | { t: "p" | "note" | "end"; text: string }
  | { t: "h2"; id: string; text: string }
  | { t: "fig"; src: string; alt: string }
  | { t: "shot"; src: string; w: number; h: number; cap: string };

export const AA_V5_URL = "https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v5";

/** Chart PNGs (zh) for sitemap / social images; SVGs are inlined from ./figures. */
export const FIGURE_FILES: string[] = [
  "f01_weights.png",
  "f02_slope.png",
  "f03_strip.png",
  "f04_band.png",
  "f05_tbs.png",
  "f08_heatmap.png",
  "f06_hle.png",
  "f07_removed.png",
  "f09_carbon.png",
  "f10_cost.png",
  "f11_effort.png"
];

export const SCREENSHOT_FILES: string[] = [
  "x/ArtificialAnlys_v5_crop.png",
  "x/superalesha_blur.png",
  "x/StatsWire.png",
  "x/Adiaos2012.png",
  "x/natolambert.png",
  "x/ymg_aq.png"
];

export const zhBlocks: Block[] = [
 {
  "t": "p",
  "text": "10 月 27 日，Artificial Analysis 发布 [Intelligence Index v5](https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v5)。AA 的发布帖有 200 万次浏览。新版一上线，几乎所有模型都掉了分，国产模型掉得最多：同一批模型，换一套题，平均少了 12.4 分。"
 },
 {
  "t": "p",
  "text": "国产模型是被针对了，还是在旧榜上本来就虚高？下面 17 个事实，全部来自 AA 公开的分数和方法论。"
 },
 {
  "t": "h2",
  "id": "fact-01",
  "text": "1. 考卷换掉了三成，而且大部分看不到"
 },
 {
  "t": "p",
  "text": "**v4.3.2 的 25% 权重被删掉，v5 的 30% 是新加的；60% 的权重落在私有题上。**"
 },
 {
  "t": "p",
  "text": "被删的是 GDPval-AA、SciCode 和长上下文测试 AA-LCR。新加的是 Cognition 出的私有代码基准 FrontierCode 2.0，和在终端里做科研任务的 Terminal-Bench-Science，各占 15%。HLE 换成精修版 HLE-Diamond，CritPt 换成 40 道私有难题，AA-Omniscience 升到 v1.1。"
 },
 {
  "t": "p",
  "text": "AA 自己的说法是：这是 v4 以来最大的一次升级，第一次让指数的大部分建立在私有数据上。"
 },
 {
  "t": "fig",
  "src": "f01_weights",
  "alt": "考卷换了三成"
 },
 {
  "t": "shot",
  "src": "ArtificialAnlys_v5_crop.png",
  "w": 569,
  "h": 611,
  "cap": "@ArtificialAnlys，10 月 27 日 22:11（美东时间）· [原帖](https://x.com/ArtificialAnlys/status/2115265133467635877)"
 },
 {
  "t": "h2",
  "id": "fact-02",
  "text": "2. 不只是国产，几乎所有模型都在掉分"
 },
 {
  "t": "p",
  "text": "**前后两版都有分的 77 个模型条目里，只有 8 个涨分。**"
 },
 {
  "t": "p",
  "text": "涨分的 8 个全是 Anthropic 和 OpenAI 的顶配：Opus 5.5 max/xhigh，GPT-6 Astra 的 max/xhigh/high/medium，GPT-6.1 Sol 的 max/xhigh。Opus 5.5 max 从 57.6 到 58.4，Astra max 从 52.7 涨到 56.9，Sol max 从 51.8 涨到 54.5。"
 },
 {
  "t": "p",
  "text": "剩下的全在掉：Claude Sonnet 5.5 max 掉 1.8，Gemini 4 Argon 掉 2.1，Meta 的 Muse Wonder Full 掉 6.1。"
 },
 {
  "t": "fig",
  "src": "f02_slope",
  "alt": "只有顶配在涨，其他都在掉"
 },
 {
  "t": "h2",
  "id": "fact-03",
  "text": "3. 但国产掉得约是别人的两倍"
 },
 {
  "t": "p",
  "text": "**17 个国产模型条目平均 -12.4 分，其余 60 个平均 -6.8 分。**"
 },
 {
  "t": "p",
  "text": "“只有国产在掉”不对，“国产没有特别掉”也不对。所有人都在退潮，国产退得更快。"
 },
 {
  "t": "fig",
  "src": "f03_strip",
  "alt": "国产掉分约是别人的两倍"
 },
 {
  "t": "h2",
  "id": "fact-04",
  "text": "4. 同一分数段比，国产仍多掉约 6 分"
 },
 {
  "t": "p",
  "text": "**v4.3.2 时同在 42–47 分的模型：国产平均 -13.9，其他平均 -8.2。**"
 },
 {
  "t": "p",
  "text": "国产模型在旧榜上大多挤在 42–47 分，这个区间本身就是重灾区：美国的 Grok 4.7 三个档位都掉了 11–12 分。但同区间对比，国产还是比别人多掉了 5.7 分。"
 },
 {
  "t": "fig",
  "src": "f04_band",
  "alt": "同一分数段，国产掉得更狠"
 },
 {
  "t": "h2",
  "id": "fact-05",
  "text": "5. 掉得最狠的是小米"
 },
 {
  "t": "p",
  "text": "**MiMo-V2.6-Pro：46.3 → 29.9，-16.4 分，从第 27 名跌到第 45 名。**"
 },
 {
  "t": "p",
  "text": "阶跃 Step 5 Preview 掉了 15.2，蚂蚁 Ling 3.1 Flash 1019 掉了 14.4。Ling 在 v5 上线前一天刚拿到 43.9 的旧版分数，第二天就成了 29.5。"
 },
 {
  "t": "h2",
  "id": "fact-06",
  "text": "6. Kimi 从第 5 跌到第 22，仍是开放权重第一"
 },
 {
  "t": "p",
  "text": "**Kimi K3.1 Pro：55.1 → 46.0。**"
 },
 {
  "t": "p",
  "text": "在旧榜上，Kimi K3.1 Pro 排第 5，压过 GPT-6 Astra；到了新榜，它落后 Opus 5.5 12.4 分。AA 把开放权重和闭源头部的差距从 3 分改写成 12 分，算的就是 Kimi。不过 Kimi K3.1 Pro 的权重还没放出来。"
 },
 {
  "t": "h2",
  "id": "fact-07",
  "text": "7. 能下载的最好模型，排在 Haiku 后面"
 },
 {
  "t": "p",
  "text": "**DeepSeek V4.1 Flash 1017 32.5、GLM-5.3 31.7，Claude Haiku 5.5 36.2。**"
 },
 {
  "t": "p",
  "text": "已发布权重的模型里，最高分的就是这两个，落后榜首 26 分，也低于 Anthropic 的小模型 Haiku。这一条点燃了 X 上的反弹：开发者 Alexey Fateev 说他每天在 4 张 3090 上跑 DeepSeek，“一秒也不信 Haiku 比它强”，帖子拿到 2,895 个赞、17 万次浏览。"
 },
 {
  "t": "shot",
  "src": "superalesha_blur.png",
  "w": 569,
  "h": 1206,
  "cap": "@superalesha，10 月 28 日 12:08（美东时间）· [原帖](https://x.com/superalesha/status/2115475753718452350)"
 },
 {
  "t": "h2",
  "id": "fact-08",
  "text": "8. 单项差距最大的，是新加的科学终端题"
 },
 {
  "t": "p",
  "text": "**Terminal-Bench-Science：Opus 5.5 59.0%，DeepSeek 12.9%，GLM 9.5%，MiMo 5.7%，阶跃 2.4%。**"
 },
 {
  "t": "p",
  "text": "这项考的是在命令行环境里连续做科研计算任务，权重 15%。v5 每题输出 token 的中位数从 3.5 万涨到 5.9 万，这一项就吃掉约三分之一。国产条目这一项的中位数是 4.1%，其他模型 13.6%。"
 },
 {
  "t": "p",
  "text": "不只是国产会在这里失分：Grok 4.7 只有 4.8%，Claude Haiku 5.5 也只有 20.0%。"
 },
 {
  "t": "fig",
  "src": "f05_tbs",
  "alt": "新加的科学终端题，国产大多不到 10%"
 },
 {
  "t": "h2",
  "id": "fact-09",
  "text": "9. 26 分差距里，科学终端一项占了 7 分"
 },
 {
  "t": "p",
  "text": "**按 AA 公布的权重和分项成绩复算：DeepSeek 在这一项上少拿 6.9 分，GLM 7.4，Qwen 7.1，MiMo 8.0。**"
 },
 {
  "t": "p",
  "text": "这四个模型和 Opus 5.5 的总差距在 25–28 分上下，科学终端约占其中 27%–30%。第二大缺口是 HLE-Diamond，4–5 分；第三是 FrontierCode 2.0，约 3 分。"
 },
 {
  "t": "p",
  "text": "Kimi 是例外。它的差距只有 12.2 分，分散在各项上，其中科学终端 3.7 分，HLE-Diamond 3.1 分，FrontierCode 3.1 分。"
 },
 {
  "t": "fig",
  "src": "f08_heatmap",
  "alt": "差距拆开看：科学终端一项吃掉 7 分"
 },
 {
  "t": "h2",
  "id": "fact-10",
  "text": "10. 旧 HLE 换成 HLE-Diamond，头部涨、国产跌"
 },
 {
  "t": "p",
  "text": "**Opus 5.5 61.4% → 67.9%；GLM-5.3 42.3% → 17.9%，MiMo 49.4% → 15.2%。**"
 },
 {
  "t": "p",
  "text": "国产模型在这项上平均掉 18.4 个百分点，其他模型平均掉 8.4。"
 },
 {
  "t": "p",
  "text": "这一项有一部分是结构性的。旧 HLE 用的是 2,158 道纯文本题；HLE-Diamond 共 1,000 题，其中 272 道带图，不支持图像输入的模型只能拿到文字，但仍按 1,000 题计分。对纯文本模型来说，这是一笔考前就定下的扣分。"
 },
 {
  "t": "fig",
  "src": "f06_hle",
  "alt": "考题精修之后，头部涨，国产跌"
 },
 {
  "t": "h2",
  "id": "fact-11",
  "text": "11. 被删掉的三项，恰是国产差距最小的"
 },
 {
  "t": "p",
  "text": "**GDPval-AA：Opus 5.5 1866，Kimi 1858，DeepSeek 1746，GPT-6 Astra 1584。**"
 },
 {
  "t": "p",
  "text": "长上下文测试 AA-LCR 前三全是国产：阶跃 88.3%，Kimi 和 MiMo 都是 86.3%，Opus 5.5 是 84.7%。SciCode 上 MiMo 60.9%、Kimi 60.8%，落后 Opus 6 个点，但领先 GPT-6 Astra。"
 },
 {
  "t": "p",
  "text": "这三项合计占旧指数的 25%。删掉它们，国产模型失去的是一块不落下风的地盘。"
 },
 {
  "t": "fig",
  "src": "f07_removed",
  "alt": "被拿掉的三门，正是国产差距最小的"
 },
 {
  "t": "h2",
  "id": "fact-12",
  "text": "12. 新代码题：最好的开放模型落后 18 个点"
 },
 {
  "t": "p",
  "text": "**FrontierCode 2.0：Opus 5.5 46%，DeepSeek V4.1 Flash 28%。**"
 },
 {
  "t": "p",
  "text": "这是 Cognition 的私有基准，评判标准是仓库维护者会不会合并 agent 提交的修改。GPT-6 Astra、Terra 和 Sonnet 都在 42%，Kimi 25.5%，GLM 21.6%，阶跃 12.0%。"
 },
 {
  "t": "h2",
  "id": "fact-13",
  "text": "13. 知识题也换了版本，两款国产模型分数转负"
 },
 {
  "t": "p",
  "text": "**AA-Omniscience v1.1：MiniMax M3.1 Flash 从 16 分降到 -6 分，MiMo V2.6 Pro 从 8 分降到 -5 分。**"
 },
 {
  "t": "p",
  "text": "这项分数可以为负。v1.1 删掉了已经饱和、已经公开的题目，补了新题。全体平均只降 1.9 分，中位数 0.6；AA 点名降幅最大的两个都是国产。"
 },
 {
  "t": "h2",
  "id": "fact-14",
  "text": "14. 新的第一名，你用不到"
 },
 {
  "t": "p",
  "text": "**Gemini 4 Carbon 10 月 28 日上榜，59.4 分，比 Opus 5.5 高 1 分。**"
 },
 {
  "t": "p",
  "text": "它在 9 项里领先 4 项：HLE-Diamond、科学终端、知识准确和 AutomationBench。它的幻觉率是 11%，Opus 5.5 和 GPT-6 Astra 都是 50%。但 AA 原话是，Carbon 正在“向部分用户推送，尚未公开可用”，榜单上它的标签是“No publicly available API”。"
 },
 {
  "t": "fig",
  "src": "f09_carbon",
  "alt": "榜首是一个调不到的模型"
 },
 {
  "t": "shot",
  "src": "StatsWire.png",
  "w": 569,
  "h": 566,
  "cap": "@StatsWire，10 月 28 日 14:02（美东时间）· [原帖](https://x.com/StatsWire/status/2115504404820349027)。分阶段开放的名单来自该帖，未与 Google 一手来源核对。"
 },
 {
  "t": "h2",
  "id": "fact-15",
  "text": "15. 同样 32 分上下，价格差 17 倍"
 },
 {
  "t": "p",
  "text": "**每道指数任务的成本：DeepSeek V4.1 Flash $0.60，Qwen3.8 Max $10.02。**"
 },
 {
  "t": "p",
  "text": "两者分数只差 1.1 分，Qwen3.8 Max 的单题成本和第二名 Opus 5.5 max（$10.04）几乎一样。在另一端，GPT-6.1 Sol max 只比 Opus 低 4 分，成本却只有八分之一，每题 $1.27。"
 },
 {
  "t": "fig",
  "src": "f10_cost",
  "alt": "同样 32 分上下，价差 17 倍"
 },
 {
  "t": "h2",
  "id": "fact-16",
  "text": "16. 同一个模型，档位能差出 24 分"
 },
 {
  "t": "p",
  "text": "**Claude Opus 5.5：low 34.5 分（$0.98），max 58.4 分（$10.04）。**"
 },
 {
  "t": "p",
  "text": "GPT-6.1 Sol 的 low 到 max 是 34.5 到 54.5 分，差距从 v4.3 的 10 分扩大到 20 分。v5 的任务更长，推理预算多一档，分数就高一截。厂商宣传时报的是哪一档，现在差别更大了。"
 },
 {
  "t": "fig",
  "src": "f11_effort",
  "alt": "同一个模型，档位差出 24 分"
 },
 {
  "t": "h2",
  "id": "fact-17",
  "text": "17. 一半是水分，一半是真差距"
 },
 {
  "t": "p",
  "text": "**私有题挤掉了旧题上可能的背题红利，但科学终端和新代码题上的差距，跟背题无关。**"
 },
 {
  "t": "p",
  "text": "“非典型 CFO”的总结最准确：一半是虚的消失了，一半是实的露出来了。尺子变严了，裁判也更没人监督了。"
 },
 {
  "t": "p",
  "text": "Nathan Lambert 的态度是五五开：私有基准往往显示开放模型差得更远，但私有基准的问题在于，没有社区帮你挑出那些必然存在的 bug。也有人觉得新榜更接近体感，日本开发者 @ymg_aq 说，性能看 Opus 5.5、性价比看 GPT-6.1 Sol，中国开放模型没有旧基准上显示得那么强。"
 },
 {
  "t": "shot",
  "src": "Adiaos2012.png",
  "w": 569,
  "h": 612,
  "cap": "@Adiaos2012，10 月 28 日 09:18（美东时间）· [原帖](https://x.com/Adiaos2012/status/2115432998480797899)"
 },
 {
  "t": "shot",
  "src": "natolambert.png",
  "w": 569,
  "h": 522,
  "cap": "@natolambert，10 月 28 日 09:35（美东时间）· [原帖](https://x.com/natolambert/status/2115437422146130032)"
 },
 {
  "t": "shot",
  "src": "ymg_aq.png",
  "w": 569,
  "h": 734,
  "cap": "@ymg_aq，10 月 28 日 21:58（美东时间）· [原帖](https://x.com/ymg_aq/status/2115624407108661710)"
 },
 {
  "t": "end",
  "text": "新榜单第一名调不到 API。能下载权重的模型里，最好的排第 38。"
 },
 {
  "t": "note",
  "text": "资料来源：Artificial Analysis 官网（v5 发布文章、方法论页、排行榜，2026-11-01 抓取）；v4.3.2 分数取自 2026-10-26 01:02 UTC 的 Wayback 存档；Gemini 4 Carbon 评测文章（2026-10-28）；AA-Omniscience v1.1 说明帖；Interconnects。排名把每个推理档位单独算一行。"
 }
];

export const enBlocks: Block[] = [
 {
  "t": "p",
  "text": "On October 27, Artificial Analysis released [Intelligence Index v5](https://artificialanalysis.ai/articles/artificial-analysis-intelligence-index-v5). AA's launch post drew 2 million views. Almost every model lost points the moment the new version went live, and Chinese models lost the most: the same models, given a new set of questions, scored 12.4 points lower on average."
 },
 {
  "t": "p",
  "text": "Were Chinese models singled out, or were their old scores inflated? Here are 17 facts, all taken from AA's published scores and methodology."
 },
 {
  "t": "h2",
  "id": "fact-01",
  "text": "1. A third of the exam was replaced, and most of it is hidden"
 },
 {
  "t": "p",
  "text": "**25% of the v4.3.2 weight was removed and 30% of v5 is new; 60% of the weight now sits on private questions.**"
 },
 {
  "t": "p",
  "text": "Removed: GDPval-AA, SciCode and the long-context test AA-LCR. Added: FrontierCode 2.0, a private coding benchmark from Cognition, and Terminal-Bench-Science, which runs research tasks in a terminal, at 15% each. HLE became the refined HLE-Diamond, CritPt became a 40-question private hard subset, and AA-Omniscience moved to v1.1."
 },
 {
  "t": "p",
  "text": "In AA's own words, this is the biggest upgrade since v4, and the first time most of the index is built on private data."
 },
 {
  "t": "fig",
  "src": "f01_weights",
  "alt": "30% of the exam is new"
 },
 {
  "t": "shot",
  "src": "ArtificialAnlys_v5_crop.png",
  "w": 569,
  "h": 611,
  "cap": "@ArtificialAnlys, Oct 27, 10:11 PM ET · [Original post](https://x.com/ArtificialAnlys/status/2115265133467635877)"
 },
 {
  "t": "h2",
  "id": "fact-02",
  "text": "2. Nearly every model lost points, not just Chinese ones"
 },
 {
  "t": "p",
  "text": "**Of the 77 model entries scored on both versions, only 8 went up.**"
 },
 {
  "t": "p",
  "text": "All 8 are top settings from Anthropic and OpenAI: Opus 5.5 max/xhigh, GPT-6 Astra max/xhigh/high/medium and GPT-6.1 Sol max/xhigh. Opus 5.5 max went from 57.6 to 58.4, Astra max from 52.7 to 56.9, Sol max from 51.8 to 54.5."
 },
 {
  "t": "p",
  "text": "Everything else fell: Claude Sonnet 5.5 max by 1.8, Gemini 4 Argon by 2.1, Meta's Muse Wonder Full by 6.1."
 },
 {
  "t": "fig",
  "src": "f02_slope",
  "alt": "Only the top settings went up"
 },
 {
  "t": "h2",
  "id": "fact-03",
  "text": "3. Chinese models fell about twice as far"
 },
 {
  "t": "p",
  "text": "**The 17 Chinese entries averaged -12.4; the other 60 averaged -6.8.**"
 },
 {
  "t": "p",
  "text": "\"Only Chinese models fell\" is wrong. \"Chinese models weren't hit any harder\" is also wrong. The tide went out for everyone, and faster for Chinese models."
 },
 {
  "t": "fig",
  "src": "f03_strip",
  "alt": "Chinese models fell about twice as far"
 },
 {
  "t": "h2",
  "id": "fact-04",
  "text": "4. In the same score band, Chinese models still lost about 6 more points"
 },
 {
  "t": "p",
  "text": "**Among models that scored 42–47 on v4.3.2: Chinese average -13.9, others -8.2.**"
 },
 {
  "t": "p",
  "text": "Most Chinese models sat in the 42–47 band on the old index, and that band was hit hard across the board: all three settings of the US model Grok 4.7 lost 11–12 points. Compared within the band, Chinese models still lost 5.7 points more."
 },
 {
  "t": "fig",
  "src": "f04_band",
  "alt": "Same starting band, bigger Chinese drop"
 },
 {
  "t": "h2",
  "id": "fact-05",
  "text": "5. Xiaomi fell furthest"
 },
 {
  "t": "p",
  "text": "**MiMo-V2.6-Pro: 46.3 → 29.9, down 16.4 points, from #27 to #45.**"
 },
 {
  "t": "p",
  "text": "StepFun's Step 5 Preview fell 15.2 and Ant Group's Ling 3.1 Flash 1019 fell 14.4. Ling received its v4.3.2 score of 43.9 one day before v5 launched; the next day it was 29.5."
 },
 {
  "t": "h2",
  "id": "fact-06",
  "text": "6. Kimi fell from #5 to #22 and is still the top open-weights model"
 },
 {
  "t": "p",
  "text": "**Kimi K3.1 Pro: 55.1 → 46.0.**"
 },
 {
  "t": "p",
  "text": "On the old index Kimi K3.1 Pro ranked 5th, ahead of GPT-6 Astra. On the new one it trails Opus 5.5 by 12.4 points. When AA says the gap between open weights and the closed frontier went from 3 points to 12, Kimi is the model it measures. Kimi K3.1 Pro's weights have not been released yet."
 },
 {
  "t": "h2",
  "id": "fact-07",
  "text": "7. The best downloadable models now rank below Haiku"
 },
 {
  "t": "p",
  "text": "**DeepSeek V4.1 Flash 1017: 32.5. GLM-5.3: 31.7. Claude Haiku 5.5: 36.2.**"
 },
 {
  "t": "p",
  "text": "These two are the highest-scoring models with released weights. They sit 26 points behind the leader and below Anthropic's small model Haiku. That result set off the backlash on X: developer Alexey Fateev said he runs DeepSeek every day on four 3090s and doesn't \"believe for a second that Haiku beats it.\" The post drew 2,895 likes and 170,000 views."
 },
 {
  "t": "shot",
  "src": "superalesha_blur.png",
  "w": 569,
  "h": 1206,
  "cap": "@superalesha, Oct 28, 12:08 PM ET · [Original post](https://x.com/superalesha/status/2115475753718452350)"
 },
 {
  "t": "h2",
  "id": "fact-08",
  "text": "8. The largest single gap is on the new science-terminal test"
 },
 {
  "t": "p",
  "text": "**Terminal-Bench-Science: Opus 5.5 59.0%, DeepSeek 12.9%, GLM 9.5%, MiMo 5.7%, Step 2.4%.**"
 },
 {
  "t": "p",
  "text": "This test runs multi-step scientific computing tasks in a command-line environment and carries 15% of the weight. Median output tokens per v5 task rose from 35,000 to 59,000, and this test alone accounts for about a third of them. The median Chinese entry scores 4.1% here; other models score 13.6%."
 },
 {
  "t": "p",
  "text": "Chinese models are not the only ones losing points here: Grok 4.7 scores 4.8% and Claude Haiku 5.5 only 20.0%."
 },
 {
  "t": "fig",
  "src": "f05_tbs",
  "alt": "Most Chinese models score under 10% here"
 },
 {
  "t": "h2",
  "id": "fact-09",
  "text": "9. Seven of the 26-point gap come from that one test"
 },
 {
  "t": "p",
  "text": "**Recomputed from AA's weights and per-eval scores: on this test alone DeepSeek loses 6.9 index points to Opus, GLM 7.4, Qwen 7.1, MiMo 8.0.**"
 },
 {
  "t": "p",
  "text": "These four models trail Opus 5.5 by roughly 25–28 points in total, and the science-terminal test accounts for about 27–30% of that. The second-largest gap is HLE-Diamond at 4–5 points; the third is FrontierCode 2.0 at about 3."
 },
 {
  "t": "p",
  "text": "Kimi is the exception. Its gap is only 12.2 points, spread across tests: 3.7 on the science-terminal test, 3.1 on HLE-Diamond and 3.1 on FrontierCode."
 },
 {
  "t": "fig",
  "src": "f08_heatmap",
  "alt": "One new eval explains 7 points of the gap"
 },
 {
  "t": "h2",
  "id": "fact-10",
  "text": "10. HLE became HLE-Diamond: the top went up, Chinese models went down"
 },
 {
  "t": "p",
  "text": "**Opus 5.5: 61.4% → 67.9%. GLM-5.3: 42.3% → 17.9%. MiMo: 49.4% → 15.2%.**"
 },
 {
  "t": "p",
  "text": "Chinese models fell 18.4 percentage points on average on this test; other models fell 8.4."
 },
 {
  "t": "p",
  "text": "Part of this is structural. The old HLE used 2,158 text-only questions. HLE-Diamond has 1,000, and 272 of them include images. Models without image input receive only the text but are still graded on all 1,000. For a text-only model, that penalty is fixed before the test starts."
 },
 {
  "t": "fig",
  "src": "f06_hle",
  "alt": "HLE-Diamond: the top rose, Chinese models fell"
 },
 {
  "t": "h2",
  "id": "fact-11",
  "text": "11. The three removed tests were where Chinese models were closest"
 },
 {
  "t": "p",
  "text": "**GDPval-AA: Opus 5.5 1866, Kimi 1858, DeepSeek 1746, GPT-6 Astra 1584.**"
 },
 {
  "t": "p",
  "text": "The top three on the long-context test AA-LCR are all Chinese: Step 88.3%, Kimi and MiMo 86.3% each, against 84.7% for Opus 5.5. On SciCode, MiMo scores 60.9% and Kimi 60.8%, 6 points behind Opus but ahead of GPT-6 Astra."
 },
 {
  "t": "p",
  "text": "Together these three made up 25% of the old index. Removing them took away ground where Chinese models held their own."
 },
 {
  "t": "fig",
  "src": "f07_removed",
  "alt": "The removed tests were Chinese models' best"
 },
 {
  "t": "h2",
  "id": "fact-12",
  "text": "12. New coding test: the best open model is 18 points behind"
 },
 {
  "t": "p",
  "text": "**FrontierCode 2.0: Opus 5.5 46%, DeepSeek V4.1 Flash 28%.**"
 },
 {
  "t": "p",
  "text": "This is Cognition's private benchmark, graded on whether a repository maintainer would merge the agent's change. GPT-6 Astra, Terra and Sonnet all score 42%; Kimi 25.5%, GLM 21.6%, Step 12.0%."
 },
 {
  "t": "h2",
  "id": "fact-13",
  "text": "13. The knowledge test changed too, and two Chinese models went negative"
 },
 {
  "t": "p",
  "text": "**AA-Omniscience v1.1: MiniMax M3.1 Flash went from 16 to -6, MiMo V2.6 Pro from 8 to -5.**"
 },
 {
  "t": "p",
  "text": "Scores on this test can be negative. v1.1 removed saturated and publicly available questions and added new ones. The average score fell only 1.9 points (median 0.6); both of the biggest drops AA named are Chinese models."
 },
 {
  "t": "h2",
  "id": "fact-14",
  "text": "14. The new #1 is a model you can't use"
 },
 {
  "t": "p",
  "text": "**Gemini 4 Carbon joined the index on October 28 at 59.4, one point above Opus 5.5.**"
 },
 {
  "t": "p",
  "text": "It leads 4 of the 9 tests: HLE-Diamond, the science-terminal test, knowledge accuracy and AutomationBench. Its hallucination rate is 11%, against 50% for both Opus 5.5 and GPT-6 Astra. But in AA's words, Carbon \"is being rolled out to selected users and is not yet publicly available,\" and the leaderboard tags it \"No publicly available API.\""
 },
 {
  "t": "fig",
  "src": "f09_carbon",
  "alt": "The #1 model has no public API"
 },
 {
  "t": "shot",
  "src": "StatsWire.png",
  "w": 569,
  "h": 566,
  "cap": "@StatsWire, Oct 28, 2:02 PM ET · [Original post](https://x.com/StatsWire/status/2115504404820349027). The staged rollout list comes from this post and has not been checked against a Google primary source."
 },
 {
  "t": "h2",
  "id": "fact-15",
  "text": "15. Around 32 points, the price varies 17-fold"
 },
 {
  "t": "p",
  "text": "**Cost per index task: DeepSeek V4.1 Flash $0.60, Qwen3.8 Max $10.02.**"
 },
 {
  "t": "p",
  "text": "Their scores differ by just 1.1 points, and Qwen3.8 Max costs almost exactly what the #2 model, Opus 5.5 max, costs ($10.04). At the other end, GPT-6.1 Sol max scores only 4 points below Opus at one-eighth of the cost: $1.27 per task."
 },
 {
  "t": "fig",
  "src": "f10_cost",
  "alt": "Same ~32 score, 17x the price"
 },
 {
  "t": "h2",
  "id": "fact-16",
  "text": "16. The same model can score 24 points apart depending on effort"
 },
 {
  "t": "p",
  "text": "**Claude Opus 5.5: 34.5 on low ($0.98), 58.4 on max ($10.04).**"
 },
 {
  "t": "p",
  "text": "GPT-6.1 Sol runs from 34.5 on low to 54.5 on max; its spread grew from 10 points on v4.3 to 20. v5 tasks are longer, so each extra step of reasoning budget buys a noticeably higher score. Which setting a vendor quotes now matters more than it did."
 },
 {
  "t": "fig",
  "src": "f11_effort",
  "alt": "Same model, 24 points apart"
 },
 {
  "t": "h2",
  "id": "fact-17",
  "text": "17. Half was froth, half is a real gap"
 },
 {
  "t": "p",
  "text": "**Private questions squeeze out any benefit from memorised public questions, but the gaps on the science-terminal and new coding tests have nothing to do with memorisation.**"
 },
 {
  "t": "p",
  "text": "The Chinese account \"非典型 CFO\" put it best: half of the drop is froth disappearing, half is a real gap showing through. The ruler got stricter, and the referee has even less oversight."
 },
 {
  "t": "p",
  "text": "Nathan Lambert is split 50/50: private benchmarks often show open models further behind, but with a private benchmark there is no community to catch the bugs that will inevitably be there. Others think the new ranking matches hands-on experience. Japanese developer @ymg_aq says Opus 5.5 leads on performance, GPT-6.1 Sol on value, and Chinese open models are not as strong as the old benchmarks suggested."
 },
 {
  "t": "shot",
  "src": "Adiaos2012.png",
  "w": 569,
  "h": 612,
  "cap": "@Adiaos2012, Oct 28, 9:18 AM ET · [Original post](https://x.com/Adiaos2012/status/2115432998480797899)"
 },
 {
  "t": "shot",
  "src": "natolambert.png",
  "w": 569,
  "h": 522,
  "cap": "@natolambert, Oct 28, 9:35 AM ET · [Original post](https://x.com/natolambert/status/2115437422146130032)"
 },
 {
  "t": "shot",
  "src": "ymg_aq.png",
  "w": 569,
  "h": 734,
  "cap": "@ymg_aq, Oct 28, 9:58 PM ET · [Original post](https://x.com/ymg_aq/status/2115624407108661710)"
 },
 {
  "t": "end",
  "text": "The new #1 has no public API. Among models you can download, the best ranks 38th."
 },
 {
  "t": "note",
  "text": "Sources: Artificial Analysis (v5 launch article, methodology page and leaderboard, fetched 2026-11-01); v4.3.2 scores from the Wayback snapshot of 2026-10-26 01:02 UTC; AA's Gemini 4 Carbon write-up (2026-10-28); AA's AA-Omniscience v1.1 thread; Interconnects. Ranks count each reasoning setting as its own entry."
 }
];
