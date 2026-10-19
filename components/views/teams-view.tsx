"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Bookmark, Code2, Edit3, FolderGit2, Plus, Search, Star, UsersRound } from "lucide-react";
import { Badge, Progress } from "@/components/ui/primitives";
import { usePlatform } from "@/components/platform-provider";

export function ProjectsView({ onCreateProject, onOpenWorkspace, onEditProject }: { onCreateProject: () => void; onOpenWorkspace: (projectId: string) => void; onEditProject: (projectId: string) => void }) {
  const { state, joinProject, toggleSavedProject, saving } = usePlatform();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Все");
  const filtered = useMemo(() => state.projects.filter((project) => {
    const owner = project.ownerId === state.profile.nickname || project.ownerId === state.profile.publicProfileSlug;
    const visible = project.status === "published" || owner;
    const matchesFilter = filter === "Все" || project.stage === filter || (filter === "Для новичков" && project.beginnerFriendly) || (filter === "Мои проекты" && owner) || (filter === "Черновики" && owner && project.status === "draft");
    const haystack = `${project.title} ${project.summary} ${project.stack.join(" ")} ${project.needs.join(" ")} ${project.tags.join(" ")}`.toLowerCase();
    return visible && matchesFilter && haystack.includes(query.toLowerCase());
  }), [filter, query, state.profile.nickname, state.profile.publicProfileSlug, state.projects]);

  return <div className="view-stack">
    <div className="page-intro panel padded"><div><Badge tone="violet">Open source — основа платформы</Badge><h2>Проекты, которые развивает сообщество</h2><p>У каждого проекта теперь есть публичная страница, roadmap, новости, роли, задачи, правила участия и отдельный редактор автора.</p></div><button className="primary-button" onClick={onCreateProject}><Plus />Создать открытый проект</button></div>
    <div className="filter-bar panel padded"><label className="search-box wide"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по названию, стеку и нужным ролям" /></label><div className="segmented">{["Все", "Мои проекты", "Черновики", "Идея", "Прототип", "MVP", "Развитие", "Для новичков"].map((item) => <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div></div>
    <div className="opensource-grid">{filtered.map((project, index) => {
      const joined = state.joinedProjectIds.includes(project.id);
      const saved = state.savedProjectIds.includes(project.id);
      const owner = project.ownerId === state.profile.nickname || project.ownerId === state.profile.publicProfileSlug;
      return <article className="opensource-card panel" key={project.id}><div className={`team-cover team-cover-${(index % 3) + 1}`}><span>{project.initials}</span><div className="project-card-actions"><Badge tone={project.status === "draft" ? "warning" : project.beginnerFriendly ? "success" : "default"}>{project.status === "draft" ? "Черновик" : project.stage}</Badge><button className={`icon-button ${saved ? "bookmarked" : ""}`} onClick={() => toggleSavedProject(project.id)} aria-label="Сохранить проект"><Bookmark fill={saved ? "currentColor" : "none"} /></button></div></div><div className="opensource-card-body"><div className="project-license-line"><span><FolderGit2 />{project.repository}</span><Badge>{project.license}</Badge></div><h3>{project.title}</h3><strong>{project.tagline}</strong><p>{project.summary}</p><div className="tag-list">{project.stack.map((item) => <span key={item}>{item}</span>)}</div><div className="project-health"><div><span>Развитие проекта</span><Progress value={project.progress} label={`${project.progress}%`} /></div><div className="project-health-stats"><span><UsersRound />{project.contributors} контрибьюторов</span><span><Code2 />{project.tasks.length} задач</span><span><Star />{project.subscribers} подписчиков</span></div></div><div className="open-needs"><small>Сейчас нужны</small><div>{project.needs.map((need) => <span key={need}>{need}</span>)}</div></div><div className="project-card-footer">{joined ? <button className="primary-button" onClick={() => onOpenWorkspace(project.id)}>Рабочая комната <ArrowRight /></button> : <button className="primary-button" disabled={saving} onClick={() => joinProject(project.id)}>Присоединиться</button>}<Link className="ghost-button" href={`/p/${project.slug}`}>Публичная страница</Link>{owner ? <button className="icon-button" onClick={() => onEditProject(project.id)} aria-label="Редактировать проект"><Edit3 /></button> : null}</div></div></article>;
    })}</div>
    {!filtered.length ? <div className="panel empty-state"><FolderGit2 /><h3>Проекты не найдены</h3><p>Измените фильтр или создайте новый open-source проект.</p><button className="primary-button" onClick={onCreateProject}>Создать проект</button></div> : null}
  </div>;
}
