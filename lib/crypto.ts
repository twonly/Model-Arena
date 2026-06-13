/**
 * 客户端零知识加密：用「同步密码」派生密钥，AES-256-GCM 加解密。
 * 同步数据（含 API Key）在浏览器里加密成密文再上传，服务器只存密文、
 * 无法解密——保住「密钥不出浏览器（明文）」的承诺。
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

// WebCrypto 要 BufferSource；TS 5.x 对 Uint8Array<ArrayBufferLike> 较严，统一转一下
const bs = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

function toB64(buf: ArrayBuffer): string {
  // 分块拼接：String.fromCharCode(...bigArray) 在数据较大时会爆栈
  const bytes = new Uint8Array(buf);
  let bin = "";
  const CHUNK = 0x8000; // 32KB/块
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}
function fromB64(s: string): Uint8Array {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

async function deriveKey(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    "raw",
    bs(enc.encode(passphrase)),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: bs(salt), iterations: 200_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export interface Encrypted {
  v: 1;
  salt: string;
  iv: string;
  data: string;
}

export async function encryptJson(
  obj: unknown,
  passphrase: string
): Promise<Encrypted> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: bs(iv) },
    key,
    bs(enc.encode(JSON.stringify(obj)))
  );
  return {
    v: 1,
    salt: toB64(salt.buffer as ArrayBuffer),
    iv: toB64(iv.buffer as ArrayBuffer),
    data: toB64(ct),
  };
}

export async function decryptJson<T = unknown>(
  blob: Encrypted,
  passphrase: string
): Promise<T> {
  const key = await deriveKey(passphrase, fromB64(blob.salt));
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: bs(fromB64(blob.iv)) },
    key,
    bs(fromB64(blob.data))
  );
  return JSON.parse(dec.decode(pt)) as T;
}
