/**
 * 内置 Prompt 库：按典型 benchmark / 评测维度分类整理。
 * 参考公开评测集（GSM8K 数学、HumanEval 代码、MMLU 知识、经典「翻车题」等），
 * 改写为可直接对比的实测题，覆盖速度与能力两类。
 * 用户可在「Prompt 库」里自定义增删，自定义项存 localStorage。
 */
import { DEFAULT_LOCALE, type Locale } from "./i18n.ts";

export interface PromptItem {
  label: string;
  text: string;
}

export interface PromptCategory {
  category: string;
  icon: string;
  /** 该类侧重什么 */
  hint?: string;
  items: PromptItem[];
}

export const PROMPT_LIBRARY: PromptCategory[] = [
  {
    category: "速度实测",
    icon: "⚡",
    hint: "拉满输出/最短首响，纯看速度",
    items: [
      {
        label: "5000 字短文（拉满输出）",
        text: "写一篇 5000 字左右的短文，主题是「为什么速度本身就是一种能力」，要有条理。",
      },
      {
        label: "自我介绍（最短测首响）",
        text: "用一句话介绍你自己，并说明你的模型名称和版本。",
      },
      {
        label: "连续数数（稳定吞吐）",
        text: "从 1 数到 200，每行一个数字，不要任何多余的话。",
      },
    ],
  },
  {
    category: "数学推理",
    icon: "🧮",
    hint: "GSM8K 风格多步应用题",
    items: [
      {
        label: "鸡兔同笼（多步计算）",
        text: "一个笼子里有鸡和兔共 35 只，脚共 94 只。问鸡和兔各有多少只？请写出推理过程。",
      },
      {
        label: "折扣叠加（易错应用题）",
        text: "一件商品原价 200 元，先打 8 折，再用满 100 减 20 的券，最后实付多少钱？分步说明。",
      },
      {
        label: "AIME 风格数论题",
        text: "求所有满足 1 ≤ n ≤ 1000 且 n 与 1000 互质的正整数 n 的个数，并说明用了什么方法。",
      },
    ],
  },
  {
    category: "代码能力",
    icon: "💻",
    hint: "HumanEval 风格 + 可运行 demo",
    items: [
      {
        label: "贪吃蛇（单文件 HTML，可预览）",
        text: "写一个单文件 HTML 贪吃蛇游戏，包含计分和加速逻辑，直接给完整代码，不要解释。",
      },
      {
        label: "算法题（去重保序）",
        text: "用 Python 实现：给定一个整数列表，返回去重后的列表，且保持元素首次出现的顺序。写出函数并附 3 个测试用例。",
      },
      {
        label: "调试题（找 bug）",
        text: "下面的快排有什么 bug？修正并说明：\n\ndef quicksort(a):\n    if len(a) <= 1: return a\n    p = a[0]\n    left = [x for x in a if x < p]\n    right = [x for x in a if x > p]\n    return quicksort(left) + quicksort(right)",
      },
    ],
  },
  {
    category: "逻辑推理",
    icon: "🧠",
    hint: "需要仔细思考的推理题",
    items: [
      {
        label: "烧绳计时（经典）",
        text: "一根绳子烧完要 60 分钟，但燃烧不均匀。现在有两根这样的绳子，如何精确测量 45 分钟？请先仔细思考再回答。",
      },
      {
        label: "称重找次品",
        text: "有 12 个外观相同的小球，其中 1 个重量异常（不知偏重还是偏轻）。用一架天平，最少称几次能找出它？给出方案。",
      },
      {
        label: "过河问题",
        text: "农夫要带一只狼、一只羊、一颗白菜过河。船每次只能带一样。狼和羊不能单独留、羊和白菜不能单独留。给出完整过河步骤。",
      },
    ],
  },
  {
    category: "经典翻车题",
    icon: "🔤",
    hint: "tokenization 导致的反直觉错误，测细节",
    items: [
      {
        label: "数字母（strawberry）",
        text: "单词 strawberry 里有几个字母 r？请逐个字母列出来数。",
      },
      {
        label: "比大小（9.11 vs 9.9）",
        text: "9.11 和 9.9 哪个更大？请解释原因。",
      },
      {
        label: "反转字符串",
        text: "请把字符串 'human-level' 逐个字符反转输出，并说明结果。",
      },
    ],
  },
  {
    category: "知识问答",
    icon: "📚",
    hint: "MMLU 风格跨学科知识",
    items: [
      {
        label: "跨学科速答（5 题）",
        text: "简要回答以下 5 题，每题一句：1) 光合作用的化学方程式；2) 凯恩斯主义的核心观点；3) 快速排序平均时间复杂度；4) 《赤壁赋》的作者；5) DNA 的双螺旋结构由谁提出。",
      },
      {
        label: "概念辨析",
        text: "用通俗的话讲清楚「相关性」和「因果性」的区别，并各举一个生活中的例子。",
      },
    ],
  },
  {
    category: "写作创作",
    icon: "✍️",
    hint: "长文 / 创意 / 风格",
    items: [
      {
        label: "产品文案（小红书风）",
        text: "为一款主打「续航 3 天」的无线降噪耳机写一条小红书种草文案，要有 emoji、分点、有记忆点，200 字以内。",
      },
      {
        label: "诗歌（限定意象）",
        text: "以「深夜便利店的灯」为意象写一首现代诗，不超过 16 行，要有画面感。",
      },
      {
        label: "改写（学术→口语）",
        text: "把下面这句改写成对小学生也能懂的大白话：「大语言模型的推理能力源于在海量语料上通过自监督学习获得的涌现性表征。」",
      },
    ],
  },
  {
    category: "指令遵循",
    icon: "📋",
    hint: "格式/约束严格度",
    items: [
      {
        label: "严格 JSON 输出",
        text: "提取下面这句话里的信息，只输出 JSON（字段：name, age, city），不要任何额外文字：「张伟今年 28 岁，住在杭州。」",
      },
      {
        label: "格式约束（每行字数）",
        text: "写 5 条关于「早睡」的好处，每条必须正好 10 个字，用「1.」开头。",
      },
      {
        label: "否定约束（不准用某字）",
        text: "介绍一下大熊猫，全程不能出现「猫」「黑」「白」这三个字。",
      },
    ],
  },
  {
    category: "视觉创作",
    icon: "🎨",
    hint: "SVG 出图，自动渲染预览",
    items: [
      {
        label: "SVG 画鹈鹕骑车（经典）",
        text: "Generate an SVG of a pelican riding a bicycle. 直接输出完整的 <svg> 代码（包含 xmlns 属性和 viewBox），不要任何解释文字。",
      },
      {
        label: "SVG 数据图表",
        text: "用 SVG 画一个简单的柱状图，展示「周一到周五」五天的数值 [3,7,5,8,6]，带坐标轴。只输出 <svg> 代码。",
      },
      {
        label: "Canvas 动态视差车",
        text: "写一个单文件 HTML（只输出完整代码，不要解释），在 16:9 深色画布上用原生 Canvas 实现一辆车向右行驶的循环动画：前景车辆始终可见，远山、树、路灯、地面分层视差滚动，轮胎旋转，有速度仪表和暂停/继续按钮。不要使用外部库。",
      },
      {
        label: "Canvas 六边形弹球（物理推理）",
        text: "写一个单文件 HTML（只输出完整代码，不要解释），用原生 Canvas 实现：一个小球在一个匀速旋转的正六边形内部弹跳。小球受重力下落，与六边形的六条边发生带能量损失的反弹（注意边在旋转，要考虑墙面速度和切向摩擦），任何时刻都不能穿出六边形。深色背景，小球带运动拖尾。不要使用外部库。",
      },
      {
        label: "Three.js 3D 水晶场景",
        text: "写一个单文件 HTML（只输出完整代码，不要解释）。在 <head> 用 importmap 引入 Three.js（把 `three` 映射到 `https://registry.npmmirror.com/three/0.171.0/files/build/three.module.js`、`three/addons/` 映射到 `https://registry.npmmirror.com/three/0.171.0/files/examples/jsm/`），再用 <script type=\"module\"> 构建可运行 3D 场景：缓慢自转的发光水晶核心、环绕粒子、合理的光照与材质、用 OrbitControls 支持鼠标拖拽旋转与滚轮缩放、canvas 铺满视口并随窗口自适应；若脚本加载失败，在页面上显示明确的错误文字。",
      },
      {
        label: "Canvas 墨滴入水扩散（流体）",
        text: "写一个单文件 HTML（只输出完整代码，不要解释），用原生 Canvas 实现一滴黑色墨水滴入一杯清水后扩散的动画。墨水入水瞬间应向外绽放出湍流、翻涌的羽状墨团——分形的卷须不断弯曲、分叉地铺开，并缓慢消散成淡淡的云雾。要用真实的流体运动（平流与扩散），而不是简单放大的圆。墨水要有密度变化：深而浓的内核、丝缕状半透明的边缘。顶部柔和打光。60fps，不要使用外部库。",
      },
      {
        label: "Canvas 光剑对决（光效）",
        text: "写一个单文件 HTML（只输出完整代码，不要解释），用原生 Canvas 实现两名兜帽武士挥舞发光等离子光剑（一蓝一红）的电影感短打斗。背景昏暗有氛围感，飘着余烬或薄雾。两名武士进行一段快速、编排好的劈砍与格挡交锋。核心效果：每把剑都留下平滑、带运动模糊的光迹，勾勒出它划过空中的弧线，带有白热的核心、彩色辉光，以及在几帧内淡出的拖尾。光剑应把动态彩色光投射到武士与地面上，碰撞时迸出火花。动作流畅、有重量感——不要僵硬机械的运动。60fps，不要使用外部库。",
      },
      {
        label: "Canvas 滑动解锁（UI 动效）",
        text: "写一个单文件 HTML（只输出完整代码，不要解释），用原生 Canvas 实现一部智能手机锁屏解锁的动画。展示一个手机屏幕，柔和渐变壁纸上有大号时钟与日期，底部有一条带可拖动滑块的「滑动解锁」轨道。一道流光高亮应持续在「滑动解锁」文字上扫过（移动的高亮渐变）。随后滑块一路滑到底；完成时锁屏平滑地滑出/淡出，露出主屏——一组圆角 App 图标（原创设计）轻柔地缩放并淡入就位，壁纸有细微视差。整体使用精致、流畅、Apple 级的缓动。60fps，不要使用外部库。",
      },
      {
        label: "Canvas 360° 全景泊车（几何同步）",
        text: "写一个单文件 HTML（只输出完整代码，不要解释），用原生 Canvas 模拟现代汽车的 360° 全景泊车辅助，正在驶入一个狭窄的路边车位完成平行泊车（经典的 S 形走位）。布局：屏幕分为两个面板。左面板是车机中控的鸟瞰（环视）合成图——车辆从正上方俯视居于中央，路面与路缘，以及由两辆已停车辆夹出的空车位。右面板是从驾驶位看的方向盘，随走位同步转动。动态引导线：在鸟瞰图上叠加由车辆射出的预测路径线——两条弯曲的轨迹线标出车宽，并按距离分成彩色色段（绿=远、黄=中、红=近）。这些线必须根据当前转向角、用正确的转向几何向左或向右弯曲（方向盘打得越死→转弯半径越小），并且必须随方向盘转动和车辆移动逐帧更新。动画：自动播放完整的平行泊车流程——沿前车并排前进并停下，打满方向盘倒车入弯，待车尾让开后反打方向盘回正，最后微微前进在车位内居中。车身应描出平滑连续的 S 形路径。关键约束：方向盘转角、引导线曲率与车辆实际路径在任何时刻都必须彼此完全一致——方向盘左打，引导线左弯，车辆左转。加入细微的 UI（距离读数、靠近停放车辆时闪红的接近警示弧）、柔和阴影，以及像真实车机一样干净的扁平化风格。60fps，不要使用外部库。",
      },
      {
        label: "Canvas 信纸燃烧成灰（粒子）",
        text: "写一个单文件 HTML（只输出完整代码，不要解释），用原生 Canvas 实现一封手写信燃烧的动画。展示一张泛黄做旧的信纸，上面有可见的手写花体字（用程序化笔画绘制即可），放在深色木桌上。2 秒后，火焰从右下角点燃并有机地蔓延整张纸——燃烧前沿应以不规则、带噪声的边缘推进，绝不是一条直线。在火焰前方，纸张先变暗发褐（焦化），再炭化变黑，最后彻底消失，露出下方的桌面。火焰用分层粒子渲染：明亮的白黄色核心、橙色中焰、半透明的红色火尖闪烁并向上舔动。发光的余烬应从燃烧边缘脱离，在湍流气流中向上飘散，由橙转灰渐隐。火焰上方有半透明烟雾升起弥散，火光在四周桌面投下温暖闪烁的光。整张纸约在 15 秒内被烧尽，只剩几片缓缓暗下去的发光灰烬。60fps，不要使用外部库。",
      },
      {
        label: "Canvas 房屋建造 7 阶段（时间线）",
        text: "写一个单文件 HTML（只输出完整代码，不要解释），用铺满整页的 Canvas、不使用任何库，在淡蓝色天空与一条绿色地面线前，分 7 个阶段、约 25 秒动画演示一栋简单的 2D 卡通房屋的建造：（1）地基——一块灰色矩形板从地下升起；（2）墙体——四段竖直墙从地基四角向上延伸；（3）填墙——墙框之间填入米黄色/浅褐色外墙板；（4）屋顶——两块三角形屋顶板从上方滑入并在屋脊相接，红色瓦片纹理逐行出现；（5）门——一扇棕色门在正面墙上淡入，带一个小小的金色门把手；（6）窗——门两侧各出现一扇窗，带可见的十字窗框和蓝色玻璃；（7）细节——烟囱从屋顶升起、开始冒出一小缕烟，一条踏脚石小径通向门口，房屋旁长出一棵小树。每个阶段顶部应有简短字幕（「打地基」「砌墙」等）。阶段之间停顿 0.5 秒。持续循环。",
      },
    ],
  },
  {
    category: "翻译与多语言",
    icon: "🌐",
    items: [
      {
        label: "技术长文翻译 + 总结",
        text: "把下面这段翻译成英文，再用中文总结成三点：\n\n大模型的推理速度由首 token 时延和吞吐两部分组成。首 token 时延主要取决于 prompt 处理（prefill）阶段的算力，而吞吐则取决于解码（decode）阶段的显存带宽。对实时对话类应用来说，首响应往往比总吞吐更影响体验。",
      },
      {
        label: "古文今译",
        text: "把《论语》里「学而时习之，不亦说乎」翻译成现代汉语和英文，并简要解释其含义。",
      },
    ],
  },
  {
    category: "长文本理解",
    icon: "📖",
    hint: "长输入摘要/抽取（需自行粘贴长文）",
    items: [
      {
        label: "结构化摘要",
        text: "请阅读我接下来粘贴的文章，输出：1) 一句话主旨；2) 3 个核心论点；3) 一个反方观点。\n\n（在这里粘贴你的长文章）",
      },
    ],
  },
];

export const PROMPT_LIBRARY_EN: PromptCategory[] = [
  {
    category: "Speed tests",
    icon: "⚡",
    hint: "Stress output length or TTFT, focused on speed",
    items: [
      {
        label: "5,000-word essay (max output)",
        text: "Write a roughly 5,000-word essay on the topic: why speed itself is a capability. Make it well structured.",
      },
      {
        label: "Self-introduction (TTFT)",
        text: "Introduce yourself in one sentence and state your model name and version.",
      },
      {
        label: "Count numbers (stable throughput)",
        text: "Count from 1 to 200, one number per line, with no extra words.",
      },
    ],
  },
  {
    category: "Math reasoning",
    icon: "🧮",
    hint: "GSM8K-style multi-step word problems",
    items: [
      {
        label: "Chickens and rabbits",
        text: "A cage contains 35 chickens and rabbits in total. They have 94 legs in total. How many chickens and rabbits are there? Show your reasoning.",
      },
      {
        label: "Stacked discount",
        text: "An item originally costs 200. It is first discounted by 20%, then a coupon subtracts 20 from orders over 100. What is the final price? Show the steps.",
      },
      {
        label: "Number theory count",
        text: "Find the number of positive integers n with 1 <= n <= 1000 that are coprime to 1000, and explain the method.",
      },
    ],
  },
  {
    category: "Coding",
    icon: "💻",
    hint: "HumanEval-style tasks and runnable demos",
    items: [
      {
        label: "Snake game (single HTML)",
        text: "Write a single-file HTML Snake game with scoring and speed-up logic. Output the complete code directly, with no explanation.",
      },
      {
        label: "Deduplicate while preserving order",
        text: "Implement in Python: given a list of integers, return a list with duplicates removed while preserving first occurrence order. Include 3 tests.",
      },
      {
        label: "Debug quicksort",
        text: "What is wrong with this quicksort? Fix it and explain:\n\ndef quicksort(a):\n    if len(a) <= 1: return a\n    p = a[0]\n    left = [x for x in a if x < p]\n    right = [x for x in a if x > p]\n    return quicksort(left) + quicksort(right)",
      },
    ],
  },
  {
    category: "Logic reasoning",
    icon: "🧠",
    hint: "Classic puzzles requiring careful reasoning",
    items: [
      {
        label: "Burning ropes",
        text: "A rope takes 60 minutes to burn completely, but it burns unevenly. You have two such ropes. How can you measure exactly 45 minutes? Think carefully before answering.",
      },
      {
        label: "Find the odd ball",
        text: "There are 12 identical-looking balls, one has an abnormal weight and you don't know whether it is heavier or lighter. With a balance scale, what is the minimum number of weighings needed to identify it? Give the plan.",
      },
      {
        label: "River crossing",
        text: "A farmer must take a wolf, a goat and a cabbage across a river. The boat carries only one item at a time. The wolf and goat cannot be left alone, nor can the goat and cabbage. Give the full steps.",
      },
    ],
  },
  {
    category: "Classic failure cases",
    icon: "🔤",
    hint: "Tokenization and counterintuitive detail checks",
    items: [
      {
        label: "Count letters in strawberry",
        text: "How many letter r's are in the word strawberry? List each letter and count them.",
      },
      {
        label: "Compare 9.11 and 9.9",
        text: "Which is larger, 9.11 or 9.9? Explain why.",
      },
      {
        label: "Reverse a string",
        text: "Reverse the string 'human-level' character by character and explain the result.",
      },
    ],
  },
  {
    category: "Knowledge Q&A",
    icon: "📚",
    hint: "MMLU-style cross-domain knowledge",
    items: [
      {
        label: "Cross-domain quick answers",
        text: "Answer these 5 questions briefly, one sentence each: 1) chemical equation for photosynthesis; 2) core idea of Keynesian economics; 3) average time complexity of quicksort; 4) author of Red Cliff Rhapsody; 5) who proposed the DNA double helix structure.",
      },
      {
        label: "Correlation vs causation",
        text: "Explain the difference between correlation and causation in plain language, with one everyday example for each.",
      },
    ],
  },
  {
    category: "Writing",
    icon: "✍️",
    hint: "Long-form, creative and style-constrained writing",
    items: [
      {
        label: "Product copy",
        text: "Write a short social media product recommendation for wireless noise-cancelling earbuds with a 3-day battery life. Use emoji, bullet points and a memorable hook, under 200 words.",
      },
      {
        label: "Poem with a fixed image",
        text: "Write a modern poem using the image 'the light of a convenience store at midnight'. Keep it under 16 lines and make it vivid.",
      },
      {
        label: "Academic to plain language",
        text: "Rewrite this sentence so an elementary-school student can understand it: 'The reasoning ability of large language models arises from emergent representations acquired through self-supervised learning on massive corpora.'",
      },
    ],
  },
  {
    category: "Instruction following",
    icon: "📋",
    hint: "Strict formatting and constraints",
    items: [
      {
        label: "Strict JSON output",
        text: 'Extract the information from this sentence and output only JSON with fields name, age and city. No extra text: "Zhang Wei is 28 years old and lives in Hangzhou."',
      },
      {
        label: "Line format constraint",
        text: "Write 5 benefits of sleeping early. Each line must start with '1.' through '5.' and contain exactly 10 words after the number.",
      },
      {
        label: "Forbidden words",
        text: "Introduce giant pandas without using the words 'cat', 'black' or 'white'.",
      },
    ],
  },
  {
    category: "Visual creation",
    icon: "🎨",
    hint: "SVG output that TOKRACE can preview",
    items: [
      {
        label: "SVG pelican on a bicycle",
        text: "Generate an SVG of a pelican riding a bicycle. Output only complete <svg> code with xmlns and viewBox, with no explanation.",
      },
      {
        label: "SVG bar chart",
        text: "Draw a simple SVG bar chart for Monday to Friday values [3,7,5,8,6], with axes. Output only <svg> code.",
      },
      {
        label: "Canvas parallax car",
        text: "Write a single-file HTML document (output complete code only, no explanation). Use vanilla Canvas on a 16:9 dark scene to animate a car driving to the right in a seamless loop: the foreground car stays visible, distant mountains, trees, streetlights and road layers scroll with parallax, wheels rotate, and there is a speed gauge plus pause/resume button. Do not use external libraries.",
      },
      {
        label: "Canvas hexagon bouncing ball (physics)",
        text: "Write a single-file HTML document (output complete code only, no explanation) using vanilla Canvas: a ball bounces inside a steadily rotating regular hexagon. The ball falls under gravity and bounces off the six moving walls with energy loss (account for the walls' rotation, including wall velocity and tangential friction), and must never escape the hexagon at any time. Dark background, with a motion trail on the ball. Do not use external libraries.",
      },
      {
        label: "Three.js 3D crystal scene",
        text: "Write a single-file HTML document (output complete code only, no explanation). In <head>, add an importmap mapping `three` to `https://registry.npmmirror.com/three/0.171.0/files/build/three.module.js` and `three/addons/` to `https://registry.npmmirror.com/three/0.171.0/files/examples/jsm/`, then use a <script type=\"module\"> to build a runnable 3D scene: a slowly self-rotating glowing crystal core, orbiting particles, sensible lighting and materials, OrbitControls for mouse-drag rotation and wheel zoom, and a canvas that fills the viewport and resizes with the window; if the scripts fail to load, show clear error text on the page.",
      },
      {
        label: "Canvas ink diffusing in water (fluid)",
        text: "Create a single HTML file with a canvas animation of a single drop of black ink falling into a glass of clear water and diffusing. On impact the ink should bloom outward in turbulent, billowing plumes — fractal tendrils curling and branching as they spread and slowly disperse into faint clouds. Use real fluid-like motion (advection and diffusion), not simple expanding circles. The ink should have density variation, with dark dense cores and wispy translucent edges. Soft lighting from above. 60fps, no external libraries. Output only the complete single-file HTML, with no explanation.",
      },
      {
        label: "Canvas energy-blade duel (light FX)",
        text: "Create a single HTML file with a canvas animation of a short, cinematic duel between two hooded warriors wielding glowing plasma blades — one blade blue, one red. Set it on a dark, atmospheric backdrop with drifting embers or mist. The warriors clash in a fast, choreographed exchange of swings and parries. The core effect: each blade leaves a smooth, motion-blurred light streak that traces its arc through the air, with a bright white-hot core, a colored glow, and a trail that fades over a few frames. Blades should cast dynamic colored light onto the fighters and the ground, and clashes throw off sparks. Fluid, weighty movement — no stiff robotic motion. 60fps, no external libraries. Output only the complete single-file HTML, with no explanation.",
      },
      {
        label: "Canvas slide to unlock (UI motion)",
        text: "Create a single HTML file with a canvas animation of a smartphone lock screen unlocking. Show a phone screen with a large clock and date over a soft gradient wallpaper, and a \"slide to unlock\" track at the bottom with a draggable handle. A shimmering light sweep should animate continuously across the \"slide to unlock\" text (a moving highlight gradient). Then animate the handle sliding all the way across; on completion, the lock screen smoothly slides/fades away to reveal a home screen — a grid of rounded app icons (original designs) that gently zoom and fade into place, with a subtle parallax on the wallpaper. Polished, fluid, Apple-grade easing throughout. 60fps, no external libraries. Output only the complete single-file HTML, with no explanation.",
      },
      {
        label: "Canvas 360° parking assist (geometry)",
        text: "Create a single HTML file with a canvas animation simulating a modern car's 360° surround-view parking assist as it parallel-parks into a tight roadside gap (the classic S-shaped maneuver). Layout: Split the screen into two panels. The left panel is the car's infotainment display showing a top-down bird's-eye (\"around-view\") composite — the car rendered from directly above in the center, the road surface and curb, and an empty parking gap bracketed by two parked cars. The right panel shows the steering wheel from the driver's seat, rotating in sync with the maneuver. Dynamic guidelines: Overlay predicted-path lines projecting from the car in the bird's-eye view — two curved trajectory lines marking the car's width, divided into colored distance bands (green = far, yellow = mid, red = close). These lines must bend left or right based on the current steering angle using correct steering geometry (sharper wheel angle → tighter turn radius), and they must update every single frame as the wheel turns and the car moves. Animation: Auto-play the full parallel-parking sequence — drive forward alongside the front car and stop, crank the wheel and reverse while curving in, then counter-steer and straighten as the rear end clears, and finally ease forward to center in the spot. The car body should trace a smooth, continuous S-path. Critical constraint: The steering wheel rotation, the curvature of the guidelines, and the car's actual path must stay perfectly consistent with one another at all times — turn the wheel left, the guidelines bend left, the car arcs left. Add subtle UI chrome (a distance readout, proximity warning arcs that flash red as the car nears the parked cars), soft shadows, and clean flat-design styling like a real car display. 60fps, no external libraries. Output only the complete single-file HTML, with no explanation.",
      },
      {
        label: "Canvas burning letter to ash (particles)",
        text: "Create a single HTML file with a canvas animation of a handwritten letter burning. Show an aged, slightly yellowed sheet of paper with visible handwritten cursive text (procedurally drawn lines are fine) resting on a dark wooden desk. After 2 seconds, a flame ignites at the bottom-right corner and spreads organically across the page — the burn front should advance with an irregular, noisy edge, never a straight line. Just ahead of the flames, the paper should darken and brown (scorching), then char black, then disappear entirely, revealing the desk beneath. Render the fire with layered particles: a bright white-yellow core, orange mid-flame, and translucent red tips that flicker and lick upward. Glowing embers should detach from the burn edge and drift upward on turbulent air currents, fading from orange to gray. Add wisps of semi-transparent smoke rising and dispersing above the flames, and a warm flickering light that the fire casts onto the surrounding desk. The entire page should be consumed in roughly 15 seconds, leaving only a few glowing ash fragments that slowly dim. 60fps, no external libraries. Output only the complete single-file HTML, with no explanation.",
      },
      {
        label: "Canvas build-a-house sequence (timeline)",
        text: "Write a single HTML file with a full-page canvas, no libraries. Animate the construction of a simple 2D cartoon house in 7 stages over ~25 seconds against a pale blue sky with a green ground line: (1) foundation - a gray rectangular slab rises from underground, (2) walls - four vertical wall segments extend upward from the foundation corners, (3) wall fill - tan/beige siding fills in between the wall frames, (4) roof - two triangular roof panels slide in from above and meet at the peak, with red shingle texture appearing row by row, (5) door - a brown door fades in on the front wall with a small gold doorknob, (6) windows - two windows appear on either side of the door with visible cross-frames and blue glass, (7) details - a chimney extends up from the roof, a small puff of smoke begins rising from it, a path of stepping stones appears leading to the door, and a small tree grows beside the house. Each stage should have a brief caption at the top (\"Laying foundation\", \"Raising walls\", etc.). Between stages, pause for 0.5 seconds. Loop continuously.",
      },
    ],
  },
  {
    category: "Translation and multilingual",
    icon: "🌐",
    items: [
      {
        label: "Technical translation + summary",
        text: "Translate the following paragraph into Chinese, then summarize it in three English bullet points:\n\nLLM inference speed consists of time to first token and throughput. TTFT is mainly determined by compute during prompt prefill, while throughput depends heavily on memory bandwidth during decoding. For real-time chat applications, first response latency often affects user experience more than total throughput.",
      },
      {
        label: "Classical Chinese translation",
        text: "Translate the Analects phrase '学而时习之，不亦说乎' into modern Chinese and English, then briefly explain its meaning.",
      },
    ],
  },
  {
    category: "Long-context understanding",
    icon: "📖",
    hint: "Long-input summarization and extraction",
    items: [
      {
        label: "Structured summary",
        text: "Read the article I paste next and output: 1) one-sentence thesis; 2) three core arguments; 3) one opposing view.\n\n(Paste your long article here.)",
      },
    ],
  },
];

export function promptLibrary(locale: Locale = DEFAULT_LOCALE): PromptCategory[] {
  return locale === "en" ? PROMPT_LIBRARY_EN : PROMPT_LIBRARY;
}

/** 扁平化所有内置 prompt（用于下拉/搜索） */
export function flattenLibrary(lib: PromptCategory[]): PromptItem[] {
  return lib.flatMap((c) => c.items);
}
