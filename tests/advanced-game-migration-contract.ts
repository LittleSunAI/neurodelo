import { fallbackConfig } from "../lib/fallback-config";
import { defaultState, platformGateway } from "../services/platform-gateway";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const storage = new MemoryStorage();
(globalThis as unknown as { window: { localStorage: MemoryStorage } }).window = { localStorage: storage };

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const legacy = {
    ...defaultState,
    version: 9,
    game: undefined,
    profile: {
      ...defaultState.profile,
      heroProgression: {
        ...defaultState.profile.heroProgression,
        skillPoints: undefined,
        unlockedSkillNodeIds: undefined,
        ownedItemIds: undefined,
        equipment: undefined,
      },
    },
  };
  storage.setItem(fallbackConfig.previousStorageKey, JSON.stringify(legacy));
  const migrated = await platformGateway.loadState();
  assert(migrated.version === 12, "Состояние версии 9 должно мигрировать в версию 11");
  assert(migrated.game.challenges.length >= 4, "Миграция должна создать испытания");
  assert(migrated.game.leaderboard.some((entry) => entry.isCurrentUser), "Миграция должна создать запись рейтинга пользователя");
  assert(migrated.profile.heroProgression.ownedItemIds.length > 0, "Миграция должна создать инвентарь");
  assert(migrated.profile.heroProgression.skillPoints >= 0, "Миграция должна создать очки навыков");
  assert(migrated.profile.heroProgression.equipment.weaponId, "Миграция должна создать экипировку");

  console.log(JSON.stringify({ schemaVersion: 11, migrationFromV9: "ok", inventory: "ok", skills: "ok", challenges: "ok", leaderboard: "ok" }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
