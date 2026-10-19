import { heroImageConfig } from "@/lib/hero-image-config";

export type ImageCropSettings = {
  zoom: number;
  x: number;
  y: number;
};

export type NormalizedImage = {
  imageUrl: string;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  originalFileName: string;
};

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Не удалось прочитать изображение"));
    image.src = source;
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });
}

export function validateHeroImageFile(file: File): string | null {
  if (!heroImageConfig.acceptedMimeTypes.includes(file.type as (typeof heroImageConfig.acceptedMimeTypes)[number])) {
    return "Поддерживаются JPG, PNG и WebP";
  }
  if (file.size > heroImageConfig.maxUploadBytes) return "Размер файла не должен превышать 5 МБ";
  return null;
}

export async function normalizeHeroImage(file: File, crop: ImageCropSettings): Promise<NormalizedImage> {
  const validationError = validateHeroImageFile(file);
  if (validationError) throw new Error(validationError);

  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  const size = heroImageConfig.outputSize;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Браузер не поддерживает обработку изображения");

  const coverScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
  const scale = coverScale * Math.max(1, crop.zoom);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const availableX = Math.max(0, drawWidth - size);
  const availableY = Math.max(0, drawHeight - size);
  const offsetX = -availableX * ((crop.x + 100) / 200);
  const offsetY = -availableY * ((crop.y + 100) / 200);

  context.fillStyle = "#101827";
  context.fillRect(0, 0, size, size);
  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

  let mimeType = "image/webp";
  let imageUrl = canvas.toDataURL(mimeType, 0.86);
  if (!imageUrl.startsWith("data:image/webp")) {
    mimeType = "image/jpeg";
    imageUrl = canvas.toDataURL(mimeType, 0.88);
  }

  const encoded = imageUrl.split(",")[1] ?? "";
  const fileSize = Math.round((encoded.length * 3) / 4);
  return { imageUrl, width: size, height: size, fileSize, mimeType, originalFileName: file.name };
}
