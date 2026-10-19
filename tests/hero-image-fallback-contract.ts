import { createFallbackHeroImage, heroImageGateway, type HeroImageProgress } from "../services/hero-image-gateway";
import type { HeroImageGenerationInput } from "../types/platform";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const input: HeroImageGenerationInput = {
  prompt: "Создатель открытых проектов в технологичной мастерской",
  negativePrompt: "text, logo",
  preset: "cinematic",
  mood: "focused",
  background: "workshop",
  palette: "cyan",
  classId: "architect",
};

async function main() {
  assert(heroImageGateway.mode === "fallback", "По умолчанию должен использоваться fallback-провайдер изображений");
  const directSvg = createFallbackHeroImage(input);
  assert(directSvg.startsWith("data:image/svg+xml"), "Fallback должен создавать безопасный SVG data URL");

  const updates: HeroImageProgress[] = [];
  const result = await heroImageGateway.generate(input, { onProgress: (progress) => updates.push(progress) });
  assert(result.variant.source === "fallback", "Вариант должен быть помечен как fallback");
  assert(result.variant.status === "ready", "Вариант должен завершаться статусом ready");
  assert(result.variant.width === 512 && result.variant.height === 512, "Fallback-образ должен иметь квадратный контракт 512x512");
  assert(result.record.provider === "fallback", "История должна сохранять провайдера");
  assert(updates.some((item) => item.status === "queued"), "Должен быть статус очереди");
  assert(updates.some((item) => item.status === "generating"), "Должен быть статус генерации");
  assert(updates.at(-1)?.status === "ready", "Последний статус должен быть ready");

  const controller = new AbortController();
  const cancelled = heroImageGateway.generate(input, { signal: controller.signal });
  controller.abort();
  let aborted = false;
  try { await cancelled; } catch (error) { aborted = error instanceof Error && error.name === "AbortError"; }
  assert(aborted, "Генерацию должно быть можно отменить через AbortController");

  console.log(JSON.stringify({
    mode: heroImageGateway.mode,
    fallbackSvg: "ok",
    progressStates: updates.map((item) => item.status),
    cancellation: "ok",
    outputContract: `${result.variant.width}x${result.variant.height}`,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
