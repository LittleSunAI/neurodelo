import { heroImageConfig, heroImageRuntimeMode } from "../lib/hero-image-config";
import type {
  HeroImageGenerationInput,
  HeroImageGenerationRecord,
  HeroImageStatus,
  HeroImageVariant,
} from "../types/platform";

export type HeroImageProgress = {
  status: HeroImageStatus;
  percent: number;
  label: string;
};

export type HeroImageGenerationResult = {
  variant: HeroImageVariant;
  record: HeroImageGenerationRecord;
};

export type HeroImageProvider = {
  mode: "fallback" | "fal-api";
  generate: (
    input: HeroImageGenerationInput,
    options?: { signal?: AbortSignal; onProgress?: (progress: HeroImageProgress) => void },
  ) => Promise<HeroImageGenerationResult>;
};

const palettes = {
  cyan: ["#2ce8e0", "#1f739c", "#0d1727"],
  violet: ["#ab8cff", "#5c4eb8", "#111426"],
  amber: ["#ffbe62", "#a55d28", "#171422"],
  green: ["#71e39a", "#287c65", "#101b25"],
} as const;

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Генерация отменена", "AbortError"));
    }, { once: true });
  });
}

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({
    "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;",
  })[character] ?? character);
}

export function createFallbackHeroImage(input: HeroImageGenerationInput): string {
  const [accent, secondary, background] = palettes[input.palette];
  const classLabels = { guardian: "СТРАЖ", technomancer: "ТЕХНОМАНТ", pathfinder: "СЛЕДОПЫТ", architect: "АРХИТЕКТОР" } as const;
  const presetLabels = { cinematic: "CINEMATIC", anime: "ANIME", pixel: "PIXEL", illustration: "ILLUSTRATION", realistic: "REALISTIC" } as const;
  const safePrompt = escapeXml(input.prompt.slice(0, 70));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%"><stop offset="0" stop-color="${secondary}"/><stop offset="1" stop-color="${background}"/></radialGradient>
    <linearGradient id="armor" x1="0" x2="1"><stop stop-color="${accent}"/><stop offset="1" stop-color="${secondary}"/></linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="512" height="512" rx="48" fill="url(#bg)"/>
  <circle cx="256" cy="226" r="148" fill="none" stroke="${accent}" stroke-opacity=".18" stroke-width="22"/>
  <circle cx="256" cy="180" r="78" fill="#d5a58c"/>
  <path d="M180 172c12-82 136-92 154 0-36-27-119-31-154 0Z" fill="#182338"/>
  <path d="M202 184h35M275 184h35" stroke="#0b1422" stroke-width="10" stroke-linecap="round"/>
  <path d="M235 222q21 16 42 0" fill="none" stroke="#7f4e45" stroke-width="7" stroke-linecap="round"/>
  <path d="M118 480c13-127 79-186 138-186s125 59 138 186" fill="url(#armor)"/>
  <path d="M208 302l48 56 48-56" fill="none" stroke="#eefcff" stroke-opacity=".65" stroke-width="8"/>
  <circle cx="256" cy="389" r="38" fill="#0f1b2d" stroke="${accent}" stroke-width="7" filter="url(#glow)"/>
  <path d="M242 389h28M256 375v28" stroke="${accent}" stroke-width="7" stroke-linecap="round"/>
  <rect x="28" y="28" width="190" height="34" rx="17" fill="#07101b" fill-opacity=".62"/>
  <text x="46" y="51" fill="${accent}" font-family="Arial,sans-serif" font-size="16" font-weight="700">${classLabels[input.classId]} · ${presetLabels[input.preset]}</text>
  <rect x="32" y="448" width="448" height="38" rx="14" fill="#07101b" fill-opacity=".72"/>
  <text x="256" y="472" text-anchor="middle" fill="#e9fbff" font-family="Arial,sans-serif" font-size="14">${safePrompt}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const fallbackProvider: HeroImageProvider = {
  mode: "fallback",
  async generate(input, options) {
    const jobId = `hero-job-${Date.now()}`;
    const createdAt = new Date().toISOString();
    options?.onProgress?.({ status: "queued", percent: 12, label: "Запрос поставлен в локальную очередь" });
    await wait(260, options?.signal);
    options?.onProgress?.({ status: "generating", percent: 48, label: "Собираем образ героя" });
    await wait(460, options?.signal);
    options?.onProgress?.({ status: "generating", percent: 82, label: "Проверяем и подготавливаем вариант" });
    await wait(340, options?.signal);
    const variantId = `hero-image-${Date.now()}`;
    const variant: HeroImageVariant = {
      id: variantId,
      title: `Образ ${new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}`,
      source: "fallback",
      status: "ready",
      imageUrl: createFallbackHeroImage(input),
      createdAt,
      width: 512,
      height: 512,
      fileSize: 18_000,
      mimeType: "image/svg+xml",
      prompt: input.prompt,
      negativePrompt: input.negativePrompt,
      modelId: "local-hero-svg-v1",
      preset: input.preset,
      mood: input.mood,
      background: input.background,
    };
    options?.onProgress?.({ status: "ready", percent: 100, label: "Новый вариант готов" });
    return {
      variant,
      record: { id: jobId, status: "ready", provider: "fallback", prompt: input.prompt, modelId: variant.modelId, createdAt, completedAt: new Date().toISOString(), variantId },
    };
  },
};

const falApiProvider: HeroImageProvider = {
  mode: "fal-api",
  async generate(input, options) {
    options?.onProgress?.({ status: "queued", percent: 10, label: "Отправляем запрос в защищённый fal.ai адаптер" });
    const response = await fetch(heroImageConfig.apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": `hero-${Date.now()}-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}` },
      body: JSON.stringify(input),
      signal: options?.signal,
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({})) as { error?: string };
      throw new Error(payload.error ?? `fal.ai адаптер недоступен: ${response.status}`);
    }
    options?.onProgress?.({ status: "generating", percent: 78, label: "Получаем результат генерации" });
    const result = await response.json() as HeroImageGenerationResult;
    options?.onProgress?.({ status: "ready", percent: 100, label: "Новый вариант готов" });
    return result;
  },
};

export const heroImageGateway: HeroImageProvider = heroImageRuntimeMode === "fallback" ? fallbackProvider : falApiProvider;
