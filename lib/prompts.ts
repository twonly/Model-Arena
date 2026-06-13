/**
 * 内置 Prompt 库：按典型 benchmark / 评测维度分类整理。
 * 参考公开评测集（GSM8K 数学、HumanEval 代码、MMLU 知识、经典「翻车题」等），
 * 改写为可直接对比的实测题，覆盖速度与能力两类。
 * 用户可在「Prompt 库」里自定义增删，自定义项存 localStorage。
 */

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

/** 扁平化所有内置 prompt（用于下拉/搜索） */
export function flattenLibrary(lib: PromptCategory[]): PromptItem[] {
  return lib.flatMap((c) => c.items);
}
