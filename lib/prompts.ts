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
