// Generated from cyberzen-replica/v3_site (v3_zh.md / v3_en.md) by build_content.py. Edit the markdown, then regenerate.
export type Block =
  | { t: "p" | "cap" | "look" | "h3"; text: string }
  | { t: "h2"; id: string; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "fig"; n: number; src: string; alt: string };

export const ORIGINAL_URL = "https://mp.weixin.qq.com/s/zoS7GlReWPhfCjENGxXCdg";
export const PROTOTYPE_URL = "https://github.com/deepseek-ai/dsh-superagent-prototype";

export const FIGURE_FILES: string[] = [
  "01_timeline.svg",
  "fig02-unprompted-fix.svg",
  "fig03-session-overload.svg",
  "fig04-plan-a-to-b.svg",
  "fig05-four-traits.svg",
  "fig06-five-modules.svg",
  "fig07-two-extremes.svg",
  "02_router_worker.svg",
  "fig09-team-vs-router.svg",
  "fig10-trigger-batching.svg",
  "fig11-one-chat-many-workers.svg",
  "03_filter_paths.svg",
  "fig13-threads.svg",
  "fig14-subscribe-bypass.svg",
  "fig15-shared-thread.svg",
  "fig16-inline-spill.svg",
  "fig17-chain-of-recall.svg",
  "fig18-speculative.svg",
  "fig19-full-duplex.svg",
  "fig20-im-vs-pr.svg",
  "fig21-laptop-sleeps.svg",
  "fig22-stateless-compute.svg",
  "fig23-brain-hands.svg",
  "fig24-device-wakes.svg",
  "fig25-watchdog.svg",
  "fig26-ablation-times.svg",
  "fig27-bypass-cost.svg",
  "fig28-router-batching-numbers.svg",
  "fig29-sharding-tradeoff.svg",
  "fig30-a2a-boundaries.svg",
  "fig31-cloud-compromised.svg"
];

export const zhBlocks: Block[] = [
 {
  "t": "p",
  "text": "DeepSeek Harness 团队发布了一篇长文：[《Super-agent 设计探索：迈向更自主的 Agent 系统》](https://mp.weixin.qq.com/s/zoS7GlReWPhfCjENGxXCdg)。讲的不是聊天技巧，而是内部常驻群聊和 GitHub、多事并行的 Agent 底下怎么搭。原文偏工程；下面按人哪里别扭 → 图 → 机制摊开。"
 },
 {
  "t": "p",
  "text": "DeepSeek 内部有一个 Super-agent。它常驻在公司的群聊和 GitHub 里，同时推进好几件事。"
 },
 {
  "t": "p",
  "text": "现场大概是这样："
 },
 {
  "t": "fig",
  "n": 1,
  "src": "01_timeline.svg",
  "alt": "群聊气泡与 GitHub 面板并排；Agent 红点常驻两侧；底部结论「同一 Agent，两边同时干活」"
 },
 {
  "t": "cap",
  "text": "同一 Agent，两边同时干活。"
 },
 {
  "t": "p",
  "text": "过程中，群里有人抱怨了一个 bug——并没有 @ Agent。Agent 自己去复现、找根因，把修复的 Pull Request 交了上来。"
 },
 {
  "t": "p",
  "text": "整条链路没人喊它："
 },
 {
  "t": "fig",
  "n": 2,
  "src": "fig02-unprompted-fix.svg",
  "alt": "群聊出现抱怨气泡（无 @）；时间轴依次出现「复现→根因→开 PR」；底部结论「没人叫，它也动手」"
 },
 {
  "t": "cap",
  "text": "没人叫，它也动手。"
 },
 {
  "t": "p",
  "text": "这不是演示稿里的理想场景。它来自那个一直在跑的实例。后面整篇文章，其实都在回答一件事：这种「一直在线、来了事件就处理」的形态，底下要长成什么样。"
 },
 {
  "t": "h2",
  "id": "stuck-on-people",
  "text": "人先撑不住"
 },
 {
  "t": "p",
  "text": "以 Coding Agent 为代表的单任务 Agent，已经证明模型能用工具解决复杂问题，而且越来越少需要人在旁边一步步盯着。"
 },
 {
  "t": "p",
  "text": "同时，模型的多 Agent 协同也在变强。跨会话去组织、调度一批 Agent，开始变得可行。"
 },
 {
  "t": "p",
  "text": "人的角色跟着变：底层执行插手得越来越少，精力更多放在决策和验收上。"
 },
 {
  "t": "p",
  "text": "个人助手（Personal Agent）就是这么来的——直接接进日常的消息、日程、邮件和工作平台，一直看着信息流，顺手把事情办了。"
 },
 {
  "t": "p",
  "text": "「一直在线、来了事件就处理」，个人助手只是其中一种用法。放在软件开发这类商业场景里，一样很有价值。"
 },
 {
  "t": "p",
  "text": "问题在于：今天主流的 Agent 设计，撑不起多任务、团队协作这个规模。"
 },
 {
  "t": "p",
  "text": "Agent 多以单个 Session 为基本单位。Session 和 Session 之间互不相通。你要同时推进几件事，就得自己在几个窗口之间来回切，还得记住每个 Session 里聊到了哪。"
 },
 {
  "t": "p",
  "text": "DeepSeek 观察下来，一个人通常只能同时跟进 **3 到 5 个**活跃的 Session。"
 },
 {
  "t": "p",
  "text": "Session 一多，人就顾不过来了。"
 },
 {
  "t": "p",
  "text": "窗口堆到这个数，注意力就断了："
 },
 {
  "t": "fig",
  "n": 3,
  "src": "fig03-session-overload.svg",
  "alt": "用户面前堆起 3→5→更多 Session 窗口；注意力条被拉断；底部结论「单任务看模型，同时几件看人」"
 },
 {
  "t": "cap",
  "text": "单任务看模型，同时几件看人。"
 },
 {
  "t": "p",
  "text": "那给现有 Agent 接上 CLI、MCP 或者外部连接器，让它也能收外部消息，行不行？"
 },
 {
  "t": "p",
  "text": "可以。但有问题。"
 },
 {
  "t": "p",
  "text": "单个会话是同步阻塞的——一件事没做完，下一件进不来。多个任务的上下文搅在一起。本地电脑一离线，Agent 也就停了。维护它，要花大量人力。"
 },
 {
  "t": "p",
  "text": "所以需要把 Agent 和「人手动开的某一次会话」解绑，让它变成一个连续存在的实体：跨会话记得上下文，同时推进好几件复杂的事，彼此不打架。"
 },
 {
  "t": "p",
  "text": "这种 Agent 形态，连同它背后的系统架构，DeepSeek 叫它 **Super-agent**。"
 },
 {
  "t": "p",
  "text": "还是拿内部那个基于 DeepSeek Harness 跑着的实例举例：同一个开发任务，可以在群聊里提、在 GitHub 上接着改。一件事换了地方说，它照样接得上。"
 },
 {
  "t": "p",
  "text": "群聊定了方案，PR 里改口——两边接到同一个头像："
 },
 {
  "t": "fig",
  "n": 4,
  "src": "fig04-plan-a-to-b.svg",
  "alt": "左侧群聊定方案 A，右侧 PR 评论改成方案 B；红线把两边接到同一个 Agent 头像；底部结论「换地方说，照样接上」"
 },
 {
  "t": "cap",
  "text": "换地方说，照样接上。"
 },
 {
  "t": "p",
  "text": "开头那个「没人 @ 也自己修 bug」的场景，也来自这个实例：它一直看着公共群聊里的反馈，在没人点名的情况下，主动定位根因、提交修复。"
 },
 {
  "t": "h2",
  "id": "four-traits",
  "text": "四个特征，五个模块"
 },
 {
  "t": "p",
  "text": "DeepSeek 给 Super-agent 定了四个基础特征："
 },
 {
  "t": "p",
  "text": "**连续**：你在群聊、GitHub 评论这些熟悉的地方跟它说话，感觉始终只有一个 Agent。「Session X 的上下文里有没有 Y 这条信息」，交给它自己操心。比如你先在群里定了方案 A，后来在 Pull Request 评论里改成方案 B，它能理解，并跟着调整。"
 },
 {
  "t": "p",
  "text": "**高效**：回话快，同时能并行、高质量地做完好几件复杂的事；上一个命令、上一个任务还没完，就能接下一条指令。"
 },
 {
  "t": "p",
  "text": "**主动**：它自己看着环境里发生的事，挑值得处理的往前推；用不着它的时候，就安静待着。"
 },
 {
  "t": "p",
  "text": "**持久**：一直在线，直接接进你真实的工作环境，长期跑下来出了异常，能自己恢复。"
 },
 {
  "t": "p",
  "text": "落到具体场景里，四个词各自长什么样："
 },
 {
  "t": "fig",
  "n": 5,
  "src": "fig05-four-traits.svg",
  "alt": "四宫格「连续/高效/主动/持久」；每格一句场景人话；底部结论「四个词，不是口号」"
 },
 {
  "t": "cap",
  "text": "四个词，不是口号。"
 },
 {
  "t": "p",
  "text": "一个 ReAct Loop（模型想一步、调一次工具、看结果、再想下一步的循环）同时撑不住这四条。底下得有一套相应的架构。"
 },
 {
  "t": "p",
  "text": "相似的设计约束，会推出相似的架构。不管是个人助手，还是软件开发里的 Agent，只要目标是「一直在线、并发响应环境里的事件」，底层大概率会长得差不多。"
 },
 {
  "t": "p",
  "text": "而且一路遇到的问题，和传统计算机系统研究了几十年的问题高度相似。所以很多经典的系统设计思想，在这里照样好用。后面你会反复看到 Fast Path、缓存、局部性、投机执行、存算分离这些老面孔。"
 },
 {
  "t": "p",
  "text": "具体落地会有各种变体，但 DeepSeek 认为，下面五个模块是撑起这四个特征的基本框架："
 },
 {
  "t": "ol",
  "items": [
   "**双层架构**：同时做到连续和高效",
   "**事件驱动**：做到主动",
   "**面向人的交互**：在跟人来回沟通时，也做到连续和高效",
   "**计算、状态与环境的分离**：跨设备一直在线",
   "**Watchdog**：出了异常自己恢复"
  ]
 },
 {
  "t": "p",
  "text": "一条群聊消息从进来到收到回复，会挨个经过这五个模块。"
 },
 {
  "t": "p",
  "text": "消息进来，五道关依次过："
 },
 {
  "t": "fig",
  "n": 6,
  "src": "fig06-five-modules.svg",
  "alt": "消息气泡从左到右穿过五个模块卡片；红脉冲沿路径移动；底部结论「一条消息，五道关」"
 },
 {
  "t": "cap",
  "text": "一条消息，五道关。"
 },
 {
  "t": "h2",
  "id": "two-layer",
  "text": "双层架构"
 },
 {
  "t": "p",
  "text": "要让交互跨信道连续、多任务又能高效并发，底层怎么组织会话，绕不开一个根本的权衡：**连续性**和**吞吐量**。"
 },
 {
  "t": "p",
  "text": "一种极端：所有事件都交给同一个 Session。上下文最连续，但单个 ReAct Loop 只能串行地一步步干，速度有上限，任务完成得慢、吞吐低；好几个任务的中间细节混在一起，还会拖累完成质量。"
 },
 {
  "t": "p",
  "text": "另一种极端：每来一条事件就新开一个 Session。并发吞吐最高，可任务之间往往不完全独立，缺了全局上下文，各个 Session 的结果彼此割裂；好几个 Session 还各自给用户回话，交互一团乱。"
 },
 {
  "t": "p",
  "text": "两种极端各自卡在哪——"
 },
 {
  "t": "look",
  "text": "看一看："
 },
 {
  "t": "fig",
  "n": 7,
  "src": "fig07-two-extremes.svg",
  "alt": "左「单 Session」上下文完整但串行堵死；右「一事件一 Session」吞吐高但回话乱；底部结论「连续性和吞吐量，二选一都不行」"
 },
 {
  "t": "cap",
  "text": "连续性和吞吐量，二选一都不行。"
 },
 {
  "t": "p",
  "text": "DeepSeek 的解法，是把「维护全局连续性」和「高并发执行」拆到两层："
 },
 {
  "t": "ul",
  "items": [
   "上层是常驻的 **Router** 层，统一接住人的交互，负责全局协调",
   "下层是 **Worker** 层，每个 Worker 上下文互相隔离，并发执行具体任务"
  ]
 },
 {
  "t": "p",
  "text": "拆成两层以后，人只跟 Router 说话，活由 Worker 去做："
 },
 {
  "t": "fig",
  "n": 8,
  "src": "02_router_worker.svg",
  "alt": "上方 Router 接人；下方多个 Worker 并行；人只连 Router；底部结论「陪聊和干活拆开」"
 },
 {
  "t": "cap",
  "text": "陪聊和干活拆开。"
 },
 {
  "t": "p",
  "text": "上下文管理和并发执行都被系统在底层接走了。用户那一侧几乎感觉不到 Session 的存在，面对的始终是同一个 Super-agent。"
 },
 {
  "t": "p",
  "text": "从这个角度看，让用户手动管理 Session，很大程度上是从底层 LLM API 一路延续下来的设计惯性。Session 应该是系统内部的实现细节。"
 },
 {
  "t": "p",
  "text": "还有一层意思：现在的 Session 身兼两职——技术上管上下文，产品上管项目。把产品形态和底层 Session 解耦以后，项目管理就能脱开 Session 单独设计。「给用户什么样的交互和任务管理方式」就成了一个独立的产品问题（文章最后的开放问题里还会聊）。"
 },
 {
  "t": "p",
  "text": "另外，「双层」说的是逻辑上的分工。每一层在实现上都可以有自己的内部结构，由好几个 Session 组成。"
 },
 {
  "t": "h3",
  "text": "一、Router 层"
 },
 {
  "t": "p",
  "text": "Router 层常驻，承接所有入口进来的人类交互。所有跨任务的信息和决策都在这里汇总。它同时是全局的序点（Sequence Point，所有事情在这里排出先后）、协调点和记忆。"
 },
 {
  "t": "p",
  "text": "为了让这个全局节点保持轻快，Router 只管跟人交互和分派任务，具体的活都交出去，甚至可以连 Bash 工具都省掉。"
 },
 {
  "t": "p",
  "text": "一个中心节点分派多个执行节点，乍一看和常见的 Agent Team 很像。两者的区别在于：中心节点要管到多细。"
 },
 {
  "t": "p",
  "text": "管到任务，还是管到每一步："
 },
 {
  "t": "fig",
  "n": 9,
  "src": "fig09-team-vs-router.svg",
  "alt": "左 Agent Team Lead 深入子步骤高频协调；右 Router 只做任务级分派；底部结论「管到任务，不管到步骤」"
 },
 {
  "t": "cap",
  "text": "管到任务，不管到步骤。"
 },
 {
  "t": "p",
  "text": "Agent Team 主要拿来拆解单个复杂任务、让不同角色协作。子步骤之间通常耦合很紧，Team Lead 得深入理解任务细节、规划子任务、高频协调各个成员，自己背着很重的推理负担。"
 },
 {
  "t": "p",
  "text": "Router 只处理任务和任务之间的高层关联和分派。单个任务内部怎么拆，交给 Worker。"
 },
 {
  "t": "p",
  "text": "反过来，如果你用提示词约束一个 Agent Team 的主会话：只负责对外交互，把不同的任务分给各个成员独立推进，那它也可以算作这种双层架构。"
 },
 {
  "t": "p",
  "text": "DeepSeek 的实践经验是：Router 的活常常没想象中复杂，用一个比较轻量的模型，往往就能兼顾速度和效果。"
 },
 {
  "t": "p",
  "text": "Router 层内部同样可以由好几个 Session 组成，有些逻辑甚至用普通代码就能写。DeepSeek 选了最直接的做法：一个常驻的 LLM Session 当 Router 的核心。"
 },
 {
  "t": "p",
  "text": "那一个会话，扛得住整个团队的消息吗？"
 },
 {
  "t": "p",
  "text": "比看上去扛得住。原因是批处理（Batching）：上一轮推理期间到达的环境事件（也就是后面要讲的 Trigger）会先攒着，下一轮一起处理，合并处理的额外开销很小。"
 },
 {
  "t": "p",
  "text": "高峰来了，几条 Trigger 并进一次调用："
 },
 {
  "t": "fig",
  "n": 10,
  "src": "fig10-trigger-batching.svg",
  "alt": "平稳时 Trigger 一条条进；高峰时多条合并进同一次 LLM 调用；Prefill 并行标注；底部结论「积压越多，摊到每个决定越便宜」"
 },
 {
  "t": "cap",
  "text": "积压越多，摊到每个决定越便宜。"
 },
 {
  "t": "p",
  "text": "外部事件流平稳的时候，Trigger 一条条进 Router，单次响应的延迟很低。"
 },
 {
  "t": "p",
  "text": "事件密集涌进来、Router 开始排队的时候，上一轮推理期间积压的几条 Trigger 自动合并，在下一次调用 LLM 时一起注入。"
 },
 {
  "t": "p",
  "text": "为什么合并很划算？Router 只做轻量的交互和分派，每一步通常是长输入、短输出。把积压的几条 Trigger 合进一次 LLM API 调用，它们在 Prefill 阶段（模型读输入的阶段）是并行计算的，单次请求的耗时，涨得远比批的大小慢。"
 },
 {
  "t": "p",
  "text": "所以在一定范围内，积压得越多，摊到每个决定上的推理时间反而越短。上限有两个：上下文长度，以及模型在一轮里能准确处理多少条 Trigger。"
 },
 {
  "t": "p",
  "text": "文章第 7 节用实验定量验证了这一点，后面会讲。再加上订阅直通和链式召回这两个机制（也在后面），一个常驻的 Router Session 既保住了上下文连续，在他们目前的团队规模下也已经够用。"
 },
 {
  "t": "p",
  "text": "如果规模再往上走、一个会话真的扛不住了，Router 层内部可以做成多层过滤，或者水平切分（Sharding）成几个会话。"
 },
 {
  "t": "p",
  "text": "这时候 Router 层的内部设计，本质上又回到了连续性和吞吐量的权衡：切得越细，并发吞吐越高，分片之间的记忆和上下文就越不连续。全局记忆的问题解决之前，这个权衡会一直存在。"
 },
 {
  "t": "h3",
  "text": "二、Worker 层"
 },
 {
  "t": "p",
  "text": "Worker 层由真正干活的会话组成。每个 Worker 上下文互相隔离，挂着完整的执行工具，在独立的上下文里专心做一件事。"
 },
 {
  "t": "p",
  "text": "Worker 直接决定任务结果和代码质量，所以通常要配能力最强的模型。"
 },
 {
  "t": "p",
  "text": "Worker 只向 Router 汇报状态。推理过程和工具调用都留在自己里面，由 Router 统一回复用户。这样既保住了并发度和交付质量，也避免了好几个会话各说各话。"
 },
 {
  "t": "p",
  "text": "多个任务并发时，各个 Worker 各推各的。"
 },
 {
  "t": "p",
  "text": "它们真正会撞车的地方，往往是同一个 Pull Request 这类共享的工作环境。只要它们都订阅了对应的 Thread（同一个话题、同一个 PR 下的一串消息，第 3 节细讲），就会收到同样的事件通知，有机会自己发现、自己解决冲突；少数需要跨任务协同的，由 Router 中转。"
 },
 {
  "t": "p",
  "text": "和 Router 一样，单个 Worker 内部也可以有好几个会话：碰到复杂的单任务，Worker 里面可以再开 Subagent，它本身也可以就是一个 Agent Team。这些对上面的 Router 都是透明的。"
 },
 {
  "t": "p",
  "text": "这个结构在写代码的场景里好用：同时推进几个互不相干的问题复现、Pull Request 评审和新功能开发，谁也不堵谁。"
 },
 {
  "t": "p",
  "text": "放到个人助手里也一样。个人助手在界面上通常只有一个聊天页，但你在同一个对话框里同时聊好几件事时，前端这一个聊天页负责交互的连续，底下可以给每个话题各派一个 Worker，并行推进、起草回复。"
 },
 {
  "t": "p",
  "text": "一个对话框里同时办几件事，长这样："
 },
 {
  "t": "fig",
  "n": 11,
  "src": "fig11-one-chat-many-workers.svg",
  "alt": "一个聊天页气泡交错三件事；底下三个 Worker 并行；底部结论「界面一个窗，底下几条线」"
 },
 {
  "t": "cap",
  "text": "界面一个窗，底下几条线。"
 },
 {
  "t": "h2",
  "id": "event-driven",
  "text": "事件驱动"
 },
 {
  "t": "p",
  "text": "要让 Super-agent 主动起来，先得换掉驱动它的方式。"
 },
 {
  "t": "p",
  "text": "驱动 Agent 的主要输入，从人在 Session 里一条条敲的提示词，换成了环境里的半结构化事件：群聊消息、邮件和日程提醒、代码审查评论、CI 运行结果……在 Super-agent 里，这些统称 **Trigger**。"
 },
 {
  "t": "p",
  "text": "监听并响应 Trigger，Agent 就能根据环境里发生的事，自己动起来。"
 },
 {
  "t": "p",
  "text": "围绕一条事件从进来到被处理的一生，依次回答四个问题：怎么过滤噪音，怎么路由给 Worker，往模型的上下文里塞多少，以及能不能提前行动。"
 },
 {
  "t": "h3",
  "text": "一、过滤"
 },
 {
  "t": "p",
  "text": "接进真实的群聊和代码平台之后，事件流的特征很鲜明：噪音高、真正需要触发的少，绝大多数日常消息用不着 Agent 介入。"
 },
 {
  "t": "p",
  "text": "如果每条事件都让大模型从头判断一遍，延迟和算力成本都扛不住。"
 },
 {
  "t": "p",
  "text": "这里借的是计算机系统里的 Fast Path / Slow Path 思想：大模型推理灵活但贵，是 Slow Path；把已经明确、稳定的高频判断写死成确定性的代码，就是又快又便宜的 Fast Path。"
 },
 {
  "t": "p",
  "text": "所以事件进系统的第一步是过滤：在调大模型之前，先用确定性的规则筛掉噪音，只把需要理解语义的候选事件交给模型。具体是两级："
 },
 {
  "t": "ul",
  "items": [
   "**程序层（Fast Path）**：按事件来源、群组范围、用户或机器人白名单这些确定的条件，直接用代码做准入检查。比如给不同来源分别设成「只响应明确请求」「作为候选事件」或者「直接忽略」，在调模型之前就筛掉大部分无关消息。",
   "**语义层（Slow Path）**：过了程序层的候选事件，交给 LLM，按提示词里写好的策略和上下文，判断要不要行动。语义层同时是给人用的自然语言扩展点——想开关某条策略、加一条新策略，改提示词就行。"
  ]
 },
 {
  "t": "p",
  "text": "一条消息要过两道筛子，才会有人处理："
 },
 {
  "t": "fig",
  "n": 12,
  "src": "03_filter_paths.svg",
  "alt": "事件流进 Fast Path 代码筛；大量灰掉；少数进 Slow Path 模型判；底部结论「先代码，再模型」"
 },
 {
  "t": "cap",
  "text": "先代码，再模型。"
 },
 {
  "t": "h3",
  "text": "二、路由"
 },
 {
  "t": "p",
  "text": "Router 层负责跨信道的连续性。但如果一个任务分出去以后，它的每条后续事件还得经 Router 转一手，这个全局节点照样要背大量负载，响应延迟也会被拉高。"
 },
 {
  "t": "p",
  "text": "所以 Fast / Slow Path 这招，在过滤之后的路由上再用一次：Router 只负责新任务的冷启动和跨任务协调；已经确定归属的后续事件，由程序直接发给对应的 Worker。"
 },
 {
  "t": "p",
  "text": "这里要先认识 **Thread**。实际工作里，同一个 GitHub Pull Request、同一个群聊话题、同一串往来邮件下的连续事件，构成一条事件流，就叫 Thread。"
 },
 {
  "t": "p",
  "text": "消息按事情归成一串一串，后面的路由都靠它："
 },
 {
  "t": "fig",
  "n": 13,
  "src": "fig13-threads.svg",
  "alt": "散落消息按 PR/群话题/邮件串成三条 Thread；底部结论「事归串，路由靠串」"
 },
 {
  "t": "cap",
  "text": "事归串，路由靠串。"
 },
 {
  "t": "p",
  "text": "Router 根据某个 Thread 的第一条事件开出一个 Worker 之后，这个 Worker 会直接订阅这条 Thread。事件路由分成两条路："
 },
 {
  "t": "ul",
  "items": [
   "**已订阅（Fast Path）**：同一个 Thread 里的后续事件，由程序直接送到订阅它的 Worker。如果新事件超出了当前任务的范围，Worker 也可以退订，或者交回 Router 重新分派。",
   "**未订阅（Slow Path）**：Router 仍然能看到所有事件，掌握全局状态，但只负责判断、分派还没人订阅的新事件。"
  ]
 },
 {
  "t": "p",
  "text": "订了以后，后续消息绕开 Router、直通 Worker："
 },
 {
  "t": "fig",
  "n": 14,
  "src": "fig14-subscribe-bypass.svg",
  "alt": "首事件经 Router 开 Worker；后续事件红线直通 Worker，绕过 Router；底部结论「订了就直通」"
 },
 {
  "t": "cap",
  "text": "订了就直通。"
 },
 {
  "t": "p",
  "text": "另外，Thread 和 Worker 之间的订阅是多对多的：一个 Worker 可以同时订好几条相关的 Thread，一条 Thread 也可以被好几个 Worker 订阅。"
 },
 {
  "t": "p",
  "text": "几个 Worker 在同一个工作环境、同一场讨论里碰上时，这条 Thread 的新事件会同时送到所有订阅者手里。它们各自就能知道彼此做了什么，自己把冲突解决掉。"
 },
 {
  "t": "p",
  "text": "两个 Worker 改到同一个 PR 时，冲突就是这样被发现的。"
 },
 {
  "t": "p",
  "text": "共享一条 Thread，撞车自己发现："
 },
 {
  "t": "fig",
  "n": 15,
  "src": "fig15-shared-thread.svg",
  "alt": "两个 Worker 同订一条 PR Thread；双方同时收到冲突事件；自行协商；底部结论「共享 Thread，自己发现撞车」"
 },
 {
  "t": "cap",
  "text": "共享 Thread，自己发现撞车。"
 },
 {
  "t": "p",
  "text": "输出那一侧照旧：Worker 把关键结论汇报给 Router，由 Router 统一回复用户、同步全局记忆。"
 },
 {
  "t": "h3",
  "text": "三、上下文放多少"
 },
 {
  "t": "p",
  "text": "事件过滤完、路由到了目标 Session，下一个问题是：往模型的上下文窗口里塞多少信息？"
 },
 {
  "t": "p",
  "text": "系统的输入，从有限的人类提示词，变成了环境源源不断产生的半结构化事件。工具调用和事件注入的结构设计，变得格外重要。"
 },
 {
  "t": "p",
  "text": "塞多了，挤占窗口、稀释模型的注意力；塞少了，模型得反复调工具去读，执行步数变多。浪费上下文窗口，就是浪费模型的智能。"
 },
 {
  "t": "p",
  "text": "DeepSeek 的做法是把有限的上下文窗口当成 Cache 来管。借编译优化和计算机系统里的说法，注入上下文可以归成两个基本操作："
 },
 {
  "t": "ul",
  "items": [
   "**Inline（内联）**：把近期很可能用到的信息直接放进当前上下文窗口，省掉一次工具调用的往返。",
   "**Spill（溢出）**：超出窗口预算、或者不常用的完整信息留在窗口外面，窗口里只留引用或摘要，模型需要时自己去读。"
  ]
 },
 {
  "t": "p",
  "text": "再结合系统设计里经典的局部性（Locality）原则，事件注入和工具调用可以一步步优化："
 },
 {
  "t": "ol",
  "items": [
   "从最少的信息开始：一开始只给当前对象的 ID 和内容摘要。",
   "按局部性逐步 Inline 关联信息：先附上紧密关联对象的 ID，再附带时间、位置上相邻的内容。比如内容的前 50 个字，群聊消息的前后几条和它回复的那条，代码评论所在评审讨论里的相邻评论。",
   "超出上限就 Spill：长内容设一个比较小的长度上限，超出的部分放到窗口外。最简单直接的做法，是截断，同时留一个「续读」入口，模型要看全文时再调工具读。"
  ]
 },
 {
  "t": "p",
  "text": "窗口里放近的，窗外留远的："
 },
 {
  "t": "fig",
  "n": 16,
  "src": "fig16-inline-spill.svg",
  "alt": "窗口里 ID+摘要+邻近片段；窗外完整长文与续读入口；底部结论「窗口当 Cache：Inline 近的，Spill 远的」"
 },
 {
  "t": "cap",
  "text": "窗口当 Cache：Inline 近的，Spill 远的。"
 },
 {
  "t": "p",
  "text": "这套规则还解决了 Router 的一个老大难。"
 },
 {
  "t": "p",
  "text": "大量后续事件直通 Worker、系统又长期运行攒下了很多历史任务以后，Router 不可能把所有任务的完整历史都放进自己的窗口；可用户在另一个信道里突然提起某个旧任务，它又得把上下文找回来。"
 },
 {
  "t": "p",
  "text": "把 Inline & Spill 一致地用到系统里的各类对象上，就得到一种按需展开的多跳检索，DeepSeek 叫它 **链式召回（Chain of Recall）**。"
 },
 {
  "t": "p",
  "text": "做法是：系统给 Trigger、Thread、Worker Session 这些对象都分配唯一 ID，注入时内联紧密关联对象的 ID，这些对象在底层就连成了一张引用图。"
 },
 {
  "t": "p",
  "text": "每次调工具召回的对象，本身也遵守 Inline & Spill，返回结果里又内联着下一跳对象的摘要和 ID。模型就能从眼前这条事件出发，顺着引用一跳一跳地按需取回上下文。"
 },
 {
  "t": "p",
  "text": "很久以前的任务，就是这样被找回来的。"
 },
 {
  "t": "p",
  "text": "顺着 ID 一跳一跳往回找："
 },
 {
  "t": "fig",
  "n": 17,
  "src": "fig17-chain-of-recall.svg",
  "alt": "当前消息→Thread ID→Worker Session→另一条评审 Thread；链状跳转点亮；底部结论「忘了也不怕，顺着 ID 跳」"
 },
 {
  "t": "cap",
  "text": "忘了也不怕，顺着 ID 跳。"
 },
 {
  "t": "p",
  "text": "比如从当前这条消息读出它所在的 Thread，从 Thread 里内联的 ID 找到相关的 Worker Session，再从这个 Worker 找到它关联的另一个代码评审 Thread。Router 在长期运行里「忘了前面的事」，靠这条链缓解了不少。"
 },
 {
  "t": "h3",
  "text": "四、提前行动"
 },
 {
  "t": "p",
  "text": "这一招借的是计算机系统里的投机执行（Speculative Execution）：结果会不会被采用还不确定，Agent 就根据环境信号，先在后台试着做。"
 },
 {
  "t": "p",
  "text": "多花一些后台算力，换人少等一会儿、少插一次手。做出来有价值就交付，没价值就扔掉。"
 },
 {
  "t": "p",
  "text": "个人助手里，收到一封会议邀约或者一条待办，Agent 可以先在后台核对日程有没有冲突、搜集相关背景、备好回复草稿，你过目一眼，确认就能直接发出。"
 },
 {
  "t": "p",
  "text": "研发协作里也一样。DeepSeek 在公司的 DeepSeek Harness 内部用户群里配了一条「静默复现并修复」的策略：群里有人反馈问题、或者在讨论改动方案时，Agent 先在后台试着复现、找修复方案；只有确认了问题、也找到了简单的修复，才把结果交给用户，否则全程安静。"
 },
 {
  "t": "p",
  "text": "群里还在讨论，修复已经备好了："
 },
 {
  "t": "fig",
  "n": 18,
  "src": "fig18-speculative.svg",
  "alt": "群聊讨论气泡还在飘；后台已出现复现成功与草稿 PR；确认后才弹出；底部结论「先做着，确认再交」"
 },
 {
  "t": "cap",
  "text": "先做着，确认再交。"
 },
 {
  "t": "h2",
  "id": "talking-to-people",
  "text": "怎么跟人说话"
 },
 {
  "t": "p",
  "text": "双层架构在上下文层面保证了跨信道的连续。但真到了人机交互的体验里，要同时做到连续和高效，还得在交互方式和交互渠道上各解决一个问题。"
 },
 {
  "t": "h3",
  "text": "一、全双工"
 },
 {
  "t": "p",
  "text": "经典的 ReAct Loop 里，模型发起一次同步的 `run()` 工具调用，循环就卡住了，一直等到工具跑完、返回最终结果。这期间，会话接不了任何新消息。"
 },
 {
  "t": "p",
  "text": "要消掉这段阻塞，得把对话从一问一答的半双工，改成全双工。改完以后，等工具的时候也能接着聊。"
 },
 {
  "t": "p",
  "text": "半双工堵住对话，全双工把前后台拆开："
 },
 {
  "t": "fig",
  "n": 19,
  "src": "fig19-full-duplex.svg",
  "alt": "半双工时间轴上工具调用把对话堵住；全双工里 start 后前台继续聊、后台跑完再投事件；底部结论「后台在跑，前台还能回话」"
 },
 {
  "t": "cap",
  "text": "后台在跑，前台还能回话。"
 },
 {
  "t": "p",
  "text": "具体做法是，把耗时的命令和子任务工具调用，改成异步的 `start()` 和 `stop()`，构成异步 ReAct Loop："
 },
 {
  "t": "ul",
  "items": [
   "模型调 `start()` 之后，马上收到「已启动（Started）」的返回，循环接着往下走。",
   "后台工具跑完，系统把最终结果当成一条新的事件消息，投进会话。",
   "模型也可以根据上下文调 `stop()`，主动终止跑得太久的后台命令。"
  ]
 },
 {
  "t": "p",
  "text": "前台对话和后台任务就此解耦：Agent 在后台跑耗时任务的同时，还能回人的消息。新消息在当前这一步推理结束后就会被处理。"
 },
 {
  "t": "p",
  "text": "这套异步任务机制，DeepSeek Harness 里已经实现了，只是还没默认开启。"
 },
 {
  "t": "h3",
  "text": "二、多信道"
 },
 {
  "t": "p",
  "text": "不同的工作信道，信息密度和交互习惯都不一样，系统的输出要跟它们对上。"
 },
 {
  "t": "p",
  "text": "把给单人终端设计的交互方式原样搬进群聊，冗长的推理过程、密集的工具调用一股脑往外倒，多人协作的群里很快就信息过载了。"
 },
 {
  "t": "p",
  "text": "双层架构已经解决了一部分：具体任务里冗长的推理和密集的工具调用，都关在 Worker 里面，由 Router 统一对外。"
 },
 {
  "t": "p",
  "text": "在这个基础上，系统还要接进用户日常用的各种工作环境，并用提示词给不同信道定制交互规范："
 },
 {
  "t": "ul",
  "items": [
   "**群聊这类即时通讯信道**：少打扰、轻量沟通。像人类同事一样，只在需要你决策或验收时才发通知，只问直接的问题，只给简短的结论。DeepSeek 验证过一条简单有效的硬规定：单次回复不超过 **100 词**。",
   "**GitHub、邮件和文档这类异步信道**：结构化、信息密度高的异步交付。比如创建或更新 Pull Request 时，按项目规范写清问题背景、改动说明和验证结果；个人助手场景里，直接起草结构化的邮件和文档摘要。"
  ]
 },
 {
  "t": "p",
  "text": "同一个结果，在群里和在 PR 里的回法差在哪："
 },
 {
  "t": "fig",
  "n": 20,
  "src": "fig20-im-vs-pr.svg",
  "alt": "左侧群聊短气泡「修好了，见 PR」；右侧 PR 描述含背景/改动/验证；底部结论「IM 短，异步信道写全」"
 },
 {
  "t": "cap",
  "text": "IM 短，异步信道写全。"
 },
 {
  "t": "h2",
  "id": "always-online",
  "text": "一直在线"
 },
 {
  "t": "p",
  "text": "现在的本地 Agent，默认把三样东西绑在同一台设备上："
 },
 {
  "t": "ol",
  "items": [
   "推进 Agent Loop 的计算",
   "需要持久保存的会话状态",
   "代码仓库、本地工具链这些执行环境"
  ]
 },
 {
  "t": "p",
  "text": "设备一休眠，这三样就一起停了："
 },
 {
  "t": "fig",
  "n": 21,
  "src": "fig21-laptop-sleeps.svg",
  "alt": "笔记本合盖；计算/状态/环境三块同时变灰；底部结论「绑在一台机上，睡了就全停」"
 },
 {
  "t": "cap",
  "text": "绑在一台机上，睡了就全停。"
 },
 {
  "t": "p",
  "text": "设备一休眠、一离线，Agent 就停了；它也碰不到其他设备上的环境。"
 },
 {
  "t": "p",
  "text": "要让 Super-agent 一直在线、还能灵活接进各种真实的工作环境，DeepSeek 借了计算机系统里存算分离（Compute-Storage Separation）的思路，分两步解开这三样的绑定。"
 },
 {
  "t": "p",
  "text": "第一步，把计算和状态分开。推进 Agent Loop 的计算可以做成无状态的，真正要持久保存的是会话状态。"
 },
 {
  "t": "p",
  "text": "所以计算放进云端无状态的弹性计算容器里，Session 这些持久化状态存进数据库。容器可以水平扩展、随时重启或替换，会话和任务的连续性由持久化存储兜着，Agent 就摆脱了单台本地设备的生命周期，在云端一直在线。"
 },
 {
  "t": "p",
  "text": "跑 Agent 的机器坏了，换一台就能接着跑。"
 },
 {
  "t": "p",
  "text": "容器挂了再拉一台，状态从库里接上："
 },
 {
  "t": "fig",
  "n": 22,
  "src": "fig22-stateless-compute.svg",
  "alt": "云端容器挂掉后新容器拉起；数据库里的 Session 状态接上；底部结论「算力可换，状态在库里」"
 },
 {
  "t": "cap",
  "text": "算力可换，状态在库里。"
 },
 {
  "t": "p",
  "text": "第二步，把计算和执行环境分开。"
 },
 {
  "t": "p",
  "text": "Agent Loop 和会话状态都常驻云端了，接下来的问题是：怎么够到任务需要的执行环境？"
 },
 {
  "t": "p",
  "text": "模型干活需要的上下文，很大一部分要靠工具调用，从代码仓库、本地文件、依赖服务这些执行环境里取。从这个意义上说，广义的上下文也包括执行环境本身。"
 },
 {
  "t": "p",
  "text": "常见的思路有两种："
 },
 {
  "t": "ul",
  "items": [
   "在云端起一个沙箱，拉代码，试着重建、同步环境。可真实的工作环境里，往往有没提交的本地修改、私有凭据、内网服务依赖，还有特定的硬件或工具链，同步这样的环境，成本很高，还容易漏东西。",
   "直接让用户放弃本地环境，搬到云上干活。对很多人来说，迁移成本太高了。"
  ]
 },
 {
  "t": "p",
  "text": "既然难复制、难同步的是环境本身，那就让执行环境留在原地。"
 },
 {
  "t": "p",
  "text": "Agent Loop 在云端跑，端侧只部署一个轻量的 daemon（会话状态都在云端）：它只负责执行命令、返回结果。执行环境留在云外，Agent 按需去读里面的上下文。"
 },
 {
  "t": "p",
  "text": "Agent 在云上，靠端侧一个轻量 daemon 够到你电脑里的环境："
 },
 {
  "t": "fig",
  "n": 23,
  "src": "fig23-brain-hands.svg",
  "alt": "云端脑 → 端侧 daemon「手」→ 本地仓库/工具链；底部结论「脑在云，手在端」"
 },
 {
  "t": "cap",
  "text": "脑在云，手在端。"
 },
 {
  "t": "p",
  "text": "这个思路，和 Anthropic 提出的「脑手分离」（Decoupling the brain from the hands）是一致的：同样让 harness 保持无状态，会话日志存在 harness 之外，通过统一接口按需接入执行环境。"
 },
 {
  "t": "p",
  "text": "区别在场景。Anthropic 那篇讲的是托管服务，主要讨论按需创建的沙箱和客户 VPC 里的资源；DeepSeek 这里首先要接的，是用户日常在用、可能时在线时离线的个人电脑，上面有没提交的修改和本地凭据。"
 },
 {
  "t": "p",
  "text": "所以这套设计既支持 BYOM（Bring Your Own Machine，把你日常用的开发机、个人电脑接给云端 Agent），也支持接云端托管的机器、按需创建的计算环境。"
 },
 {
  "t": "p",
  "text": "一个 Agent 可以在不同的执行设备之间切换，按任务需要挑一个环境去跑命令、取上下文。"
 },
 {
  "t": "p",
  "text": "它甚至能照顾到时在线时离线的设备：你的某台个人电脑重新上线以后，云端 Agent 会自动触发，把需要在这台设备上做的任务做完。"
 },
 {
  "t": "p",
  "text": "时在线时离线的电脑，一上线就能接到活："
 },
 {
  "t": "fig",
  "n": 24,
  "src": "fig24-device-wakes.svg",
  "alt": "离线设备灰掉；重新上线后云端任务队列下发；daemon 执行；底部结论「设备一醒，活就接上」"
 },
 {
  "t": "cap",
  "text": "设备一醒，活就接上。"
 },
 {
  "t": "h2",
  "id": "watchdog",
  "text": "出了事，谁来管"
 },
 {
  "t": "p",
  "text": "要一直在线，除了存算分离，系统还得在长期运行里自己从异常中恢复。"
 },
 {
  "t": "p",
  "text": "一个长期在线的分布式系统，很难只靠主系统内部的逻辑保证长期可靠，需要在主系统之外，再加一个独立的外部控制回路（Control Loop）。"
 },
 {
  "t": "p",
  "text": "而且对 Agent 系统来说，很多异常出在模型身上：进程好好活着，模型却在执行中陷进了无效循环，或者跑偏了目标，进程存活探测和监控脚本看到的一切正常。所以长期运行的 Agent 系统，既要盯基础设施是不是活着，也要盯任务本身有没有进展。"
 },
 {
  "t": "p",
  "text": "DeepSeek 的做法，是在主系统外面配一个独立的 Watchdog Session，用定时消息驱动它，构成外部的 Control Loop。"
 },
 {
  "t": "p",
  "text": "它要揪出来的，正是跑偏和原地打转的 Worker："
 },
 {
  "t": "fig",
  "n": 25,
  "src": "fig25-watchdog.svg",
  "alt": "Watchdog 独立于主系统；扫描 Worker「空转/跑偏」红标；底部结论「机器活着不算，任务要有实质进展」"
 },
 {
  "t": "cap",
  "text": "机器活着不算，任务要有实质进展。"
 },
 {
  "t": "p",
  "text": "Watchdog 一边处理接口报错、状态恢复失败这类基础设施故障，一边由模型判断各个 Worker 有没有实质进展、方向有没有偏离整体目标。发现异常就及时介入修复；碰到外部偶发的故障，就持续复查，直到恢复正常。"
 },
 {
  "t": "p",
  "text": "Watchdog 自己也是一个带全套工具的 Agent Session，所以维护者可以直接用自然语言问它故障原因，也可以让它在线改主系统的行为，比如增删提示词、调整触发规则。"
 },
 {
  "t": "h2",
  "id": "experiments",
  "text": "实验：真的更快吗"
 },
 {
  "t": "p",
  "text": "为了评估核心的调度和路由设计，DeepSeek 做了两组初步实验：一组端到端，对比双层架构、订阅直通和单 Session 方案；一组单独测 Router 层的批处理。"
 },
 {
  "t": "p",
  "text": "实验基于合成负载和简化环境，部分设置还可以更严谨，结果只作为初步参考。"
 },
 {
  "t": "h3",
  "text": "一、消融实验"
 },
 {
  "t": "p",
  "text": "实验用群聊和 GitHub CI 两路消息流，同时驱动四种端到端方案。单次实验约 **300** 条消息，其中约 **20** 条是工作请求，剩下的是闲聊、跟进、叫停和 CI 消息。"
 },
 {
  "t": "p",
  "text": "写代码的活，用一个只消耗时间的工具代替。所以这个实验量的是系统的调度和协作能力。每种方案重复跑 **5** 次。"
 },
 {
  "t": "p",
  "text": "参赛的四种方案："
 },
 {
  "t": "ol",
  "items": [
   "Super-agent",
   "去掉直通的 Super-agent",
   "单 Session + Subagent 工具，中性提示：「Use a subagent for a piece of work when appropriate...」",
   "单 Session + Subagent 工具，提示优先委派：「Every message of the chat reaches you, so work you run yourself keeps stopping for new messages. Prefer handing each piece of work to a subagent of its own, and do only small things yourself...」"
  ]
 },
 {
  "t": "p",
  "text": "谁先把 20 个活做完——"
 },
 {
  "t": "look",
  "text": "看一看："
 },
 {
  "t": "fig",
  "n": 26,
  "src": "fig26-ablation-times.svg",
  "alt": "四条完成时间的 P50–P95 区间条；Super-agent 最短最稳；单 Session 中性提示拖出长尾；底部结论「P50 12.4 分钟，双层更稳」"
 },
 {
  "t": "cap",
  "text": "P50 12.4 分钟，双层更稳。"
 },
 {
  "t": "p",
  "text": "（图里是各方案的 P50–P95 完成时间区间，数字来自 5 次运行；消息间隔和工作时长按 1/4 缩放，模型调用的耗时是真实值。任务完成时间，指从工作请求发出，到结果消息回来。）"
 },
 {
  "t": "table",
  "head": [
   "方案",
   "完成时间 P50 / P95（分钟）",
   "单次实验读缓存 token（全部 Session）"
  ],
  "rows": [
   [
    "Super-agent",
    "12.4 / 15.7",
    "2323 万"
   ],
   [
    "Super-agent，去掉直通",
    "12.6 / 15.5",
    "3177 万"
   ],
   [
    "单 Session + Subagent，中性提示",
    "20.4 / 29.5",
    "605 万"
   ],
   [
    "单 Session + Subagent，提示优先委派",
    "13.8 / 29.0",
    "1082 万"
   ]
  ]
 },
 {
  "t": "p",
  "text": "先看完成时间。Super-agent 的 P50 是 **12.4** 分钟，P95 是 **15.7** 分钟，明显好过带 Subagent 工具的单 Session。"
 },
 {
  "t": "p",
  "text": "单 Session 这边，结果被提示词左右得很厉害，主会话常常决定自己动手："
 },
 {
  "t": "ul",
  "items": [
   "中性提示下，5 次运行里模型一次 Subagent 都没调，所有活都在主 Session 里干，还不停被新消息打断，P95 到了 **29.5** 分钟。",
   "换成优先委派的提示后，5 次里有 4 次委派了，完成时间短了一些，但整体仍然慢于 Super-agent；剩下那 1 次，它判断这活「很小」，自己干了，就是图里那条紫色的长尾区间。"
  ]
 },
 {
  "t": "p",
  "text": "在单 Session 里，分不分工要看提示词和模型的临场判断；双层架构在系统层面把分工定了下来：Router 不碰具体的活，Worker 只收自己订阅的 Thread。"
 },
 {
  "t": "p",
  "text": "再看开销。Super-agent 维护着好几个独立会话，单次实验的读缓存 token 比单 Session 多，是拿更多的 token，换更短、更稳的完成时间。"
 },
 {
  "t": "p",
  "text": "至于直通机制，在 Super-agent 内部把它去掉，任务完成时间和完整版基本一样，但 Router 要做的决定多了约 **30%**，总读缓存 token 从 2323 万涨到 3177 万，多了约 **37%**。"
 },
 {
  "t": "p",
  "text": "完整版和去掉直通，Router 侧账单差多少："
 },
 {
  "t": "fig",
  "n": 27,
  "src": "fig27-bypass-cost.svg",
  "alt": "柱状对比完整版 vs 去掉直通的 Router 决定数与读缓存 token；标注约 +37%；底部结论「直通省的是 Router 侧账单」"
 },
 {
  "t": "cap",
  "text": "直通省的是 Router 侧账单。"
 },
 {
  "t": "p",
  "text": "在这个实验负载下，直通的作用是给 Router Session 省下相当可观的 token 和推理开销。完成时间不一定更快，但账单和噪声会好受一些。"
 },
 {
  "t": "h3",
  "text": "二、Router 的批处理"
 },
 {
  "t": "p",
  "text": "为了验证前面说的「一个常驻 Router 扛得住」，DeepSeek 单独给 Router 层做了压力测试：Router 调真实模型，Worker 用 Mock 模型，把需要决定的 Trigger 到达速率，从每分钟约 **1** 条一路加到约 **40** 条，看平均一批几条、单次请求多久、每个决定摊到多少推理时间。"
 },
 {
  "t": "p",
  "text": "到达速率往上推，每个决定摊到多少时间："
 },
 {
  "t": "fig",
  "n": 28,
  "src": "fig28-router-batching-numbers.svg",
  "alt": "到达速率 1→40/分钟；批大小 1.0→2.8；单次耗时 2.5→3.9 秒；每决定推理时间 6.4→1.6 秒；底部结论「高峰靠合并，有效吞吐上去」"
 },
 {
  "t": "cap",
  "text": "高峰靠合并，有效吞吐上去。"
 },
 {
  "t": "p",
  "text": "到达速率从每分钟约 1 条升到约 40 条，平均每批从 **1.0** 条涨到 **2.8** 条，单次请求耗时只从 **2.5** 秒涨到 **3.9** 秒，涨得比批的大小慢。每个决定摊到的推理时间，从 **6.4** 秒降到了 **1.6** 秒。"
 },
 {
  "t": "p",
  "text": "也就是说，外部事件突然扎堆的时候，Router 能靠自动合并积压的事件，把有效吞吐提上去。"
 },
 {
  "t": "p",
  "text": "这也解释了消融实验里的一个现象：去掉直通以后，Router 的峰值负载变大了，单个 Router 依然扛得住。所以在他们目前的团队规模下，一个 Router 就够用，全局上下文也能保持连续。"
 },
 {
  "t": "h2",
  "id": "open-questions",
  "text": "还没解决的问题"
 },
 {
  "t": "p",
  "text": "这套系统能用比较低的复杂度跑起来，很大程度上是因为在现阶段做了一系列工程和场景上的简化。出了这些简化的适用范围，还有四类问题要解决。"
 },
 {
  "t": "h3",
  "text": "一、双层架构怎么扩展"
 },
 {
  "t": "p",
  "text": "前面这套组合：一个常驻的 Router Session，加订阅直通，加 Worker 之间各干各的，用很小的工程代价，覆盖了他们目前绝大多数的日常任务。"
 },
 {
  "t": "p",
  "text": "但任务规模变大、耦合变紧，超出一个 Router Session 能承载的范围时，层内具体怎么搭，还没有定论：Router 什么时候该水平切分、按什么粒度切，同层 Worker 什么时候需要直接通信、用什么样的协作拓扑，都还要在更多场景里检验。"
 },
 {
  "t": "p",
  "text": "Router 要不要拆成几份，难处在这里："
 },
 {
  "t": "fig",
  "n": 29,
  "src": "fig29-sharding-tradeoff.svg",
  "alt": "单 Router 连续但吞吐顶；Sharding 吞吐升但分片记忆断；天平晃动；底部结论「切得越细，记忆越碎」"
 },
 {
  "t": "cap",
  "text": "切得越细，记忆越碎。"
 },
 {
  "t": "p",
  "text": "系统和模型的协同设计（Co-design）也值得探索：专门针对 Router 的事件判别、批量分派、上下文召回这些任务训练模型，有可能把 Router 的吞吐和决策再往上提一截。"
 },
 {
  "t": "p",
  "text": "还有记忆。常驻 Router 配上基于引用图的链式召回，解决的主要是近期任务和会话历史的按需检索。运行周期拉长到跨月、甚至更久，长程记忆就成了制约扩展的主要瓶颈。"
 },
 {
  "t": "h3",
  "text": "二、没了 Session，人怎么和 Agent 协作"
 },
 {
  "t": "p",
  "text": "双层架构把底层的多会话管理藏了起来，Session 退到了产品设计的幕后。底层的执行会话和界面上的会话分开以后，怎么把任务呈现给用户、提供自然的交互和项目管理方式，成了新问题。"
 },
 {
  "t": "p",
  "text": "DeepSeek 的判断是，以聊天窗口为中心的交互，一定程度上是路径依赖的结果。交互可以更多地发生在各个领域专属的界面里，比如像文中的实例那样，让 Super-agent 直接在 GitHub 的 Issue 和 Pull Request 里干活。"
 },
 {
  "t": "p",
  "text": "Session 也可以照顾用户习惯，在界面上留着，只是你看到的一个会话，底层未必只对应一个 Session。"
 },
 {
  "t": "p",
  "text": "另外，前面讲的主要是人在「发起任务」和「验收结果」两头的交互。但在模型能力快速演进的过渡期，很多任务还需要人在中途参与：让你在后台执行过程中随时插手、接管，或者和 Agent 实时协同。怎么在产品里同时照顾逐步干预关键细节的需要，和后台自主推进的效率，同样值得探索。"
 },
 {
  "t": "p",
  "text": "用户要的项目管理和交互方式，跟具体的工作领域、个人风格密切相关，最终形态很可能是高度定制化的。DeepSeek Harness 的架构是开放的，也更容易支持这种定制。"
 },
 {
  "t": "h3",
  "text": "三、上下文边界和 A2A"
 },
 {
  "t": "p",
  "text": "前面讨论的，都是单个 Super-agent 实例的内部设计，默认它服务范围里的信息都汇进同一个全局上下文。"
 },
 {
  "t": "p",
  "text": "可一旦使用范围从个人、小团队扩到更大的组织，组织决定怎么配 Super-agent，其实就是在划定上下文共享和隔离的边界：需要共享上下文的范围共用一个实例，需要隔离的范围各配各的。"
 },
 {
  "t": "p",
  "text": "实例和实例之间，这样协作："
 },
 {
  "t": "fig",
  "n": 30,
  "src": "fig30-a2a-boundaries.svg",
  "alt": "个人助手实例与团队 Super-agent 实例各有边界；跨边界消息走 A2A；底部结论「共享用一个，隔离各配各的」"
 },
 {
  "t": "cap",
  "text": "共享用一个，隔离各配各的。"
 },
 {
  "t": "p",
  "text": "再往前一步，组织内部、组织之间一旦有了好几个彼此隔离的实例，比如每个成员各自的个人助手，和团队共用的 Super-agent，它们跨边界的协同就是 Agent 之间的通信（A2A，这里不特指哪个协议）。"
 },
 {
  "t": "p",
  "text": "底层上下文各自隔开、各自代表不同权限边界的前提下，怎么做到安全、可靠的 A2A 通信和协作，还要继续探索。"
 },
 {
  "t": "h3",
  "text": "四、安全与隐私"
 },
 {
  "t": "p",
  "text": "事件驱动让 Agent 能被更广泛的环境驱动，也让它更多地接触到不可信的输入。安全和隐私的问题解决不好，Super-agent 就只能在一个很小、很可信的范围里工作。"
 },
 {
  "t": "p",
  "text": "比如前面把 Agent Loop 放在云端、在各台执行设备上装轻量 daemon，这个设计默认云端和端侧互相信任。"
 },
 {
  "t": "p",
  "text": "可云端的 Agent Loop 一直在接外部的环境事件，端侧设备上又放着私有代码、敏感数据和本地凭据，这种跨设备连接带来了明显的安全和隐私隐患：云端 Agent Loop 一旦因为服务端入侵、提示词注入被攻破，连着的所有端侧设备都有被控制的风险。"
 },
 {
  "t": "p",
  "text": "云端一旦失守，风险会传到哪："
 },
 {
  "t": "fig",
  "n": 31,
  "src": "fig31-cloud-compromised.svg",
  "alt": "云端脑被攻破；风险箭头传到多台端侧 daemon；本地凭据高亮；底部结论「信任默认值，撑不住更广场景」"
 },
 {
  "t": "cap",
  "text": "信任默认值，撑不住更广场景。"
 },
 {
  "t": "p",
  "text": "就算云端没被攻破，只要端侧的凭据能进到模型的上下文里，正常执行的过程中也有泄露的风险。所以还得设计相应的机制，让 Agent 在完全碰不到凭据本身的情况下使用凭据。"
 },
 {
  "t": "p",
  "text": "这套架构要走向更广的应用，就得在能从各种环境里召回上下文的同时，把这些安全和隐私问题解决掉。"
 },
 {
  "t": "h2",
  "id": "finally",
  "text": "最后"
 },
 {
  "t": "p",
  "text": "回头看整套设计，DeepSeek 做的，是把计算机系统里经典的工程思想，用到了 Agent 系统的构建上。具体实现会随着技术发展而变，背后的系统设计思路，参考价值更长久。"
 },
 {
  "t": "p",
  "text": "目前，他们基于这套思路和 DeepSeek Harness 搭的内部 Super-agent 实例，一直在跑，日常参与问题复现和修复、回应代码审查，还参与 DeepSeek Harness 自己的迭代。"
 },
 {
  "t": "p",
  "text": "大模型做单个任务越来越少需要人插手，限制生产力继续往上走的瓶颈，就转到了人的注意力上。双层架构、事件驱动、异步多信道交互、存算分离和外部 Watchdog，把繁琐的会话管理和上下文同步接到了系统底层，人就能从具体的执行细节里再往上走一步，去做决策和验收。"
 },
 {
  "t": "p",
  "text": "到了这一步，Agent 就从一个等指令的对话窗口，变成了数字环境里一直在线、自己推进事情的协作者：对个人，它是跨设备帮你处理日常事务的助手；对团队，它长在研发流程里，接活、推进。"
 },
 {
  "t": "p",
  "text": "文中的部分设计，已经在一个叫 `dsh-superagent-prototype` 的插件里实现了。它是为了验证技术路线做的原型。"
 }
];

export const enBlocks: Block[] = [
 {
  "t": "p",
  "text": "The DeepSeek Harness team published a long essay: [Exploring Super-agent Design: Towards a More Autonomous Agent System](https://mp.weixin.qq.com/s/zoS7GlReWPhfCjENGxXCdg). It is not about chat tricks. It is about what sits underneath an agent that lives in the company group chat and on GitHub and pushes several things forward at once. The original is engineering-heavy; below we unpack it as: where people get stuck → a diagram → the mechanism."
 },
 {
  "t": "p",
  "text": "Inside DeepSeek there is a Super-agent. It lives in the company's group chats and on GitHub, and it moves several things forward at the same time."
 },
 {
  "t": "p",
  "text": "On the ground it looks roughly like this:"
 },
 {
  "t": "fig",
  "n": 1,
  "src": "01_timeline.svg",
  "alt": "One agent, working on both sides at once"
 },
 {
  "t": "cap",
  "text": "One agent, working on both sides at once."
 },
 {
  "t": "p",
  "text": "Along the way, someone in the group complained about a bug — without @-mentioning the agent. The agent reproduced it on its own, found the root cause, and submitted a pull request with the fix."
 },
 {
  "t": "p",
  "text": "Nobody called it at any point:"
 },
 {
  "t": "fig",
  "n": 2,
  "src": "fig02-unprompted-fix.svg",
  "alt": "Nobody called it, and it still got to work"
 },
 {
  "t": "cap",
  "text": "Nobody called it, and it still got to work."
 },
 {
  "t": "p",
  "text": "This is not an idealized demo scenario. It comes from that instance, which keeps running. The whole essay is really answering one question: what does this \"always on, handle events as they come\" form need to look like underneath?"
 },
 {
  "t": "h2",
  "id": "stuck-on-people",
  "text": "People hit the wall first"
 },
 {
  "t": "p",
  "text": "Single-task agents, with Coding Agents leading the way, have already shown that models can use tools to solve complex problems, and need less and less step-by-step human supervision."
 },
 {
  "t": "p",
  "text": "At the same time, models are getting better at multi-agent collaboration. Organizing and scheduling a batch of agents across sessions is starting to become feasible."
 },
 {
  "t": "p",
  "text": "The human role shifts with it: less hands-on involvement in low-level execution, more energy spent on decisions and acceptance."
 },
 {
  "t": "p",
  "text": "That is where personal assistants (Personal Agents) come from — plugged straight into everyday messages, calendars, email and work platforms, always watching the information flow, taking care of things along the way."
 },
 {
  "t": "p",
  "text": "\"Always on, handle events as they come\" — personal assistants are only one use of it. In commercial settings like software development, it is just as valuable."
 },
 {
  "t": "p",
  "text": "The problem: today's mainstream agent designs cannot carry multi-tasking and team collaboration at that scale."
 },
 {
  "t": "p",
  "text": "Agents mostly use a single Session as the basic unit. Sessions do not talk to each other. If you want to push several things at once, you have to switch between windows yourself and remember where each Session left off."
 },
 {
  "t": "p",
  "text": "DeepSeek observed that one person can usually keep up with only **3 to 5** active Sessions at a time."
 },
 {
  "t": "p",
  "text": "Once there are more Sessions, people can no longer keep up."
 },
 {
  "t": "p",
  "text": "When windows pile up to that number, attention breaks:"
 },
 {
  "t": "fig",
  "n": 3,
  "src": "fig03-session-overload.svg",
  "alt": "A single task is limited by the model; several at once are limited by people"
 },
 {
  "t": "cap",
  "text": "A single task is limited by the model; several at once are limited by people."
 },
 {
  "t": "p",
  "text": "So what if you hook an existing agent up to a CLI, MCP or external connectors so it can also receive outside messages?"
 },
 {
  "t": "p",
  "text": "You can. But there are problems."
 },
 {
  "t": "p",
  "text": "A single session is synchronous and blocking — until one thing finishes, the next cannot get in. The contexts of multiple tasks get tangled together. Once the local computer goes offline, the agent stops too. Maintaining it takes a lot of human effort."
 },
 {
  "t": "p",
  "text": "So the agent needs to be unbundled from \"one session a person opened by hand\" and turned into a continuously existing entity: it remembers context across sessions and pushes several complex things forward at once without them stepping on each other."
 },
 {
  "t": "p",
  "text": "This form of agent, together with the system architecture behind it, is what DeepSeek calls **Super-agent**."
 },
 {
  "t": "p",
  "text": "Take that internal instance running on DeepSeek Harness again: the same development task can be raised in the group chat and continued on GitHub. When the same thing is said somewhere else, it still picks up the thread."
 },
 {
  "t": "p",
  "text": "A plan agreed in the chat, changed in the PR — both ends lead back to the same avatar:"
 },
 {
  "t": "fig",
  "n": 4,
  "src": "fig04-plan-a-to-b.svg",
  "alt": "Say it somewhere else, and it still picks it up"
 },
 {
  "t": "cap",
  "text": "Say it somewhere else, and it still picks it up."
 },
 {
  "t": "p",
  "text": "The \"fixes a bug even though nobody @-ed it\" scene at the start also comes from this instance: it keeps watching feedback in the public group chat and, without anyone naming it, proactively locates the root cause and submits a fix."
 },
 {
  "t": "h2",
  "id": "four-traits",
  "text": "Four traits, five modules"
 },
 {
  "t": "p",
  "text": "DeepSeek gave Super-agent four basic traits:"
 },
 {
  "t": "p",
  "text": "**Continuous**: you talk to it in familiar places like the group chat and GitHub comments, and it always feels like there is only one agent. \"Does Session X's context have piece of information Y?\" is its problem, not yours. For example, if you first settle on plan A in the group and later switch to plan B in a pull request comment, it understands and adjusts."
 },
 {
  "t": "p",
  "text": "**Efficient**: it replies quickly and can finish several complex things in parallel, with high quality; it can take the next instruction before the previous command or task is done."
 },
 {
  "t": "p",
  "text": "**Proactive**: it watches what happens in the environment itself and pushes forward the things worth handling; when it is not needed, it stays quiet."
 },
 {
  "t": "p",
  "text": "**Durable**: always online, plugged directly into your real work environment, and able to recover by itself when something goes wrong over long runs."
 },
 {
  "t": "p",
  "text": "What the four words look like in concrete scenes:"
 },
 {
  "t": "fig",
  "n": 5,
  "src": "fig05-four-traits.svg",
  "alt": "Four words, not slogans"
 },
 {
  "t": "cap",
  "text": "Four words, not slogans."
 },
 {
  "t": "p",
  "text": "A single ReAct Loop (the model thinks one step, calls a tool once, looks at the result, then thinks the next step) cannot hold all four at once. Underneath there has to be a matching architecture."
 },
 {
  "t": "p",
  "text": "Similar design constraints lead to similar architectures. Whether it is a personal assistant or an agent for software development, as long as the goal is \"always on, responding concurrently to events in the environment,\" the foundation will most likely look much the same."
 },
 {
  "t": "p",
  "text": "And the problems met along the way are highly similar to ones traditional computer systems research has studied for decades. So many classic system design ideas still work here. You will keep seeing old faces: Fast Path, caching, locality, speculative execution, compute-storage separation."
 },
 {
  "t": "p",
  "text": "Real deployments will come in many variants, but DeepSeek believes the following five modules form the basic framework holding up those four traits:"
 },
 {
  "t": "ol",
  "items": [
   "**Two-layer architecture**: continuous and efficient at the same time",
   "**Event-driven**: proactive",
   "**Human-facing interaction**: continuous and efficient while going back and forth with people",
   "**Separating compute, state and environment**: always online across devices",
   "**Watchdog**: recovers by itself when something goes wrong"
  ]
 },
 {
  "t": "p",
  "text": "A group chat message, from arriving to getting a reply, passes through these five modules one after another."
 },
 {
  "t": "p",
  "text": "The message comes in and clears five gates in turn:"
 },
 {
  "t": "fig",
  "n": 6,
  "src": "fig06-five-modules.svg",
  "alt": "One message, five gates"
 },
 {
  "t": "cap",
  "text": "One message, five gates."
 },
 {
  "t": "h2",
  "id": "two-layer",
  "text": "Two-layer architecture"
 },
 {
  "t": "p",
  "text": "To keep interaction continuous across channels while running many tasks efficiently in parallel, the way sessions are organized underneath runs into one fundamental trade-off: **continuity** versus **throughput**."
 },
 {
  "t": "p",
  "text": "One extreme: give every event to the same Session. Context is as continuous as it gets, but a single ReAct Loop can only work serially, step by step. Speed has a ceiling, tasks finish slowly, throughput is low; the intermediate details of several tasks get mixed together and drag down the quality of the work."
 },
 {
  "t": "p",
  "text": "The other extreme: open a new Session for every event. Concurrent throughput is highest, but tasks are often not fully independent; without global context the results of different Sessions are disconnected; several Sessions each reply to the user on their own, and the interaction becomes a mess."
 },
 {
  "t": "p",
  "text": "Where each extreme gets stuck —"
 },
 {
  "t": "look",
  "text": "Take a look:"
 },
 {
  "t": "fig",
  "n": 7,
  "src": "fig07-two-extremes.svg",
  "alt": "Continuity or throughput — picking just one does not work"
 },
 {
  "t": "cap",
  "text": "Continuity or throughput — picking just one does not work."
 },
 {
  "t": "p",
  "text": "DeepSeek's answer is to split \"maintaining global continuity\" and \"highly concurrent execution\" into two layers:"
 },
 {
  "t": "ul",
  "items": [
   "On top is a resident **Router** layer that receives all human interaction and handles global coordination",
   "Below is the **Worker** layer; each Worker's context is isolated, and they execute concrete tasks concurrently"
  ]
 },
 {
  "t": "p",
  "text": "With two layers, people only talk to the Router, and the Workers do the work:"
 },
 {
  "t": "fig",
  "n": 8,
  "src": "02_router_worker.svg",
  "alt": "Chatting and working, split apart"
 },
 {
  "t": "cap",
  "text": "Chatting and working, split apart."
 },
 {
  "t": "p",
  "text": "Context management and concurrent execution are both taken over by the system underneath. On the user side you barely notice Sessions exist; you always face the same Super-agent."
 },
 {
  "t": "p",
  "text": "Seen this way, making users manage Sessions by hand is largely design inertia carried all the way up from the underlying LLM API. Sessions should be an internal implementation detail of the system."
 },
 {
  "t": "p",
  "text": "There is another layer to it: today's Session does two jobs — technically it manages context, and in the product it manages projects. Once the product form is decoupled from the underlying Session, project management can be designed separately from Sessions. \"What kind of interaction and task management to give users\" becomes an independent product question (it comes up again in the open questions at the end)."
 },
 {
  "t": "p",
  "text": "Also, \"two layers\" describes a logical division of labor. Each layer can have its own internal structure and be made of several Sessions."
 },
 {
  "t": "h3",
  "text": "1. The Router layer"
 },
 {
  "t": "p",
  "text": "The Router layer is resident and receives human interaction from every entry point. All cross-task information and decisions are gathered here. It is at once the global Sequence Point (where everything is put in order), the coordination point, and the memory."
 },
 {
  "t": "p",
  "text": "To keep this global node light and fast, the Router only handles interaction with people and task dispatch; all concrete work is handed off, and it can even go without a Bash tool."
 },
 {
  "t": "p",
  "text": "One central node dispatching to multiple execution nodes looks a lot like a common Agent Team at first glance. The difference is how fine-grained the central node's management is."
 },
 {
  "t": "p",
  "text": "Managing tasks, or managing every step:"
 },
 {
  "t": "fig",
  "n": 9,
  "src": "fig09-team-vs-router.svg",
  "alt": "Manage the task, not the steps"
 },
 {
  "t": "cap",
  "text": "Manage the task, not the steps."
 },
 {
  "t": "p",
  "text": "An Agent Team is mainly used to break down a single complex task and have different roles collaborate. Sub-steps are usually tightly coupled, so the Team Lead has to understand task details deeply, plan subtasks and coordinate members at high frequency, carrying a heavy reasoning load itself."
 },
 {
  "t": "p",
  "text": "The Router only deals with high-level relationships between tasks and with dispatch. How to break down the inside of a single task is left to the Worker."
 },
 {
  "t": "p",
  "text": "Conversely, if you use prompts to constrain an Agent Team's main session to only handle outside interaction and hand different tasks to members to push forward independently, that can also count as this two-layer architecture."
 },
 {
  "t": "p",
  "text": "DeepSeek's practical experience: the Router's job is often less complicated than you would think, and a relatively lightweight model often balances speed and quality well."
 },
 {
  "t": "p",
  "text": "The Router layer can also be made of several Sessions inside, and some of its logic can even be written in ordinary code. DeepSeek chose the most direct approach: a single resident LLM Session as the core of the Router."
 },
 {
  "t": "p",
  "text": "Can one session handle the messages of a whole team?"
 },
 {
  "t": "p",
  "text": "Better than it looks. The reason is batching: environment events (the Triggers discussed later) that arrive while the previous round of inference is running are held and processed together in the next round, and the extra cost of merging them is small."
 },
 {
  "t": "p",
  "text": "At peak times, several Triggers fold into one call:"
 },
 {
  "t": "fig",
  "n": 10,
  "src": "fig10-trigger-batching.svg",
  "alt": "The bigger the backlog, the cheaper each decision"
 },
 {
  "t": "cap",
  "text": "The bigger the backlog, the cheaper each decision."
 },
 {
  "t": "p",
  "text": "When the external event stream is steady, Triggers enter the Router one at a time, and single-response latency is very low."
 },
 {
  "t": "p",
  "text": "When events flood in densely and the Router starts to queue, the Triggers that piled up during the previous inference round are merged automatically and injected together on the next LLM call."
 },
 {
  "t": "p",
  "text": "Why is merging such a good deal? The Router only does lightweight interaction and dispatch; each step is usually long input, short output. When several backlogged Triggers are merged into one LLM API call, they are computed in parallel during the Prefill stage (the stage where the model reads its input), so the time of a single request grows far more slowly than the batch size."
 },
 {
  "t": "p",
  "text": "So within a certain range, the more that piles up, the shorter the inference time per decision actually gets. There are two limits: the context length, and how many Triggers the model can handle accurately in one round."
 },
 {
  "t": "p",
  "text": "Section 7 of the essay verifies this quantitatively with experiments, covered later. Together with two more mechanisms, subscription bypass and chain of recall (also later), one resident Router Session keeps context continuous and is already enough at their current team size."
 },
 {
  "t": "p",
  "text": "If the scale grows further and one session really cannot keep up, the Router layer can be built internally as multi-stage filtering, or horizontally split (Sharding) into several sessions."
 },
 {
  "t": "p",
  "text": "At that point the internal design of the Router layer comes back to the continuity-throughput trade-off: the finer the split, the higher the concurrent throughput, and the less continuous memory and context become between shards. Until global memory is solved, this trade-off will stay."
 },
 {
  "t": "h3",
  "text": "2. The Worker layer"
 },
 {
  "t": "p",
  "text": "The Worker layer is made of the sessions that actually do the work. Each Worker's context is isolated, carries the full set of execution tools, and focuses on one thing in its own context."
 },
 {
  "t": "p",
  "text": "Workers directly determine task results and code quality, so they usually get the most capable model."
 },
 {
  "t": "p",
  "text": "Workers only report status to the Router. Reasoning and tool calls stay inside; the Router replies to the user on everyone's behalf. This keeps concurrency and delivery quality, and avoids several sessions each saying their own thing."
 },
 {
  "t": "p",
  "text": "When several tasks run concurrently, each Worker pushes its own forward."
 },
 {
  "t": "p",
  "text": "Where they actually collide is usually a shared work environment like the same pull request. As long as they all subscribe to the corresponding Thread (a run of messages under the same topic or the same PR, covered in detail in section 3), they receive the same event notifications and get a chance to notice and resolve conflicts themselves; the few cases that need cross-task coordination are relayed through the Router."
 },
 {
  "t": "p",
  "text": "Like the Router, a single Worker can contain several sessions: for a complex single task, a Worker can open Subagents inside, or be an Agent Team itself. All of this is transparent to the Router above."
 },
 {
  "t": "p",
  "text": "This structure works well for coding: several unrelated bug reproductions, pull request reviews and new feature work advance at the same time, and nobody blocks anybody."
 },
 {
  "t": "p",
  "text": "It is the same for personal assistants. A personal assistant usually has only one chat page in the interface, but when you talk about several things at once in the same dialog, that one front-end chat page keeps the interaction continuous, while underneath each topic can get its own Worker to advance in parallel and draft replies."
 },
 {
  "t": "p",
  "text": "Handling several things at once in one dialog looks like this:"
 },
 {
  "t": "fig",
  "n": 11,
  "src": "fig11-one-chat-many-workers.svg",
  "alt": "One window on the surface, several lines underneath"
 },
 {
  "t": "cap",
  "text": "One window on the surface, several lines underneath."
 },
 {
  "t": "h2",
  "id": "event-driven",
  "text": "Event-driven"
 },
 {
  "t": "p",
  "text": "To make Super-agent proactive, you first have to change what drives it."
 },
 {
  "t": "p",
  "text": "The main input driving the agent changes from prompts a person types into a Session one by one to semi-structured events in the environment: group chat messages, email and calendar reminders, code review comments, CI results… In Super-agent these are all called **Triggers**."
 },
 {
  "t": "p",
  "text": "By listening for and responding to Triggers, the agent can move by itself based on what happens in the environment."
 },
 {
  "t": "p",
  "text": "The life of an event, from coming in to being handled, answers four questions in turn: how to filter noise, how to route it to a Worker, how much to put into the model's context, and whether it can act ahead of time."
 },
 {
  "t": "h3",
  "text": "1. Filtering"
 },
 {
  "t": "p",
  "text": "Once connected to real group chats and code platforms, the event stream has a clear character: high noise, few things that really need triggering; the vast majority of everyday messages do not need the agent."
 },
 {
  "t": "p",
  "text": "If every event had the large model judge it from scratch, neither latency nor compute cost would hold up."
 },
 {
  "t": "p",
  "text": "The idea borrowed here is Fast Path / Slow Path from computer systems: large-model inference is flexible but expensive — the Slow Path; hard-coding high-frequency judgments that are already clear and stable into deterministic code gives a fast, cheap Fast Path."
 },
 {
  "t": "p",
  "text": "So the first step for an event entering the system is filtering: before calling the large model, deterministic rules screen out the noise, and only candidate events that need semantic understanding are passed to the model. There are two stages:"
 },
 {
  "t": "ul",
  "items": [
   "**Program layer (Fast Path)**: admission checks done directly in code on definite conditions such as event source, group scope, and user or bot allowlists. For example, different sources can be set to \"only respond to explicit requests,\" \"treat as candidate events,\" or \"ignore,\" screening out most irrelevant messages before the model is ever called.",
   "**Semantic layer (Slow Path)**: candidate events that pass the program layer go to the LLM, which decides whether to act based on the policies and context written in the prompt. The semantic layer is also a natural-language extension point for people — to switch a policy on or off or add a new one, just edit the prompt."
  ]
 },
 {
  "t": "p",
  "text": "A message has to pass two sieves before anyone handles it:"
 },
 {
  "t": "fig",
  "n": 12,
  "src": "03_filter_paths.svg",
  "alt": "Code first, then the model"
 },
 {
  "t": "cap",
  "text": "Code first, then the model."
 },
 {
  "t": "h3",
  "text": "2. Routing"
 },
 {
  "t": "p",
  "text": "The Router layer is responsible for continuity across channels. But if, after a task is handed out, every follow-up event still has to pass through the Router, this global node still carries a heavy load and response latency goes up."
 },
 {
  "t": "p",
  "text": "So the Fast / Slow Path trick is used once more, on routing after filtering: the Router only handles cold starts of new tasks and cross-task coordination; follow-up events whose owner is already known are sent by the program straight to the corresponding Worker."
 },
 {
  "t": "p",
  "text": "First, meet the **Thread**. In real work, consecutive events under the same GitHub pull request, the same group chat topic, or the same email exchange form one event stream, called a Thread."
 },
 {
  "t": "p",
  "text": "Messages are grouped into strings by what they are about, and all later routing relies on that:"
 },
 {
  "t": "fig",
  "n": 13,
  "src": "fig13-threads.svg",
  "alt": "Events grouped into threads; routing follows the threads"
 },
 {
  "t": "cap",
  "text": "Events grouped into threads; routing follows the threads."
 },
 {
  "t": "p",
  "text": "After the Router opens a Worker based on the first event of a Thread, that Worker subscribes directly to the Thread. Event routing then splits into two paths:"
 },
 {
  "t": "ul",
  "items": [
   "**Subscribed (Fast Path)**: follow-up events in the same Thread are delivered by the program straight to the Worker subscribed to it. If a new event goes beyond the current task's scope, the Worker can unsubscribe or hand it back to the Router for re-dispatch.",
   "**Unsubscribed (Slow Path)**: the Router still sees all events and keeps the global state, but only judges and dispatches new events nobody has subscribed to yet."
  ]
 },
 {
  "t": "p",
  "text": "Once subscribed, follow-up messages skip the Router and go straight to the Worker:"
 },
 {
  "t": "fig",
  "n": 14,
  "src": "fig14-subscribe-bypass.svg",
  "alt": "Subscribe once, go direct"
 },
 {
  "t": "cap",
  "text": "Subscribe once, go direct."
 },
 {
  "t": "p",
  "text": "Also, subscriptions between Threads and Workers are many-to-many: one Worker can subscribe to several related Threads, and one Thread can be subscribed to by several Workers."
 },
 {
  "t": "p",
  "text": "When several Workers meet in the same work environment or the same discussion, new events in that Thread are delivered to all subscribers at once. Each of them can then see what the others did and resolve the conflict themselves."
 },
 {
  "t": "p",
  "text": "When two Workers end up changing the same PR, this is how the conflict gets discovered."
 },
 {
  "t": "p",
  "text": "Share one Thread, and collisions surface on their own:"
 },
 {
  "t": "fig",
  "n": 15,
  "src": "fig15-shared-thread.svg",
  "alt": "A shared Thread lets them spot the collision themselves"
 },
 {
  "t": "cap",
  "text": "A shared Thread lets them spot the collision themselves."
 },
 {
  "t": "p",
  "text": "The output side stays the same: Workers report key conclusions to the Router, which replies to the user and syncs global memory."
 },
 {
  "t": "h3",
  "text": "3. How much goes into context"
 },
 {
  "t": "p",
  "text": "Once an event is filtered and routed to its target Session, the next question is: how much information goes into the model's context window?"
 },
 {
  "t": "p",
  "text": "The system's input has changed from limited human prompts to a steady flow of semi-structured events produced by the environment. The design of tool calls and event injection becomes especially important."
 },
 {
  "t": "p",
  "text": "Put in too much, and it crowds the window and dilutes the model's attention; put in too little, and the model has to keep calling tools to read, adding execution steps. Wasting the context window means wasting the model's intelligence."
 },
 {
  "t": "p",
  "text": "DeepSeek's approach is to manage the limited context window as a Cache. Borrowing terms from compiler optimization and computer systems, context injection boils down to two basic operations:"
 },
 {
  "t": "ul",
  "items": [
   "**Inline**: put information likely to be needed soon directly into the current context window, saving a tool-call round trip.",
   "**Spill**: complete information that exceeds the window budget or is rarely used stays outside the window; only a reference or summary stays inside, and the model reads it itself when needed."
  ]
 },
 {
  "t": "p",
  "text": "Combined with the classic principle of Locality from systems design, event injection and tool calls can be optimized step by step:"
 },
 {
  "t": "ol",
  "items": [
   "Start with the least information: at first only give the current object's ID and a content summary.",
   "Inline related information gradually by locality: first attach the IDs of closely related objects, then content that is adjacent in time or position. For example, the first 50 characters of a piece of content, the few group chat messages before and after it plus the one it replies to, or neighboring comments in the review discussion a code comment belongs to.",
   "Spill beyond the limit: set a fairly small length limit for long content and put the excess outside the window. The simplest direct approach is to truncate while leaving a \"continue reading\" entry, so the model calls a tool to read the full text when it needs it."
  ]
 },
 {
  "t": "p",
  "text": "Near things go in the window, far things stay outside:"
 },
 {
  "t": "fig",
  "n": 16,
  "src": "fig16-inline-spill.svg",
  "alt": "The window as a cache: Inline what's near, Spill what's far"
 },
 {
  "t": "cap",
  "text": "The window as a cache: Inline what's near, Spill what's far."
 },
 {
  "t": "p",
  "text": "These rules also solve a long-standing headache for the Router."
 },
 {
  "t": "p",
  "text": "Once many follow-up events go straight to Workers and the system has run long enough to accumulate many past tasks, the Router cannot possibly keep the full history of every task in its own window; yet when a user suddenly brings up an old task in another channel, it has to recover the context."
 },
 {
  "t": "p",
  "text": "Applying Inline & Spill consistently to every kind of object in the system yields an on-demand, multi-hop retrieval that DeepSeek calls **Chain of Recall**."
 },
 {
  "t": "p",
  "text": "It works like this: the system gives Triggers, Threads, Worker Sessions and other objects unique IDs, and inlines the IDs of closely related objects on injection, so the objects form a reference graph underneath."
 },
 {
  "t": "p",
  "text": "Every object recalled by a tool call also follows Inline & Spill, so the result again inlines the summary and ID of the next hop. Starting from the event in front of it, the model can follow references hop by hop and fetch context on demand."
 },
 {
  "t": "p",
  "text": "A task from long ago gets recovered exactly this way."
 },
 {
  "t": "p",
  "text": "Follow the IDs back, one hop at a time:"
 },
 {
  "t": "fig",
  "n": 17,
  "src": "fig17-chain-of-recall.svg",
  "alt": "Forgot? No problem — follow the IDs"
 },
 {
  "t": "cap",
  "text": "Forgot? No problem — follow the IDs."
 },
 {
  "t": "p",
  "text": "For example, from the current message read the Thread it belongs to, from the IDs inlined in that Thread find the related Worker Session, and from that Worker find another code review Thread it is linked to. The Router \"forgetting earlier things\" over long runs is eased a lot by this chain."
 },
 {
  "t": "h3",
  "text": "4. Acting ahead of time"
 },
 {
  "t": "p",
  "text": "This one borrows Speculative Execution from computer systems: before it is certain whether the result will be used, the agent tries the work in the background based on signals in the environment."
 },
 {
  "t": "p",
  "text": "Spend a bit more background compute in exchange for people waiting less and stepping in less. If the result is valuable it is delivered; if not, it is thrown away."
 },
 {
  "t": "p",
  "text": "In a personal assistant, when a meeting invitation or a to-do arrives, the agent can check the calendar for conflicts in the background, gather relevant background and prepare a draft reply; you take a quick look and can send it once you confirm."
 },
 {
  "t": "p",
  "text": "The same goes for engineering collaboration. In the company's internal DeepSeek Harness user group, DeepSeek set up a \"silently reproduce and fix\" policy: when someone in the group reports a problem or is discussing a proposed change, the agent first tries to reproduce it and find a fix in the background; only when the problem is confirmed and a simple fix is found does it hand the result to users, otherwise it stays quiet throughout."
 },
 {
  "t": "p",
  "text": "The group is still talking, and the fix is already ready:"
 },
 {
  "t": "fig",
  "n": 18,
  "src": "fig18-speculative.svg",
  "alt": "Work on it first, deliver once confirmed"
 },
 {
  "t": "cap",
  "text": "Work on it first, deliver once confirmed."
 },
 {
  "t": "h2",
  "id": "talking-to-people",
  "text": "How to talk to people"
 },
 {
  "t": "p",
  "text": "The two-layer architecture guarantees continuity across channels at the context level. But in the actual experience of human-agent interaction, being continuous and efficient at the same time also requires solving one problem in the interaction mode and one in the interaction channels."
 },
 {
  "t": "h3",
  "text": "1. Full duplex"
 },
 {
  "t": "p",
  "text": "In a classic ReAct Loop, once the model makes a synchronous `run()` tool call, the loop is stuck until the tool finishes and returns its final result. During that time the session cannot take any new messages."
 },
 {
  "t": "p",
  "text": "To remove this blocking, the conversation has to change from question-and-answer half duplex to full duplex. After the change, you can keep talking while waiting for tools."
 },
 {
  "t": "p",
  "text": "Half duplex blocks the conversation; full duplex splits foreground from background:"
 },
 {
  "t": "fig",
  "n": 19,
  "src": "fig19-full-duplex.svg",
  "alt": "The background keeps running, the foreground can still reply"
 },
 {
  "t": "cap",
  "text": "The background keeps running, the foreground can still reply."
 },
 {
  "t": "p",
  "text": "Concretely, long-running commands and subtask tool calls are changed into asynchronous `start()` and `stop()`, forming an asynchronous ReAct Loop:"
 },
 {
  "t": "ul",
  "items": [
   "After the model calls `start()`, it immediately gets a \"Started\" return and the loop moves on.",
   "When the background tool finishes, the system delivers the final result into the session as a new event message.",
   "Based on context, the model can also call `stop()` to terminate a background command that has been running too long."
  ]
 },
 {
  "t": "p",
  "text": "Foreground conversation and background tasks are thus decoupled: while the agent runs long tasks in the background, it can still reply to people. New messages are handled as soon as the current reasoning step ends."
 },
 {
  "t": "p",
  "text": "This asynchronous task mechanism is already implemented in DeepSeek Harness, just not enabled by default yet."
 },
 {
  "t": "h3",
  "text": "2. Multiple channels"
 },
 {
  "t": "p",
  "text": "Different work channels have different information density and interaction habits, and the system's output has to match them."
 },
 {
  "t": "p",
  "text": "If you move an interaction style designed for a single-user terminal into a group chat as is, dumping long reasoning and dense tool calls into it, a multi-person group quickly drowns in information."
 },
 {
  "t": "p",
  "text": "The two-layer architecture already solves part of this: the long reasoning and dense tool calls of concrete tasks are kept inside Workers, and the Router speaks for everyone."
 },
 {
  "t": "p",
  "text": "On top of that, the system needs to plug into the various work environments users use every day, and use prompts to customize interaction norms for each channel:"
 },
 {
  "t": "ul",
  "items": [
   "**Instant messaging channels like group chats**: minimal interruption, lightweight communication. Like a human colleague, it only notifies you when it needs your decision or acceptance, only asks direct questions, and only gives short conclusions. DeepSeek validated a simple, effective hard rule: no more than **100 words** per reply.",
   "**Asynchronous channels like GitHub, email and documents**: structured, information-dense asynchronous delivery. For example, when creating or updating a pull request, write up the background, the change and the verification results according to project conventions; in personal assistant scenarios, draft structured emails and document summaries directly."
  ]
 },
 {
  "t": "p",
  "text": "How the same result is reported in the group versus in the PR:"
 },
 {
  "t": "fig",
  "n": 20,
  "src": "fig20-im-vs-pr.svg",
  "alt": "Short in IM, complete in asynchronous channels"
 },
 {
  "t": "cap",
  "text": "Short in IM, complete in asynchronous channels."
 },
 {
  "t": "h2",
  "id": "always-online",
  "text": "Always online"
 },
 {
  "t": "p",
  "text": "Today's local agents by default bind three things to the same device:"
 },
 {
  "t": "ol",
  "items": [
   "The compute that drives the Agent Loop",
   "The session state that needs to be persisted",
   "The execution environment: code repos, local toolchains"
  ]
 },
 {
  "t": "p",
  "text": "Once the device sleeps, all three stop together:"
 },
 {
  "t": "fig",
  "n": 21,
  "src": "fig21-laptop-sleeps.svg",
  "alt": "Bound to one machine: when it sleeps, everything stops"
 },
 {
  "t": "cap",
  "text": "Bound to one machine: when it sleeps, everything stops."
 },
 {
  "t": "p",
  "text": "Once the device sleeps or goes offline, the agent stops; it also cannot reach environments on other devices."
 },
 {
  "t": "p",
  "text": "To keep Super-agent always online while flexibly plugging into all kinds of real work environments, DeepSeek borrowed the idea of Compute-Storage Separation from computer systems and unbundled these three things in two steps."
 },
 {
  "t": "p",
  "text": "Step one: separate compute from state. The compute that drives the Agent Loop can be made stateless; what really needs to be persisted is the session state."
 },
 {
  "t": "p",
  "text": "So compute goes into stateless, elastic compute containers in the cloud, and persistent state such as Sessions is stored in a database. Containers can scale horizontally and be restarted or replaced at any time, while the continuity of sessions and tasks is backed by persistent storage. The agent escapes the lifecycle of any single local device and stays online in the cloud."
 },
 {
  "t": "p",
  "text": "If the machine running the agent breaks, swap in another and keep going."
 },
 {
  "t": "p",
  "text": "When a container dies, start another and pick the state back up from the database:"
 },
 {
  "t": "fig",
  "n": 22,
  "src": "fig22-stateless-compute.svg",
  "alt": "Compute is replaceable; state lives in the database"
 },
 {
  "t": "cap",
  "text": "Compute is replaceable; state lives in the database."
 },
 {
  "t": "p",
  "text": "Step two: separate compute from the execution environment."
 },
 {
  "t": "p",
  "text": "With the Agent Loop and session state both resident in the cloud, the next question is: how does it reach the execution environment a task needs?"
 },
 {
  "t": "p",
  "text": "Much of the context a model needs for its work has to be fetched through tool calls from execution environments such as code repos, local files and dependent services. In that sense, context in the broad sense includes the execution environment itself."
 },
 {
  "t": "p",
  "text": "There are two common approaches:"
 },
 {
  "t": "ul",
  "items": [
   "Spin up a sandbox in the cloud, pull the code, and try to rebuild and sync the environment. But real work environments often have uncommitted local changes, private credentials, intranet service dependencies, and specific hardware or toolchains; syncing such an environment is expensive and easy to get wrong.",
   "Have users give up their local environment and move their work to the cloud. For many people, the migration cost is too high."
  ]
 },
 {
  "t": "p",
  "text": "Since what is hard to copy and hard to sync is the environment itself, let the execution environment stay where it is."
 },
 {
  "t": "p",
  "text": "The Agent Loop runs in the cloud, and only a lightweight daemon is deployed on the device (all session state is in the cloud): it only executes commands and returns results. The execution environment stays outside the cloud, and the agent reads the context inside it on demand."
 },
 {
  "t": "p",
  "text": "The agent lives in the cloud and reaches the environment on your computer through a lightweight daemon:"
 },
 {
  "t": "fig",
  "n": 23,
  "src": "fig23-brain-hands.svg",
  "alt": "Brain in the cloud, hands on the device"
 },
 {
  "t": "cap",
  "text": "Brain in the cloud, hands on the device."
 },
 {
  "t": "p",
  "text": "This idea matches Anthropic's \"Decoupling the brain from the hands\": likewise keep the harness stateless, store session logs outside the harness, and connect to execution environments on demand through a unified interface."
 },
 {
  "t": "p",
  "text": "The difference is the scenario. Anthropic's piece is about a managed service and mainly discusses on-demand sandboxes and resources in customer VPCs; what DeepSeek needs to connect first here are the personal computers users use every day, which may be online one moment and offline the next, with uncommitted changes and local credentials on them."
 },
 {
  "t": "p",
  "text": "So this design supports BYOM (Bring Your Own Machine — connecting the dev machine or personal computer you use every day to the cloud agent), as well as cloud-hosted machines and on-demand compute environments."
 },
 {
  "t": "p",
  "text": "One agent can switch between different execution devices, picking an environment per task to run commands and fetch context."
 },
 {
  "t": "p",
  "text": "It can even take care of devices that come and go: when one of your personal computers comes back online, the cloud agent is triggered automatically and finishes the tasks that need to be done on that device."
 },
 {
  "t": "p",
  "text": "A computer that is sometimes offline gets its work as soon as it comes online:"
 },
 {
  "t": "fig",
  "n": 24,
  "src": "fig24-device-wakes.svg",
  "alt": "As soon as the device wakes, the work resumes"
 },
 {
  "t": "cap",
  "text": "As soon as the device wakes, the work resumes."
 },
 {
  "t": "h2",
  "id": "watchdog",
  "text": "When something breaks, who steps in"
 },
 {
  "t": "p",
  "text": "To stay always online, besides compute-storage separation the system also has to recover from anomalies by itself over long runs."
 },
 {
  "t": "p",
  "text": "A long-lived distributed system can hardly guarantee long-term reliability through logic inside the main system alone; it needs an independent external control loop (Control Loop) outside the main system."
 },
 {
  "t": "p",
  "text": "And for agent systems, many anomalies come from the model: the process is alive and well, yet the model has fallen into an unproductive loop or drifted from its goal, and liveness probes and monitoring scripts see nothing wrong. So a long-running agent system has to watch both whether the infrastructure is alive and whether the task itself is making progress."
 },
 {
  "t": "p",
  "text": "DeepSeek's approach is to set up an independent Watchdog Session outside the main system, driven by scheduled messages, forming an external Control Loop."
 },
 {
  "t": "p",
  "text": "What it has to catch are exactly the Workers that drift or spin in place:"
 },
 {
  "t": "fig",
  "n": 25,
  "src": "fig25-watchdog.svg",
  "alt": "A live machine is not enough; the task has to make real progress"
 },
 {
  "t": "cap",
  "text": "A live machine is not enough; the task has to make real progress."
 },
 {
  "t": "p",
  "text": "The Watchdog handles infrastructure failures such as API errors and failed state recovery on one hand, and on the other uses the model to judge whether each Worker is making real progress and whether its direction has drifted from the overall goal. When it finds an anomaly it steps in to fix it promptly; when it meets an occasional external failure, it keeps rechecking until things return to normal."
 },
 {
  "t": "p",
  "text": "The Watchdog is itself an Agent Session with a full set of tools, so maintainers can ask it in natural language what caused a failure, or have it change the main system's behavior online, such as adding or removing prompts or adjusting trigger rules."
 },
 {
  "t": "h2",
  "id": "experiments",
  "text": "Experiments: is it really faster?"
 },
 {
  "t": "p",
  "text": "To evaluate the core scheduling and routing design, DeepSeek ran two sets of preliminary experiments: one end to end, comparing the two-layer architecture, subscription bypass and single-Session approaches; and one testing Router-layer batching on its own."
 },
 {
  "t": "p",
  "text": "The experiments use synthetic load and a simplified environment, some settings could be more rigorous, and the results are only a preliminary reference."
 },
 {
  "t": "h3",
  "text": "1. Ablation"
 },
 {
  "t": "p",
  "text": "The experiment drives four end-to-end approaches at once with two message streams, group chat and GitHub CI. Each run has about **300** messages, of which about **20** are work requests; the rest are chit-chat, follow-ups, stop requests and CI messages."
 },
 {
  "t": "p",
  "text": "The coding work is replaced by a tool that only consumes time. So this experiment measures the system's scheduling and collaboration ability. Each approach is repeated **5** times."
 },
 {
  "t": "p",
  "text": "The four contenders:"
 },
 {
  "t": "ol",
  "items": [
   "Super-agent",
   "Super-agent without bypass",
   "Single Session + Subagent tool, neutral prompt: \"Use a subagent for a piece of work when appropriate...\"",
   "Single Session + Subagent tool, prompt favoring delegation: \"Every message of the chat reaches you, so work you run yourself keeps stopping for new messages. Prefer handing each piece of work to a subagent of its own, and do only small things yourself...\""
  ]
 },
 {
  "t": "p",
  "text": "Who finishes the 20 jobs first —"
 },
 {
  "t": "look",
  "text": "Take a look:"
 },
 {
  "t": "fig",
  "n": 26,
  "src": "fig26-ablation-times.svg",
  "alt": "P50 12.4 minutes; the two-layer setup is steadier"
 },
 {
  "t": "cap",
  "text": "P50 12.4 minutes; the two-layer setup is steadier."
 },
 {
  "t": "p",
  "text": "(The chart shows each setup's P50–P95 completion-time range from 5 runs; message intervals and work durations are scaled by 1/4, while model call latencies are real. Task completion time means from when a work request is sent until the result message comes back.)"
 },
 {
  "t": "table",
  "head": [
   "Approach",
   "Completion time P50 / P95 (minutes)",
   "Cache-read tokens per run (all Sessions)"
  ],
  "rows": [
   [
    "Super-agent",
    "12.4 / 15.7",
    "23.23M"
   ],
   [
    "Super-agent, no bypass",
    "12.6 / 15.5",
    "31.77M"
   ],
   [
    "Single Session + Subagent, neutral prompt",
    "20.4 / 29.5",
    "6.05M"
   ],
   [
    "Single Session + Subagent, delegation prompt",
    "13.8 / 29.0",
    "10.82M"
   ]
  ]
 },
 {
  "t": "p",
  "text": "Look at completion time first. Super-agent's P50 is **12.4** minutes and its P95 is **15.7** minutes, clearly better than the single Session with a Subagent tool."
 },
 {
  "t": "p",
  "text": "On the single-Session side, results are swayed heavily by the prompt, and the main session often decides to do the work itself:"
 },
 {
  "t": "ul",
  "items": [
   "With the neutral prompt, the model did not call a Subagent even once in 5 runs; all work was done in the main Session, which kept getting interrupted by new messages, and P95 reached **29.5** minutes.",
   "With the delegation prompt, it delegated in 4 of 5 runs and completion time got somewhat shorter, but overall it was still slower than Super-agent; in the remaining run it judged the work \"small\" and did it itself — that is the purple long-tail range in the chart."
  ]
 },
 {
  "t": "p",
  "text": "In a single Session, whether work gets divided depends on the prompt and the model's judgment in the moment; the two-layer architecture fixes the division of labor at the system level: the Router never touches concrete work, and Workers only receive the Threads they subscribe to."
 },
 {
  "t": "p",
  "text": "Now the cost. Super-agent maintains several independent sessions, so its cache-read tokens per run are higher than the single Session — it trades more tokens for shorter, steadier completion times."
 },
 {
  "t": "p",
  "text": "As for the bypass mechanism, removing it inside Super-agent leaves task completion time basically the same as the full version, but the Router has to make about **30%** more decisions, and total cache-read tokens rise from 23.23M to 31.77M, about **37%** more."
 },
 {
  "t": "p",
  "text": "How much the Router-side bill differs between the full version and the no-bypass version:"
 },
 {
  "t": "fig",
  "n": 27,
  "src": "fig27-bypass-cost.svg",
  "alt": "Bypass saves the Router-side bill"
 },
 {
  "t": "cap",
  "text": "Bypass saves the Router-side bill."
 },
 {
  "t": "p",
  "text": "Under this experimental load, what the bypass does is save the Router Session a considerable amount of tokens and inference overhead. Completion is not necessarily faster, but the bill and the noise get easier to live with."
 },
 {
  "t": "h3",
  "text": "2. Router batching"
 },
 {
  "t": "p",
  "text": "To verify the earlier claim that \"one resident Router can cope,\" DeepSeek stress-tested the Router layer on its own: the Router calls a real model, Workers use a mock model, and the arrival rate of Triggers needing a decision is raised from about **1** per minute all the way to about **40** per minute, measuring how many are in a batch on average, how long a single request takes, and how much inference time each decision costs."
 },
 {
  "t": "p",
  "text": "As the arrival rate goes up, how much time each decision costs:"
 },
 {
  "t": "fig",
  "n": 28,
  "src": "fig28-router-batching-numbers.svg",
  "alt": "Peaks are handled by merging, and effective throughput goes up"
 },
 {
  "t": "cap",
  "text": "Peaks are handled by merging, and effective throughput goes up."
 },
 {
  "t": "p",
  "text": "As the arrival rate rises from about 1 to about 40 per minute, the average batch grows from **1.0** to **2.8** Triggers, while the time of a single request only rises from **2.5** to **3.9** seconds — more slowly than the batch size. The inference time per decision falls from **6.4** seconds to **1.6** seconds."
 },
 {
  "t": "p",
  "text": "In other words, when external events suddenly bunch up, the Router can raise its effective throughput by automatically merging the backlog."
 },
 {
  "t": "p",
  "text": "This also explains something in the ablation: after removing the bypass, the Router's peak load got bigger, and a single Router could still cope. So at their current team size one Router is enough, and global context stays continuous."
 },
 {
  "t": "h2",
  "id": "open-questions",
  "text": "Problems not solved yet"
 },
 {
  "t": "p",
  "text": "That this system can run with fairly low complexity is largely thanks to a series of engineering and scenario simplifications made at this stage. Outside the range where those simplifications hold, four kinds of problems remain."
 },
 {
  "t": "h3",
  "text": "1. How the two-layer architecture scales"
 },
 {
  "t": "p",
  "text": "The combination so far — one resident Router Session, plus subscription bypass, plus Workers each doing their own thing — covers the vast majority of their current daily tasks at very small engineering cost."
 },
 {
  "t": "p",
  "text": "But when tasks grow larger and more tightly coupled, beyond what one Router Session can carry, there is no settled answer on how to build each layer internally: when the Router should be split horizontally and at what granularity, when Workers in the same layer need to talk directly and with what collaboration topology — all of this still needs testing in more scenarios."
 },
 {
  "t": "p",
  "text": "Here is the hard part of whether to split the Router:"
 },
 {
  "t": "fig",
  "n": 29,
  "src": "fig29-sharding-tradeoff.svg",
  "alt": "The finer the split, the more fragmented the memory"
 },
 {
  "t": "cap",
  "text": "The finer the split, the more fragmented the memory."
 },
 {
  "t": "p",
  "text": "System-model Co-design is also worth exploring: training models specifically for the Router's tasks — event discrimination, batch dispatch, context recall — might push the Router's throughput and decision quality up another notch."
 },
 {
  "t": "p",
  "text": "Then there is memory. A resident Router with reference-graph-based chain of recall mainly solves on-demand retrieval of recent tasks and session history. Once the running period stretches across months or longer, long-term memory becomes the main bottleneck to scaling."
 },
 {
  "t": "h3",
  "text": "2. Without Sessions, how do people work with the agent?"
 },
 {
  "t": "p",
  "text": "The two-layer architecture hides the underlying multi-session management, and Sessions retreat behind the scenes of product design. Once execution sessions underneath are separated from sessions in the interface, how to present tasks to users and offer natural interaction and project management becomes a new problem."
 },
 {
  "t": "p",
  "text": "DeepSeek's judgment is that chat-window-centered interaction is to some extent the result of path dependence. Interaction can happen more in domain-specific interfaces — for example, as with the instance in this essay, letting Super-agent work directly in GitHub Issues and Pull Requests."
 },
 {
  "t": "p",
  "text": "Sessions can also stay in the interface to respect user habits; it is just that one conversation you see does not necessarily map to only one Session underneath."
 },
 {
  "t": "p",
  "text": "Also, what was discussed so far is mainly interaction at the two ends: \"starting a task\" and \"accepting the result.\" But in this transition period of rapidly evolving model capability, many tasks still need people to participate midway: stepping in or taking over at any point during background execution, or collaborating with the agent in real time. How to serve, in one product, both the need to intervene step by step on key details and the efficiency of autonomous background progress is also worth exploring."
 },
 {
  "t": "p",
  "text": "The project management and interaction style users want depends closely on their field of work and personal style; the final form will very likely be highly customized. The DeepSeek Harness architecture is open, which makes such customization easier to support."
 },
 {
  "t": "h3",
  "text": "3. Context boundaries and A2A"
 },
 {
  "t": "p",
  "text": "Everything discussed so far is the internal design of a single Super-agent instance, assuming all information within its service scope flows into the same global context."
 },
 {
  "t": "p",
  "text": "But once usage expands from individuals and small teams to larger organizations, deciding how to deploy Super-agents is in effect drawing the boundaries of context sharing and isolation: scopes that need shared context share one instance, and scopes that need isolation each get their own."
 },
 {
  "t": "p",
  "text": "Between instances, collaboration works like this:"
 },
 {
  "t": "fig",
  "n": 30,
  "src": "fig30-a2a-boundaries.svg",
  "alt": "Share one where context is shared; give each its own where it is isolated"
 },
 {
  "t": "cap",
  "text": "Share one where context is shared; give each its own where it is isolated."
 },
 {
  "t": "p",
  "text": "One step further: once there are several mutually isolated instances inside and across organizations — say, each member's personal assistant and the team's shared Super-agent — their collaboration across boundaries is agent-to-agent communication (A2A, not referring to any specific protocol here)."
 },
 {
  "t": "p",
  "text": "With underlying contexts kept apart and each representing a different permission boundary, how to achieve safe and reliable A2A communication and collaboration still needs exploring."
 },
 {
  "t": "h3",
  "text": "4. Security and privacy"
 },
 {
  "t": "p",
  "text": "Event-driven design lets the agent be driven by a wider environment, and also exposes it to more untrusted input. If security and privacy are not handled well, Super-agent can only work in a small, highly trusted scope."
 },
 {
  "t": "p",
  "text": "For example, the earlier design of putting the Agent Loop in the cloud and installing lightweight daemons on each execution device assumes by default that cloud and device trust each other."
 },
 {
  "t": "p",
  "text": "But the cloud Agent Loop is constantly taking in external environment events, while the devices hold private code, sensitive data and local credentials. This cross-device connection brings clear security and privacy risks: once the cloud Agent Loop is compromised through a server intrusion or prompt injection, every connected device is at risk of being controlled."
 },
 {
  "t": "p",
  "text": "Once the cloud falls, where the risk spreads:"
 },
 {
  "t": "fig",
  "n": 31,
  "src": "fig31-cloud-compromised.svg",
  "alt": "Default trust will not hold up in broader settings"
 },
 {
  "t": "cap",
  "text": "Default trust will not hold up in broader settings."
 },
 {
  "t": "p",
  "text": "Even if the cloud is not compromised, as long as device credentials can enter the model's context, there is a risk of leakage during normal execution. So mechanisms are needed that let the agent use credentials without ever touching the credentials themselves."
 },
 {
  "t": "p",
  "text": "For this architecture to reach wider use, these security and privacy problems have to be solved while still being able to recall context from all kinds of environments."
 },
 {
  "t": "h2",
  "id": "finally",
  "text": "Finally"
 },
 {
  "t": "p",
  "text": "Looking back at the whole design, what DeepSeek did was apply classic engineering ideas from computer systems to building agent systems. Specific implementations will change as technology develops; the system design thinking behind them has more lasting reference value."
 },
 {
  "t": "p",
  "text": "Right now, the internal Super-agent instance they built on these ideas and DeepSeek Harness keeps running, taking part daily in reproducing and fixing issues, responding to code reviews, and even in iterating DeepSeek Harness itself."
 },
 {
  "t": "p",
  "text": "As large models need less and less human intervention for single tasks, the bottleneck to further productivity shifts to human attention. The two-layer architecture, event-driven design, asynchronous multi-channel interaction, compute-storage separation and an external Watchdog push tedious session management and context synchronization down into the system, letting people move one more step up from execution details to decisions and acceptance."
 },
 {
  "t": "p",
  "text": "At that point, the agent turns from a chat window waiting for instructions into a collaborator that is always online in the digital environment and moves things forward on its own: for individuals, an assistant that handles daily affairs across devices; for teams, something that grows inside the engineering workflow, taking on work and pushing it forward."
 },
 {
  "t": "p",
  "text": "Some of the designs in the essay are already implemented in a plugin called `dsh-superagent-prototype`. It is a prototype built to validate the technical approach."
 }
];
