import type { HeroImageGenerationResult } from "../services/hero-image-gateway";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const fakeResult: HeroImageGenerationResult = {
    variant: {
      id: "hero-api-test",
      title: "fal.ai test",
      source: "fal",
      status: "ready",
      imageUrl: "https://example.invalid/hero.webp",
      createdAt: "2026-07-17T00:00:00.000Z",
      width: 1024,
      height: 1024,
      fileSize: 0,
      mimeType: "image/remote",
      prompt: "test",
      modelId: "test-model",
      preset: "cinematic",
      mood: "focused",
      background: "workshop",
    },
    record: {
      id: "hero-job-api-test",
      status: "ready",
      provider: "fal",
      prompt: "test",
      modelId: "test-model",
      createdAt: "2026-07-17T00:00:00.000Z",
      completedAt: "2026-07-17T00:00:01.000Z",
      variantId: "hero-api-test",
    },
  };

  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    assert(String(input) === "/api/v1/hero-images/generate", "API-провайдер должен обращаться только к нашему серверному маршруту");
    assert(init?.method === "POST", "Генерация должна отправляться POST-запросом");
    assert(typeof init?.body === "string" && init.body.includes("Архитектор"), "Тело запроса должно содержать пользовательский prompt");
    return new Response(JSON.stringify(fakeResult), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;

  const { heroImageGateway } = await import("../services/hero-image-gateway");
  assert(heroImageGateway.mode === "fal-api", "После отключения fallback должен включаться fal-api режим");
  const progress: string[] = [];
  const result = await heroImageGateway.generate({
    prompt: "Архитектор открытого проекта",
    negativePrompt: "logo",
    preset: "cinematic",
    mood: "focused",
    background: "workshop",
    palette: "cyan",
    classId: "architect",
  }, { onProgress: (item) => progress.push(item.status) });
  assert(result.variant.source === "fal", "API должен вернуть fal-вариант");
  assert(progress[0] === "queued" && progress.at(-1) === "ready", "API-режим должен отдавать статусы прогресса");

  console.log(JSON.stringify({ mode: heroImageGateway.mode, serverProxyPath: "ok", responseContract: "ok", progress }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
