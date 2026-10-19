import { fallbackConfig } from "../lib/fallback-config";
import { defaultState, platformGateway } from "../services/platform-gateway";
import type { OpenSourceProject } from "../types/platform";

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
  const initial = await platformGateway.loadState();
  assert(initial.version === 12, "Проектная схема должна использовать версию 11");
  assert(initial.projects.length >= 4, "Должны загружаться демонстрационные open-source проекты");
  const openCompanion = initial.projects.find((project) => project.id === "open-companion");
  assert(openCompanion, "Должен существовать проект Open Companion");
  assert(openCompanion.roadmap.length > 0, "У проекта должен быть roadmap");
  assert(openCompanion.tasks.length > 0, "У проекта должны быть задачи");
  assert(openCompanion.roles.length > 0, "У проекта должны быть открытые роли");
  assert(openCompanion.news.length > 0, "У проекта должны быть новости");
  assert(openCompanion.faq.length > 0, "У проекта должен быть FAQ");

  const custom: OpenSourceProject = {
    ...JSON.parse(JSON.stringify(openCompanion)) as OpenSourceProject,
    id: "fallback-project",
    slug: "fallback-project",
    title: "Fallback Project",
    ownerId: "fallback-user",
    ownerName: "Fallback User",
    status: "draft",
    tasks: [],
    openTasks: 0,
    roadmap: [{ id: "road-1", title: "Первый этап", summary: "Проверка сохранения", state: "active", progress: 10, targetVersion: "v0.1", dueLabel: "локально" }],
  };
  await platformGateway.saveState({ ...initial, projects: [custom, ...initial.projects], selectedProjectId: custom.id, subscribedProjectIds: [custom.id] });
  const restored = await platformGateway.loadState();
  assert(restored.projects[0]?.title === "Fallback Project", "Созданный проект должен сохраняться");
  assert(restored.selectedProjectId === custom.id, "Выбранный проект должен сохраняться");
  assert(restored.subscribedProjectIds.includes(custom.id), "Подписка на проект должна сохраняться");

  storage.removeItem(fallbackConfig.storageKey);
  storage.setItem(fallbackConfig.previousStorageKey, JSON.stringify({
    ...defaultState,
    version: 5,
    projects: undefined,
    selectedProjectId: undefined,
    subscribedProjectIds: undefined,
  }));
  const migrated = await platformGateway.loadState();
  assert(migrated.version === 12, "Схема версии 5 должна мигрировать в версию 11");
  assert(migrated.projects.length >= 4, "Миграция должна добавить проекты");
  assert(migrated.selectedProjectId === "open-companion", "Миграция должна выбрать безопасный проект по умолчанию");

  console.log(JSON.stringify({
    schemaVersion: migrated.version,
    projectCount: migrated.projects.length,
    customPersistence: true,
    migrationFromV5: true,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
