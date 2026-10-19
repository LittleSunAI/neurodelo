"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Bell, BellOff, BookOpenCheck, CheckCircle2, Code2, ExternalLink, FileText, GitBranch, GitFork, HelpCircle, History, MessageCircle, Rocket, ShieldCheck, Sparkles, Star, UsersRound } from "lucide-react";
import { Badge, Progress } from "@/components/ui/primitives";
import { usePlatform } from "@/components/platform-provider";
import type { OpenSourceProject } from "@/types/platform";
import { validateUserExternalUrl } from "@/lib/server/url-policy";

type PublicTab = "overview" | "tasks" | "roadmap" | "team" | "news" | "faq";

export function PublicProjectPage({ slug }: { slug: string }) {
  const { state, hydrated, authSession, joinProject, toggleProjectSubscription, selectProject, saving } = usePlatform();
  const [tab, setTab] = useState<PublicTab>("overview");
  const project = useMemo(() => state.projects.find((item) => item.slug === slug || item.id === slug), [slug, state.projects]);
  if (!hydrated) return <main className="public-profile-shell"><div className="platform-loader"><Sparkles className="spin" /><strong>Загружаем проект</strong></div></main>;
  const isOwner = Boolean(project && (project.ownerId === state.profile.nickname || project.ownerId === state.profile.publicProfileSlug));
  if (!project || project.status === "archived" || (project.status === "draft" && !isOwner)) return <main className="public-profile-shell"><header className="public-profile-top"><Link href="/" className="auth-brand"><span className="brand-mark"><span /></span><strong>NEURODELO</strong></Link></header><section className="panel public-project-missing"><HelpCircle /><h1>Проект не найден</h1><p>Возможно, он находится в черновиках, был перемещён или архивирован.</p><Link href="/" className="primary-button">Открыть каталог</Link></section></main>;

  const projectId = project.id;
  const joined = state.joinedProjectIds.includes(projectId);
  const subscribed = state.subscribedProjectIds.includes(projectId);

  function requireLogin() { window.location.assign(`/login?returnTo=${encodeURIComponent(`/p/${slug}`)}`); }

  async function openWorkspace(edit = false) {
    if (!authSession.authenticated) { requireLogin(); return; }
    await selectProject(projectId);
    window.location.assign(`/?project=${encodeURIComponent(projectId)}${edit ? "&edit=1" : ""}`);
  }

  return <main className="public-project-shell">
    <header className="public-profile-top"><Link href="/" className="auth-brand"><span className="brand-mark"><span /></span><strong>NEURODELO</strong></Link><nav><Link href="/">Каталог</Link><Link href={`/u/${state.profile.publicProfileSlug}`}>Мой профиль</Link></nav></header>
    <section className="public-project-hero panel">
      <div className="public-project-cover"><span>{project.initials}</span></div>
      <div className="public-project-title"><div className="project-badge-row"><Badge tone="success">{project.status === "published" ? "Открытый проект" : "Черновик"}</Badge><Badge>{project.license}</Badge><Badge tone={project.beginnerFriendly ? "violet" : "default"}>{project.stage}</Badge></div><h1>{project.title}</h1><strong>{project.tagline}</strong><p>{project.summary}</p><div className="tag-list">{project.tags.map((item) => <span key={item}>{item}</span>)}</div><div className="public-project-meta"><span><GitBranch />{project.repository}</span><span><UsersRound />{project.contributors} участников</span><span><Star />{project.subscribers} подписчиков</span><span><MessageCircle />{project.forumThreads} обсуждений</span></div></div>
      <div className="public-project-actions"><button className="primary-button" disabled={saving} onClick={() => authSession.authenticated ? (joined ? openWorkspace(false) : joinProject(project.id)) : requireLogin()}>{joined ? <>Рабочая комната <ArrowRight /></> : <>Присоединиться <UsersRound /></>}</button><button className="ghost-button" disabled={saving} onClick={() => authSession.authenticated ? toggleProjectSubscription(project.id) : requireLogin()}>{subscribed ? <><BellOff />Отписаться</> : <><Bell />Следить</>}</button>{isOwner ? <button className="ghost-button" onClick={() => openWorkspace(true)}>Редактировать</button> : null}</div>
    </section>

    <nav className="panel public-project-tabs">{([ ["overview", "Обзор"], ["tasks", "Задачи"], ["roadmap", "Roadmap"], ["team", "Команда"], ["news", "Новости"], ["faq", "FAQ"] ] as Array<[PublicTab, string]>).map(([id, label]) => <button className={tab === id ? "active" : ""} key={id} onClick={() => setTab(id)}>{label}</button>)}</nav>

    <div className="public-project-layout">
      <section className="view-stack">
        {tab === "overview" ? <ProjectOverview project={project} /> : null}
        {tab === "tasks" ? <ProjectTasks project={project} onOpenWorkspace={() => openWorkspace(false)} /> : null}
        {tab === "roadmap" ? <ProjectRoadmap project={project} /> : null}
        {tab === "team" ? <ProjectTeam project={project} /> : null}
        {tab === "news" ? <ProjectNews project={project} /> : null}
        {tab === "faq" ? <ProjectFaq project={project} /> : null}
      </section>
      <aside className="view-stack">
        <article className="panel public-project-progress"><div className="section-title"><div><p>Состояние</p><h2>{project.progress}% готово</h2></div></div><Progress value={project.progress} /><div className="project-side-stats"><span><Code2 /><strong>{project.tasks.length}</strong> открытых задач</span><span><UsersRound /><strong>{project.roles.reduce((sum, role) => sum + Math.max(0, role.slots - role.filled), 0)}</strong> свободных ролей</span><span><GitFork /><strong>{project.releases.length}</strong> релизов</span></div></article>
        <article className="panel content-panel"><div className="section-title"><div><p>Владелец проекта</p><h2>{project.ownerName}</h2></div></div><p>Мейнтейнер отвечает за roadmap, правила вклада и решения основной ветки.</p><Link className="ghost-button full" href={`/u/${project.ownerId}`}>Открыть профиль</Link></article>
        <article className="panel content-panel"><div className="section-title"><div><p>Правила</p><h2>Открытый вклад</h2></div><ShieldCheck /></div><ul className="public-project-rules"><li><CheckCircle2 />XP только за принятый результат</li><li><CheckCircle2 />Код через Pull Request</li><li><CheckCircle2 />Лицензия {project.license}</li><li><CheckCircle2 />Один вклад — одна понятная задача</li></ul></article>
      </aside>
    </div>
  </main>;
}

type Project = OpenSourceProject;

function ProjectOverview({ project }: { project: Project }) {
  const repositoryUrl = validateUserExternalUrl(project.repository.startsWith("http") ? project.repository : `https://github.com/${project.repository}`);
  const contributingUrl = repositoryUrl ? `${repositoryUrl.replace(/\/$/, "")}/blob/${encodeURIComponent(project.defaultBranch)}/CONTRIBUTING.md` : null;
  return <><article className="panel content-panel"><div className="section-title"><div><p>О проекте</p><h2>Что создаёт команда</h2></div><Badge tone="violet"><Rocket />{project.stage}</Badge></div><p className="public-project-description">{project.description}</p><div className="project-stack-grid"><article><strong>Технологии</strong><div className="tag-list">{project.stack.map((item) => <span key={item}>{item}</span>)}</div></article><article><strong>Сейчас нужны</strong><div className="tag-list">{project.needs.map((item) => <span key={item}>{item}</span>)}</div></article></div></article><article className="panel content-panel"><div className="section-title"><div><p>Быстрый старт</p><h2>README</h2></div><FileText /></div><p className="document-preview">{project.readme}</p><div className="button-row">{repositoryUrl ? <a className="ghost-button" href={repositoryUrl} target="_blank" rel="noopener noreferrer"><ExternalLink />Открыть репозиторий</a> : <button className="ghost-button" disabled><ExternalLink />Некорректная ссылка</button>}{contributingUrl ? <a className="ghost-button" href={contributingUrl} target="_blank" rel="noopener noreferrer"><BookOpenCheck />CONTRIBUTING</a> : null}</div></article><article className="panel content-panel"><div className="section-title"><div><p>Последние версии</p><h2>Релизы</h2></div><History /></div><div className="release-list">{project.releases.length ? project.releases.map((release) => <article key={release.id}><Badge tone="success">{release.version}</Badge><div><strong>{release.title}</strong><p>{release.summary}</p><small>{release.publishedAt} · {release.contributionCount} вкладов</small></div></article>) : <p>Первый релиз ещё готовится.</p>}</div></article></>;
}

function ProjectTasks({ project, onOpenWorkspace }: { project: Project; onOpenWorkspace: () => void }) {
  return <article className="panel content-panel"><div className="section-title"><div><p>Можно помочь сейчас</p><h2>Открытые задачи</h2></div><Badge tone="success">{project.tasks.length} доступно</Badge></div><div className="public-task-list">{project.tasks.map((task) => <article key={task.id}><div><Badge tone={task.difficulty === "Начальная" ? "success" : task.difficulty === "Средняя" ? "warning" : "danger"}>{task.difficulty}</Badge><h3>{task.title}</h3><p>{task.summary}</p><div className="tag-list">{task.skills.map((skill) => <span key={skill}>{skill}</span>)}</div></div><aside><strong>+{task.rewardXp} XP</strong><span>{task.estimatedTime}</span><button className="primary-button" onClick={onOpenWorkspace}>Открыть задачу</button></aside></article>)}</div></article>;
}

function ProjectRoadmap({ project }: { project: Project }) {
  return <article className="panel content-panel"><div className="section-title"><div><p>Публичный план</p><h2>Roadmap</h2></div></div><div className="public-roadmap-list">{project.roadmap.map((item) => <article key={item.id}><span className={`roadmap-state ${item.state}`}>{item.state === "done" ? <CheckCircle2 /> : item.state === "active" ? <Rocket /> : <History />}</span><div><div className="roadmap-title-line"><strong>{item.title}</strong><Badge>{item.targetVersion}</Badge></div><p>{item.summary}</p><Progress value={item.progress} label={`${item.progress}% · ${item.dueLabel}`} /></div></article>)}</div></article>;
}

function ProjectTeam({ project }: { project: Project }) {
  return <article className="panel content-panel"><div className="section-title"><div><p>Кого ищет проект</p><h2>Открытые роли</h2></div></div><div className="public-role-grid">{project.roles.map((role) => <article key={role.id}><UsersRound /><div><strong>{role.title}</strong><p>{role.summary}</p><span>{role.skill} · уровень {role.minLevel}+ · {Math.max(0, role.slots - role.filled)} мест</span></div><Badge tone={role.mentorAvailable ? "violet" : "default"}>{role.mentorAvailable ? "Есть наставник" : "Самостоятельно"}</Badge></article>)}</div></article>;
}

function ProjectNews({ project }: { project: Project }) {
  return <article className="panel content-panel"><div className="section-title"><div><p>Журнал проекта</p><h2>Новости и решения</h2></div></div><div className="public-news-list">{project.news.map((item) => <article key={item.id}><div className="news-icon">{item.pinned ? <Star /> : <MessageCircle />}</div><div><strong>{item.title}</strong><p>{item.summary}</p><small>{item.author} · {item.publishedAt}</small></div>{item.pinned ? <Badge tone="violet">Закреплено</Badge> : null}</article>)}</div></article>;
}

function ProjectFaq({ project }: { project: Project }) {
  return <article className="panel content-panel"><div className="section-title"><div><p>Частые вопросы</p><h2>FAQ</h2></div></div><div className="faq-list">{project.faq.map((item) => <details key={item.id}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></article>;
}
