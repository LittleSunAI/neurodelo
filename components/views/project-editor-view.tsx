"use client";

import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { CheckCircle2, ExternalLink, FileText, GitBranch, Plus, Rocket, Save, Settings2, Sparkles, Trash2, UsersRound } from "lucide-react";
import { Badge, Progress } from "@/components/ui/primitives";
import { usePlatform } from "@/components/platform-provider";
import type { ContributionDifficulty, ContributionKind, OpenSourceProject, ProjectRoadmapState, ProjectStage } from "@/types/platform";

type EditorTab = "overview" | "roadmap" | "tasks" | "roles" | "content" | "xp";

const tabs: Array<{ id: EditorTab; label: string }> = [
  { id: "overview", label: "Основное" },
  { id: "roadmap", label: "Roadmap" },
  { id: "tasks", label: "Задачи" },
  { id: "roles", label: "Роли" },
  { id: "content", label: "Материалы" },
  { id: "xp", label: "Правила XP" },
];

export function ProjectEditorView({ onBack, onOpenPublic }: { onBack: () => void; onOpenPublic: (slug: string) => void }) {
  const { state, updateProject, addProjectTask, addProjectNews, addProjectRoadmapItem, saving } = usePlatform();
  const project = useMemo(() => state.projects.find((item) => item.id === state.selectedProjectId) ?? state.projects[0], [state.projects, state.selectedProjectId]);
  const [tab, setTab] = useState<EditorTab>("overview");
  const [draft, setDraft] = useState<OpenSourceProject>(project);
  const [saved, setSaved] = useState(false);

  if (!project) return <div className="panel content-panel"><h2>Проект не найден</h2><button className="ghost-button" onClick={onBack}>Вернуться к каталогу</button></div>;

  async function saveProject() {
    await updateProject(project.id, draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function update<K extends keyof OpenSourceProject>(key: K, value: OpenSourceProject[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  async function addRoadmap() {
    const item = {
      id: `${project.id}-road-${Date.now()}`,
      title: "Новый этап",
      summary: "Опишите проверяемый результат этапа.",
      state: "planned" as ProjectRoadmapState,
      progress: 0,
      targetVersion: "vNext",
      dueLabel: "без даты",
    };
    await addProjectRoadmapItem(project.id, item);
    setDraft((current) => ({ ...current, roadmap: [...current.roadmap, item] }));
  }

  async function addTask() {
    const task = {
      id: `${project.id}-task-${Date.now()}`,
      projectId: project.id,
      project: draft.title,
      title: "Новая задача для сообщества",
      category: "Frontend",
      kind: "Код" as ContributionKind,
      difficulty: "Начальная" as ContributionDifficulty,
      rewardXp: 180,
      estimatedTime: "1–2 часа",
      applicants: 0,
      slots: 1,
      requiredLevel: 1,
      summary: "Опишите небольшой результат и критерии готовности.",
      skills: ["Git", "Open source"],
      issueLabel: "good-first-issue",
      mentorReview: true,
      repositoryPath: `issues/${draft.tasks.length + 1}`,
    };
    await addProjectTask(project.id, task);
    setDraft((current) => ({ ...current, tasks: [task, ...current.tasks], openTasks: current.tasks.length + 1 }));
  }

  async function addNews() {
    const item = {
      id: `${project.id}-news-${Date.now()}`,
      title: "Новость проекта",
      summary: "Коротко расскажите сообществу, что изменилось и где нужна помощь.",
      publishedAt: "только что",
      author: state.profile.name,
      pinned: false,
    };
    await addProjectNews(project.id, item);
    setDraft((current) => ({ ...current, news: [item, ...current.news] }));
  }

  return <div className="view-stack project-editor-view">
    <section className="panel project-editor-hero">
      <div className="project-editor-symbol">{draft.initials}</div>
      <div className="project-editor-heading"><Badge tone={draft.status === "published" ? "success" : "warning"}>{draft.status === "published" ? "Опубликован" : "Черновик"}</Badge><h2>{draft.title}</h2><p>{draft.repository} · обновлено {draft.updatedAt}</p></div>
      <div className="project-editor-actions"><button className="ghost-button" onClick={onBack}>К каталогу</button><button className="ghost-button" onClick={() => onOpenPublic(draft.slug)}><ExternalLink />Публичная страница</button><button className="primary-button" disabled={saving} onClick={saveProject}>{saved ? <CheckCircle2 /> : <Save />}{saved ? "Сохранено" : "Сохранить"}</button></div>
    </section>

    <div className="project-editor-layout">
      <aside className="panel project-editor-nav">
        <div className="project-editor-progress"><span>Готовность страницы</span><Progress value={projectCompleteness(draft)} label={`${projectCompleteness(draft)}%`} /></div>
        {tabs.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => setTab(item.id)}>{item.label}</button>)}
        <div className="project-editor-status"><GitBranch /><div><strong>{draft.defaultBranch}</strong><span>{draft.license} · {draft.stage}</span></div></div>
      </aside>

      <section className="panel content-panel project-editor-content">
        {tab === "overview" ? <OverviewEditor draft={draft} update={update} /> : null}
        {tab === "roadmap" ? <RoadmapEditor draft={draft} setDraft={setDraft} onAdd={addRoadmap} /> : null}
        {tab === "tasks" ? <TasksEditor draft={draft} setDraft={setDraft} onAdd={addTask} /> : null}
        {tab === "roles" ? <RolesEditor draft={draft} setDraft={setDraft} /> : null}
        {tab === "content" ? <ContentEditor draft={draft} update={update} onAddNews={addNews} /> : null}
        {tab === "xp" ? <XpEditor draft={draft} setDraft={setDraft} /> : null}
      </section>
    </div>
  </div>;
}

function OverviewEditor({ draft, update }: { draft: OpenSourceProject; update: <K extends keyof OpenSourceProject>(key: K, value: OpenSourceProject[K]) => void }) {
  return <div className="editor-section-stack"><div className="section-title"><div><p>Публичная карточка</p><h2>Основная информация</h2></div><Badge tone="violet"><Settings2 />Редактор</Badge></div>
    <div className="form-grid"><label><span>Название</span><input value={draft.title} onChange={(event) => update("title", event.target.value)} /></label><label><span>Slug</span><input value={draft.slug} onChange={(event) => update("slug", slugify(event.target.value))} /></label><label className="full"><span>Короткий слоган</span><input value={draft.tagline} onChange={(event) => update("tagline", event.target.value)} /></label><label className="full"><span>Краткое описание</span><textarea value={draft.summary} onChange={(event) => update("summary", event.target.value)} /></label><label className="full"><span>Полное описание</span><textarea className="tall-textarea" value={draft.description} onChange={(event) => update("description", event.target.value)} /></label><label><span>Репозиторий</span><input value={draft.repository} onChange={(event) => update("repository", event.target.value)} /></label><label><span>Основная ветка</span><input value={draft.defaultBranch} onChange={(event) => update("defaultBranch", event.target.value)} /></label><label><span>Лицензия</span><select value={draft.license} onChange={(event) => update("license", event.target.value as OpenSourceProject["license"])}><option>MIT</option><option>Apache-2.0</option><option>GPL-3.0</option><option>MPL-2.0</option></select></label><label><span>Стадия</span><select value={draft.stage} onChange={(event) => update("stage", event.target.value as ProjectStage)}><option>Идея</option><option>Прототип</option><option>MVP</option><option>Развитие</option></select></label><label><span>Стек через запятую</span><input value={draft.stack.join(", ")} onChange={(event) => update("stack", splitList(event.target.value))} /></label><label><span>Кого ищем</span><input value={draft.needs.join(", ")} onChange={(event) => update("needs", splitList(event.target.value))} /></label><label><span>Теги</span><input value={draft.tags.join(", ")} onChange={(event) => update("tags", splitList(event.target.value))} /></label><label><span>Прогресс, %</span><input type="number" min={0} max={100} value={draft.progress} onChange={(event) => update("progress", clamp(Number(event.target.value), 0, 100))} /></label></div>
    <div className="settings-toggle-row"><div><strong>Подходит новичкам</strong><span>Показывать проект в подборке первого вклада.</span></div><button className={`switch ${draft.beginnerFriendly ? "on" : ""}`} onClick={() => update("beginnerFriendly", !draft.beginnerFriendly)}><span /></button></div>
    <div className="settings-toggle-row"><div><strong>Проект активен</strong><span>Активные проекты отображаются в основном каталоге.</span></div><button className={`switch ${draft.active ? "on" : ""}`} onClick={() => update("active", !draft.active)}><span /></button></div>
  </div>;
}

function RoadmapEditor({ draft, setDraft, onAdd }: { draft: OpenSourceProject; setDraft: Dispatch<SetStateAction<OpenSourceProject>>; onAdd: () => void }) {
  return <div className="editor-section-stack"><div className="section-title"><div><p>План развития</p><h2>Roadmap проекта</h2></div><button className="primary-button" onClick={onAdd}><Plus />Добавить этап</button></div><div className="editor-list">{draft.roadmap.map((item) => <article className="editor-roadmap-item" key={item.id}><div className="editor-row-main"><input value={item.title} onChange={(event) => setDraft((current) => ({ ...current, roadmap: current.roadmap.map((entry) => entry.id === item.id ? { ...entry, title: event.target.value } : entry) }))} /><select value={item.state} onChange={(event) => setDraft((current) => ({ ...current, roadmap: current.roadmap.map((entry) => entry.id === item.id ? { ...entry, state: event.target.value as ProjectRoadmapState } : entry) }))}><option value="planned">Запланирован</option><option value="active">В работе</option><option value="done">Готов</option></select><button className="icon-button danger" onClick={() => setDraft((current) => ({ ...current, roadmap: current.roadmap.filter((entry) => entry.id !== item.id) }))}><Trash2 /></button></div><textarea value={item.summary} onChange={(event) => setDraft((current) => ({ ...current, roadmap: current.roadmap.map((entry) => entry.id === item.id ? { ...entry, summary: event.target.value } : entry) }))} /><div className="editor-inline-fields"><label><span>Версия</span><input value={item.targetVersion} onChange={(event) => setDraft((current) => ({ ...current, roadmap: current.roadmap.map((entry) => entry.id === item.id ? { ...entry, targetVersion: event.target.value } : entry) }))} /></label><label><span>Срок</span><input value={item.dueLabel} onChange={(event) => setDraft((current) => ({ ...current, roadmap: current.roadmap.map((entry) => entry.id === item.id ? { ...entry, dueLabel: event.target.value } : entry) }))} /></label><label><span>Прогресс</span><input type="number" min={0} max={100} value={item.progress} onChange={(event) => setDraft((current) => ({ ...current, roadmap: current.roadmap.map((entry) => entry.id === item.id ? { ...entry, progress: clamp(Number(event.target.value), 0, 100) } : entry) }))} /></label></div></article>)}</div></div>;
}

function TasksEditor({ draft, setDraft, onAdd }: { draft: OpenSourceProject; setDraft: Dispatch<SetStateAction<OpenSourceProject>>; onAdd: () => void }) {
  return <div className="editor-section-stack"><div className="section-title"><div><p>Задачи сообщества</p><h2>Открытые задачи</h2></div><button className="primary-button" onClick={onAdd}><Plus />Добавить задачу</button></div><div className="editor-list">{draft.tasks.map((task) => <article className="editor-task-item" key={task.id}><div className="editor-row-main"><input value={task.title} onChange={(event) => setDraft((current) => ({ ...current, tasks: current.tasks.map((entry) => entry.id === task.id ? { ...entry, title: event.target.value } : entry) }))} /><select value={task.difficulty} onChange={(event) => setDraft((current) => ({ ...current, tasks: current.tasks.map((entry) => entry.id === task.id ? { ...entry, difficulty: event.target.value as ContributionDifficulty } : entry) }))}><option>Начальная</option><option>Средняя</option><option>Высокая</option></select><button className="icon-button danger" onClick={() => setDraft((current) => ({ ...current, tasks: current.tasks.filter((entry) => entry.id !== task.id), openTasks: Math.max(0, current.openTasks - 1) }))}><Trash2 /></button></div><textarea value={task.summary} onChange={(event) => setDraft((current) => ({ ...current, tasks: current.tasks.map((entry) => entry.id === task.id ? { ...entry, summary: event.target.value } : entry) }))} /><div className="editor-inline-fields"><label><span>Категория</span><input value={task.category} onChange={(event) => setDraft((current) => ({ ...current, tasks: current.tasks.map((entry) => entry.id === task.id ? { ...entry, category: event.target.value } : entry) }))} /></label><label><span>XP</span><input type="number" min={0} value={task.rewardXp} onChange={(event) => setDraft((current) => ({ ...current, tasks: current.tasks.map((entry) => entry.id === task.id ? { ...entry, rewardXp: Number(event.target.value) } : entry) }))} /></label><label><span>Уровень</span><input type="number" min={1} max={10} value={task.requiredLevel} onChange={(event) => setDraft((current) => ({ ...current, tasks: current.tasks.map((entry) => entry.id === task.id ? { ...entry, requiredLevel: Number(event.target.value) } : entry) }))} /></label><label><span>Слоты</span><input type="number" min={1} value={task.slots} onChange={(event) => setDraft((current) => ({ ...current, tasks: current.tasks.map((entry) => entry.id === task.id ? { ...entry, slots: Number(event.target.value) } : entry) }))} /></label></div></article>)}</div></div>;
}

function RolesEditor({ draft, setDraft }: { draft: OpenSourceProject; setDraft: Dispatch<SetStateAction<OpenSourceProject>> }) {
  function addRole() { setDraft((current) => ({ ...current, roles: [...current.roles, { id: `${current.id}-role-${Date.now()}`, title: "Новая роль", skill: "Frontend", minLevel: 1, slots: 1, filled: 0, summary: "Опишите задачи и ожидаемый вклад.", mentorAvailable: true }] })); }
  return <div className="editor-section-stack"><div className="section-title"><div><p>Набор команды</p><h2>Открытые роли</h2></div><button className="primary-button" onClick={addRole}><Plus />Добавить роль</button></div><div className="editor-list">{draft.roles.map((role) => <article className="editor-role-item" key={role.id}><div className="editor-row-main"><input value={role.title} onChange={(event) => setDraft((current) => ({ ...current, roles: current.roles.map((entry) => entry.id === role.id ? { ...entry, title: event.target.value } : entry) }))} /><input value={role.skill} onChange={(event) => setDraft((current) => ({ ...current, roles: current.roles.map((entry) => entry.id === role.id ? { ...entry, skill: event.target.value } : entry) }))} /><button className="icon-button danger" onClick={() => setDraft((current) => ({ ...current, roles: current.roles.filter((entry) => entry.id !== role.id) }))}><Trash2 /></button></div><textarea value={role.summary} onChange={(event) => setDraft((current) => ({ ...current, roles: current.roles.map((entry) => entry.id === role.id ? { ...entry, summary: event.target.value } : entry) }))} /><div className="editor-inline-fields"><label><span>Мин. уровень</span><input type="number" min={1} max={10} value={role.minLevel} onChange={(event) => setDraft((current) => ({ ...current, roles: current.roles.map((entry) => entry.id === role.id ? { ...entry, minLevel: Number(event.target.value) } : entry) }))} /></label><label><span>Мест</span><input type="number" min={1} value={role.slots} onChange={(event) => setDraft((current) => ({ ...current, roles: current.roles.map((entry) => entry.id === role.id ? { ...entry, slots: Number(event.target.value) } : entry) }))} /></label><label><span>Занято</span><input type="number" min={0} value={role.filled} onChange={(event) => setDraft((current) => ({ ...current, roles: current.roles.map((entry) => entry.id === role.id ? { ...entry, filled: Number(event.target.value) } : entry) }))} /></label></div></article>)}</div></div>;
}

function ContentEditor({ draft, update, onAddNews }: { draft: OpenSourceProject; update: <K extends keyof OpenSourceProject>(key: K, value: OpenSourceProject[K]) => void; onAddNews: () => void }) {
  return <div className="editor-section-stack"><div className="section-title"><div><p>Документы и новости</p><h2>Материалы проекта</h2></div><button className="ghost-button" onClick={onAddNews}><Plus />Тестовая новость</button></div><label className="editor-textarea-block"><span><FileText />README</span><textarea className="tall-textarea" value={draft.readme} onChange={(event) => update("readme", event.target.value)} /></label><label className="editor-textarea-block"><span><GitBranch />CONTRIBUTING</span><textarea className="tall-textarea" value={draft.contributionGuide} onChange={(event) => update("contributionGuide", event.target.value)} /></label><label className="editor-textarea-block"><span><UsersRound />CODE OF CONDUCT</span><textarea className="tall-textarea" value={draft.codeOfConduct} onChange={(event) => update("codeOfConduct", event.target.value)} /></label><div className="editor-news-preview">{draft.news.slice(0, 3).map((item) => <article key={item.id}><div><strong>{item.title}</strong><p>{item.summary}</p></div><Badge tone={item.pinned ? "violet" : "default"}>{item.publishedAt}</Badge></article>)}</div></div>;
}

function XpEditor({ draft, setDraft }: { draft: OpenSourceProject; setDraft: Dispatch<SetStateAction<OpenSourceProject>> }) {
  const policy = draft.xpPolicy;
  function patch(patchValue: Partial<OpenSourceProject["xpPolicy"]>) { setDraft((current) => ({ ...current, xpPolicy: { ...current.xpPolicy, ...patchValue } })); }
  return <div className="editor-section-stack"><div className="section-title"><div><p>Признание вклада</p><h2>Правила начисления XP</h2></div><Badge tone="warning"><Sparkles />Не денежная система</Badge></div><div className="xp-policy-grid"><label><span>XP за ревью</span><input type="number" min={0} value={policy.reviewXp} onChange={(event) => patch({ reviewXp: Number(event.target.value) })} /></label><label><span>XP за документацию</span><input type="number" min={0} value={policy.documentationXp} onChange={(event) => patch({ documentationXp: Number(event.target.value) })} /></label><label><span>Множитель новичка</span><input type="number" min={1} max={2} step={0.05} value={policy.beginnerMultiplier} onChange={(event) => patch({ beginnerMultiplier: Number(event.target.value) })} /></label><label><span>Максимум за задачу</span><input type="number" min={100} value={policy.maxTaskXp} onChange={(event) => patch({ maxTaskXp: Number(event.target.value) })} /></label></div><div className="settings-toggle-row"><div><strong>Только подтверждённый результат</strong><span>Черновик и обещание работы не дают профессиональный XP.</span></div><button className={`switch ${policy.requiresAcceptedResult ? "on" : ""}`} onClick={() => patch({ requiresAcceptedResult: !policy.requiresAcceptedResult })}><span /></button></div><div className="settings-toggle-row"><div><strong>Код требует merge</strong><span>Для программного вклада XP начисляется после принятия Pull Request.</span></div><button className={`switch ${policy.requiresMergeForCode ? "on" : ""}`} onClick={() => patch({ requiresMergeForCode: !policy.requiresMergeForCode })}><span /></button></div><div className="scope-note"><Rocket /><div><strong>Игровой опыт отделён от профессионального</strong><span>Эти правила управляют подтверждённым skill XP. Hero XP и косметические награды рассчитываются отдельным игровым адаптером.</span></div></div></div>;
}

function projectCompleteness(project: OpenSourceProject) {
  const checks = [project.title, project.summary, project.description, project.repository, project.readme, project.contributionGuide, project.roadmap.length, project.tasks.length, project.roles.length, project.license];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
function splitList(value: string) { return value.split(",").map((item) => item.trim()).filter(Boolean); }
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-|-$/g, ""); }
function clamp(value: number, min: number, max: number) { return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min)); }
