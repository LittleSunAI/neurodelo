"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Award, BookOpenCheck, CheckCircle2, CircleDot, Code2, ExternalLink, FileText, GitBranch, GitCommit, GitMerge, GitPullRequestArrow, History, MessageCircle, Plus, Rocket, ShieldCheck, Sparkles, UsersRound, X } from "lucide-react";
import { Badge, Progress } from "@/components/ui/primitives";
import { usePlatform } from "@/components/platform-provider";
import type { ContributionDifficulty, ContributionKind, RoleId } from "@/types/platform";

type TabId = "overview" | "roadmap" | "tasks" | "team" | "repository" | "recognition" | "news";
type DialogId = "task" | "news" | "invite" | null;

export function ProjectView({ role, onOpenRecognition, onOpenGit, onEditProject }: { role: RoleId; onOpenRecognition: () => void; onOpenGit: () => void; onEditProject: () => void }) {
  const { state, addProjectTask, addProjectNews, saving } = usePlatform();
  const project = useMemo(() => state.projects.find((item) => item.id === state.selectedProjectId) ?? state.projects[0], [state.projects, state.selectedProjectId]);
  const [tab, setTab] = useState<TabId>("overview");
  const [dialog, setDialog] = useState<DialogId>(null);
  if (!project) return <div className="panel empty-state"><GitBranch /><h3>Проект не выбран</h3></div>;
  const isOwner = project.ownerId === state.profile.nickname || project.ownerId === state.profile.publicProfileSlug;

  async function createTask(title: string, summary: string) {
    await addProjectTask(project.id, {
      id: `${project.id}-task-${Date.now()}`,
      projectId: project.id,
      project: project.title,
      title,
      category: "Frontend",
      kind: "Код" as ContributionKind,
      difficulty: "Начальная" as ContributionDifficulty,
      rewardXp: 180,
      estimatedTime: "1–2 часа",
      applicants: 0,
      slots: 1,
      requiredLevel: 1,
      summary,
      skills: ["Git", "Open source"],
      issueLabel: "good-first-issue",
      mentorReview: true,
      repositoryPath: `issues/${project.tasks.length + 1}`,
    });
  }

  async function createNews(title: string, summary: string) {
    await addProjectNews(project.id, { id: `${project.id}-news-${Date.now()}`, title, summary, publishedAt: "только что", author: state.profile.name, pinned: false });
  }

  return <div className="view-stack">
    <section className="project-hero panel"><div className="project-symbol">{project.initials}</div><div className="project-hero-copy"><div className="project-badge-row"><Badge tone="success">{project.status === "published" ? "Открытый проект" : "Черновик"}</Badge><Badge>{project.license}</Badge><Badge tone="violet">{project.stage}</Badge></div><h2>{project.title}</h2><p>{project.tagline}</p><div className="project-repo-line"><GitBranch />{project.repository} · {project.defaultBranch}</div></div><div className="project-hero-actions"><Link className="ghost-button" href={`/p/${project.slug}`}><ExternalLink />Публичная страница</Link>{isOwner || role === "maintainer" ? <button className="primary-button" onClick={onEditProject}>Редактировать проект</button> : null}</div></section>
    <nav className="panel project-tabs">{([ ["overview", "Обзор"], ["roadmap", "Roadmap"], ["tasks", "Задачи"], ["team", "Команда"], ["repository", "Репозиторий"], ["recognition", "Признание"], ["news", "Новости"] ] as Array<[TabId, string]>).map(([id, label]) => <button className={tab === id ? "active" : ""} key={id} onClick={() => setTab(id)}>{label}</button>)}</nav>

    {tab === "overview" ? <OverviewTab project={project} /> : null}
    {tab === "roadmap" ? <RoadmapTab project={project} /> : null}
    {tab === "tasks" ? <TasksTab project={project} canManage={isOwner || role === "maintainer"} onAdd={() => setDialog("task")} onOpenGit={onOpenGit} /> : null}
    {tab === "team" ? <TeamTab project={project} canManage={isOwner || role === "maintainer"} onInvite={() => setDialog("invite")} /> : null}
    {tab === "repository" ? <RepositoryTab project={project} onOpenGit={onOpenGit} /> : null}
    {tab === "recognition" ? <RecognitionTab project={project} onOpenRecognition={onOpenRecognition} /> : null}
    {tab === "news" ? <NewsTab project={project} canManage={isOwner || role === "maintainer"} onAdd={() => setDialog("news")} /> : null}
    {dialog ? <ProjectDialog id={dialog} saving={saving} onClose={() => setDialog(null)} onCreateTask={createTask} onCreateNews={createNews} /> : null}
  </div>;
}

type Project = import("@/types/platform").OpenSourceProject;

function OverviewTab({ project }: { project: Project }) {
  return <div className="project-overview-grid"><section className="view-stack"><article className="panel content-panel"><div className="section-title"><div><p>О проекте</p><h2>{project.summary}</h2></div><Badge tone="violet">{project.progress}%</Badge></div><p>{project.description}</p><div className="tag-list">{project.stack.map((item) => <span key={item}>{item}</span>)}</div><div className="project-overview-stats"><article><UsersRound /><strong>{project.contributors}</strong><span>контрибьюторов</span></article><article><Code2 /><strong>{project.tasks.length}</strong><span>открытых задач</span></article><article><MessageCircle /><strong>{project.forumThreads}</strong><span>обсуждений</span></article><article><Sparkles /><strong>{project.subscribers}</strong><span>подписчиков</span></article></div></article><article className="panel content-panel"><div className="section-title"><div><p>Последние события</p><h2>Лента проекта</h2></div></div><div className="timeline">{project.news.slice(0, 3).map((item) => <div key={item.id}><span className="timeline-icon violet"><Sparkles /></span><div><strong>{item.title}</strong><p>{item.summary} · {item.publishedAt}</p></div></div>)}</div></article></section><aside className="view-stack"><article className="panel content-panel"><div className="section-title"><div><p>Текущий этап</p><h2>{project.roadmap.find((item) => item.state === "active")?.title ?? "Планируется"}</h2></div></div><Progress value={project.progress} label={`${project.progress}%`} /><p>{project.roadmap.find((item) => item.state === "active")?.summary ?? "Автор проекта готовит следующий этап."}</p></article><article className="panel content-panel"><div className="section-title"><div><p>Ответственный</p><h2>{project.ownerName}</h2></div><ShieldCheck /></div><p>Владелец roadmap и решений основной ветки. Код остаётся доступным по лицензии {project.license}.</p></article></aside></div>;
}

function RoadmapTab({ project }: { project: Project }) {
  return <article className="panel content-panel"><div className="section-title"><div><p>Версии и результаты</p><h2>Публичный roadmap</h2></div><Badge tone="success">{project.roadmap.filter((item) => item.state === "done").length} завершено</Badge></div><div className="public-roadmap-list">{project.roadmap.map((item) => <article key={item.id}><span className={`roadmap-state ${item.state}`}>{item.state === "done" ? <CheckCircle2 /> : item.state === "active" ? <Rocket /> : <History />}</span><div><div className="roadmap-title-line"><strong>{item.title}</strong><Badge>{item.targetVersion}</Badge></div><p>{item.summary}</p><Progress value={item.progress} label={`${item.progress}% · ${item.dueLabel}`} /></div></article>)}</div></article>;
}

function TasksTab({ project, canManage, onAdd, onOpenGit }: { project: Project; canManage: boolean; onAdd: () => void; onOpenGit: () => void }) {
  return <article className="panel content-panel"><div className="section-title"><div><p>Issue и небольшие результаты</p><h2>Задачи проекта</h2></div>{canManage ? <button className="primary-button" onClick={onAdd}><Plus />Добавить задачу</button> : null}</div><div className="contribution-review-list">{project.tasks.map((task) => <article key={task.id}><span className="pr-icon"><GitPullRequestArrow /></span><div><strong>{task.title}</strong><small>{task.category} · уровень {task.requiredLevel}+ · {task.estimatedTime}</small></div><Badge tone={task.difficulty === "Начальная" ? "success" : task.difficulty === "Средняя" ? "warning" : "danger"}>+{task.rewardXp} XP</Badge><button className="ghost-button" onClick={onOpenGit}>Открыть</button></article>)}</div><div className="handoff-banner"><GitMerge /><div><strong>XP начисляется за проверяемый результат</strong><p>Для программного вклада обычно требуется принятый Pull Request. Документация и исследования подтверждаются мейнтейнером по опубликованным критериям.</p></div></div></article>;
}

function TeamTab({ project, canManage, onInvite }: { project: Project; canManage: boolean; onInvite: () => void }) {
  return <article className="panel content-panel"><div className="section-title"><div><p>Нужные навыки</p><h2>Открытые роли</h2></div>{canManage ? <button className="primary-button" onClick={onInvite}>Пригласить участника</button> : null}</div><div className="public-role-grid">{project.roles.map((role) => <article key={role.id}><UsersRound /><div><strong>{role.title}</strong><p>{role.summary}</p><span>{role.skill} · уровень {role.minLevel}+ · занято {role.filled}/{role.slots}</span></div><Badge tone={role.mentorAvailable ? "violet" : "default"}>{role.mentorAvailable ? "Есть наставник" : "Без наставника"}</Badge></article>)}</div></article>;
}

function RepositoryTab({ project, onOpenGit }: { project: Project; onOpenGit: () => void }) {
  const { state, gitMode } = usePlatform();
  const repository = state.git.repositories.find((item) => item.projectId === project.id);
  const issues = repository ? state.git.issues.filter((item) => item.repositoryId === repository.id) : [];
  const pulls = repository ? state.git.pullRequests.filter((item) => item.repositoryId === repository.id) : [];
  const commits = repository ? state.git.commits.filter((item) => item.repositoryId === repository.id) : [];
  return <div className="view-stack"><article className="panel content-panel git-summary"><div className="section-title"><div><p>Публичный Git-репозиторий</p><h2>{repository?.fullName ?? project.repository}</h2></div><Badge tone="success">{gitMode === "fallback" ? "Git fallback" : "Git API"}</Badge></div><div className="git-metrics"><article><GitCommit /><strong>{commits.length}</strong><span>загружено коммитов</span></article><article><GitMerge /><strong>{pulls.filter((item) => item.state === "merged").length}</strong><span>принятых PR</span></article><article><GitPullRequestArrow /><strong>{pulls.filter((item) => item.state !== "merged").length}</strong><span>активных PR</span></article><article><CircleDot /><strong>{issues.filter((item) => item.state === "open").length}</strong><span>открытых issues</span></article></div><div className="git-branch-card"><div><span className="branch-dot" /><div><strong>{repository?.defaultBranch ?? project.defaultBranch}</strong><small>Protected branch · проверки перед merge</small></div></div><Badge tone="success">{repository?.lastSyncedAt ?? "не синхронизирован"}</Badge></div><button className="primary-button" onClick={onOpenGit}><GitBranch />Открыть центр Git</button></article><article className="panel content-panel"><div className="section-title"><div><p>Базовые документы</p><h2>Правила участия</h2></div></div><div className="fact-grid"><article><FileText /><div><strong>README.md</strong><p>{repository?.readme ?? project.readme}</p></div></article><article><BookOpenCheck /><div><strong>CONTRIBUTING.md</strong><p>{project.contributionGuide}</p></div></article><article><ShieldCheck /><div><strong>LICENSE</strong><p>Проект опубликован по лицензии {project.license}.</p></div></article><article><UsersRound /><div><strong>CODE_OF_CONDUCT.md</strong><p>{project.codeOfConduct}</p></div></article></div></article></div>;
}

function RecognitionTab({ project, onOpenRecognition }: { project: Project; onOpenRecognition: () => void }) {
  return <div className="view-stack"><article className="panel content-panel"><div className="section-title"><div><p>Правила проекта</p><h2>Как начисляется XP</h2></div><Badge tone="violet">До {project.xpPolicy.maxTaskXp} XP</Badge></div><div className="recognition-steps"><article><span>1</span><div><strong>Выбрать задачу</strong><p>Проверить уровень, критерии готовности и свободный слот.</p></div></article><article><span>2</span><div><strong>Отправить результат</strong><p>{project.xpPolicy.requiresMergeForCode ? "Код оформляется Pull Request и требует merge." : "Код может быть подтверждён мейнтейнером без обязательного merge."}</p></div></article><article><span>3</span><div><strong>Пройти проверку</strong><p>Учитываются тесты, качество, документация и завершённость.</p></div></article><article><span>4</span><div><strong>Получить подтверждение</strong><p>Вклад появляется в портфолио и повышает профильный навык.</p></div></article></div></article><article className="panel content-panel"><div className="section-title"><div><p>Благодарность участникам</p><h2>Признание вклада</h2></div><Award /></div><p>Автор может публично поблагодарить участника, отметить его в релизе и выдать косметическую награду. Профессиональный XP определяется проверяемым результатом, а не личной симпатией.</p><button className="primary-button" onClick={onOpenRecognition}>Открыть центр признания</button></article></div>;
}

function NewsTab({ project, canManage, onAdd }: { project: Project; canManage: boolean; onAdd: () => void }) {
  return <article className="panel content-panel"><div className="section-title"><div><p>Решения и обновления</p><h2>Новости проекта</h2></div>{canManage ? <button className="primary-button" onClick={onAdd}><Plus />Добавить новость</button> : null}</div><div className="public-news-list">{project.news.map((item) => <article key={item.id}><div className="news-icon">{item.pinned ? <Sparkles /> : <MessageCircle />}</div><div><strong>{item.title}</strong><p>{item.summary}</p><small>{item.author} · {item.publishedAt}</small></div>{item.pinned ? <Badge tone="violet">Закреплено</Badge> : null}</article>)}</div></article>;
}

function ProjectDialog({ id, saving, onClose, onCreateTask, onCreateNews }: { id: Exclude<DialogId, null>; saving: boolean; onClose: () => void; onCreateTask: (title: string, summary: string) => Promise<void>; onCreateNews: (title: string, summary: string) => Promise<void> }) {
  const [title, setTitle] = useState(id === "task" ? "Новая задача для сообщества" : id === "news" ? "Обновление проекта" : "@username");
  const [summary, setSummary] = useState(id === "task" ? "Опишите небольшой результат и критерии готовности." : "Расскажите, что изменилось и где нужна помощь.");
  const [done, setDone] = useState(false);
  async function submit() { if (id === "task") await onCreateTask(title, summary); if (id === "news") await onCreateNews(title, summary); setDone(true); }
  return <div className="modal-layer" role="dialog" aria-modal="true"><button className="modal-backdrop" onClick={onClose} aria-label="Закрыть" /><section className="modal-card compact-modal"><header className="modal-header"><div><Badge tone="violet">{id === "task" ? "Новая задача" : id === "news" ? "Новость" : "Команда"}</Badge><h2>{id === "task" ? "Добавить задачу" : id === "news" ? "Опубликовать новость" : "Пригласить участника"}</h2></div><button className="icon-button" onClick={onClose} aria-label="Закрыть"><X /></button></header>{done ? <div className="dialog-success"><CheckCircle2 /><h3>Сохранено в fallback-режиме</h3><p>Изменение уже отражается в локальном проекте.</p><button className="ghost-button" onClick={onClose}>Закрыть</button></div> : <div className="compact-modal-body"><label className="field-label">{id === "invite" ? "Пользователь" : "Заголовок"}</label><input value={title} onChange={(event) => setTitle(event.target.value)} />{id !== "invite" ? <><label className="field-label">Описание</label><textarea value={summary} onChange={(event) => setSummary(event.target.value)} /></> : <div className="assistant-hint"><UsersRound /><div><strong>Права выдаются отдельно</strong><span>Приглашение не открывает доступ к основной ветке автоматически.</span></div></div>}<button className="primary-button full" disabled={saving} onClick={submit}>{id === "invite" ? "Отправить приглашение" : "Сохранить"}</button></div>}</section></div>;
}
