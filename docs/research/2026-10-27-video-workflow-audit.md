# 知识视频效果复核与 Opus 5.5 工作流

核查日期：2026-10-27。这里区分作者披露、本地实测和改进建议。没有进行同提示词、同工具、同预算的跨模型 A/B，不能量化 skill、harness、模型分别贡献多少。

## 已证实的本地问题

原始视频先于可复用 skill 制作；不能把历史结果归因于后来创建的 skill。不过，初版 skill 继承了工具和检查限制，需要一起改。

| 层面 | 实际证据 | 影响 |
| --- | --- | --- |
| 任务与工具 | 追加两题限定 Pillow/NumPy/FFmpeg，禁止 Manim/Remotion；环流 288.133 秒改为 90 秒，导数 457 秒改为 89.167 秒；最多两轮有效视觉修正 | 只是主题改编短片，不能称原案例同条件复现。模型需自行处理数学图形、排版、裁剪、转场和音画时间轴 |
| 模型实现与自检 | 模型确实调用看图工具并自行修改；仍遗漏环流南北半球同向粒子、导数标签碰撞、负 h 切换跳变和缺字 | 有真实模型实现错误；静态抽帧不足以验证连续运动和知识准确性 |
| 制作后制 | 公开旁白按既定窗口强行拟合：打印机最高 2.208×，反钓鱼 1.647×，环流 2.231×，导数 2.664× | 响度统一不能解决语速、停顿和可懂度。应先测语音时长，再编排镜头 |
| 发布适配 | 打印机背景音误指向 build/music.wav，实际 build/music_bed.wav 又被原构建器清理；导数误指向 deliverables/music.wav，实际 output/music.wav | 两支公开配音版未保留模型生成的背景音。属于发布适配错误，并非模型没有生成音乐 |

四题都由模型主动结束，未触及 50 轮／150,000 输出 token／60 分钟上限。打印机 36 轮、47.72 分钟；反钓鱼 29 轮、47.67 分钟；环流 21 轮、10.34 分钟；导数 20 轮、25.95 分钟。初批请求 max，追加请求 high；不能据这些混合条件评出纯模型差距。

具体知识问题沿用原 QA：打印机激光束穿过感光鼓内部；环流南北半球曲线仅改文字而未改几何；导数核心答案已被 Kimi 自行修正为 y=4x−4，但趋近末段未做局部放大，h=0.05 时两点只相隔约 18.5px，而点的直径为 20px。去旁白不修复任何画面或知识错误。

本次复核查看了四支成片的八张联系表、工具摘要、源码、音频参数和公开配音 cue 计划；未完成独立真人盲评或全片人耳听审。机器解码、响度和峰值检查不能替代主观试听。

## 热门案例实际怎样做

X 原页读取受限时，按相同帖子 ID 实时读取作者正文；仓库、官方工具文档与作者文章直接核查。“未披露 skill”不等于“没有用 skill”，但不能补写为已使用。

| 案例与原始来源 | 作者披露的制作链 | 环境／skill 证据与复现边界 |
| --- | --- | --- |
| [Deedy 论文解释片](https://x.com/deedydas/status/2103141339651350646)、[工具说明](https://x.com/deedydas/status/2103142971646652607) | 约 8 分钟，Manim + Kokoro-82m + FFmpeg，作者称工具由模型自行选择 | 两帖未明确 Claude Code，未提 skill；未取得完整工程／会话 |
| [LinearUncle 导数教学](https://x.com/LinearUncle/status/2103128559174971663) | 457 秒，Opus 5.5 + Manim + edge-tts | 公开主提示词，未明确 agent 环境或 skill；不能把本地 89 秒 Pillow 改编称为该工作流复现 |
| [akokoi 大气环流](https://x.com/akokoi1/status/2102606609574941028) | 288.133 秒，线稿、音乐、中英字幕、TTS；作者自述 26 分钟 | 教程包含 .claude/settings.json、TTS.md 和主提示词，支持 Claude Code 环境；未提 skill，完整工程未披露 |
| [kimmonismus AI 简史](https://x.com/kimmonismus/status/2102844654169575547) | 3 分钟，约 7,400 行 React/TypeScript、Remotion、SVG/Canvas、开源 TTS、Python 配乐 | 明确 Claude Code，未提 skill；自述约一小时和 7% 周额度，不能换算为本站逐题 API 金额 |
| [WinterArc 奥斯特里茨工程](https://github.com/WinterArc21/Battle-of-Austerlitz-Film)、[原帖](https://x.com/WinterArc2125/status/2103116235009347650)、[主提示词](https://x.com/WinterArc2125/status/2103116689944502720) | WebGL2、SRTM 地形、程序士兵、Kokoro、Python 混音，Chromium → FFmpeg，镜头与声音共用时序 | 工程和重建步骤公开；作者只称 cloud agent credits，不能补成 Claude Code；输入另含两张绘画参考；构建／渲染时间与金额为作者自述 |
| [Bilal 配方仓库](https://github.com/bilaldemirerr/opus-video-recipes) | HyperFrames HTML→MP4、布局检查、本地 TTS 和词级转写；另有 Remotion App Store 片 | 字幕与动态排版例明确在 Cursor 长会话制作；App Store 例明确 Claude Code、83 次模型调用并依赖既有私有工程。仓库有 skill 入口，不代表每例实际加载 |

因此，可以说存在成熟的“Claude Code + 制片工具 + skill”路线，不能说热门案例普遍都用同一种组合，也不能把一条主提示词理解为一次模型 API 调用。

## 值得参考的开源规范

- [Remotion 官方 agent skills](https://www.remotion.dev/docs/ai/skills)：同时支持 Claude Code、Codex、Kimi Code、Cursor；有排版、字体、按帧动画、字幕、音频、预览和渲染知识。工具知识可复用，不是某热门作品使用过它的证据。
- [opus-video-skills](https://github.com/tuzhechen2005/opus-video-skills)：作者明确 Opus 5.5 + Claude Code；kinetic-reel 要求每镜头教学／视觉机制、镜头与声音共用 cues.js、逐章联系表、密集镜头全分辨率图和转场运动条带。painted-animation 强调关键姿态、观众应读懂什么，以及连续帧检查；其禁文字风格不能直接套到科学教学。
- [作者的长课纠错记录](https://hijoseromero.substack.com/p/i-asked-opus-55-to-make-three-videos)：Manim + Kokoro 成片仍出现事实／参数口径问题，需要同步修正画面与旁白。视觉完成度与知识准确性应分开验收。

本轮只阅读参考资料，未安装或执行这些外部 skill／仓库代码。

## 本轮落地与下一轮评测口径

1. 新 skill 协议版本 creative-agent-v3：默认 music-only，用户明确要求才 narration；保留画面文字和字幕。背景音乐／音效由被测模型写代码生成，交付独立 stem 与音频时间轴；不能以全片静音当作完成。
2. 显式配音时才依赖 TTS，先测自然语速时长再安排镜头；加速上限 1.15× 并披露，长句改稿或延长镜头，不再塞进原窗口。
3. 不再一律禁止 Manim／Remotion，也不假装它们已安装。评测前实测环境和版本；只选择已准备好的框架，运行期间禁止临时安装。离线隔离和不调用其他生成模型的边界继续保留。
4. 分镜必须写清事实、注意力焦点、视觉状态、运动、停留时长、转场。检查每个机制和接缝的连续帧、字形与手机阅读尺寸，视觉修正受总预算约束，不固定两轮。
5. 当前四支公开视频更换为独立程序配乐／音效版，原画面编码包和时序保持一致。历史公开旁白作为用户主动选择的旧版本保留，并标明语速问题；原始评测证据和评分不改写。
6. 尚未使用 v3 重新调用模型。因此当前修复只能证明默认音频与制作协议改进，不能宣称新画面效果已提升。下一次需要用同一模型、同一题目／时长／预算比较旧新 harness，再在新条件下比较模型；分别报告知识准确性、构图、运动、声音和成本。

原始证据目录：`output/kimi-creative-20261027/`、`output/kimi-creative-20261027-expanded/`。本轮新增证据：`output/kimi-creative-20261027-expanded/publication/audio-policy-20261027/`。既有原片、提示词、API 记录、首次发布快照和收据保留。
