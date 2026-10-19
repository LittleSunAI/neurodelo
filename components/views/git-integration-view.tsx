"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle, CheckCircle2, CircleDot, CloudCog, Code2, ExternalLink, FileCode2,
  GitBranch, GitCommit, GitFork, GitMerge, GitPullRequestArrow, LoaderCircle,
  LockKeyhole, Play, RefreshCw, ShieldCheck, Star, Unplug, UserRoundCheck,
} from "lucide-react";
import { Badge, Progress } from "@/components/ui/primitives";
import { usePlatform } from "@/components/platform-provider";
import type { GitCheckConclusion, GitPullRequestRecord } from "@/types/platform";

type TabId = "overview" | "readme" | "issues" | "pulls" | "commits";

export function GitIntegrationView({ onOpenProject }: { onOpenProject: () => void }) {
  const {
    state, saving, gitMode, connectGitProfile, disconnectGitProfile, selectGitRepository,
    syncGitRepository, createGitPullRequest, runGitChecks, mergeGitPullRequest,
  } = usePlatform();
  const [tab, setTab] = useState<TabId>("overview");
  const [message, setMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const repository = useMemo(
    () => state.git.repositories.find((item) => item.id === state.git.selectedRepositoryId) ?? state.git.repositories[0],
    [state.git.repositories, state.git.selectedRepositoryId],
  );
  const project = repository ? state.projects.find((item) => item.id === repository.projectId) : undefined;
  const issues = repository ? state.git.issues.filter((item) => item.repositoryId === repository.id) : [];
  const pulls = repository ? state.git.pullRequests.filter((item) => item.repositoryId === repository.id) : [];
  const commits = repository ? state.git.commits.filter((item) => item.repositoryId === repository.id) : [];
  const availableTask = project?.tasks.find((task) => !pulls.some((pr) => pr.linkedTaskId === task.id && pr.state !== "closed"));

  async function action(id: string, work: () => Promise<void>, success: string) {
    setBusyAction(id);
    setMessage(null);
    try {
      await work();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Операция не выполнена");
    } finally {
      setBusyAction(null);
    }
  }

  if (!repository) return <div className="panel empty-state"><GitBranch /><h3>Нет репозиториев</h3><p>Сначала создайте open-source проект.</p></div>;

  return <div className="view-stack">
    <section className="panel git-connect-hero">
      <div className="git-provider-mark"><GitFork /></div>
      <div>
        <Badge tone={state.git.profile ? "success" : "warning"}>{state.git.profile ? "Профиль подключён" : "Локальный Git fallback"}</Badge>
        <h2>{state.git.profile ? `@${state.git.profile.username}` : "Подключите Git-профиль"}</h2>
        <p>{state.git.profile ? `Доступы: ${state.git.profile.scopes.join(" · ")}` : "Пока используются искусственные репозитории и события. Настоящий токен в браузере не хранится."}</p>
      </div>
      <div className="git-connect-actions">
        {state.git.profile
          ? <button className="ghost-button" onClick={() => action("disconnect", disconnectGitProfile, "Git-профиль отключён.")}><Unplug />Отключить</button>
          : <button className="primary-button" onClick={() => action("connect", connectGitProfile, "Демо GitHub-профиль подключён.")}><GitFork />Подключить GitHub</button>}
        <Badge tone={gitMode === "fallback" ? "violet" : "success"}>{gitMode === "fallback" ? "Fallback" : "Git API"}</Badge>
      </div>
    </section>

    {message ? <div className="runtime-alert git-message"><CheckCircle2 /><span>{message}</span></div> : null}

    <div className="git-layout">
      <aside className="panel git-repository-list">
        <div className="section-title"><div><p>Доступные репозитории</p><h2>{state.git.repositories.length}</h2></div><GitFork /></div>
        {state.git.repositories.map((item) => <button key={item.id} className={repository.id === item.id ? "active" : ""} onClick={() => action(`select-${item.id}`, () => selectGitRepository(item.id), `Выбран ${item.fullName}`)}>
          <span>{item.fullName.slice(0, 2).toUpperCase()}</span><div><strong>{item.fullName}</strong><small>{item.visibility} · {item.defaultBranch}</small></div><em>{item.openIssues}</em>
        </button>)}
      </aside>

      <section className="view-stack">
        <article className="panel content-panel git-repo-header">
          <div className="section-title"><div><p>Выбранный репозиторий</p><h2>{repository.fullName}</h2></div><Badge tone="success">{repository.visibility}</Badge></div>
          <p>{repository.description}</p>
          <div className="git-repo-actions">
            <button className="ghost-button" disabled={saving || busyAction === "sync"} onClick={() => action("sync", () => syncGitRepository(repository.id), "README, issues, Pull Request и коммиты синхронизированы.")}>
              {busyAction === "sync" ? <LoaderCircle className="spin" /> : <RefreshCw />}Синхронизировать
            </button>
            <button className="ghost-button" onClick={onOpenProject}><ExternalLink />Открыть проект</button>
          </div>
          <div className="git-metrics">
            <article><Star /><strong>{repository.stars}</strong><span>звёзд</span></article>
            <article><GitFork /><strong>{repository.forks}</strong><span>форков</span></article>
            <article><CircleDot /><strong>{issues.filter((item) => item.state === "open").length}</strong><span>issues</span></article>
            <article><GitPullRequestArrow /><strong>{pulls.filter((item) => item.state !== "merged").length}</strong><span>активных PR</span></article>
          </div>
        </article>

        <nav className="panel project-tabs">{([ ["overview", "Обзор"], ["readme", "README"], ["issues", "Issues"], ["pulls", "Pull Request"], ["commits", "Коммиты"] ] as Array<[TabId, string]>).map(([id, label]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>{label}</button>)}</nav>

        {tab === "overview" ? <GitOverview repository={repository} pulls={pulls} syncLog={state.git.syncLog.filter((item) => item.repositoryId === repository.id)} /> : null}
        {tab === "readme" ? <ReadmeTab repository={repository} /> : null}
        {tab === "issues" ? <IssuesTab issues={issues} /> : null}
        {tab === "pulls" ? <PullRequestsTab pulls={pulls} availableTask={availableTask} connected={Boolean(state.git.profile)} busyAction={busyAction} onCreate={() => availableTask ? action("create-pr", async () => { await createGitPullRequest(availableTask.id); }, `Pull Request для «${availableTask.title}» создан.`) : Promise.resolve()} onChecks={(id) => action(`checks-${id}`, () => runGitChecks(id), "Все fallback CI-проверки успешно завершены.")} onMerge={(id) => action(`merge-${id}`, async () => { const ok = await mergeGitPullRequest(id); if (!ok) throw new Error("Pull Request пока нельзя объединить"); }, "Pull Request объединён. XP и портфолио обновлены.")} /> : null}
        {tab === "commits" ? <CommitsTab commits={commits} /> : null}
      </section>
    </div>
  </div>;
}

function GitOverview({ repository, pulls, syncLog }: { repository: import("@/types/platform").GitRepositorySnapshot; pulls: GitPullRequestRecord[]; syncLog: import("@/types/platform").GitSyncEvent[] }) {
  const latest = pulls[0];
  return <div className="project-overview-grid"><article className="panel content-panel"><div className="section-title"><div><p>Состояние интеграции</p><h2>Репозиторий готов к работе</h2></div><ShieldCheck /></div><div className="fact-grid"><article><GitBranch /><div><strong>Основная ветка</strong><p>{repository.defaultBranch}</p></div></article><article><LockKeyhole /><div><strong>Минимальные права</strong><p>Чтение профиля, публичных репозиториев и статусов проверок.</p></div></article><article><CloudCog /><div><strong>Последняя синхронизация</strong><p>{repository.lastSyncedAt}</p></div></article><article><Code2 /><div><strong>Ветви</strong><p>{repository.branches.join(", ")}</p></div></article></div></article><aside className="view-stack"><article className="panel content-panel"><div className="section-title"><div><p>Последний Pull Request</p><h2>{latest ? `#${latest.number} ${latest.title}` : "Пока нет"}</h2></div></div>{latest ? <><Progress value={latest.state === "merged" ? 100 : latest.state === "ready" ? 80 : 35} label={latest.state} /><p>{latest.summary}</p></> : <p>Создайте Pull Request из открытой задачи проекта.</p>}</article><article className="panel content-panel"><div className="section-title"><div><p>Журнал синхронизации</p><h2>{syncLog.length} событий</h2></div></div>{syncLog.length ? syncLog.slice(0, 3).map((item) => <div className="git-log-row" key={item.id}><CheckCircle2 /><div><strong>{item.action}</strong><small>{item.createdAt}</small></div></div>) : <p>Синхронизация ещё не запускалась.</p>}</article></aside></div>;
}

function ReadmeTab({ repository }: { repository: import("@/types/platform").GitRepositorySnapshot }) {
  return <article className="panel content-panel"><div className="section-title"><div><p>Импортированное содержимое</p><h2>README.md</h2></div><FileCode2 /></div><pre className="git-readme">{`# ${repository.fullName.split("/")[1]}\n\n${repository.readme}\n\n## Как участвовать\n\n1. Выберите issue.\n2. Создайте ветку от ${repository.defaultBranch}.\n3. Откройте Pull Request и дождитесь проверок.`}</pre></article>;
}

function IssuesTab({ issues }: { issues: import("@/types/platform").GitIssueRecord[] }) {
  return <article className="panel content-panel"><div className="section-title"><div><p>Импорт задач</p><h2>Issues</h2></div><Badge>{issues.length}</Badge></div><div className="git-issue-list">{issues.map((issue) => <article key={issue.id}><CircleDot className={issue.state === "open" ? "open" : "closed"} /><div><strong>#{issue.number} {issue.title}</strong><p>{issue.summary}</p><div className="tag-list">{issue.labels.map((label) => <span key={label}>{label}</span>)}</div></div><aside><Badge tone={issue.state === "open" ? "success" : "default"}>{issue.state}</Badge><small>{issue.assignee ? `@${issue.assignee}` : "без исполнителя"}</small></aside></article>)}</div></article>;
}

function PullRequestsTab({ pulls, availableTask, connected, busyAction, onCreate, onChecks, onMerge }: { pulls: GitPullRequestRecord[]; availableTask?: import("@/types/platform").ContributionTask; connected: boolean; busyAction: string | null; onCreate: () => Promise<void>; onChecks: (id: string) => Promise<void>; onMerge: (id: string) => Promise<void> }) {
  return <article className="panel content-panel"><div className="section-title"><div><p>Вклад через Git</p><h2>Pull Request</h2></div><button className="primary-button" disabled={!connected || !availableTask || busyAction === "create-pr"} onClick={onCreate}>{busyAction === "create-pr" ? <LoaderCircle className="spin" /> : <GitPullRequestArrow />}{availableTask ? "Создать PR из задачи" : "Все задачи уже связаны"}</button></div>{!connected ? <div className="handoff-banner"><AlertTriangle /><div><strong>Сначала подключите Git-профиль</strong><p>Fallback не хранит токен, но имитирует безопасный OAuth-сценарий.</p></div></div> : null}<div className="git-pr-list">{pulls.length ? pulls.map((pr) => <PullRequestCard key={pr.id} pull={pr} busyAction={busyAction} onChecks={onChecks} onMerge={onMerge} />) : <div className="empty-state"><GitPullRequestArrow /><h3>Pull Request пока нет</h3><p>Возьмите открытую задачу и создайте демонстрационный PR.</p></div>}</div></article>;
}

function PullRequestCard({ pull, busyAction, onChecks, onMerge }: { pull: GitPullRequestRecord; busyAction: string | null; onChecks: (id: string) => Promise<void>; onMerge: (id: string) => Promise<void> }) {
  const successful = pull.checks.filter((check) => check.conclusion === "success").length;
  return <article className="git-pr-card"><header><span className={`pr-state ${pull.state}`}><GitPullRequestArrow /></span><div><strong>#{pull.number} {pull.title}</strong><small>{pull.branch} → {pull.baseBranch} · @{pull.author}</small></div><Badge tone={pull.state === "merged" ? "success" : pull.state === "ready" ? "violet" : "warning"}>{pull.state}</Badge></header><p>{pull.summary}</p><div className="git-diff-line"><span>+{pull.additions}</span><span>-{pull.deletions}</span><span>{pull.changedFiles} файлов</span></div><div className="git-check-grid">{pull.checks.map((check) => <CheckItem key={check.id} name={check.name} conclusion={check.conclusion} duration={check.durationLabel} />)}</div><footer><span>{successful}/{pull.checks.length} проверок · review: {pull.reviewStatus}</span>{pull.state === "open" ? <button className="ghost-button" disabled={busyAction === `checks-${pull.id}`} onClick={() => onChecks(pull.id)}><Play />Запустить CI</button> : null}{pull.state === "ready" ? <button className="primary-button" disabled={busyAction === `merge-${pull.id}`} onClick={() => onMerge(pull.id)}><GitMerge />Merge и начислить XP</button> : null}{pull.state === "merged" ? <Badge tone="success"><UserRoundCheck />XP начислен</Badge> : null}</footer></article>;
}

function CheckItem({ name, conclusion, duration }: { name: string; conclusion: GitCheckConclusion; duration: string }) {
  return <div className={`git-check ${conclusion}`}>{conclusion === "pending" ? <LoaderCircle /> : conclusion === "success" ? <CheckCircle2 /> : <AlertTriangle />}<div><strong>{name}</strong><small>{duration}</small></div></div>;
}

function CommitsTab({ commits }: { commits: import("@/types/platform").GitCommitRecord[] }) {
  return <article className="panel content-panel"><div className="section-title"><div><p>История изменений</p><h2>Последние коммиты</h2></div><GitCommit /></div><div className="git-commit-list">{commits.map((commit) => <article key={commit.id}><GitCommit /><div><strong>{commit.message}</strong><small>{commit.sha} · {commit.author} · {commit.branch}</small></div><aside>{commit.verified ? <Badge tone="success">Verified</Badge> : <Badge>Unverified</Badge>}<span>{commit.createdAt}</span></aside></article>)}</div></article>;
}
