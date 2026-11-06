# TOKRACE 创作实测 v6

2026-11-06 起，`--profile creator` 使用 `creative-suite-v6`。题目和首交文件以 `scripts/evaluation/creation-suite.mjs` 及其引用定义为准。

| 题目 | 作者交付 | 页面展示 |
| --- | --- | --- |
| `creator-handheld` 复古掌机分层拆解 | 组装、拆解两份可编辑 Blender 工程，两张原图，重建脚本 | 原图和工程，统一全景与近景 |
| `creator-web3d` 海底洗衣店 | 可操作的 Web3D 场景 | 实时原作及通过验证的统一导览 |
| `creator-webapp` 旅行行李清单 | 可运行的三操作网页 | 实时原作及固定操作录屏 |
| `svg-dashboard` 数据图表 | 原始 SVG | 原图及数据核对 |
| `creator-spot-difference` 两图找不同 | 一份含中文变化说明和位置框的 `answer.json` | 共用题图、模型框、可展开答案 |

两道新题可用 `--cases creator-handheld,creator-spot-difference` 单独补测。本地评测库提供同样的范围选项。比较要求实际题集与逐题核心规格相同，题集版本与采集接口另行记录。

找不同的 A 图由内置 ImageGen 生成，B 图以 A 为输入做定点修改。两张原图及生成提示词位于 `scripts/evaluation/assets/spot-difference-v1/`，标准答案和区域固定在同目录的 `ground-truth.json`。作者工作区只接收 A、B PNG 与题目。定位采用一对一匹配，框与变化紧框或所属物件框的交并比至少为 0.25。定位、漏标、多报和描述方向分别记录。说明文字保留作者原文，方向由协调者逐条核对。

掌机统一导览从冻结的两份工程读取主体网格，共 12 秒。组装全景、组装近景、拆解全景和拆解近景各 3 秒，两作采用同一角度轨迹。预览条件与源文件哈希记入采集回执，作者原图单独展示。找不同视频依次展示题面、原答框与标准区域，横排和上下版共用各自的一条播放时间轴。

首交冻结、必要核验和博主评语遵循 [评测流程](model-evaluation.md)。旧书架与库存看板留在 [v5 历史题集](evaluation-suite-v5.md)，已有批次按冻结规格解释。
