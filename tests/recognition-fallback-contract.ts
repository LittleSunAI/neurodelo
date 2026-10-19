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
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

async function main() {
  const state = await platformGateway.loadState();
  assert(state.version === 12, "Recognition должен использовать схему версии 11");
  assert(state.xpTransactions.length >= 4, "Должен существовать журнал XP");
  assert(state.releaseCredits.length >= 2, "Должны существовать участники релизов");
  assert(state.profile.supportLinks.length === 0, "Профиль не должен содержать чужие ссылки поддержки");

  const transaction = state.xpTransactions.find((item) => item.id === "xp-own-1");
  assert(transaction, "Должно существовать тестовое начисление пользователя");
  const reversed = await platformGateway.reverseXpTransaction({ transaction, reason: "Повторное тестовое начисление", actorName: state.profile.name });
  assert(reversed.original.status === "reversed", "Исходная операция должна перейти в статус reversed");
  assert(reversed.reversal.amount === -transaction.amount, "Обратная операция должна компенсировать XP");
  assert(reversed.reversal.reversalOfId === transaction.id, "Обратная операция должна ссылаться на исходную");
  assert(reversed.audit.action === "xp-reversed", "Аудит должен фиксировать отмену XP");

  const migratedInput = { ...defaultState, version: 8, xpTransactions: undefined, releaseCredits: undefined, recognitionAuditLog: undefined, profile: { ...defaultState.profile, supportLinks: undefined } };
  storage.setItem(fallbackConfig.previousStorageKey, JSON.stringify(migratedInput));
  const migrated = await platformGateway.loadState();
  assert(migrated.version === 12, "Состояние версии 8 должно мигрировать в версию 11");
  assert(migrated.xpTransactions.length > 0, "Миграция должна добавить XP-журнал");
  assert(migrated.releaseCredits.length > 0, "Миграция должна добавить release credits");
  assert(migrated.profile.supportLinks.length === 0, "Миграция не должна добавлять чужие ссылки поддержки");

  console.log(JSON.stringify({ schemaVersion: 11, xpLedger: "ok", reversal: "ok", releases: "ok", supportLinks: "ok", migrationFromV8: "ok" }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
