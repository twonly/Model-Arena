---
pipeline_tag: image-text-to-text
license: other
license_name: minimax-community
license_link: LICENSE
library_name: transformers
tags:
  - multimodal
  - moe
  - agent
  - coding
  - video
---


<p align="right"><a href="README.md">English</a></p>

# MiniMax-M3.1-Flash

<div align="center">
  <img width="60%" src="figures/logo.svg" alt="MiniMax">
</div>
<hr>

<p align="center">
  <a href="https://agent.minimax.io/" target="_blank"><img src="https://img.shields.io/badge/MiniMax%20Agent-FF6C37?logo=minimax&logoColor=white" alt="MiniMax Agent"></a>
  <a href="https://platform.minimax.io/docs/guides/text-generation" target="_blank"><img src="https://img.shields.io/badge/API-FF6C37?logo=minimax&logoColor=white" alt="API"></a>
  <a href="https://www.minimax.io" target="_blank"><img src="https://img.shields.io/badge/MiniMax%20Website-FF6C37?logo=minimax&logoColor=white" alt="MiniMax Website"></a>
  <br>
  <a href="https://modelscope.cn/organization/minimax" target="_blank" rel="noopener noreferrer"><img alt="ModelScope MiniMax AI" src="https://img.shields.io/badge/ModelScope-MiniMax%20AI-white?labelColor=%23EF3D5D"></a>
  <a href="https://platform.minimaxi.com/docs/faq/contact-us" target="_blank"><img src="https://img.shields.io/badge/WeChat-07C160?logo=wechat&logoColor=white" alt="WeChat"></a>
  <a href="https://discord.com/invite/DPC4AHFCBw" target="_blank"><img src="https://img.shields.io/badge/Discord-5865F2?logo=discord&logoColor=white" alt="Discord"></a>
  <a href="https://huggingface.co/MiniMaxAI" target="_blank"><img src="https://img.shields.io/badge/Hugging%20Face-FFD21E?logo=huggingface&logoColor=black" alt="Hugging Face"></a>
  <a href="https://github.com/MiniMax-AI" target="_blank"><img src="https://img.shields.io/badge/GitHub-181717?logo=github&logoColor=white" alt="GitHub"></a>
  <a href="https://arxiv.org/abs/2606.13392" target="_blank"><img src="https://img.shields.io/badge/arXiv-2606.13392-B31B1B?logo=arxiv&logoColor=white" alt="arXiv Paper"></a>
</p>

**MiniMax-M3.1-Flash** 是一款原生多模态混合专家（MoE）模型，面向编程、智能体工作流、计算机使用和网络安全等场景。它支持文本、图像和视频输入，上下文窗口最高可达 **100 万 tokens**。

在 MiniMax-M3 的基础上，M3.1-Flash 通过全模型稀疏注意力、量化感知训练和 DSpark 投机解码，进一步提升了任务表现与推理效率。

**亮点：**
- **智能体能力：** 在智能体任务、编程和网络安全方面实现代际跃升——BankerToolBench 76.2、DeepSWE v1.1 73.7%、OSWorld V2 61.7、Agents' Last Exam 29.6、CyberGym 82.2。
- **高效设计：** 全模型稀疏注意力、量化感知训练和 DSpark 投机解码共同提升推理效率。

## 模型概览

- **架构：** 原生多模态混合专家（MoE）
- **参数：** 总参数约 428B；每 token 激活约 23B
- **输入 / 输出：** 文本、图像和视频输入；文本输出
- **上下文窗口：** 最高 1,000,000 tokens
- **注意力：** 全模型采用 [MiniMax Sparse Attention](https://arxiv.org/abs/2606.13392)（MSA）
- **投机解码：** 包含 DSpark draft head

## 基准测试

<div style="overflow-x:auto;margin:16px 0">
<table style="width:100%;border-collapse:collapse;font-size:14px">
<thead>
<tr>
<th style="padding:10px 12px;text-align:left;vertical-align:middle;border-bottom:1px solid #e5e7eb;font-weight:600;border-bottom:2px solid #f25f5c;background:#f7f7f8;">基准测试</th>
<th style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;font-weight:600;border-bottom:2px solid #f25f5c;background:rgba(242,95,92,0.08);">MiniMax M3.1 Flash</th>
<th style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;font-weight:600;border-bottom:2px solid #f25f5c;background:#f7f7f8;">DeepSeek V4.1 Flash-1017</th>
<th style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;font-weight:600;border-bottom:2px solid #f25f5c;background:#f7f7f8;">DeepSeek V4.1 Flash</th>
<th style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;font-weight:600;border-bottom:2px solid #f25f5c;background:#f7f7f8;">Kimi K3</th>
<th style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;font-weight:600;border-bottom:2px solid #f25f5c;background:#f7f7f8;">GLM-5.3</th>
<th style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;font-weight:600;border-bottom:2px solid #f25f5c;background:#f7f7f8;">GPT-5.6 Sol</th>
<th style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;font-weight:600;border-bottom:2px solid #f25f5c;background:#f7f7f8;">Opus 5</th>
</tr>
</thead>
<tbody>
<tr>
<td style="padding:10px 12px;text-align:left;vertical-align:middle;border-bottom:1px solid #e5e7eb;"><div>Automation-Bench v1.0.6</div></td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;background:rgba(242,95,92,0.08);"><strong>62.8</strong></td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">60.5</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">54.8</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">46.7</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">48.8</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">45.8</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">50.3</td>
</tr>
<tr>
<td style="padding:10px 12px;text-align:left;vertical-align:middle;border-bottom:1px solid #e5e7eb;">BankerToolBench</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;background:rgba(242,95,92,0.08);"><strong>76.2</strong></td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">—</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">73.7</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">69.1</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">74.5</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">74.6</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;"><strong>76.2</strong></td>
</tr>
<tr>
<td style="padding:10px 12px;text-align:left;vertical-align:middle;border-bottom:1px solid #e5e7eb;">GDP.pdf AA</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;background:rgba(242,95,92,0.08);">20.8</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">—</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">12.8</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">22.0</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">11.2</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;"><strong>27.2</strong></td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">21.6</td>
</tr>
<tr>
<td style="padding:10px 12px;text-align:left;vertical-align:middle;border-bottom:1px solid #e5e7eb;">Terminal Bench 4.0</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;background:rgba(242,95,92,0.08);">38.1</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">42.3</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">31.2</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">12.6</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">37.9</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">39.9</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;"><strong>51.8</strong></td>
</tr>
<tr>
<td style="padding:10px 12px;text-align:left;vertical-align:middle;border-bottom:1px solid #e5e7eb;">LOCA-Bench 256K</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;background:rgba(242,95,92,0.08);"><strong>60.3</strong></td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">—</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">—</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">49.7</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">50.3</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">60.0</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">53.7</td>
</tr>
<tr>
<td style="padding:10px 12px;text-align:left;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;"><div>Agents’ Last Exam</div></td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;background:rgba(242,95,92,0.08);">29.6</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">—</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">—</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">28.3</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">—</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">30.6</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;"><strong>32.2</strong></td>
</tr>
<tr>
<td style="padding:10px 12px;text-align:left;vertical-align:middle;border-bottom:1px solid #e5e7eb;">OSWorld 2.0</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;background:rgba(242,95,92,0.08);">61.7</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">—</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">54.3</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">58.3</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">—</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">65.7</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;"><strong>70.6</strong></td>
</tr>
<tr>
<td style="padding:10px 12px;text-align:left;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;"><div>PostTrain Bench v1.1</div></td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;background:rgba(242,95,92,0.08);">39.3</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">—</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">30.5</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">36.6</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">37.5</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">36.2</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;"><strong>40.4</strong></td>
</tr>
<tr>
<td style="padding:10px 12px;text-align:left;vertical-align:middle;border-bottom:1px solid #e5e7eb;">DeepSWE v1.1</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;background:rgba(242,95,92,0.08);">73.7</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;"><strong>77.0</strong></td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">74.2</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">67.5</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">66.9</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">73.0</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">74.0</td>
</tr>
<tr>
<td style="padding:10px 12px;text-align:left;vertical-align:middle;border-bottom:1px solid #e5e7eb;">NL2Repo-Bench</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;background:rgba(242,95,92,0.08);">61.2</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">68.2</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">65.4</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">58.0</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">58.0</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">56.8</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;"><strong>75.3</strong></td>
</tr>
<tr>
<td style="padding:10px 12px;text-align:left;vertical-align:middle;border-bottom:1px solid #e5e7eb;">SWE Refactor Bench</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;background:rgba(242,95,92,0.08);">23.0</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">—</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">11.8</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">19.5</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">10.4</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">28.5</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;"><strong>31.0</strong></td>
</tr>
<tr>
<td style="padding:10px 12px;text-align:left;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;"><div>CyberGym</div></td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;background:rgba(242,95,92,0.08);">82.2</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">—</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">—</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">80.0</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;"><strong>84.5</strong></td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">83.6</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">—</td>
</tr>
<tr>
<td style="padding:10px 12px;text-align:left;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;"><div>BabyVision (with tools)</div></td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;background:rgba(242,95,92,0.08);">91.0</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">92.5</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">89.6</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">85.7</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">—</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;">88.9</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;border-top:2px solid #f1d6d3;"><strong>94.1</strong></td>
</tr>
<tr>
<td style="padding:10px 12px;text-align:left;vertical-align:middle;border-bottom:1px solid #e5e7eb;">HLE (without tools)</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;background:rgba(242,95,92,0.08);">43.4</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">42.6</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">39.2</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">43.5</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">42.3</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">49.5</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;"><strong>55.6</strong></td>
</tr>
<tr>
<td style="padding:10px 12px;text-align:left;vertical-align:middle;border-bottom:1px solid #e5e7eb;">CharXiv RQ</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;background:rgba(242,95,92,0.08);">82.5</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">—</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">69.0</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">84.8</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">—</td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;"><strong>85.2</strong></td>
<td style="padding:10px 12px;text-align:center;vertical-align:middle;border-bottom:1px solid #e5e7eb;">83.7</td>
</tr>
</tbody>
</table>
</div>

<details>
<summary><strong>评测说明</strong></summary>

- **Automation-Bench v1.0.6：** 600 个公开任务。
- **BankerToolBench：** OpenCode 1.17.18；MiniMax-M2.7 作为 judge。
- **GDP.pdf AA：** 直接取自 Artificial Analysis。
- **Terminal Bench 4.0：** Codex 0.149.1。
- **LOCA-Bench 256K：** 官方实现。
- **Agents’ Last Exam：** 采用官方 Overall 设置；仅收录官方 ALE 榜单的完整测试集结果。空白表示没有官方结果（仅 CLI 结果不计入），并非零分。
- **OSWorld 2.0：** 采用 0808 Full 版本；各模型取其发布时报告的最高分，DeepSeek V4.1 除外（内部复现）。
- **PostTrain Bench v1.1：** Claude Code 2.1.251，512K 上下文；其余设置遵循官方评测。
- **DeepSWE v1.1：** mini-SWE-agent 2.4.5，512K 上下文。
- **NL2Repo-Bench：** Claude Code 2.1.233，512K 上下文；reward hacking 计 0 分；修正了两个规格与测试不一致的任务（分数基于修正后的测试集）。
- **SWE Refactor Bench：** Claude Code 2.1.220，200K 上下文；其余设置遵循官方评测。
- **CyberGym：** Claude Code 2.1.263，1M 上下文。
- **BabyVision（带工具）：** Claude Code 2.1.285；图像最短边 1,500 px。
- **HLE（不带工具）：** 纯文本子集（2,158 题）。
- **CharXiv RQ：** GPT-5.5 作为 judge。

</details>

以上结果基于官方权重；第三方量化版本可能有所不同。

## M3.1-Flash 的新特性

M3.1-Flash 延续 M3 的核心混合专家架构，主要有三项变化：

- **全模型稀疏注意力：** 前三个全注意力层替换为稀疏注意力。
- **量化感知训练：** 路由 MoE 专家与注意力路径在训练阶段完成量化，降低显存占用并提升推理效率。
- **DSpark 投机解码：** DSpark 取代此前的类 EAGLE MTP 方案。本次发布包含 draft head，可与兼容的 serving 实现配合使用。

## 如何使用

- [MiniMax Agent](https://agent.minimax.io/)
- [MiniMax API](https://platform.minimax.io/)

### 本地部署

下载模型：

```bash
hf download MiniMaxAI/MiniMax-M3.1-Flash --local-dir MiniMax-M3.1-Flash
```

推荐使用以下推理框架部署模型：

- [SGLang](https://docs.sglang.io/) — 参见 [SGLang cookbook](https://docs.sglang.io/cookbook/autoregressive/MiniMax/MiniMax-M3.1)。
- [vLLM](https://github.com/vllm-project/vllm) — 参见 [vLLM recipe](https://recipes.vllm.ai/MiniMaxAI/MiniMax-M3.1-Flash)。

更多集成正在推进中：Transformers、TokenSpeed、KTransformers、unsloth 和 ATOM。

## 推理设置

推荐采样设置：`temperature=1.0` 和 `top_p=0.95`。

推理时，在 chat template 中设置 `reasoning_effort`：`low`、`medium`、`high`、`xhigh` 或 `max`。

模型支持最高 100 万 tokens 的上下文窗口。可用上下文长度和吞吐量取决于 GPU 显存和 serving 配置。

## 联系我们

请联系 [model@minimax.io](mailto:model@minimax.io)。
