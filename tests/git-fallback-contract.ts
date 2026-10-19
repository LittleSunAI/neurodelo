import { createDefaultGitState, gitGateway } from "../services/git-gateway";
import { defaultProfile, defaultState, platformGateway } from "../services/platform-gateway";
import { fallbackConfig } from "../lib/fallback-config";

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
  const state = await platformGateway.loadState();
  assert(state.version === 12, "Git-схема должна использовать версию 11");
  assert(state.git.repositories.length === state.projects.length, "Каждый проект должен иметь fallback-репозиторий");
  assert(!state.git.profile, "Git-профиль по умолчанию не подключён");

  let git = createDefaultGitState(state.projects, defaultProfile);
  git = await gitGateway.connectProfile(git, defaultProfile);
  assert(git.profile?.status === "connected", "Git-профиль должен подключаться");

  const repository = git.repositories[0];
  assert(repository, "Должен существовать репозиторий");
  git = await gitGateway.selectRepository(git, repository.id);
  assert(git.selectedRepositoryId === repository.id, "Репозиторий должен выбираться");
  git = await gitGateway.syncRepository(git, repository.id);
  assert(git.repositories[0]?.lastSyncedAt === "только что", "Синхронизация должна обновлять время");
  assert(git.syncLog.length === 1, "Синхронизация должна записываться в журнал");

  const project = state.projects.find((item) => item.id === repository.projectId);
  const task = project?.tasks[0];
  assert(project && task, "Для Git-теста нужна задача проекта");
  const created = await gitGateway.createPullRequest(git, repository, task, defaultProfile);
  git = created.state;
  assert(created.pullRequest.state === "open", "Новый Pull Request должен быть открыт");
  assert(git.issues.find((issue) => issue.linkedTaskId === task.id)?.assignee === defaultProfile.nickname, "Issue должен назначаться автору PR");

  git = await gitGateway.runChecks(git, created.pullRequest.id);
  const ready = git.pullRequests.find((item) => item.id === created.pullRequest.id);
  assert(ready?.state === "ready", "После CI Pull Request должен быть готов к merge");
  assert(ready.checks.every((check) => check.conclusion === "success"), "Все fallback CI-проверки должны быть успешны");

  const merged = await gitGateway.mergePullRequest(git, created.pullRequest.id);
  git = merged.state;
  assert(merged.pullRequest.state === "merged", "Pull Request должен объединяться");
  assert(merged.pullRequest.xpAwarded, "Merged PR должен быть отмечен для начисления XP");
  assert(git.issues.find((issue) => issue.linkedTaskId === task.id)?.state === "closed", "Связанный issue должен закрываться");
  assert(git.commits[0]?.linkedPullRequestId === created.pullRequest.id, "Merge-коммит должен ссылаться на PR");

  await platformGateway.saveState({ ...state, git });
  const restored = await platformGateway.loadState();
  assert(restored.git.pullRequests.some((item) => item.state === "merged"), "Git-состояние должно сохраняться");

  storage.removeItem(fallbackConfig.storageKey);
  storage.setItem(fallbackConfig.previousStorageKey, JSON.stringify({ ...defaultState, version: 6, git: undefined }));
  const migrated = await platformGateway.loadState();
  assert(migrated.version === 12, "Схема версии 6 должна мигрировать в версию 11");
  assert(migrated.git.repositories.length === migrated.projects.length, "Миграция должна создать Git-репозитории");

  console.log(JSON.stringify({
    schemaVersion: migrated.version,
    connected: true,
    repositories: migrated.git.repositories.length,
    pullRequestLifecycle: ["open", "ready", "merged"],
    issueClosed: true,
    persistence: true,
    migrationFromV6: true,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
