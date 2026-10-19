import { fallbackConfig } from "../lib/fallback-config";
import { defaultState, platformGateway } from "../services/platform-gateway";
import type { PlatformState } from "../types/platform";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

const storage = new MemoryStorage();
(globalThis as unknown as { window: { localStorage: MemoryStorage } }).window = { localStorage: storage };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  assert(platformGateway.mode === "fallback", "Gateway должен работать в fallback-режиме");
  const initial = await platformGateway.loadState();
  assert(initial.version === 12, "Состояние должно использовать схему версии 11");
  assert(initial.onboardingCompleted === false, "Новый профиль должен открывать регистрацию");
  assert(initial.profile.supportLinks.length === 0, "Новый профиль не должен содержать чужие спонсорские ссылки");
  assert(initial.profile.heroProgression.modelVersion === "advanced-foundation-v2", "Должна существовать игровая основа");
  assert(initial.recognitionRecords.length > 0, "Должна существовать демонстрационная история признания");

  const saved: PlatformState = {
    ...defaultState,
    onboardingCompleted: true,
    completedAt: "2026-07-17T00:00:00.000Z",
    profile: { ...defaultState.profile, name: "Fallback Test", nickname: "fallback-test" },
    claimedContributionIds: ["oc-142"],
    joinedProjectIds: ["open-companion"],
  };
  await platformGateway.saveState(saved);
  const restored = await platformGateway.loadState();
  assert(restored.profile.name === "Fallback Test", "Профиль должен восстанавливаться из localStorage");
  assert(restored.profile.heroProgression.classId === "architect", "Класс героя должен сохраняться");
  assert(restored.claimedContributionIds.includes("oc-142"), "Закреплённый вклад должен сохраняться");

  storage.clear();
  storage.setItem(fallbackConfig.previousStorageKey, JSON.stringify({
    version: 2,
    onboardingCompleted: true,
    profile: {
      ...defaultState.profile,
      heroProgression: undefined,
      gratitudeReceived: undefined,
      communityPoints: undefined,
    },
    claimedContributionIds: [],
    submittedContributionIds: [],
    joinedProjectIds: ["open-companion"],
    savedProjectIds: [],
  }));
  const migrated = await platformGateway.loadState();
  assert(migrated.version === 12, "Состояние версии 2 должно мигрировать в версию 11");
  assert(migrated.profile.heroProgression.level > 0, "Миграция должна добавить игровую прогрессию");
  assert(Array.isArray(migrated.kudosRecords), "Миграция должна добавить благодарности");

  const hero = await platformGateway.generateHero({ professions: ["design"], experience: "middle", preferredPalette: "green" });
  assert(hero.style === "creator", "Дизайнеру должен подбираться стиль creator");
  assert(hero.palette === "green", "Выбранная палитра должна сохраняться");

  const skills = await platformGateway.assessSkills({ professions: ["frontend", "backend"], experience: "middle" });
  assert(skills.length === 2, "Оценка должна вернуть все выбранные направления");

  const kudos = await platformGateway.sendKudos({
    fromUserId: "fallback-test",
    fromName: "Fallback Test",
    toContributorId: "elena-k",
    toContributorName: "Елена Ким",
    projectId: "open-companion",
    contributionId: "pr-139",
    category: "mentorship",
    message: "Спасибо за проверку fallback-контракта.",
    communityPoints: 3,
    officialProjectThanks: true,
  });
  assert(kudos.id.startsWith("kudos-"), "Fallback должен создавать благодарность");

  await platformGateway.reset();
  assert(storage.getItem(fallbackConfig.storageKey) === null, "Сброс должен удалять состояние версии 10");
  assert(storage.getItem(fallbackConfig.previousStorageKey) === null, "Сброс должен удалять состояние версии 2");
  assert(storage.getItem(fallbackConfig.legacyStorageKey) === null, "Сброс должен удалять старое состояние");

  console.log(JSON.stringify({
    mode: platformGateway.mode,
    schemaVersion: 11,
    persistence: "ok",
    version2Migration: "ok",
    recognition: "ok",
    heroGeneration: "ok",
    skillAssessment: "ok",
    reset: "ok",
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
