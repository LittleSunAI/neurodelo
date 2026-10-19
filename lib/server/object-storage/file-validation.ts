import path from "node:path";

export type ValidatedUpload = {
  mimeType: string;
  extension: string;
  width?: number;
  height?: number;
  checks: string[];
  warnings: string[];
};

const MAX_IMAGE_PIXELS = Math.max(1_000_000, Number(process.env.UPLOAD_MAX_IMAGE_PIXELS || 20_000_000));
const MAX_DIMENSION = Math.max(1024, Number(process.env.UPLOAD_MAX_IMAGE_DIMENSION || 8192));

function startsWith(buffer: Buffer, signature: number[]) {
  return signature.every((value, index) => buffer[index] === value);
}

function pngDimensions(buffer: Buffer) {
  if (buffer.length < 24) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function jpegDimensions(buffer: Buffer) {
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) { offset += 1; continue; }
    const marker = buffer[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 2 > buffer.length) return null;
    const length = buffer.readUInt16BE(offset);
    if (length < 2 || offset + length > buffer.length) return null;
    if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
      if (length < 7) return null;
      return { height: buffer.readUInt16BE(offset + 3), width: buffer.readUInt16BE(offset + 5) };
    }
    offset += length;
  }
  return null;
}

function webpDimensions(buffer: Buffer) {
  if (buffer.length < 30) return null;
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8X") {
    const width = 1 + buffer.readUIntLE(24, 3);
    const height = 1 + buffer.readUIntLE(27, 3);
    return { width, height };
  }
  if (chunk === "VP8 ") {
    const frame = buffer.indexOf(Buffer.from([0x9d, 0x01, 0x2a]), 20);
    if (frame < 0 || frame + 7 >= buffer.length) return null;
    return { width: buffer.readUInt16LE(frame + 3) & 0x3fff, height: buffer.readUInt16LE(frame + 5) & 0x3fff };
  }
  if (chunk === "VP8L" && buffer[20] === 0x2f) {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

function validateDimensions(dimensions: { width: number; height: number } | null) {
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1) throw new Error("Не удалось безопасно определить размеры изображения");
  if (dimensions.width > MAX_DIMENSION || dimensions.height > MAX_DIMENSION) throw new Error("Размер изображения превышает допустимое разрешение");
  if (dimensions.width * dimensions.height > MAX_IMAGE_PIXELS) throw new Error("Изображение содержит слишком много пикселей");
  return dimensions;
}

function isSafeText(buffer: Buffer) {
  if (buffer.includes(0)) return false;
  const decoded = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  const controls = [...decoded].filter((char) => {
    const code = char.charCodeAt(0);
    return code < 32 && ![9, 10, 13].includes(code);
  }).length;
  return controls <= Math.max(2, Math.floor(decoded.length * 0.001));
}

export function sanitizeUploadName(value: string) {
  const base = path.basename(value || "file").normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, "");
  const cleaned = base.replace(/[^\p{L}\p{N}._ -]+/gu, "_").replace(/\s+/g, " ").replace(/^\.+/, "").trim();
  return (cleaned || "file").slice(0, 120);
}

export function validateUploadedBuffer(buffer: Buffer, originalName: string): ValidatedUpload {
  const extension = path.extname(originalName).toLowerCase();
  const checks = ["magic-bytes", "size", "safe-name"];
  const warnings: string[] = [];

  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    const dimensions = validateDimensions(pngDimensions(buffer));
    checks.push("image-dimensions");
    return { mimeType: "image/png", extension: ".png", ...dimensions, checks, warnings };
  }
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) {
    const dimensions = validateDimensions(jpegDimensions(buffer));
    checks.push("image-dimensions");
    return { mimeType: "image/jpeg", extension: ".jpg", ...dimensions, checks, warnings: [...warnings, "EXIF должен удаляться при будущем серверном перекодировании"] };
  }
  if (buffer.length >= 16 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    const dimensions = validateDimensions(webpDimensions(buffer));
    checks.push("image-dimensions");
    return { mimeType: "image/webp", extension: ".webp", ...dimensions, checks, warnings };
  }
  if (buffer.length >= 5 && buffer.toString("ascii", 0, 5) === "%PDF-") {
    if (!buffer.subarray(Math.max(0, buffer.length - 2048)).toString("latin1").includes("%%EOF")) warnings.push("PDF не содержит ожидаемый завершающий маркер в конце файла");
    checks.push("pdf-signature");
    return { mimeType: "application/pdf", extension: ".pdf", checks, warnings };
  }
  if (isSafeText(buffer)) {
    checks.push("utf8-text");
    const markdown = [".md", ".markdown"].includes(extension);
    return { mimeType: markdown ? "text/markdown" : "text/plain", extension: markdown ? ".md" : ".txt", checks, warnings };
  }
  throw new Error("Тип файла не разрешён или его содержимое не соответствует расширению");
}
