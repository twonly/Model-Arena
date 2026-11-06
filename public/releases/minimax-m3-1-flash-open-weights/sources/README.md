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

**MiniMax-M3.1-Flash** is a native multimodal mixture-of-experts model for coding, agentic workflows, computer use, and cybersecurity. It supports text, image, and video inputs with a context window of up to **1M tokens**.

Building on MiniMax-M3, M3.1-Flash improves task performance and inference efficiency with sparse attention throughout the model, quantization-aware training, and DSpark speculative decoding.

**Highlights:**
- **Agentic performance:** A generational leap in agentic tasks, coding, and cybersecurity — 76.2 on BankerToolBench, 73.7% on DeepSWE v1.1, 61.7 on OSWorld V2, 29.6 on Agents' Last Exam, and 82.2 on CyberGym.
- **Efficient by design:** Sparse attention throughout, quantization-aware training, and DSpark speculative decoding improve inference efficiency.


## Model at a Glance

- **Architecture:** Native multimodal mixture-of-experts (MoE)
- **Parameters:** Approximately 428B total; 23B activated per token
- **Inputs / output:** Text, image, and video inputs; text output
- **Context window:** Up to 1,000,000 tokens
- **Attention:** [MiniMax Sparse Attention](https://arxiv.org/abs/2606.13392) (MSA) throughout the model
- **Speculative decoding:** DSpark draft head included

## Benchmarks

<div style="overflow-x:auto;margin:16px 0">
<table style="width:100%;border-collapse:collapse;font-size:14px">
<thead>
<tr>
<th style="padding:10px 12px;text-align:left;vertical-align:middle;border-bottom:1px solid #e5e7eb;font-weight:600;border-bottom:2px solid #f25f5c;background:#f7f7f8;">Benchmark</th>
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
<summary><strong>Evaluation Notes</strong></summary>

- **Automation-Bench v1.0.6:** 600 publicly released tasks.
- **BankerToolBench:** OpenCode 1.17.18; MiniMax-M2.7 judge.
- **GDP.pdf AA:** Taken directly from Artificial Analysis.
- **Terminal Bench 4.0:** Codex 0.149.1.
- **LOCA-Bench 256K:** Official implementation.
- **Agents’ Last Exam:** Official Overall setting; full-set results from the official ALE leaderboard only. Blank = no official result (CLI-only excluded), not zero.
- **OSWorld 2.0:** 0808 Full release; highest reported per model at release, except DeepSeek V4.1 (in-house reproduction).
- **PostTrain Bench v1.1:** Claude Code 2.1.251, 512K context; otherwise official setup.
- **DeepSWE v1.1:** mini-SWE-agent 2.4.5, 512K context.
- **NL2Repo-Bench:** Claude Code 2.1.233, 512K context; reward hacking = 0; two inconsistent tasks corrected (scores use the corrected set).
- **SWE Refactor Bench:** Claude Code 2.1.220, 200K context; otherwise official setup.
- **CyberGym:** Claude Code 2.1.263, 1M context.
- **BabyVision (with tools):** Claude Code 2.1.285; min image side 1,500 px.
- **HLE (without tools):** Text-only subset (2,158 questions).
- **CharXiv RQ:** GPT-5.5 judge.

</details>

Results are for the official weights; third-party quantizations may differ.

## What’s New in M3.1-Flash

M3.1-Flash retains M3’s core mixture-of-experts architecture, with three main changes:

- **Sparse attention throughout:** the first three full-attention layers are replaced with sparse attention.
- **Quantization-aware training:** the routed MoE experts and the attention paths are quantized during training, reducing memory footprint and improving serving efficiency.
- **DSpark speculative decoding:** DSpark replaces the earlier EAGLE-like MTP approach. The release includes the draft head for use with compatible serving implementations.


## How to Use

- [MiniMax Agent](https://agent.minimax.io/)
- [MiniMax API](https://platform.minimax.io/)

### Local Deployment

Download the model:

```bash
hf download MiniMaxAI/MiniMax-M3.1-Flash --local-dir MiniMax-M3.1-Flash
```

We recommend the following inference frameworks to serve the model:

- [SGLang](https://docs.sglang.io/) — see [SGLang cookbook](https://docs.sglang.io/cookbook/autoregressive/MiniMax/MiniMax-M3.1).
- [vLLM](https://github.com/vllm-project/vllm) — see [vLLM recipe](https://recipes.vllm.ai/MiniMaxAI/MiniMax-M3.1-Flash).
- [TokenSpeed](https://github.com/lightseekorg/tokenspeed) — see [TokenSpeed recipe](https://lightseek.org/tokenspeed/recipes/models#minimax-m3-1).

Additional integrations in progress: Transformers, KTransformers, unsloth, and ATOM.

### Multi-Chip Deployment

[FlagOS](https://github.com/flagos-ai) — see [Multi-Chip Support and Downloads](https://huggingface.co/MiniMaxAI/MiniMax-M3.1-Flash/blob/main/docs/FlagOS-Multi-Chip-Support-and-Downloads.md).

## Inference Settings

Recommended sampling settings: `temperature=1.0` and `top_p=0.95`.

For reasoning, set `reasoning_effort` in the chat template: `low`, `medium`, `high`, `xhigh`, or `max`.

The model supports a context window of up to 1M tokens. Usable context length and throughput depend on GPU memory and the serving configuration.

## Contact Us

Contact us at [model@minimax.io](mailto:model@minimax.io).
