// Generated from /workspace/manus-rebuild (article.md / article_en.md) by build_content.py. Edit the markdown, then regenerate.
export type Block =
  | { t: "p" | "cap" | "look" | "h3"; text: string }
  | { t: "h2"; id: string; text: string }
  | { t: "ul" | "ol"; items: string[] }
  | { t: "fig"; n: number; src: string; alt: string };

export const ORIGINAL_URL_ZH = "https://manus.im/zh-cn/blog/rebuilding-manus-with-manus";
export const ORIGINAL_URL_EN = "https://manus.im/blog/rebuilding-manus-with-manus";

export const FIGURE_FILES: string[] = [
  "fig01-slack-pasted.svg",
  "fig02-year-ago-vs-now.svg",
  "fig03-six-lessons.svg",
  "fig04-no-halfway.svg",
  "fig05-mono-entry.svg",
  "fig06-mono-steps.svg",
  "fig07-release-in-mono.svg",
  "fig08-bug-loop.svg",
  "fig09-trust-gaps.svg",
  "fig10-merge-gate.svg",
  "fig11-weekend-200.svg",
  "fig12-finish-line.svg",
  "fig13-bottleneck-moves.svg",
  "fig14-stt-pm.svg",
  "fig15-in-vs-on-loop.svg",
  "fig16-marketing-chain.svg",
  "fig17-front-desk.svg",
  "fig18-untagged-reply.svg",
  "fig19-self-improving-site.svg",
  "fig20-interrupt-less.svg",
  "fig21-todo-project.svg",
  "fig22-cost.svg",
  "fig23-fragmented.svg",
  "fig24-who-changed.svg",
  "fig25-next.svg",
  "fig26-people.svg"
];

export const zhBlocks: Block[] = [
 {
  "t": "p",
  "text": "Manus 联合创始人、首席产品官张涛发布了一篇长文：[《用 Manus 重建 Manus：什么变了，什么出了问题，以及我们现在如何工作》](https://manus.im/zh-cn/blog/rebuilding-manus-with-manus)。讲的不是某个新功能，而是一家做 Agent 的公司，自己默认跟 Agent 一起干活以后，工程、产品、市场三个团队各变成了什么样，又有哪些地方没跑通。"
 },
 {
  "t": "p",
  "text": "故事从九月下旬开始。那是 Manus 2.0 的最后冲刺，张涛在 Slack 上给一位工程师发了几条功能需求和缺陷报告。后来他去看进展：工程师屏幕上开着一排 Agent 会话，有的在 Manus 里，有的在 Codex 里。他点开其中一个。"
 },
 {
  "t": "p",
  "text": "提示词就是他发的那条 Slack 消息："
 },
 {
  "t": "fig",
  "n": 1,
  "src": "fig01-slack-pasted.svg",
  "alt": "Slack 里的一条需求被原样粘进一排 Agent 会话中的一个；红框标出「一字不差」"
 },
 {
  "t": "cap",
  "text": "需求原样进了 Agent。"
 },
 {
  "t": "p",
  "text": "一年前，工程师会先读消息、弄懂意思，再动手写代码。现在是 Agent 读请求、找到相关代码、提出修改方案。工程师做三件事：指挥任务、检查结果、对最终产物负责。"
 },
 {
  "t": "p",
  "text": "大多数时候，请求在跑，不在等他。在 Manus，一名工程师同时推进 **10 到 20 个**请求已是常态。"
 },
 {
  "t": "p",
  "text": "同一个人，一年前和现在手上的活："
 },
 {
  "t": "fig",
  "n": 2,
  "src": "fig02-year-ago-vs-now.svg",
  "alt": "左侧一年前：读→理解→写代码，一次一件；右侧现在：Agent 读请求、找代码、提方案，人只指挥、检查、负责；计数涨到 10–20"
 },
 {
  "t": "cap",
  "text": "请求在跑，不在等人。"
 },
 {
  "t": "p",
  "text": "张涛说他为团队适应得这么快感到自豪，也感到不安：这个节奏对吗？还有什么没注意到？"
 },
 {
  "t": "p",
  "text": "Manus 给自己定了两条规矩：用自己的产品干真实的活；一直去找 AI 失灵的地方。这篇长文就是按这两条写的，覆盖工程、产品、市场三个团队，也写了行不通的地方。张涛自己的定位是：一份还在进行中的实验报告，不是在给「AI 原生组织」下定义。"
 },
 {
  "t": "h2",
  "id": "lessons",
  "text": "先看结论"
 },
 {
  "t": "p",
  "text": "文章开头先摆了六条目前学到的东西："
 },
 {
  "t": "ul",
  "items": [
   "**没有折中之道**：把 AI 加到旧的工作方式上，有时只会多出噪音。闭环真正形成，事情才会变。",
   "**Agent 需要全局视野**：更好的上下文，比更好的提示词收益更大。",
   "**信任来自测试和上下文**，不只来自模型质量。",
   "**自主性需要终点线**：成功可被验证，Agent 才能独立跑；其他地方，人来定。",
   "**瓶颈会转移**：工程变快以后，决定做什么成了约束。",
   "**人的角色没被削弱**，而是更聚焦在高影响力的事情上。"
  ]
 },
 {
  "t": "p",
  "text": "六条放在一起，大概是这样一条线："
 },
 {
  "t": "fig",
  "n": 3,
  "src": "fig03-six-lessons.svg",
  "alt": "六张卡片依次出现：没有折中、全局视野、测试与上下文、终点线、瓶颈转移、人更聚焦；红线把它们串成一条闭环"
 },
 {
  "t": "cap",
  "text": "六条，都还在实验里。"
 },
 {
  "t": "p",
  "text": "后面每一节，基本对应其中一条。"
 },
 {
  "t": "h2",
  "id": "no-halfway",
  "text": "没有折中"
 },
 {
  "t": "p",
  "text": "2026 年之前，Manus 和大多数公司做的事一样：把 AI 加到已有的工作方式上。客服用 AI 摘要标记问题，工程师用编程助手，机器人在频道里发分析。"
 },
 {
  "t": "p",
  "text": "每一块单看都有用，但块和块之间没连起来。"
 },
 {
  "t": "p",
  "text": "在闭环形成之前，他们只是在用老办法干活，只不过多了很多 AI 在互相说话："
 },
 {
  "t": "fig",
  "n": 4,
  "src": "fig04-no-halfway.svg",
  "alt": "上半：客服摘要、编程助手、频道机器人三块各自冒气泡，彼此不连；下半：三块被红线连成环，气泡收敛成一条结果"
 },
 {
  "t": "cap",
  "text": "没接成环，只是多了 AI 在互相说话。"
 },
 {
  "t": "p",
  "text": "团队常回到一句话：软件工程是随时间累积的编程。写代码容易衡量；让一个复杂产品健康地跑上好几年，不容易衡量。AI 写的代码占比高，可能是真进展，也可能是在堆以后要有人清理的垃圾。"
 },
 {
  "t": "p",
  "text": "所以他们在意的考验更难：Manus 是一款上线超过一年的复杂产品，换了工作方式以后，它能不能持续改进而不崩，同时每个人都做得更多？"
 },
 {
  "t": "p",
  "text": "张涛给的答案是：到目前为止，能。"
 },
 {
  "t": "h2",
  "id": "whole-picture",
  "text": "把全局交给 Agent"
 },
 {
  "t": "p",
  "text": "和大多数科技公司一样，Manus 时间丢得最多的地方是交接。前端和后端工程师各自解读一个需求，就接口达成一致，再花好几天修不匹配的地方。两个人很少会以同样的方式理解同一个需求。"
 },
 {
  "t": "p",
  "text": "如果 AI 能跨技术栈写代码，能不能让一个人端到端负责一个需求？障碍是上下文：代码散在不同仓库里，没有哪个 Agent 能一次看到整个系统。"
 },
 {
  "t": "p",
  "text": "回答始于一次内部实验——想看看在尽量少的人工输入、几乎不手写代码的情况下，AI 能把一个产品做到什么程度。实验里形成的方法，后来长成了内部工具 **Manus-mono**，简称 **Mono**。"
 },
 {
  "t": "p",
  "text": "Mono 不合并代码仓库。它是一个统一入口，加一份写给 Agent 的手册：每个仓库做什么、怎么协作、团队怎么干活。Agent 按需去拉。另外还维护一个架构决策记录库，每个 Agent 会话一开始拿到的就不只是代码，还有过往决策背后的理由。"
 },
 {
  "t": "p",
  "text": "不管谁在跟 Agent 协作，这个 Agent 都带着之前所有人的上下文："
 },
 {
  "t": "fig",
  "n": 5,
  "src": "fig05-mono-entry.svg",
  "alt": "左：前端、后端各读一遍需求，中间接口对不上、标红「几天」；右：多个仓库外面套一个 Mono 入口，手册与决策记录库接入，Agent 按需拉取"
 },
 {
  "t": "cap",
  "text": "不合并仓库，给 Agent 一张全图。"
 },
 {
  "t": "p",
  "text": "Mono 是一步步长出来的，每一步都在解决上一步暴露出的瓶颈："
 },
 {
  "t": "ol",
  "items": [
   "**看清整个系统**：补上任何单个仓库都装不下的业务上下文，用 Git worktrees 并行干活。",
   "**本地验证**：以前推到测试环境要 **5 到 10 分钟**；现在整个 Manus 技术栈能在一台笔记本上跑，检查只要几秒。",
   "**调试生产环境问题**：在受限权限下，Mono 能读诊断生产 bug 需要的日志、配置和错误报告。",
   "**端到端执行发布**：以前容易卡住的发布环节交给 Mono，审批仍由人来做。",
   "**端到端测试**：验证成了瓶颈以后，Mono 开始用测试账户，在浏览器和移动端模拟器里跑真实用户流程。"
  ]
 },
 {
  "t": "p",
  "text": "五级台阶，一级一级往上："
 },
 {
  "t": "fig",
  "n": 6,
  "src": "fig06-mono-steps.svg",
  "alt": "五级台阶依次亮起：看清系统、本地验证（5–10 分钟→几秒）、调试生产、端到端发布、端到端测试；每级下方标出它解决的上一级瓶颈"
 },
 {
  "t": "cap",
  "text": "每一步，补上一步露出的短板。"
 },
 {
  "t": "p",
  "text": "（原文这里配了一段介绍 Mono 如何运作、如何演进的视频，由一位同事用 Manus 制作。）"
 },
 {
  "t": "p",
  "text": "常有人问 Mono 是不是代码 wiki。文档只是一部分；其余是代码周围的一切：怎么测、怎么发、决定了什么、为什么这样定，还有 Agent 能碰什么、不能碰什么。"
 },
 {
  "t": "p",
  "text": "Mono 也成了一个大家一起往里加东西、越用越好的共享知识库。有个例子：运维工程师烦透了总被叫去帮忙发布，就把发布流程写进了 Mono。现在任何人都能执行发布，Agent 也能，但审批仍归有发布权限的人。"
 },
 {
  "t": "p",
  "text": "一个人解决了自己的烦恼，整个公司快了一点："
 },
 {
  "t": "fig",
  "n": 7,
  "src": "fig07-release-in-mono.svg",
  "alt": "运维头上不断冒出「帮我发一下」气泡；他把流程写进 Mono 后，任何人和 Agent 都能点发布，审批锁仍在有权限的人手里；底部计数：移动端 7 人 · 4 款应用 · 2 个产品"
 },
 {
  "t": "cap",
  "text": "人人能发布，审批仍归有权限的人。"
 },
 {
  "t": "p",
  "text": "团队现在默认一个人就能在每个平台上交付一个需求。移动端团队一直是 **七个人**，在两个产品之间维护 **四款**应用，还跟网页端保持同步节奏。"
 },
 {
  "t": "p",
  "text": "Mono 在公司里扩散，没有自上而下的强推。张涛觉得这更多是文化：探索 AI 的边界本来就是他们存在的理由之一，组织又是扁平的。工具能走多远，取决于组织允许它走多远。"
 },
 {
  "t": "h2",
  "id": "closed-loop",
  "text": "闭环：从 bug 报告到验证过的修复"
 },
 {
  "t": "p",
  "text": "Mono 让任何人都能碰产品的任何部分，这是一半。另一半，是让 Agent 自己发现问题。"
 },
 {
  "t": "p",
  "text": "在大多数互联网公司，用户的 bug 报告要先过客服、产品、分流，才到得了能修它的工程师手上。"
 },
 {
  "t": "p",
  "text": "在 Manus，现在是一个内部 Agent 先调查报告，把问题追溯到引起它的那次改动，然后在 Slack 发帖，@ 负责这次改动的工程师。工程师判断是不是自己该修的，再交给自己的 Agent。另一个独立的 Agent 跑相关测试和流程，检查修复。"
 },
 {
  "t": "p",
  "text": "三个 Agent，三种角色：分流、执行、验证。中间的人做判断。"
 },
 {
  "t": "p",
  "text": "一条 bug 报告走完的路："
 },
 {
  "t": "fig",
  "n": 8,
  "src": "fig08-bug-loop.svg",
  "alt": "上方灰色旧路：客服→产品→分流→工程师；下方新路：分流 Agent 追溯改动并 @ 工程师→人判断→执行 Agent→验证 Agent→待审批发布；三处挂锁标出边界"
 },
 {
  "t": "cap",
  "text": "三个 Agent，中间是人。"
 },
 {
  "t": "p",
  "text": "越来越多的工程工作现在是这样开头的：Agent 把问题交到人手上。"
 },
 {
  "t": "p",
  "text": "这个闭环有明确的边界。读用户报告的 Agent 不能改代码，只能调查、反馈。改动来自工程师自己的 Agent，而且要工程师先拍板。任何东西在拥有发布权限的人审批之前，都不会上线。"
 },
 {
  "t": "h2",
  "id": "trust",
  "text": "怎么信 Agent 写的代码"
 },
 {
  "t": "p",
  "text": "很长一段时间里，合进主分支的每一次改动，都要两位高级工程师之一签字。团队对 AI 的信任还不够跳过这一步。Agent 写的代码越来越多，这个审查环节成了瓶颈。"
 },
 {
  "t": "p",
  "text": "单论写代码，模型已经相当强。他们发现差距落在两点："
 },
 {
  "t": "p",
  "text": "第一，人知道怎么测自己的活。第二，人参与了上下游的讨论，知道对业务来说什么才叫「对」。"
 },
 {
  "t": "p",
  "text": "正确的代码，不等于正确的产品："
 },
 {
  "t": "fig",
  "n": 9,
  "src": "fig09-trust-gaps.svg",
  "alt": "左：模型写的代码打勾；右侧两个缺口依次亮起——「会测」「懂上下游」；两条补法接上：Agent 进讨论串、Agent 跑端到端测试"
 },
 {
  "t": "cap",
  "text": "正确的代码 ≠ 正确的产品。"
 },
 {
  "t": "p",
  "text": "于是从两头补："
 },
 {
  "t": "ul",
  "items": [
   "**让 Agent 加入讨论**：每位工程师的 Agent 都驻在它被拉进去的 Slack 讨论串里，跟着上下文走。等有人最后说一句「开工」，Agent 已经知道团队定了什么、为什么。",
   "**让 Agent 做端到端测试**：和后端团队一起，让 Agent 每次改动后都能在 Manus 里跑真实流程和回归测试。测试覆盖率涨，信任跟着涨。"
  ]
 },
 {
  "t": "p",
  "text": "现在每一次改动都要过这道验证，再过一个跑着当前最强模型的代码审查机器人；支付这类敏感区域还有额外规则。"
 },
 {
  "t": "p",
  "text": "机器人替掉的是排队，不是人的决定："
 },
 {
  "t": "fig",
  "n": 10,
  "src": "fig10-merge-gate.svg",
  "alt": "上方：一串 PR 排队等两位高级工程师签字；下方：PR 依次过「端到端验证」「最强模型审查机器人」「支付额外规则」，停在「人明确批准」闸门前，批准后才进主分支"
 },
 {
  "t": "cap",
  "text": "机器人替掉排队，不替决定。"
 },
 {
  "t": "p",
  "text": "Agent 可以提 pull request，但没有人的明确批准，合不进主分支。做什么、谁能发布，仍由人定。"
 },
 {
  "t": "h2",
  "id": "finish-line",
  "text": "自主要有终点线"
 },
 {
  "t": "p",
  "text": "信任是有边界的。这一点，他们是吃了亏才明白的。"
 },
 {
  "t": "p",
  "text": "曾经有段时间，大家都对完全自主的 Agent 循环很兴奋，于是试了一次：一个 Agent 从内部反馈渠道收集反馈，每条反馈都启动一个项目。一位同事让它跑了一整个周末。"
 },
 {
  "t": "look",
  "text": "看一看："
 },
 {
  "t": "fig",
  "n": 11,
  "src": "fig11-weekend-200.svg",
  "alt": "周五晚到周一早的时间轴；反馈不断变成项目卡片，越堆越高；周一早上计数停在 200+，一个人面对整面墙"
 },
 {
  "t": "cap",
  "text": "周一早上，200 多个项目等他拍板。"
 },
 {
  "t": "p",
  "text": "为什么不让 Agent 把这些决定也做了？因为自主循环只有在系统能检查目标是否达成时才有效。测试过或不过；页面能加载或不能。大多数现实工作没有这种检查，要靠人判断：做完没有，值不值得做。"
 },
 {
  "t": "p",
  "text": "那个周末留下两条教训。第一，人做决定的速度，跟不上一个不受约束的循环产生决定的速度。第二，没人决定某件事该不该做，就没人为结果负责。"
 },
 {
  "t": "p",
  "text": "能不能放手，看有没有终点线："
 },
 {
  "t": "fig",
  "n": 12,
  "src": "fig12-finish-line.svg",
  "alt": "两条路分叉：左边「测试通过/失败」「页面能/不能加载」→ Agent 自己跑到终点旗；右边「做完了吗」「值得做吗」→ 停在人面前"
 },
 {
  "t": "cap",
  "text": "能验证的放手，不能验证的人来定。"
 },
 {
  "t": "p",
  "text": "前面那个 bug 修复闭环之所以能跑，是因为测试定义了成功。产品决策没有测试可依，所以 Manus 的每一次产品变更，仍然从一个人决定「值不值得做」开始。"
 },
 {
  "t": "h2",
  "id": "product-bottleneck",
  "text": "瓶颈挪到了产品"
 },
 {
  "t": "p",
  "text": "传统产品流程交接多，每交接一次，优先级就偏一点。编码 Agent 让工程师变快以后，冒出一个新问题：没有足够的产品经理来写好需求。"
 },
 {
  "t": "p",
  "text": "工程第一次不再是瓶颈。"
 },
 {
  "t": "p",
  "text": "Manus 先试了两条路。一是请几位工程师当「建造者」（builder），从探索到发布全权负责一个问题，但同时有技术判断和产品判断的人寥寥无几。二是让 PM 改代码，也停住了：交接还在，没有工程师的直觉，PM 能改文案和交互，改不了底层逻辑。"
 },
 {
  "t": "p",
  "text": "瓶颈怎么一路挪过去："
 },
 {
  "t": "fig",
  "n": 13,
  "src": "fig13-bottleneck-moves.svg",
  "alt": "一条流水线上红色「瓶颈」标记从「工程」移到「产品需求」；下方两次尝试依次划掉——「工程师当建造者：人太少」「PM 改代码：改不动底层」；最后 Mono 带着规则接上"
 },
 {
  "t": "cap",
  "text": "工程一快，卡点挪到「做什么」。"
 },
 {
  "t": "p",
  "text": "Mono 把这两个问题都解了，因为它自带规则："
 },
 {
  "t": "ul",
  "items": [
   "任何涉及模型调用或成本的改动，写代码之前要先拿到负责人签字。",
   "每一次改动都过和工程师改动一样的审查与测试。",
   "Mono 能用测试账户走完注册和支付流程，并把每一步记下来，PM 就能准确指出出问题的那一刻。"
  ]
 },
 {
  "t": "p",
  "text": "实际是什么样？一位负责语音转文字的 PM，让 Manus 对 **10 多个**模型做了基准测试，然后选定一个。她通过 Mono 拉下前端代码，在设计系统里做了 demo，让 Manus 把每个用户场景渲染成图片给她审。她把 demo 转成视频。方案清楚到她自己就把功能做了出来，包括 Web 和桌面端界面。"
 },
 {
  "t": "p",
  "text": "过程里有三个决定是人做的：她选了模型；产品和设计团队审了演示；一位有发布权限的工程师审了代码。"
 },
 {
  "t": "p",
  "text": "一位 PM 从选模型到上线："
 },
 {
  "t": "fig",
  "n": 14,
  "src": "fig14-stt-pm.svg",
  "alt": "横向流程：基准测试 10+ 模型→选定→Mono 拉前端→设计系统 demo→场景渲染成图→转视频→Web 与桌面端上线；三处人的决定用红点标出"
 },
 {
  "t": "cap",
  "text": "一年前，这一切不可能。"
 },
 {
  "t": "p",
  "text": "他们把这种转变叫作从「人在环中」（human in the loop）到「人在环上」（human on the loop）。以前 AI 完成任务的 **70–80%**，人补剩下的；现在人定规则，监督多个 Agent，在关键节点检查方法和结果，必要时介入，并对结果负责。"
 },
 {
  "t": "p",
  "text": "两种站位的差别："
 },
 {
  "t": "fig",
  "n": 15,
  "src": "fig15-in-vs-on-loop.svg",
  "alt": "左「人在环中」：进度条 AI 占 70–80%，人补尾巴；右「人在环上」：人站在环上方，下面同时转着多个 Agent 小环，人只在关键节点落点检查"
 },
 {
  "t": "cap",
  "text": "从补尾巴，到定规则、看节点。"
 },
 {
  "t": "p",
  "text": "有些 PM 现在交的不是书面规格或原型图，而是一段短视频。几分钟里讲清使用场景、每个界面、每次点击做什么、边缘情况怎么处理、底层怎么转。设计、工程和 QA 更快对「完成」的定义达成一致，PM 只用讲一次。（原文这里附了一段语音输入功能的产品需求视频。）"
 },
 {
  "t": "p",
  "text": "如今约 **一半** 的 PM 独立上线功能，**每位** PM 都提交过代码。设计师也开始动手了。一位 PM 写了 Manus 2.0 里 Manus Studio 界面的大部分代码，另一位写了视频编辑器。背后是有人花了好几个月，突破自己原来的岗位边界。张涛说这是最让他自豪的地方。"
 },
 {
  "t": "p",
  "text": "但这不等于每个人都得变成开发者。公司里谁都能构建产品，就可能有人上线本不该存在的东西。产品团队常问一句：「如果这件事只花一秒钟、零成本，你会上线吗？」有时答案是不会。"
 },
 {
  "t": "p",
  "text": "所以仍然需要模块负责人，决定做什么、不做什么、用户最终看到什么；也需要有人维护 Mono 这样的基础设施。构建变容易了，决定构建什么就更重要。"
 },
 {
  "t": "h2",
  "id": "marketing",
  "text": "市场部的 AI 队友"
 },
 {
  "t": "p",
  "text": "一次营销合作，要走脚本审查、定价、合同、审批、付款、上线、效果复盘。这些步骤散在邮件、合同工具、审批系统、电子表格和广告平台里。以前很大一部分时间花在这些系统之间搬信息，留给需要判断力的创意工作的时间很少。"
 },
 {
  "t": "p",
  "text": "他们从一个小问题下手：合作方内容或广告上线了，团队往往很晚才知道。于是让 AI 写了个脚本，检测内容什么时候发布。接着想要效果数据。然后是过往合作的复盘。再然后，整条内部工作流打通了：合同一签、审批一过，Agent 就更新状态，通知负责下一步的人。"
 },
 {
  "t": "p",
  "text": "从一个脚本，长成一整条线："
 },
 {
  "t": "fig",
  "n": 16,
  "src": "fig16-marketing-chain.svg",
  "alt": "七个环节横排：脚本审查→定价→合同→审批→付款→上线→复盘，下方散落邮件、合同工具、审批系统、表格、广告平台；红点从「上线检测脚本」开始，依次点亮效果数据、复盘，最后整条线连通"
 },
 {
  "t": "cap",
  "text": "从一个小问题长出来。"
 },
 {
  "t": "p",
  "text": "Manus 把这一切做成了一个内部站点。对人来说，它是仪表板和日历；对 Agent 来说，它是一组工具。在这条工作流里用这些工具干活的 Agent，就是他们说的 **AI 队友**。它只在团队给它接的渠道和系统里工作，权限只限这条工作流。"
 },
 {
  "t": "p",
  "text": "它管自己的队列。很多人同时给它发消息，它就在一个「前台」会话里跟所有人沟通，把任务分派到并行会话里。它先判断一条消息跟自己有没有关系，再决定是打断手上的活还是等一等。这些规则是它在开发过程中自己提出来的，团队审过以后留下了。"
 },
 {
  "t": "p",
  "text": "一个前台，背后几条并行的活："
 },
 {
  "t": "fig",
  "n": 17,
  "src": "fig17-front-desk.svg",
  "alt": "多人消息涌进「前台」会话；前台给每条打上「相关/无关」，再决定「打断」或「等待」，相关的分派到下方三条并行会话"
 },
 {
  "t": "cap",
  "text": "前台接话，后台并行。"
 },
 {
  "t": "p",
  "text": "它从转发的上下文里学。以前策略一调整，就要开会、写书面简报；现在营销负责人把讨论转给它，说一句「学习一下」。"
 },
 {
  "t": "p",
  "text": "它盯着长期目标。有一次，它也在的一个 Slack 线程里，队友们记不清某个项目进展到哪了。没人 @ 它，它回了一句："
 },
 {
  "t": "look",
  "text": "看一看："
 },
 {
  "t": "fig",
  "n": 18,
  "src": "fig18-untagged-reply.svg",
  "alt": "Slack 线程里几个人在问「这个项目到哪了？」；没有 @，AI 队友的气泡浮上来：「B 还在测试中。要不要等 A 的结果出来再看 B？」"
 },
 {
  "t": "cap",
  "text": "没人 @，它记得 A 和 B。"
 },
 {
  "t": "p",
  "text": "它还会找别的团队核实事实。3D 模型绑定上线以后，它去问产品团队支持哪些内容，得知绑定覆盖 **七个类别**，包括鱼类、蛇类和四足动物，市场的描述因此保持准确。"
 },
 {
  "t": "p",
  "text": "现在队友们会拉它参与脚本和定价审查，因为它读过过往的合作记录。最终决定仍由人做。"
 },
 {
  "t": "p",
  "text": "这个内部站点还能从使用者身上改进，包括 Agent 自己。Agent 遇到阻碍，就通过反馈接口提一个请求；请求经 Manus 2.0 的自动化（Automations）在 Manus 里建成一项开发任务；工程师审过改动再发布。"
 },
 {
  "t": "p",
  "text": "站点被它的用户一点点修："
 },
 {
  "t": "fig",
  "n": 19,
  "src": "fig19-self-improving-site.svg",
  "alt": "环形：AI 队友遇阻→反馈接口→Automations 建开发任务→工程师审查→发布→站点变好；角落标注「已运行约一周」"
 },
 {
  "t": "cap",
  "text": "用的人来修，但才跑了一周。"
 },
 {
  "t": "p",
  "text": "这个机制才运行了 **大约一周**。张涛说得很直接：还要攒更多案例，才能真正依赖它。"
 },
 {
  "t": "p",
  "text": "那团队里的人做什么？三件事仍归他们：做出并承担每一个重要决定；处理 Agent 没见过的情况，并教它怎么做、该找谁；当它的分析指向新角度时，给它调方向。"
 },
 {
  "t": "h2",
  "id": "interrupt-less",
  "text": "少打扰"
 },
 {
  "t": "p",
  "text": "在这几个团队里，很多问题不再需要去打扰某个人。文章给了三种做法。"
 },
 {
  "t": "p",
  "text": "**先问 Agent。** 一位同事在 Mono 上搭了个 Slack 机器人，跑在云端电脑上，在话题串里回复。用得最多的是非工程师：这个功能怎么工作的？这个字符串在哪？这个发了没有？不用先去找负责人。"
 },
 {
  "t": "p",
  "text": "**打开会话，而不是问进度。** 工程师的进展以前存在他们自己的 AI 聊天里，人一下线就看不到。于是团队做了一个内部功能，项目成员能看到彼此的会话并申请加入。工程师可能用 Agent 做完一个功能的大部分，PM 再进同一个会话调间距、样式和文案。在别人的会话里发帖要对方批准，权限机制还在完善。"
 },
 {
  "t": "p",
  "text": "**只决定需要决定的事。** 公司里用 AI 最多的人留着一个主会话，只干一件事：列出要他决定的事项，每项附一条建议。Slack 一忙起来，他不进去，只问：「我现在需要决定什么？」"
 },
 {
  "t": "p",
  "text": "三种少打扰的办法："
 },
 {
  "t": "fig",
  "n": 20,
  "src": "fig20-interrupt-less.svg",
  "alt": "三栏依次亮起：「先问 Agent」——话题串里机器人回答「这个发了没」；「打开会话」——工程师、PM、设计师头像进入同一会话，发帖需批准；「只决定要决定的」——主会话列出待决事项与建议"
 },
 {
  "t": "cap",
  "text": "不是少交流，是少打扰。"
 },
 {
  "t": "p",
  "text": "重点不是让大家彼此交流更少，而是彼此打扰更少。（原文配了一张工程师、PM 和设计师在同一会话里协作的示意图，并注明那不是真实的价格调整。）"
 },
 {
  "t": "p",
  "text": "张涛自己也这么干。他每天有 **20 多个**待办，而且——他也对外讲过——他有 ADHD。对他来说最难的是开始。"
 },
 {
  "t": "p",
  "text": "现在每个待办都进一个专属的 Manus Project，它把每一项变成单独的任务，能启动的就启动；拿不准的，回头问他背景，以及该归哪位 PM。然后它用他授权的 Slack、Gmail 和 Notion 访问权限收集上下文，交给 PM 一个完整的请求，而不是一句话。"
 },
 {
  "t": "p",
  "text": "一条待办，变成一份完整的请求："
 },
 {
  "t": "fig",
  "n": 21,
  "src": "fig21-todo-project.svg",
  "alt": "20+ 张待办便签落进一个 Manus Project；每张拆成任务，能启动的打勾，拿不准的冒出问号回问「背景？归哪位 PM？」；再从 Slack、Gmail、Notion 收集上下文，打包成完整请求交给 PM"
 },
 {
  "t": "cap",
  "text": "难的是开始，它先替他起步。"
 },
 {
  "t": "p",
  "text": "他说这种变化不只是效率：每天为「从哪下手」焦虑的时间少多了，这在个人层面意义很大。"
 },
 {
  "t": "h2",
  "id": "cost",
  "text": "这笔钱值不值"
 },
 {
  "t": "p",
  "text": "Manus 在 AI 上花得很多，也盯得很紧。花销数据不拿来评判任何人的表现，只拿来评判这笔钱本身：它现在有没有回报，或者是不是在为以后打基础。"
 },
 {
  "t": "p",
  "text": "他们的账是这么算的："
 },
 {
  "t": "ul",
  "items": [
   "**换来时间和注意力。** 团队变大，协作会吃掉每个人的注意力。AI 护住了每个人的注意力，让人更完整地掌控自己的工作。而他们还在招人。",
   "**用最好的模型，是摸清 AI 边界的办法。** 前面那套验证和代码审查，跑在能拿到的最强模型上。负责开发者生产力的同事说，这是最有性价比的一笔支出。",
   "**成本应该通过产品降下来。** 越来越多开发工作发生在自家产品 Manus Studio 里，使用数据能告诉他们 tokens 浪费在哪；修复进到产品里，也该让 Manus 对用户更省。他们预期随着模型变便宜、浪费被消掉，今天的成本会大幅下降。"
  ]
 },
 {
  "t": "p",
  "text": "三笔账，一条一条摆出来："
 },
 {
  "t": "fig",
  "n": 22,
  "src": "fig22-cost.svg",
  "alt": "三格账本依次出现：「时间和注意力」——注意力条被护住；「最强模型」——审查机器人，标「最具性价比」；「成本经产品下降」——曲线箭头向下，旁边小字「信念，不是承诺」"
 },
 {
  "t": "cap",
  "text": "钱换注意力，成本靠产品往下压。"
 },
 {
  "t": "p",
  "text": "最后那条，张涛特意加了一句：这是一个信念，不是承诺。"
 },
 {
  "t": "h2",
  "id": "not-working",
  "text": "还没做好的"
 },
 {
  "t": "p",
  "text": "**打扰少了，注意力更碎了。** 以前一天处理四五件事的人，现在可能同时推 **20 或 30 件**。每切一次，就要重新加载一次上下文。AI 扩大了人能做的事，也推着人做得更多。一位 PM 说，只要有一个任务在跑，她就忍不住再开一个 Agent。"
 },
 {
  "t": "p",
  "text": "做更多事不是目标。他们把这当成一个要解决的问题，而不是值得庆祝的节奏。"
 },
 {
  "t": "p",
  "text": "同一个人，从四五件到二三十件："
 },
 {
  "t": "fig",
  "n": 23,
  "src": "fig23-fragmented.svg",
  "alt": "左：一天 4–5 件，块大而完整；右：20–30 件同时在跑，块被切碎，每次切换闪一下「重载上下文」；角落一个任务在跑，旁边又冒出一个新 Agent"
 },
 {
  "t": "cap",
  "text": "做得更多，不是目标。"
 },
 {
  "t": "p",
  "text": "**信息更分散了。** 产品负责人以前知道每一项改动和背后的原因。现在他有时会截一张图去问 Mono：「这是谁改的？」听着好笑，问题是真的：人人都被赋权改产品的时候，谁对整体负责？"
 },
 {
  "t": "p",
  "text": "**共享权限要重新设计。** 工作能被分享、交接，Agent 又出现在越来越多的对话里，就得决定什么开放、什么要审批。"
 },
 {
  "t": "p",
  "text": "现在的解法还很初级：一个 Agent 监督其他 Agent，只汇报哪些卡住了、哪些需要人来决定。他们知道这还能做得更好。"
 },
 {
  "t": "p",
  "text": "谁改的、谁能看、谁来盯："
 },
 {
  "t": "fig",
  "n": 24,
  "src": "fig24-who-changed.svg",
  "alt": "产品负责人截图问 Mono「这是谁改的？」；周围很多人和 Agent 都连到同一产品；下方一个监督 Agent 扫过所有 Agent，只挑出「卡住」和「需人决策」两类上报"
 },
 {
  "t": "cap",
  "text": "人人能改，谁管整体？"
 },
 {
  "t": "h2",
  "id": "next",
  "text": "接下来做什么"
 },
 {
  "t": "p",
  "text": "这些问题指向的产品工作，别的团队大概也会需要。这些功能不是提前规划的，是从他们自己反复撞上的问题里来的："
 },
 {
  "t": "ul",
  "items": [
   "**把会话变成共享工作区**：一个人提出问题，设计师给方案，工程师构建，PM 让它跑起来，全在同一个地方。",
   "**跨设备、跨人员流转的工作**：本地机器和云端机器保持连接，人暂时走开，活还能接着跑。",
   "**能发现人没想到的方案的 Agent**：在公司系统里、带着合适权限运行的 Agent，应该能提出解法，而不只是执行指令。"
  ]
 },
 {
  "t": "p",
  "text": "三个方向："
 },
 {
  "t": "fig",
  "n": 25,
  "src": "fig25-next.svg",
  "alt": "三张卡依次亮起：共享会话（四个角色头像进同一框）；跨设备跨人流转（笔记本合上，云端继续，红点不断）；会提方案的 Agent（Agent 气泡里冒出「还有一种做法」）"
 },
 {
  "t": "cap",
  "text": "先在自己身上试，再带给用户。"
 },
 {
  "t": "h2",
  "id": "people",
  "text": "人现在做什么"
 },
 {
  "t": "p",
  "text": "回到开头那位开着一排 Agent 会话的工程师。张涛说，那不只是一个关于效率的故事，而是组织运作方式变了。"
 },
 {
  "t": "p",
  "text": "过去公司靠角色和层级传递信息，一个人能做什么，取决于他能调动多少人、多少资源。现在是花一点时间给 AI 上下文和工具，花更多时间做判断和决策。越来越多的时候，是 Agent 把问题带到人面前；决定怎么应对，仍然是人的事。"
 },
 {
  "t": "p",
  "text": "他们开过玩笑：Manus 能干这么多，还来办公室干嘛？让 Agent 自己搞定好了。但真正重要的问题，仍然要人来提出、争论、拍板。比如，什么才算好产品？或者稍微夸张一点：是做一个有真实收入、一直推着 AI 边界走的伟大产品，还是去追利润率？"
 },
 {
  "t": "p",
  "text": "AI 不知道他们想要哪个。他们知道。"
 },
 {
  "t": "p",
  "text": "文化和信任，来自日复一日、在关键时刻一起把事情想清楚。那是每个会话里所有工作的地基。"
 },
 {
  "t": "p",
  "text": "所以，就目前而言，他们的答案是：人的角色没有被削弱，而是更集中到能产生最大影响的地方："
 },
 {
  "t": "fig",
  "n": 26,
  "src": "fig26-people.svg",
  "alt": "中心一个人，四周四件事依次亮起：定义问题、判断质量、决定什么值得做、为结果负责；外圈一圈 Agent 小点在转"
 },
 {
  "t": "cap",
  "text": "四件事，还在人手里。"
 },
 {
  "t": "p",
  "text": "这也是 Manus 还在招人的原因：人的技能和判断力在这种工作方式的中心，短期内不会变。"
 },
 {
  "t": "p",
  "text": "张涛写到最后，说他很好奇一年后这篇文章会是什么样。每家公司的目标、结构和文化不同，可能没有标准答案，也没有最终形态。但对一家做 Agent 的公司来说，弄清楚人和 AI 怎么协作不是可选项，它就是工作的一部分。"
 },
 {
  "t": "p",
  "text": "原文最后有一条关于数据的说明：文中的数字来自内部记录，团队规模和 PM 交付数据截至 10 月下旬；部分内容是估算或个人经验，不是严格的度量。"
 }
];

export const enBlocks: Block[] = [
 {
  "t": "p",
  "text": "Tao Zhang, co-founder and Chief Product Officer of Manus, published a long essay: [“Rebuilding Manus with Manus: What changed, what broke, and how we work now”](https://manus.im/blog/rebuilding-manus-with-manus). It is not about a new feature. It is about what happened to the engineering, product and marketing teams at a company that builds agents once its own people started working alongside agents by default — and which parts have not worked."
 },
 {
  "t": "p",
  "text": "The story starts in late September, during the final push on Manus 2.0. Zhang sent one of the engineers a few feature requests and bug reports on Slack. Later he went to see how it was going: the engineer's screen had a row of open agent sessions, some in Manus and some in Codex. He clicked into one."
 },
 {
  "t": "p",
  "text": "The prompt was his Slack message:"
 },
 {
  "t": "fig",
  "n": 1,
  "src": "fig01-slack-pasted.svg",
  "alt": "A Slack request pasted as-is into one of a row of agent sessions; a red tag reads “word for word”"
 },
 {
  "t": "cap",
  "text": "The request went into the agent as-is."
 },
 {
  "t": "p",
  "text": "A year ago, the engineer would have read the message, worked out what it meant, then written the code. Now an agent reads the request, finds the relevant code and proposes a change. The engineer does three things: directs the work, checks it, and owns the result."
 },
 {
  "t": "p",
  "text": "Most of the time a request is running, not waiting on him. At Manus it is now common for one engineer to have **10 to 20** requests moving at once."
 },
 {
  "t": "p",
  "text": "The same person's work, a year ago and now:"
 },
 {
  "t": "fig",
  "n": 2,
  "src": "fig02-year-ago-vs-now.svg",
  "alt": "Left, a year ago: read → understand → write code, one thing at a time; right, now: the agent reads, finds code and proposes, the person directs, checks and owns; the counter rises to 10–20"
 },
 {
  "t": "cap",
  "text": "Requests run; they don't wait on people."
 },
 {
  "t": "p",
  "text": "Zhang says he is proud of how quickly the team adapted, and also uneasy: is this pace right? What haven't they noticed yet?"
 },
 {
  "t": "p",
  "text": "Manus holds itself to two rules: use its own product for real work, and keep looking for the places where AI stops working. The essay follows both. It covers engineering, product and marketing, including what hasn't worked. Zhang frames it as a report of an experiment in progress, not a definition of an “AI-native organization.”"
 },
 {
  "t": "h2",
  "id": "lessons",
  "text": "The conclusions first"
 },
 {
  "t": "p",
  "text": "The essay opens with six things learned so far:"
 },
 {
  "t": "ul",
  "items": [
   "**There's no halfway point**: adding AI to old ways of working sometimes just added noise. Things changed only when the loop closed.",
   "**Agents need the whole picture**: better context did more than better prompts.",
   "**Trust comes from tests and context**, not from model quality alone.",
   "**Autonomy needs a finish line**: agents can run on their own only when success can be checked; everywhere else, a person decides.",
   "**The bottleneck moves**: once engineering got faster, deciding what to build became the constraint.",
   "**The role of people hasn't diminished**; it has become more focused on higher-impact things."
  ]
 },
 {
  "t": "p",
  "text": "Put together, the six read roughly as one line:"
 },
 {
  "t": "fig",
  "n": 3,
  "src": "fig03-six-lessons.svg",
  "alt": "Six cards appear in turn: no halfway point, the whole picture, tests and context, a finish line, the bottleneck moves, people more focused"
 },
 {
  "t": "cap",
  "text": "Six points, all still in the experiment."
 },
 {
  "t": "p",
  "text": "Each section that follows maps more or less to one of them."
 },
 {
  "t": "h2",
  "id": "no-halfway",
  "text": "No halfway point"
 },
 {
  "t": "p",
  "text": "Before 2026, Manus did what most companies did: it added AI to the way it already worked. Support flagged issues with AI summaries, engineers used coding assistants, and bots posted analysis in channels."
 },
 {
  "t": "p",
  "text": "Each piece was useful on its own, but the pieces weren't connected."
 },
 {
  "t": "p",
  "text": "Until the loop closed, they were working the old way, just with a lot of AI talking over each other:"
 },
 {
  "t": "fig",
  "n": 4,
  "src": "fig04-no-halfway.svg",
  "alt": "Top: support summaries, coding assistants and channel bots each produce bubbles, unconnected; bottom: the three are joined into a red loop that closes"
 },
 {
  "t": "cap",
  "text": "Without a closed loop, it's just more AI talking over each other."
 },
 {
  "t": "p",
  "text": "The team often comes back to one line: software engineering is programming integrated over time. Writing code is easy to measure; keeping a complex product healthy for years is not. A high share of AI-written code can mean real progress, or a pile of slop someone will have to clean up later."
 },
 {
  "t": "p",
  "text": "So the test they care about is harder: Manus is a complex product that has been live for more than a year. Under new ways of working, can it keep improving without collapsing, while each person gets more done?"
 },
 {
  "t": "p",
  "text": "Zhang's answer: so far, yes."
 },
 {
  "t": "h2",
  "id": "whole-picture",
  "text": "Give the agent the whole picture"
 },
 {
  "t": "p",
  "text": "Like most tech companies, Manus lost the most time at handoffs. A frontend engineer and a backend engineer would each interpret a request, agree on an interface, then spend days fixing the mismatches. Two people rarely understand a requirement the same way."
 },
 {
  "t": "p",
  "text": "If AI can write code across the stack, could one person own a request end to end? The obstacle was context: the code lived in separate repositories, and no agent could see the whole system at once."
 },
 {
  "t": "p",
  "text": "The answer began with an internal experiment — how far could AI go in building a product with as little human input as possible and almost no hand-written code? The method that emerged became the internal tool **Manus-mono**, or **Mono**."
 },
 {
  "t": "p",
  "text": "Mono doesn't merge the repositories. It is a single entry point plus a manual written for the agent: what each repository does, how they fit together, how the team works. The agent pulls in what it needs. There is also a library of architecture decision records, so every agent session starts with the reasoning behind past decisions, not just the code."
 },
 {
  "t": "p",
  "text": "Whoever works with the agent, the agent carries the context of everyone who came before:"
 },
 {
  "t": "fig",
  "n": 5,
  "src": "fig05-mono-entry.svg",
  "alt": "Left: frontend and backend each read the request and the interface doesn't match, marked “days”; right: several repositories wrapped in one Mono entry point, with the manual and decision records attached and the agent pulling what it needs"
 },
 {
  "t": "cap",
  "text": "Don't merge the repos; give the agent the whole picture."
 },
 {
  "t": "p",
  "text": "Mono grew in steps, each fixing the bottleneck the previous step exposed:"
 },
 {
  "t": "ol",
  "items": [
   "**See the whole system**: add the business context no single repository contains, and use Git worktrees for parallel work.",
   "**Verify locally**: a push to the test environment used to take **5 to 10 minutes**; now the full Manus stack runs on a laptop and checks take seconds.",
   "**Debug production issues**: with scoped permissions, Mono can read the logs, configuration and error reports needed to diagnose production bugs.",
   "**Run releases end to end**: Mono handles the release steps where work used to stall; people still make the approval decisions.",
   "**Test end to end**: when verification became the slow part, Mono started running real user flows with test accounts, in a browser and a mobile simulator."
  ]
 },
 {
  "t": "p",
  "text": "Five steps, one at a time:"
 },
 {
  "t": "fig",
  "n": 6,
  "src": "fig06-mono-steps.svg",
  "alt": "Five steps light up in turn: see the system, verify locally (5–10 minutes → seconds), debug production, release end to end, test end to end"
 },
 {
  "t": "cap",
  "text": "Each step fixes what the last one exposed."
 },
 {
  "t": "p",
  "text": "(The original includes a video on how Mono works and how it evolved, made by a teammate with Manus.)"
 },
 {
  "t": "p",
  "text": "People often ask whether Mono is a code wiki. Documentation is one part; the rest is everything around the code: how they test, how they release, what they decided and why, and what the agent is and isn't allowed to touch."
 },
 {
  "t": "p",
  "text": "Mono has also become a shared knowledge base that gets better as people add to it. One example: the ops engineer got tired of being asked to help with releases, so he wrote the release process into Mono. Now anyone can run a release, and so can the agent, but approval still sits with people who have release rights."
 },
 {
  "t": "p",
  "text": "One person fixed his own frustration, and the whole company got a little faster:"
 },
 {
  "t": "fig",
  "n": 7,
  "src": "fig07-release-in-mono.svg",
  "alt": "“Can you ship this for me?” bubbles pile up over the ops engineer; once the process is in Mono, anyone and the agent can release, with the approval lock still held by people with release rights; bottom counters: mobile team of 7 · 4 apps · 2 products"
 },
 {
  "t": "cap",
  "text": "Anyone can release; approval stays with people who have release rights."
 },
 {
  "t": "p",
  "text": "The team now assumes one person can ship a request on every platform. The mobile team has been **seven people** throughout, maintaining **four** apps across two products and keeping pace with web."
 },
 {
  "t": "p",
  "text": "Mono spread through the company with no top-down mandate. Zhang credits culture as much as the tool: testing AI's limits is part of why they exist, and the organization is flat. A tool goes only as far as the organization lets it."
 },
 {
  "t": "h2",
  "id": "closed-loop",
  "text": "Closing the loop: from a bug report to a verified fix"
 },
 {
  "t": "p",
  "text": "Mono let anyone work on any part of the product. That was half of it. The other half was letting agents find problems on their own."
 },
 {
  "t": "p",
  "text": "At most internet companies, a user's bug report passes through support, product and triage before it reaches an engineer who can fix it."
 },
 {
  "t": "p",
  "text": "At Manus, an internal agent now investigates the report first, traces the issue back to the change that caused it, then posts in Slack and tags the engineer who owns that change. The engineer decides whether it's theirs to fix and hands it to their own agent. A separate agent checks the fix by running the relevant tests and flows."
 },
 {
  "t": "p",
  "text": "Three agents, three roles: triage, do the work, verify. The person in the middle makes the calls."
 },
 {
  "t": "p",
  "text": "The path one bug report takes:"
 },
 {
  "t": "fig",
  "n": 8,
  "src": "fig08-bug-loop.svg",
  "alt": "Gray old path on top: support → product → triage → engineer; new path below: the triage agent traces the change and tags the engineer → the person decides → the doing agent → the verifying agent → release pending approval; locks mark the limits"
 },
 {
  "t": "cap",
  "text": "Three agents, a person in the middle."
 },
 {
  "t": "p",
  "text": "A growing share of engineering work now starts this way: an agent bringing a problem to a person."
 },
 {
  "t": "p",
  "text": "The loop has clear limits. The agent that reads user reports can't change code; it can only investigate and report back. Changes come from the engineer's own agent, after the engineer decides. Nothing ships without approval from a person with release rights."
 },
 {
  "t": "h2",
  "id": "trust",
  "text": "Trusting agent-written code"
 },
 {
  "t": "p",
  "text": "For a long time, every change into the main branch needed sign-off from one of two senior engineers. The team didn't trust AI enough to skip that step. As agents produced more code, that review became the bottleneck."
 },
 {
  "t": "p",
  "text": "On pure coding ability, the models were already strong. The gap came down to two things:"
 },
 {
  "t": "p",
  "text": "First, people know how to test their work. Second, people have been part of the discussions upstream and downstream, so they know what “right” means for the business."
 },
 {
  "t": "p",
  "text": "Correct code isn't the same as the correct product:"
 },
 {
  "t": "fig",
  "n": 9,
  "src": "fig09-trust-gaps.svg",
  "alt": "Left: model-written code gets a check; two gaps light up — “knows how to test” and “knows upstream and downstream”; two fixes connect: agents join the discussion threads, agents run end-to-end tests"
 },
 {
  "t": "cap",
  "text": "Correct code ≠ the correct product."
 },
 {
  "t": "p",
  "text": "So they addressed both:"
 },
 {
  "t": "ul",
  "items": [
   "**Let agents join the discussion**: each engineer's agent now sits in the Slack threads it has been added to and follows the context. When someone finally says “Go,” the agent already knows what the team decided and why.",
   "**Let agents test end to end**: working with the backend team, they gave agents the ability to run real flows and regression tests in Manus after each change. As test coverage grew, trust grew with it."
  ]
 },
 {
  "t": "p",
  "text": "Today every change goes through that verification and through a code review bot running the strongest model available, with extra rules for sensitive areas such as payments."
 },
 {
  "t": "p",
  "text": "The bot replaced the queue, not the human decision:"
 },
 {
  "t": "fig",
  "n": 10,
  "src": "fig10-merge-gate.svg",
  "alt": "Top: a row of PRs queued for one of two senior engineers to sign off; bottom: a PR passes end-to-end verification, the strongest-model review bot and the extra rules for payments, then stops at the “explicit human approval” gate before main"
 },
 {
  "t": "cap",
  "text": "The bot replaces the queue, not the decision."
 },
 {
  "t": "p",
  "text": "An agent can open a pull request, but it can't merge into main without explicit approval from a person. People still decide what gets built and who can release."
 },
 {
  "t": "h2",
  "id": "finish-line",
  "text": "Autonomy needs a finish line"
 },
 {
  "t": "p",
  "text": "Trust has limits. They found this out the hard way."
 },
 {
  "t": "p",
  "text": "At one point everyone was excited about fully autonomous agent loops, so they tried one: an agent collected feedback from internal feedback channels and started a project for each item. A teammate let it run over a weekend."
 },
 {
  "t": "look",
  "text": "Take a look:"
 },
 {
  "t": "fig",
  "n": 11,
  "src": "fig11-weekend-200.svg",
  "alt": "A timeline from Friday night to Monday morning; feedback keeps turning into project cards that stack higher; on Monday morning the counter stops at 200+, one person facing the whole wall"
 },
 {
  "t": "cap",
  "text": "Monday morning: more than 200 items waiting for his decision."
 },
 {
  "t": "p",
  "text": "Why not let the agent make those decisions too? Because autonomous loops work only when the system can check whether the goal has been met. Tests pass or fail; a page loads or it doesn't. Most real work has no such check, and a person has to judge whether it's done, and whether it was worth doing."
 },
 {
  "t": "p",
  "text": "That weekend left two lessons. First, people can't make decisions as fast as an unchecked loop creates them. Second, if no one decides whether something should be done, no one owns the result."
 },
 {
  "t": "p",
  "text": "Whether you can let go depends on whether there's a finish line:"
 },
 {
  "t": "fig",
  "n": 12,
  "src": "fig12-finish-line.svg",
  "alt": "A fork: “tests pass/fail” and “page loads or not” → the agent runs to the finish flag; “is it done?” and “is it worth doing?” → stops at a person"
 },
 {
  "t": "cap",
  "text": "Let go where it can be checked; a person decides where it can't."
 },
 {
  "t": "p",
  "text": "The bug-fixing loop above works because tests define success. Product decisions don't have tests, so every product change at Manus still starts with a person deciding whether it's worth doing."
 },
 {
  "t": "h2",
  "id": "product-bottleneck",
  "text": "The bottleneck moved to product"
 },
 {
  "t": "p",
  "text": "A traditional product process has many handoffs, and priorities drift a little at each one. As coding agents made engineers faster, a new problem appeared: there weren't enough product managers to write good requirements."
 },
 {
  "t": "p",
  "text": "For the first time, engineering wasn't the constraint."
 },
 {
  "t": "p",
  "text": "Manus tried two things first. One was asking a few engineers to become “builders” who own a problem from discovery to launch, but few people had both technical and product judgment. The other was letting PMs change code, which also stalled: the handoffs were still there, and without an engineer's instincts, PMs could change copy and interactions but not the underlying logic."
 },
 {
  "t": "p",
  "text": "How the bottleneck moved:"
 },
 {
  "t": "fig",
  "n": 13,
  "src": "fig13-bottleneck-moves.svg",
  "alt": "On a pipeline, the red “bottleneck” marker moves from “engineering” to “product requirements”; two attempts get crossed out — “engineers as builders: too few people” and “PMs change code: can't reach the logic”; then Mono arrives carrying its rules"
 },
 {
  "t": "cap",
  "text": "Once engineering speeds up, the constraint moves to deciding what to build."
 },
 {
  "t": "p",
  "text": "Mono solved both problems because it carries the rules with it:"
 },
 {
  "t": "ul",
  "items": [
   "Any change that touches model calls or cost needs the owner's sign-off before code is written.",
   "Every change goes through the same review and testing as an engineer's change.",
   "Mono can walk through sign-up and payment with test accounts and record each step, so a PM can point to the exact moment something breaks."
  ]
 },
 {
  "t": "p",
  "text": "What does that look like? A PM working on speech-to-text had Manus benchmark **more than 10** models, then chose one. She pulled the frontend code through Mono, built a demo in the design system, and had Manus render each user scenario as an image for her to review. She turned the demo into a video. The plan was clear enough that she built the feature herself, including the web and desktop UI."
 },
 {
  "t": "p",
  "text": "People made three decisions along the way: she chose the model; product and design reviewed the demo; an engineer with release rights reviewed the code."
 },
 {
  "t": "p",
  "text": "One PM, from choosing a model to shipping:"
 },
 {
  "t": "fig",
  "n": 14,
  "src": "fig14-stt-pm.svg",
  "alt": "A flow: benchmark 10+ models → choose → pull frontend via Mono → design-system demo → scenarios rendered as images → video → product and design review → she builds it → code review; the three human decisions marked with red dots"
 },
 {
  "t": "cap",
  "text": "A year ago, none of this would have been possible."
 },
 {
  "t": "p",
  "text": "They describe the shift as moving from human in the loop to human on the loop. AI used to do **70–80%** of a task and people filled in the rest; now people set the rules, supervise several agents, check methods and results at key points, step in when needed, and own the outcome."
 },
 {
  "t": "p",
  "text": "The difference between the two positions:"
 },
 {
  "t": "fig",
  "n": 15,
  "src": "fig15-in-vs-on-loop.svg",
  "alt": "Left, “human in the loop”: a progress bar with AI at 70–80% and a person filling the tail; right, “human on the loop”: a person above several spinning agent loops, checking only at key points"
 },
 {
  "t": "cap",
  "text": "From filling in the tail to setting rules and checking key points."
 },
 {
  "t": "p",
  "text": "Some PMs now hand off a short video instead of a written spec or mockups. In a few minutes it shows the use case, each screen, what each click does, how edge cases behave, and how it works underneath. Design, engineering and QA agree on what “done” means faster, and the PM explains it once. (The original includes a product requirement video for voice input.)"
 },
 {
  "t": "p",
  "text": "Today about **half** of the PMs ship features on their own, and **every** PM has committed code. Designers have started too. One PM wrote most of the Manus Studio interface in Manus 2.0; another wrote the Video Editor. Behind each is someone who spent months pushing past what their role used to cover. Zhang says that's what he's proudest of."
 },
 {
  "t": "p",
  "text": "That doesn't mean everyone has to be a builder. When anyone in a company can build, people may ship things that shouldn't exist. The product team often asks: “If this took one second and cost nothing, would you ship it?” Sometimes the answer is no."
 },
 {
  "t": "p",
  "text": "So they still need module owners who decide what gets built, what doesn't, and what users finally see, and people who maintain infrastructure like Mono. When building gets easy, deciding what to build matters more."
 },
 {
  "t": "h2",
  "id": "marketing",
  "text": "An AI teammate in marketing"
 },
 {
  "t": "p",
  "text": "A marketing partnership moves through script review, pricing, contracts, approvals, payment, launch and results review. Those steps live in email, contract tools, approval systems, spreadsheets and ad platforms. Much of the job used to be moving information between them, leaving little time for creative work that needs judgment."
 },
 {
  "t": "p",
  "text": "They started with one small problem: when partner content or an ad went live, the team often heard about it late. So they had AI write a script that detects when content is published. Then they wanted performance data. Then a review of past partnerships. Then the whole internal workflow connected: when a contract is signed or an approval clears, the agent updates the status and notifies whoever owns the next step."
 },
 {
  "t": "p",
  "text": "From one script to a whole line:"
 },
 {
  "t": "fig",
  "n": 16,
  "src": "fig16-marketing-chain.svg",
  "alt": "Seven steps in a row: script review → pricing → contract → approval → payment → launch → review, with email, contract tools, approval systems, spreadsheets and ad platforms scattered below; starting from a launch-detection script, performance data and reviews light up, then the whole line connects"
 },
 {
  "t": "cap",
  "text": "It grew from one small problem."
 },
 {
  "t": "p",
  "text": "Manus built all of this into an internal site. For people, it's dashboards and a calendar; for the agent, it's a set of tools. The agent that uses those tools inside this workflow is what they call an **AI teammate**. It works only in the channels and systems the team has connected it to, with access scoped to this workflow."
 },
 {
  "t": "p",
  "text": "It manages its own queue. Many people message it at once, so it talks to everyone in one “front desk” session and hands tasks to parallel sessions. It decides whether a message is relevant to it, then whether to interrupt current work or wait. It proposed these rules itself during development, and the team reviewed them before keeping them."
 },
 {
  "t": "p",
  "text": "One front desk, several parallel jobs behind it:"
 },
 {
  "t": "fig",
  "n": 17,
  "src": "fig17-front-desk.svg",
  "alt": "Messages from many people flow into the “front desk” session; it tags each as relevant or not, decides to interrupt or wait, and hands relevant ones to three parallel sessions"
 },
 {
  "t": "cap",
  "text": "The front desk talks; the sessions behind it work in parallel."
 },
 {
  "t": "p",
  "text": "It learns from forwarded context. A strategy change used to mean a meeting and a written brief; now the marketing lead forwards the discussion and says, “Learn this.”"
 },
 {
  "t": "p",
  "text": "It keeps long-running goals in view. Once, in a Slack thread it had been added to, teammates couldn't recall where a project stood. Without being tagged, it replied:"
 },
 {
  "t": "look",
  "text": "Take a look:"
 },
 {
  "t": "fig",
  "n": 18,
  "src": "fig18-untagged-reply.svg",
  "alt": "In a Slack thread, people ask where a project stands; with no tag, the AI teammate's bubble appears: “B is still in testing. Should we wait for A's results before looking at B?”"
 },
 {
  "t": "cap",
  "text": "Nobody tagged it; it remembered A and B."
 },
 {
  "t": "p",
  "text": "It also checks facts with other teams. After 3D model rigging launched, it asked the product team what was supported and learned that rigging covers **seven categories**, including fish, snakes and quadrupeds, so marketing's descriptions stayed accurate."
 },
 {
  "t": "p",
  "text": "Teammates now bring it into script and pricing reviews, because it has read the past partnership records. People still make the call."
 },
 {
  "t": "p",
  "text": "The internal site can also improve from its own users, including the agent. When the agent hits friction, it files a request through a feedback endpoint; the request opens a development task in Manus through Automations in Manus 2.0; an engineer reviews the change before it ships."
 },
 {
  "t": "p",
  "text": "The site gets fixed by its users:"
 },
 {
  "t": "fig",
  "n": 19,
  "src": "fig19-self-improving-site.svg",
  "alt": "A loop: the AI teammate hits friction → feedback endpoint → Automations opens a dev task → engineer review → ship → the site improves; a corner tag reads “running for about a week”"
 },
 {
  "t": "cap",
  "text": "Fixed by its users — but only a week in."
 },
 {
  "t": "p",
  "text": "This mechanism has run for **about a week**. Zhang is blunt: they need many more cases before they rely on it."
 },
 {
  "t": "p",
  "text": "So what do the people on the team do? Three things stay with them: they make and own every important decision; they handle cases the agent hasn't seen and teach it what to do or whom to ask; and they redirect it whenever its analysis points to a new angle."
 },
 {
  "t": "h2",
  "id": "interrupt-less",
  "text": "Interrupt each other less"
 },
 {
  "t": "p",
  "text": "Across these teams, many questions no longer require interrupting someone. The essay describes three habits."
 },
 {
  "t": "p",
  "text": "**Ask the agent first.** A teammate built a Slack bot on Mono that runs on a cloud computer and replies in the thread. Non-engineers use it most: How does this feature work? Where is this string? Has this shipped? They no longer need to find the owner first."
 },
 {
  "t": "p",
  "text": "**Open the session instead of asking for a status update.** An engineer's progress used to live in their own AI chats, invisible once they logged off. So the team built an internal feature that lets project members see each other's sessions and ask to join. An engineer might build most of a feature with the agent, then a PM joins the same session to adjust spacing, styles and copy. Posting in someone else's session requires their approval, and the permissions are still being worked out."
 },
 {
  "t": "p",
  "text": "**Decide only what needs deciding.** The company's heaviest AI user keeps one main session with a single job: list what needs his decision, with a recommendation for each. When Slack gets busy, he stays out of it and asks, “What do I need to decide right now?”"
 },
 {
  "t": "p",
  "text": "Three ways to interrupt less:"
 },
 {
  "t": "fig",
  "n": 20,
  "src": "fig20-interrupt-less.svg",
  "alt": "Three columns light up: “ask the agent first” — a bot answers in the thread; “open the session” — engineer, PM and designer join one session, posting needs approval; “decide only what needs deciding” — a main session lists pending decisions with recommendations"
 },
 {
  "t": "cap",
  "text": "Not talking less — interrupting less."
 },
 {
  "t": "p",
  "text": "The point isn't to talk to each other less; it's to interrupt each other less. (The original shows an illustration of an engineer, a PM and a designer working in one session, noting it isn't a real pricing change.)"
 },
 {
  "t": "p",
  "text": "Zhang does something similar. He has **more than 20** to-dos a day, and — as he has shared publicly — he has ADHD. Starting is the hardest part for him."
 },
 {
  "t": "p",
  "text": "Now every to-do goes into a dedicated Manus project that turns each one into its own task and starts what it can. When it's unsure, it asks him for background and which PM should own it. Then, using the access he has given it to his Slack, Gmail and Notion, it gathers the context and hands the PM a complete request instead of a one-line note."
 },
 {
  "t": "p",
  "text": "One to-do becomes a complete request:"
 },
 {
  "t": "fig",
  "n": 21,
  "src": "fig21-todo-project.svg",
  "alt": "20+ sticky notes drop into a Manus project; each becomes a task, the ones it can start get a check, unsure ones ask back “background? which PM?”; context is gathered from Slack, Gmail and Notion and packaged into a complete request for a PM"
 },
 {
  "t": "cap",
  "text": "Starting is the hard part, so it starts for him."
 },
 {
  "t": "p",
  "text": "He says the change isn't only about efficiency: he spends much less of his day anxious about where to begin, which is huge on a personal level."
 },
 {
  "t": "h2",
  "id": "cost",
  "text": "Is it worth the cost?"
 },
 {
  "t": "p",
  "text": "Manus spends a lot on AI and tracks that spend closely. The data isn't used to judge anyone's performance; it's used to judge the spend itself: is it paying off now, or setting them up for later?"
 },
 {
  "t": "p",
  "text": "Here's how they reckon it:"
 },
 {
  "t": "ul",
  "items": [
   "**It buys time and attention.** As a team grows, coordination eats into everyone's attention. AI protects each person's attention and gives them fuller ownership of their work. And they're still hiring.",
   "**Using the best models is how they learn where AI's limits are.** The verification and code review setup above runs on the strongest models they can get. The colleague who leads developer productivity calls it their best-value spend.",
   "**The cost should fall through the product.** More development now happens in Manus Studio, their own product, so usage data shows where tokens are wasted; the fixes go into the product and should make Manus more efficient for users too. They expect today's costs to fall substantially as models get cheaper and waste is removed."
  ]
 },
 {
  "t": "p",
  "text": "Three entries in the ledger:"
 },
 {
  "t": "fig",
  "n": 22,
  "src": "fig22-cost.svg",
  "alt": "Three ledger columns appear: “time and attention” — the attention bar is protected; “the strongest models” — the review bot, “best-value spend”; “cost falls through the product” — a downward curve, with “a belief, not a promise”"
 },
 {
  "t": "cap",
  "text": "Money buys attention; the product pushes the cost down."
 },
 {
  "t": "p",
  "text": "On that last point Zhang adds: it's a belief, not a promise."
 },
 {
  "t": "h2",
  "id": "not-working",
  "text": "What isn't working yet"
 },
 {
  "t": "p",
  "text": "**Fewer interruptions, more fragmented attention.** Someone who used to handle four or five things a day may now push **20 or 30** forward at once. Every switch means reloading context. AI expands what people can do, and it also pushes them to do more. One PM said that whenever a task is running, she can't resist starting another agent."
 },
 {
  "t": "p",
  "text": "Doing more things isn't the goal. They treat this as a problem to solve, not a pace to celebrate."
 },
 {
  "t": "p",
  "text": "The same person, from four or five things to twenty or thirty:"
 },
 {
  "t": "fig",
  "n": 23,
  "src": "fig23-fragmented.svg",
  "alt": "Left: 4–5 things a day, large whole blocks; right: 20–30 running at once, chopped into small blocks, each switch flashing “reload context”"
 },
 {
  "t": "cap",
  "text": "Doing more isn't the goal."
 },
 {
  "t": "p",
  "text": "**Information is more scattered.** The head of product used to know every change and why it was made. Now he sometimes screenshots a problem and asks Mono, “Who changed this?” It's funny, but the question is real: when everyone is empowered to change the product, who is responsible for the whole?"
 },
 {
  "t": "p",
  "text": "**Sharing permissions need a redesign.** When work can be shared and handed over, and agents sit in more conversations, they have to decide what's open and what needs approval."
 },
 {
  "t": "p",
  "text": "The current fix is basic: one agent supervises the others and reports only what's stuck and what needs a human decision. They know it can be better."
 },
 {
  "t": "p",
  "text": "Who changed it, who can see it, who's watching:"
 },
 {
  "t": "fig",
  "n": 24,
  "src": "fig24-who-changed.svg",
  "alt": "The head of product screenshots a problem and asks Mono “Who changed this?”; many people and agents connect to the same product; below, a supervising agent scans every agent and reports only “stuck” and “needs a human decision”"
 },
 {
  "t": "cap",
  "text": "Everyone can change it — who owns the whole?"
 },
 {
  "t": "h2",
  "id": "next",
  "text": "What's next"
 },
 {
  "t": "p",
  "text": "These problems point to product work other teams will probably need too. The features weren't planned in advance; they came from problems the team kept running into:"
 },
 {
  "t": "ul",
  "items": [
   "**Sessions as shared workspaces**: one person raises a problem, a designer proposes a fix, an engineer builds it, and a PM runs it, all in the same place.",
   "**Work that moves across devices and people**: local and cloud machines stay connected, so work continues when people step away.",
   "**Agents that find options people hadn't considered**: an agent working inside a company's systems, with the right permissions, should be able to suggest solutions, not just carry out instructions."
  ]
 },
 {
  "t": "p",
  "text": "Three directions:"
 },
 {
  "t": "fig",
  "n": 25,
  "src": "fig25-next.svg",
  "alt": "Three cards light up: shared sessions (four roles in one frame); work across devices and people (the laptop closes, the cloud carries on); an agent that proposes (“there's another way…”)"
 },
 {
  "t": "cap",
  "text": "Try it on themselves first, then bring it to users."
 },
 {
  "t": "h2",
  "id": "people",
  "text": "What people do now"
 },
 {
  "t": "p",
  "text": "Back to the engineer with a row of agent sessions open. Zhang says that isn't just a story about efficiency; it's a change in how the organization runs."
 },
 {
  "t": "p",
  "text": "Companies used to move information through roles and hierarchy, and what one person could do depended on how many people and resources they could leverage. Now they spend a little time giving AI context and tools, and more time making judgments and decisions. More and more often, an agent brings the problem to a person; deciding what to do about it remains the person's job."
 },
 {
  "t": "p",
  "text": "They've joked: if Manus can do this much, why come to the office? Let the agents work it out. But the important questions still need people to raise them, argue about them and decide. What counts as a good product? Or, to exaggerate a little: build a great product with real revenue that keeps pushing AI's limits, or go for the margin?"
 },
 {
  "t": "p",
  "text": "AI doesn't know which one they want. They do."
 },
 {
  "t": "p",
  "text": "Culture and trust come from working things through together, day after day and in the moments that matter. That's the foundation under the work in every session."
 },
 {
  "t": "p",
  "text": "So, for now, their answer is that the role of people hasn't diminished; it has become more focused on where they have the most impact:"
 },
 {
  "t": "fig",
  "n": 26,
  "src": "fig26-people.svg",
  "alt": "A person at the center, four things lighting up around them: define the problem, judge quality, decide what's worth doing, own the result; a ring of agent dots turning outside"
 },
 {
  "t": "cap",
  "text": "Four things still in people's hands."
 },
 {
  "t": "p",
  "text": "That's also why Manus is still hiring: people's skills and judgment are at the center of this way of working, and that isn't changing any time soon."
 },
 {
  "t": "p",
  "text": "Zhang ends by saying he's curious what the post would say a year from now. Every company has different goals, structures and culture, so there may be no standard answer and no final form. But for a company that builds agents, working out how people and AI work together isn't optional; it's part of the job."
 },
 {
  "t": "p",
  "text": "The original closes with a note on the numbers: figures come from internal records; team sizes and PM shipping figures are as of late October; some points are estimates or one person's experience rather than measurements."
 }
];
