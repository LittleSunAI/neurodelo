"use client";

import { useMemo, useState } from "react";
import { Bookmark, CheckCircle2, Filter, GitPullRequestArrow, MessageCircle, Search, Sparkles, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { usePlatform } from "@/components/platform-provider";
import type { RoleId } from "@/types/platform";

export function ContributionsView({ role, onGoProject }: { role: RoleId; onGoProject: () => void }) {
  const { state, claimContribution, submitContribution, selectProject, saving } = usePlatform();
  const contributionTasks = useMemo(() => state.projects.flatMap((project) => project.tasks), [state.projects]);
  const [filter, setFilter] = useState("Все");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(() => contributionTasks[0]?.id ?? "");
  const selected = contributionTasks.find((task) => task.id === selectedId) ?? contributionTasks[0];
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [dialog, setDialog] = useState<"claim" | "question" | "submit" | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [mentorOnly, setMentorOnly] = useState(false);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const filtered = contributionTasks.filter((task) => (!mentorOnly || task.mentorReview) && (!bookmarkedOnly || bookmarks.includes(task.id)) && (filter === "Все" || task.difficulty === filter || task.kind === filter) && `${task.title} ${task.project} ${task.category} ${task.skills.join(" ")}`.toLowerCase().includes(query.toLowerCase()));
  const claimed = selected ? state.claimedContributionIds.includes(selected.id) : false;
  const sent = selected ? state.submittedContributionIds.includes(selected.id) : false;

  function toggleBookmark(id: string) { setBookmarks((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  async function performAction() {
    if (!selected) return;
    if (dialog === "claim") await claimContribution(selected.id);
    if (dialog === "submit") await submitContribution(selected.id);
    setSubmitted(true);
  }

  if (!selected) return <div className="panel empty-state"><GitPullRequestArrow /><h3>Пока нет открытых задач</h3><p>Автор проекта может добавить первую задачу в редакторе проекта.</p></div>;

  return <>
    <div className="tasks-layout">
      <section className="panel content-panel tasks-list-panel">
        <div className="page-intro"><div><Badge tone="violet">{contributionTasks.length} задач доступно</Badge><h2>{role === "maintainer" ? "Задачи ваших и открытых проектов" : "Выберите вклад в open source"}</h2><p>{role === "maintainer" ? "Проверяйте, насколько задачи понятны сообществу, и следите за входящими вкладами." : "Берите небольшую задачу, работайте в отдельной ветке и отправляйте Pull Request. Принятый вклад повышает навыки и общий уровень героя."}</p></div>{role === "maintainer" ? <button className="primary-button" onClick={onGoProject}>Добавить задачу</button> : null}</div>
        <div className="contribution-principles"><span><GitPullRequestArrow />Вклад через Pull Request</span><span><CheckCircle2 />XP после проверки</span><span><Sparkles />ИИ объясняет репозиторий</span></div>
        <div className="filter-bar"><label className="search-box wide"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск по проектам, навыкам и задачам" /></label><div className="segmented">{["Все", "Начальная", "Средняя", "Высокая", "Документация"].map((item) => <button className={filter === item ? "active" : ""} key={item} onClick={() => setFilter(item)}>{item}</button>)}</div><button className={advancedOpen ? "icon-button active" : "icon-button"} aria-label="Дополнительные фильтры" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen((value) => !value)}><Filter size={18} /></button></div>{advancedOpen ? <div className="advanced-filter-row"><label><input type="checkbox" checked={mentorOnly} onChange={(event) => setMentorOnly(event.target.checked)} />Есть наставник</label><label><input type="checkbox" checked={bookmarkedOnly} onChange={(event) => setBookmarkedOnly(event.target.checked)} />Только закладки</label><button className="text-button" onClick={() => { setMentorOnly(false); setBookmarkedOnly(false); setFilter("Все"); }}>Сбросить</button></div> : null}
        <div className="task-cards">{filtered.map((task) => { const isClaimed = state.claimedContributionIds.includes(task.id); const isSubmitted = state.submittedContributionIds.includes(task.id); return <button className={`task-card ${selectedId === task.id ? "selected" : ""}`} key={task.id} onClick={() => setSelectedId(task.id)}><div className="task-card-top"><div><span>{task.project} · {task.kind}</span><h3>{task.title}</h3></div><span className={bookmarks.includes(task.id) ? "bookmark active" : "bookmark"} onClick={(event) => { event.stopPropagation(); toggleBookmark(task.id); }}><Bookmark size={18} fill={bookmarks.includes(task.id) ? "currentColor" : "none"} /></span></div><p>{task.summary}</p><div className="tag-list">{task.skills.map((skill) => <span key={skill}>{skill}</span>)}</div><div className="task-card-bottom"><div><strong>+{task.rewardXp} XP</strong><span>{task.estimatedTime}</span></div><div><Users size={15} />{task.applicants} участников</div>{isSubmitted ? <Badge tone="success">На ревью</Badge> : isClaimed ? <Badge tone="warning">В работе</Badge> : <Badge tone={task.difficulty === "Высокая" ? "danger" : task.difficulty === "Средняя" ? "warning" : "success"}>{task.difficulty}</Badge>}</div></button>; })}</div>
      </section>
      <aside className="panel task-detail">
        <div className="detail-head"><div><small>{selected.project} · {selected.repositoryPath}</small><h2>{selected.title}</h2></div><button className={`icon-button ${bookmarks.includes(selected.id) ? "bookmarked" : ""}`} onClick={() => toggleBookmark(selected.id)} aria-label="Добавить в закладки"><Bookmark size={19} fill={bookmarks.includes(selected.id) ? "currentColor" : "none"} /></button></div>
        <div className="detail-price"><strong>+{selected.rewardXp} XP</strong><span>Оценка: {selected.estimatedTime}</span></div>
        <div className="guarantee-note open-source-note"><GitPullRequestArrow /><div><strong>Открытый вклад</strong><span>Код и обсуждение видны в репозитории. Решение о принятии принимает мейнтейнер проекта по опубликованным правилам.</span></div></div>
        <div className="detail-section"><h3>Описание</h3><p>{selected.summary}</p></div>
        <div className="detail-section"><h3>Требования</h3><ul><li><CheckCircle2 />Подтверждённый уровень: {selected.requiredLevel}+</li><li><CheckCircle2 />Следование CONTRIBUTING.md</li><li><CheckCircle2 />Один небольшой Pull Request</li>{selected.mentorReview ? <li><CheckCircle2 />Доступна помощь наставника</li> : null}</ul></div>
        <div className="detail-section"><h3>Метки и места</h3><div className="slots"><strong>{selected.slots}</strong><span>слотов доступно<br />метка: {selected.issueLabel}</span></div></div>
        {sent ? <><button className="primary-button full" onClick={async () => { await selectProject(selected.projectId); onGoProject(); }}>Открыть ревью</button><button className="ghost-button full" disabled>Вклад отправлен</button></> : claimed ? <><button className="primary-button full" onClick={() => { setDialog("submit"); setSubmitted(false); }}>Отправить вклад на ревью</button><button className="ghost-button full" onClick={async () => { await selectProject(selected.projectId); onGoProject(); }}>Открыть рабочую комнату</button></> : <><button className="primary-button full" disabled={role === "maintainer"} onClick={() => { setDialog("claim"); setSubmitted(false); }}>{role === "maintainer" ? "Задача вашего проекта" : "Взять задачу"}</button><button className="ghost-button full" onClick={() => { setDialog("question"); setSubmitted(false); }}>Задать вопрос команде</button></>}
      </aside>
    </div>

    {dialog ? <div className="modal-layer" role="dialog" aria-modal="true"><button className="modal-backdrop" onClick={() => setDialog(null)} aria-label="Закрыть" /><section className="modal-card compact-modal"><header className="modal-header"><div><Badge tone={dialog === "question" ? "violet" : "success"}>{dialog === "claim" ? "Начало вклада" : dialog === "submit" ? "Pull Request" : "Сообщение"}</Badge><h2>{dialog === "claim" ? "Взять задачу в работу" : dialog === "submit" ? "Отправить вклад на ревью" : "Задать вопрос команде"}</h2><p>{selected.title}</p></div><button className="icon-button" onClick={() => setDialog(null)} aria-label="Закрыть"><X /></button></header>{!submitted ? <div className="compact-modal-body">{dialog === "claim" ? <><div className="eligibility-box"><CheckCircle2 /><div><strong>Вы подходите по уровню</strong><span>Задача закрепится за вами в fallback-состоянии. Её можно будет отправить на тестовое ревью.</span></div></div><label className="field-label">Короткий план</label><textarea defaultValue="Изучу CONTRIBUTING.md, воспроизведу задачу, сделаю небольшое изменение и приложу проверку результата." /></> : dialog === "submit" ? <><label className="field-label">Ссылка или название ветки</label><input defaultValue={`feature/${selected.id}`} /><label className="field-label">Что изменено?</label><textarea defaultValue="Задача выполнена, проверены основные сценарии и обновлена документация изменения." /><div className="assistant-hint"><GitPullRequestArrow /><div><strong>Fallback-ревью</strong><span>В тестовом режиме вклад будет принят искусственно, XP начислится сразу, а работа появится в портфолио.</span></div></div></> : <><label className="field-label">Ваш вопрос</label><textarea defaultValue="Подскажите, есть ли готовый пример поведения и какие проверки обязательны перед Pull Request?" /><div className="assistant-hint"><MessageCircle /><div><strong>Вопрос попадёт в обсуждение</strong><span>В рабочей версии он будет связан с issue и виден другим участникам.</span></div></div></>}<button className="primary-button full" disabled={saving} onClick={performAction}>{dialog === "claim" ? "Закрепить задачу" : dialog === "submit" ? "Отправить на ревью" : "Отправить вопрос"}</button></div> : <div className="dialog-success"><CheckCircle2 /><h3>{dialog === "claim" ? "Задача закреплена" : dialog === "submit" ? "Вклад принят fallback-проверкой" : "Вопрос отправлен"}</h3><p>{dialog === "submit" ? `Начислено ${selected.rewardXp} XP. В рабочей версии награда появится только после реального merge или подтверждения мейнтейнера.` : "Событие сохранено в демонстрационном интерфейсе."}</p><button className="ghost-button" onClick={() => setDialog(null)}>Закрыть</button></div>}</section></div> : null}
  </>;
}
