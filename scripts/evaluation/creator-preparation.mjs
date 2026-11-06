import {copyFile, readFile, realpath, unlink} from 'node:fs/promises';
import {constants} from 'node:fs';
import {basename, relative, resolve} from 'node:path';
import {createHash} from 'node:crypto';

const inside = (root, path) => {
  const rel = relative(root, path);
  return rel !== '..' && !rel.startsWith('../') && !rel.startsWith('/');
};

export async function copyCaseInputs(task, {repoRoot, skillRoot, target}) {
  const inputs = [];
  for (const input of task.inputs ?? []) {
    if (!input.name || basename(input.name) !== input.name) throw Error('Invalid input filename');
    const root = await realpath(input.repoAsset ? repoRoot : skillRoot);
    const source = await realpath(resolve(root, input.repoAsset ?? input.asset));
    if (!inside(root, source)) throw Error('Input escaped its registered archive');
    const sha256 = createHash('sha256').update(await readFile(source)).digest('hex');
    if (input.sha256 && sha256 !== input.sha256) throw Error('Frozen input hash mismatch');
    const destination = resolve(target, input.name);
    try { await unlink(destination); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    await copyFile(source, destination, constants.COPYFILE_EXCL);
    inputs.push({name: input.name, sha256});
  }
  return inputs;
}

export function creatorPrompt({task, workspace, tools, author = '本批指定模型'}) {
  return `你是作品作者：${author}。独立完成下列任务，交付后结束。\n\n${task.titleZh}\n${task.prompt ?? task.requirements}\n\n工作目录：${workspace}\n- 先读 inputs/original-prompt.txt；图片题必须用 Read 查看 inputs 中原图，不用外部 OCR 代答。\n- 只在本题目录写文件，不读取其他作品、用户凭据或修改全局设置；不调用其他生成模型，不使用现成作品或下载现成美术资产。可使用已安装依赖、查官方文档；需要的库可安装在本题目录。\n- 工具：Blender=${tools.blenderPath}；Python=${tools.pythonPath}；Node模块=${tools.nodeModuleRoot}；Chromium=${tools.browserPath}。\n- Web 3D 可选 Three.js 等框架；库放本地并说明启动命令，网页交 index.html 与源码。浏览器录屏由协调者统一制作，不额外生成MP4、配乐、旁白或长审计文档。\n- 可以自行运行、看图和修错；以主要交付齐全且可运行为终点，不追求工程指标全优，不给自己打分。真实缺项或障碍简短说明。\n- 保存源码与必要依赖说明，最终只列交付文件和启动方式。首次自主交付由协调者冻结，后续反馈另存。\n`;
}
