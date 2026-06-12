/**
 * 视觉对比用的图片预处理：浏览器端压缩到最长边 ≤1600px 的 JPEG，
 * 控制请求体大小（base64 经代理转发给各家视觉模型）。
 */
export async function fileToResizedDataUrl(
  file: File,
  maxDim = 1600,
  quality = 0.85
): Promise<string> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bmp.width, bmp.height));
  const w = Math.max(1, Math.round(bmp.width * scale));
  const h = Math.max(1, Math.round(bmp.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法创建画布");
  ctx.fillStyle = "#fff"; // 透明 PNG 压成 JPEG 时填白底
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(bmp, 0, 0, w, h);
  bmp.close();
  return canvas.toDataURL("image/jpeg", quality);
}

/** data URL → { mediaType, base64 }（Anthropic 原生协议需要拆开） */
export function parseDataUrl(
  dataUrl: string
): { mediaType: string; base64: string } | null {
  const m = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  return m ? { mediaType: m[1], base64: m[2] } : null;
}
