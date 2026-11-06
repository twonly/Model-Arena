const source = {sourceUrl:'https://www.tokrace.com/',sourceType:'TOKRACE original task'};

export const creatorBookshelf = {
  requirements:'用同一份build.py参数脚本制作可编辑Blender书架：宽800mm、深300mm、高1200mm、板厚18mm，两个侧板、顶板、底板和两块内部横板形成三个等净高格。然后只将宽度改为1000mm，其余尺寸、板厚、格数、材质和相机不变。交final.blend、wide.blend、同一机位的两张1280×720对照图和build.py。主体完整入画，让宽度变化清楚可比；无需背板、柜脚、UV/LOD、视频、额外图组或审计文档。',
  checks:['两个工程可打开，板件为可编辑三维结构','两版宽度800/1000mm，其余尺寸和三格结构一致','同机位对照图完整呈现书架，宽度修改可辨认'],
  inputs:[],deliverables:['final.blend','wide.blend','build.py','两张1280×720对照图'],
};
creatorBookshelf.prompt = creatorBookshelf.requirements;

export default [
  {
    id:'creator-handheld',titleZh:'复古掌机分层拆解',titleEn:'Exploded retro handheld console',category:'blender',durationSeconds:12,
    requirements:'制作一台有辨识度的复古掌机及其分层拆解展示。由你设计造型、材质、配色和布光。组装状态有屏幕、十字方向键、至少两枚操作按键和有厚度的机身。拆解状态将同一掌机的壳体、屏幕、按键、可辨识的主板分开展示，零件与组装版对应。提交可编辑的 final.blend（组装）、exploded.blend（拆解）、可重建的 build.py，以及两张主体完整入画的 1280×720 作者原图 hero.png 和 exploded.png。两个工程均为 Z 轴向上，设备正面朝 +X，宽沿 Y，拆解沿 X 前后分层。每个工程的 TOKRACE_DEVICE 集合递归包含全部掌机主体网格，灯光、相机、地台和背景在集合外，同一零件在两份工程中沿用对象名。可选 Empty TOKRACE_FOCUS 标近景中心，组装版标屏幕或按键，拆解版标主板。由协调者另做统一环视和近景，不需要作者制作动画或视频。主板做可辨识的概念表达即可，无需实现电路或机械仿真。不使用下载的成品模型或外部生成资产。',
    checks:['可编辑三维工程与两张原图齐全','组装版屏幕、十字键、按键可辨','拆解版壳体、屏幕、按键、主板可辨且对应同一设备'],
    deliverables:['final.blend','exploded.blend','build.py','hero.png','exploded.png'],inputs:[],...source,
  },
  {
    id:'creator-spot-difference',titleZh:'两图找不同',titleEn:'Spot the differences between two images',category:'vision',durationSeconds:12,
    requirements:'直接用 Read 查看 inputs/spot-a.png（A图）和 inputs/spot-b.png（B图），找出从 A 到 B 的明确物品、颜色或图案变化。每处一项，最多五项，没把握可以少报。只交 UTF-8 answer.json，格式为 {"changes":[{"description":"用中文简述 A 到 B 的变化","box":[x1,y1,x2,y2]}]}。两图使用同一相对坐标系，左上(0,0)，右下(1000,1000)，x1<x2、y1<y2。框出变化的零件或它所属的具体物件，不框整格。新增、消失也标相同画面位置。忽略轻微渲染纹理与阴影差异。只能直接读这两张图，不读取题图来源、答案或其它作品，不用 OCR、程序像素差分或其它模型代答。无需生成图片、网页、视频或自评。',
    checks:['变化框与冻结标准位置一对一匹配','记录漏标、额外框和无效项','保留原描述并逐条核对变化方向'],
    deliverables:['answer.json'],inputs:[
      {name:'spot-a.png',repoAsset:'scripts/evaluation/assets/spot-difference-v1/spot-a.png',sha256:'aaaa974d56dd922fd1cd7f25259f15ec14825fb36daac05df1e237caaafc1a6f'},
      {name:'spot-b.png',repoAsset:'scripts/evaluation/assets/spot-difference-v1/spot-b.png',sha256:'877a12664efbc033c61eb623fdc405f76313ae90c26efa8ccef9900c52f8eee0'},
    ],...source,
  },
  {
    id:'creator-web3d',titleZh:'海底洗衣店 Web3D 动态场景',titleEn:'Underwater laundromat Web3D scene',category:'web-3d',durationSeconds:12,
    requirements:'制作一个可在浏览器运行的真正三维海底洗衣店，使用Three.js或其它合适的Web3D方式，模型、灯光和相机由你设计。洗衣店有三台可辨认的滚筒洗衣机，滚筒持续转动；至少两只水母在店外漂浮，气泡上升，鱼游过店前。场景具有前后景和真实空间层次，不能只把一张二维图贴到平面上。提供可拖动查看的相机，以便检查三维结构；初始机位清楚展示店铺全貌。制作约12秒循环动效，在1280×720视口完整呈现主体。画面由代码制作，不使用下载的成品场景或其它生成模型。主交index.html、必要源码/本地依赖和简短启动说明；由协调者统一录屏，你无需编码MP4、配音或制作审计文档。',
    checks:['三台洗衣机和至少两只水母可辨认','滚筒、水母、气泡和鱼有可见运动','拖动相机可验证真实三维结构，初始画面主体完整'],deliverables:['index.html','README.md'],inputs:[],...source,
  },
  {
    id:'creator-webapp',titleZh:'旅行行李清单小工具',titleEn:'Travel packing checklist',category:'web-app',durationSeconds:null,
    requirements:'制作一个中文旅行行李清单网页，初始恰有三个未完成条目：护照、充电器、相机。提供三个可实际操作的功能：输入名称并添加条目、勾选/取消勾选完成状态、删除指定条目。空白名称不创建条目。页面清楚区分已完成与未完成，兼容1440px桌面和390px手机视口，使用带可读标签的输入框和按钮。无需后端、登录或跨刷新存储；重新打开页面显示固定初始清单。主交index.html、必要源码和简短启动说明，无需视频或长篇自评。',
    checks:['添加雨伞后清单从3项变为4项','勾选充电器后仅该项变为已完成，可取消','删除相机后仅移除该项，手机页面可操作'],
    operations:[{action:'add',item:'雨伞',expectedCount:4},{action:'toggle',item:'充电器',expectedCompleted:true},{action:'delete',item:'相机',expectedCount:3}],
    deliverables:['index.html','README.md'],inputs:[],...source,
  },
  {
    id:'creator-vision',titleZh:'库存看板读图与信息缺失',titleEn:'Inventory image reading and missing information',category:'vision',durationSeconds:null,
    requirements:'直接查看inputs/inspection.png中的库存看板，将简短原始答案保存为answer.md。回答：1.逐行列出三种商品名称、当前库存和安全库存；2.按“当前库存低于安全库存”列出需要补货的商品及各自还差多少件；3.计算三种商品的当前库存总数；4.读出供应商编号，若图片中有遮挡或信息不足，明确指出，不能猜测被遮挡字符。只能依据输入图片，不查找生成图片的源码、答案或其它任务文件，不调用OCR/其它模型代为识图。无需开发网页、生成解释视频或自评分。',
    checks:['三行商品与库存数值读取正确','补货判断、差额和库存合计正确','对遮挡信息明确表示不可读，不编造编号'],deliverables:['answer.md'],
    inputs:[{name:'inspection.png',repoAsset:'scripts/evaluation/assets/creator-vision-v1.png',sha256:'be5b4ab1629a026d88173c9fef6f8f1a4f364d4c83db5d5c218c9d80bf0ad046'}],...source,
  },
].map(c=>({...c,prompt:c.requirements}));
