export const heroImageConfig = {
  fallbackEnabled: process.env.NEXT_PUBLIC_USE_HERO_IMAGE_FALLBACKS !== "false",
  apiPath: "/api/v1/hero-images/generate",
  maxUploadBytes: 5 * 1024 * 1024,
  maxStoredVariants: 8,
  outputSize: 512,
  acceptedMimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
} as const;

export type HeroImageRuntimeMode = "fallback" | "fal-api";
export const heroImageRuntimeMode: HeroImageRuntimeMode = heroImageConfig.fallbackEnabled ? "fallback" : "fal-api";
