import { NextResponse } from "next/server";
import { authSecurityStatus } from "@/lib/server/session";
import { persistenceHealth } from "@/lib/server/persistence";
import { localAuthPersistenceStatus } from "@/lib/server/local-auth-store";
import { objectStorageHealth } from "@/lib/server/object-storage";
import { listLocalJobs } from "@/lib/server/jobs";

function fallbackEnabled(value: string | undefined) { return value !== "false"; }

export async function GET() {
  const jobs = listLocalJobs(1000);
  return NextResponse.json({
    status: "ok",
    release: "prebackend-final-0.23.0",
    backend: "local-persistent-adapters",
    database: "contract-only",
    persistence: { ...persistenceHealth(), auth: localAuthPersistenceStatus() },
    objectStorage: objectStorageHealth(),
    jobs: {
      driver: "local-file",
      total: jobs.length,
      queued: jobs.filter((job) => job.status === "queued").length,
      processing: jobs.filter((job) => job.status === "processing").length,
      failed: jobs.filter((job) => job.status === "failed").length,
      warning: "Локальная очередь предназначена для одного процесса; в production заменяется Redis/BullMQ.",
    },
    security: {
      auth: authSecurityStatus(),
      falConfigured: Boolean(process.env.FAL_KEY && process.env.FAL_HERO_MODEL_ID),
      emailConfigured: Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
      hstsEnabled: process.env.ENABLE_HSTS === "true",
    },
    fallbacks: {
      core: fallbackEnabled(process.env.NEXT_PUBLIC_USE_FALLBACKS),
      game: fallbackEnabled(process.env.NEXT_PUBLIC_USE_GAME_FALLBACKS),
      heroImages: fallbackEnabled(process.env.NEXT_PUBLIC_USE_HERO_IMAGE_FALLBACKS),
      git: fallbackEnabled(process.env.NEXT_PUBLIC_USE_GIT_FALLBACKS),
      community: fallbackEnabled(process.env.NEXT_PUBLIC_USE_COMMUNITY_FALLBACKS),
      moderation: fallbackEnabled(process.env.NEXT_PUBLIC_USE_MODERATION_FALLBACKS),
    },
  });
}
