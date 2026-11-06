# TOKRACE 创作评测 v4

2026-11-02 起，新批次默认使用同一套清单。历史成品、原题和结果保持不变；恢复旧任务沿用其原题，不把新选题套到旧工程上。

| 类别 | 默认任务 |
| --- | --- |
| Blender，3 项 | 参数化书架、行星减速器、两居室 |
| 知识视频，4 项 | 当天检索并锁定的四个新选题 |
| 静态 SVG，3 项 | 9:41 钟表、数据图表、中文海报 |
| SVG 动画，1 项 | 鹈鹕骑车 |

默认共 **11 项**。`--profile quick` 为两项 Blender（书架、两居室），共10项；`--profile extended` 加回蒸汽机、寺庙、木星船坞，共14项。开放主题视频 skill 只执行其中四个当天知识视频，不另建固定四题。`--cases` 可选择部分任务。

新评测不安排旧的短文本问答、JSON 提取和简单函数题；历史结果不删除。静态鹈鹕退役，新直接 SVG 请求使用 `cases-v2.mjs` / `visual-svg-v2`，旧 `cases.mjs` 仅用于历史恢复。thinking 对比仅在明确研究该变量时增加。

## 知识视频：先研究，再锁定，同日同题

日期统一为 **Asia/Shanghai**。第一次评测前检索四个新题，优先选择观众会追问“为什么”的历史趣事、反常识故事、日常机制、近期文章或有可视化空间的创意。可以参考 vibe 知识大赏的好奇心和视觉表达，不照搬他人文案。每题聚焦一个问题，宁可讲透一个机制，不拼百科条目。

1. 先查 `node scripts/evaluation/daily-topics.mjs show --date YYYY-MM-DD`。已有当天锁定集直接复用；同日新增模型不能另换主题、来源事实、任务规格或口播规则。
2. 没有时，先用 `template` 生成草稿格式，联网查阅可靠来源，填写四题的中英文标题、核心问题、开场钩子、视觉创意、至少三条核对后的事实及来源。来源包含 URL、标题、机构/作者、发布日期（未知填 null）和核对日期；历史故事区分史料与传说，技术稿不捏造“刚发”。必要的图片与素材也在首次运行前整理好，并在批次归档来源、许可和字节哈希，供同日模型复用。
3. `node scripts/evaluation/daily-topics.mjs lock /实际/draft.json --repo /实际/repo` 创建不可覆盖的 `content/evaluation-topicsets/YYYY-MM-DD/topic-set.json`。文件冻结主题、来源事实、任务规格和 knowledge-video-narration 技能正文及 SHA-256。相同输入再次锁定只复用，内容不同会拒绝；事实需要更正时另建明确标识的新协议日期/批次，不混成原同日比较。
4. prepare 接受 `--date`，默认上海当天。跨午夜继续工作时沿用 batch 里的日期和主题集，不临时换题。没有当天锁定题时准备会停止，提示先研究选题，不退回导数、打印机等旧固定题。

示例（路径和模型名须替换为实际值）：

```sh
node scripts/evaluation/daily-topics.mjs template --date 2026-11-02
node scripts/evaluation/daily-topics.mjs lock /实际/选题草稿.json --repo "$PWD"
node scripts/evaluation/daily-topics.mjs show --date 2026-11-02
```

由**被测模型**按随题复制的 `knowledge-video-narration.md` 写口播稿和分镜，四个模型拿到的是同一问题与事实材料，不提供预写好的成片脚本或其他模型的答案。默认中文口播、字幕与适量配乐/音效，60–90秒、1080p。先测实际语音时长，再排镜头；字幕、读音稿、画面机制和人声同步，音乐压在人声下方。TTS 是制作工具，固定同日提供商/音色/版本并记录，不算模型原生语音能力。用户另要求无旁白时是单独的音频条件，不改历史片。Blender 视频不因知识视频改口播而强制加入旁白。

## Blender 的取舍与交付

三题覆盖参数与尺寸、机构几何与运动、空间与材质。原有六题单题记录约11–60分钟，包含未完成任务，不能当新流程的完成时间保证。先用低清预览检查结构与机位，再出终稿，避免反复完整重渲染。书架保持静态尺寸与参数检查；行星机构和两居室保留短运动/导览视频。既有规格仍须完成，缺项给原模型继续处理，不让协调者补作品后计为模型成绩。

这套小样本是 TOKRACE 自选组合。研究参考：[BlenderGym（CVPR 2025）](https://blendergym.github.io/) 的几何、摆放、光照和材质编辑；[BlenderWorld](https://github.com/QwenLM/BlenderWorld) 的真实参考创作和多视角交付。Blender Open Data 的 Classroom/Junkshop/Monster 衡量渲染设备性能，不适合作为大模型建模题直接替代。

## 执行、比较与页面

共享定义在 `scripts/evaluation/creation-suite.mjs`。Claude Code 原生持续会话、当前 harness、API 兼容准备入口均读取它，不各自维护新默认题库。保存 `suiteVersion`、`evaluationDate`、`topicSetSha256` 和每题 `caseSpecSha256`；同日跨模型比较先核对这些标识与实际工具条件。不同日期可以换题，作品可比较阅读，不把不同题直接合并为同条件总排名。

保持当前制作优先规则：持续保存项目，在原会话迭代至作品完成；网络/过载退避，真实鉴权问题先解决。公开页面先介绍模型，再展示成品和简短观察，保留源码下载、导航、两语与SEO；完整过程另存批次档案。仅用户要求发布时执行对应发布流程。

## 可选的难代码题方向

旧的简单文本/函数题不再执行。若单独研究工程能力，优先真实仓库 issue 修复、跨文件改动、失败测试定位，或 [Terminal-Bench 2.0](https://www.tbench.ai/news/announcement-2-0) 这类可执行终端任务。另建容器环境、隐藏测试和固定版本；先审查题目质量、污染与成本，不自动加入本创作套件，也不因为换了知名名称就声称题目可靠。
