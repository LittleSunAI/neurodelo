import { gitConfig, gitRuntimeMode } from "../lib/git-config";
import type {
  ContributionTask,
  GitIntegrationState,
  GitProfile,
  GitPullRequestRecord,
  GitRepositorySnapshot,
  OpenSourceProject,
  UserProfile,
} from "../types/platform";

function wait(ms: number = gitConfig.artificialDelayMs) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function repositoryName(repository: string, fallback: string) {
  const cleaned = repository.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\.git$/, "");
  return cleaned.includes("/") ? cleaned : `neurodelo/${fallback}`;
}

export function createDefaultGitState(projects: OpenSourceProject[], profile: UserProfile): GitIntegrationState {
  const repositories: GitRepositorySnapshot[] = projects.map((project, index) => ({
    id: `repo-${project.id}`,
    projectId: project.id,
    provider: "github",
    fullName: repositoryName(project.repository, project.slug),
    description: project.summary,
    visibility: "public",
    defaultBranch: project.defaultBranch,
    stars: 84 + index * 37 + project.subscribers,
    forks: 12 + index * 8,
    openIssues: project.tasks.length,
    branches: [project.defaultBranch, "develop", `feature/${project.slug}-ui`],
    readme: project.readme,
    lastSyncedAt: "ещё не синхронизирован",
  }));
  const issues = projects.flatMap((project) => project.tasks.map((task, index) => ({
    id: `issue-${task.id}`,
    repositoryId: `repo-${project.id}`,
    projectId: project.id,
    number: index + 11,
    title: task.title,
    summary: task.summary,
    state: "open" as const,
    labels: [task.issueLabel, task.kind.toLowerCase()],
    author: project.ownerName,
    assignee: undefined,
    linkedTaskId: task.id,
    updatedAt: `${index + 1} ч назад`,
  })));
  const commits = projects.flatMap((project, index) => [
    {
      id: `commit-${project.id}-1`, repositoryId: `repo-${project.id}`, sha: `a${index + 2}f9c1e`,
      message: `docs: обновить roadmap ${project.title}`, author: project.ownerName,
      branch: project.defaultBranch, createdAt: "сегодня, 09:20", verified: true,
    },
    {
      id: `commit-${project.id}-2`, repositoryId: `repo-${project.id}`, sha: `b${index + 4}d2aa7`,
      message: "chore: подготовить задачи для сообщества", author: profile.name,
      branch: "develop", createdAt: "вчера, 18:05", verified: true,
    },
  ]);
  return {
    profile: undefined,
    selectedRepositoryId: repositories[0]?.id,
    repositories,
    issues,
    pullRequests: [],
    commits,
    syncLog: [],
  };
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${gitConfig.apiBasePath}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`Git API недоступен: ${response.status}`);
  return response.json() as Promise<T>;
}

export const gitGateway = {
  mode: gitRuntimeMode,

  async connectProfile(current: GitIntegrationState, profile: UserProfile): Promise<GitIntegrationState> {
    if (gitRuntimeMode === "api") return apiRequest<GitIntegrationState>("/connect", { method: "POST" });
    await wait(420);
    const gitProfile: GitProfile = {
      provider: "github",
      username: profile.github.replace(/^@/, "") || profile.nickname,
      displayName: profile.name,
      status: "connected",
      connectedAt: "только что",
      scopes: ["read:user", "repo:status", "public_repo", "read:org"],
    };
    return { ...clone(current), profile: gitProfile };
  },

  async disconnectProfile(current: GitIntegrationState): Promise<GitIntegrationState> {
    if (gitRuntimeMode === "api") return apiRequest<GitIntegrationState>("/disconnect", { method: "POST" });
    await wait(180);
    return { ...clone(current), profile: undefined };
  },

  async selectRepository(current: GitIntegrationState, repositoryId: string): Promise<GitIntegrationState> {
    if (gitRuntimeMode === "api") return apiRequest<GitIntegrationState>("/repository/select", { method: "POST", body: JSON.stringify({ repositoryId }) });
    await wait(90);
    if (!current.repositories.some((item) => item.id === repositoryId)) throw new Error("Репозиторий не найден");
    return { ...clone(current), selectedRepositoryId: repositoryId };
  },

  async syncRepository(current: GitIntegrationState, repositoryId: string): Promise<GitIntegrationState> {
    if (gitRuntimeMode === "api") return apiRequest<GitIntegrationState>(`/repositories/${repositoryId}/sync`, { method: "POST" });
    await wait(540);
    const repositories = current.repositories.map((repo) => repo.id === repositoryId
      ? { ...repo, lastSyncedAt: "только что", stars: repo.stars + 1 }
      : repo);
    return {
      ...clone(current),
      repositories,
      syncLog: [{ id: `sync-${Date.now()}`, repositoryId, action: "README, issues, Pull Request и коммиты обновлены", createdAt: "только что", result: "success" as const }, ...current.syncLog].slice(0, 20),
    };
  },

  async createPullRequest(current: GitIntegrationState, repository: GitRepositorySnapshot, task: ContributionTask, profile: UserProfile): Promise<{ state: GitIntegrationState; pullRequest: GitPullRequestRecord }> {
    if (gitRuntimeMode === "api") return apiRequest<{ state: GitIntegrationState; pullRequest: GitPullRequestRecord }>("/pull-requests", { method: "POST", body: JSON.stringify({ repositoryId: repository.id, taskId: task.id }) });
    await wait(470);
    const existing = current.pullRequests.find((item) => item.linkedTaskId === task.id && item.state !== "closed");
    if (existing) return { state: clone(current), pullRequest: existing };
    const nextNumber = Math.max(20, ...current.pullRequests.filter((item) => item.repositoryId === repository.id).map((item) => item.number)) + 1;
    const pullRequest: GitPullRequestRecord = {
      id: `pr-${task.id}-${Date.now()}`,
      repositoryId: repository.id,
      projectId: task.projectId,
      number: nextNumber,
      title: task.title,
      summary: `Fallback Pull Request для задачи: ${task.summary}`,
      author: profile.nickname,
      branch: `contrib/${profile.nickname}/${task.id}`,
      baseBranch: repository.defaultBranch,
      state: "open",
      linkedTaskId: task.id,
      additions: 74,
      deletions: 18,
      changedFiles: 5,
      reviewStatus: "waiting",
      checks: [
        { id: `check-${Date.now()}-1`, name: "TypeScript", conclusion: "pending", durationLabel: "ожидает" },
        { id: `check-${Date.now()}-2`, name: "Unit tests", conclusion: "pending", durationLabel: "ожидает" },
        { id: `check-${Date.now()}-3`, name: "Lint", conclusion: "pending", durationLabel: "ожидает" },
      ],
      createdAt: "только что",
      xpAwarded: false,
    };
    const issues = current.issues.map((issue) => issue.linkedTaskId === task.id ? { ...issue, assignee: profile.nickname } : issue);
    return { state: { ...clone(current), issues, pullRequests: [pullRequest, ...current.pullRequests] }, pullRequest };
  },

  async runChecks(current: GitIntegrationState, pullRequestId: string): Promise<GitIntegrationState> {
    if (gitRuntimeMode === "api") return apiRequest<GitIntegrationState>(`/pull-requests/${pullRequestId}/checks`, { method: "POST" });
    await wait(690);
    const pullRequests = current.pullRequests.map((pr) => pr.id === pullRequestId ? {
      ...pr,
      state: "ready" as const,
      reviewStatus: "approved" as const,
      checks: pr.checks.map((check, index) => ({ ...check, conclusion: "success" as const, durationLabel: `${18 + index * 7} сек` })),
    } : pr);
    return { ...clone(current), pullRequests };
  },

  async mergePullRequest(current: GitIntegrationState, pullRequestId: string): Promise<{ state: GitIntegrationState; pullRequest: GitPullRequestRecord }> {
    if (gitRuntimeMode === "api") return apiRequest<{ state: GitIntegrationState; pullRequest: GitPullRequestRecord }>(`/pull-requests/${pullRequestId}/merge`, { method: "POST" });
    await wait(520);
    const source = current.pullRequests.find((pr) => pr.id === pullRequestId);
    if (!source) throw new Error("Pull Request не найден");
    if (source.state !== "ready") throw new Error("Сначала дождитесь успешных проверок");
    const pullRequest = { ...source, state: "merged" as const, mergedAt: "только что", xpAwarded: true };
    const pullRequests = current.pullRequests.map((pr) => pr.id === pullRequestId ? pullRequest : pr);
    const issues = current.issues.map((issue) => issue.linkedTaskId === source.linkedTaskId ? { ...issue, state: "closed" as const, updatedAt: "только что" } : issue);
    const commits = [{
      id: `merge-${Date.now()}`,
      repositoryId: source.repositoryId,
      sha: Math.random().toString(16).slice(2, 9),
      message: `merge: ${source.title} (#${source.number})`,
      author: source.author,
      branch: source.baseBranch,
      createdAt: "только что",
      verified: true,
      linkedPullRequestId: source.id,
    }, ...current.commits];
    return { state: { ...clone(current), pullRequests, issues, commits }, pullRequest };
  },
};
