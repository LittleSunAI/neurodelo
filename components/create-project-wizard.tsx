"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Code2, FileText, GitFork, Sparkles, UsersRound, X } from "lucide-react";
import { Badge, Progress } from "@/components/ui/primitives";
import { usePlatform } from "@/components/platform-provider";
import type { OpenSourceProject } from "@/types/platform";

const steps = ["Идея", "Репозиторий", "Команда", "Публикация"];

export function CreateProjectWizard({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated?: (projectId: string) => void }) {
  const { state, createProject, saving } = usePlatform();
  const [step, setStep] = useState(0);
  const [published, setPublished] = useState(false);
  const [title, setTitle] = useState("Open Tools Hub");
  const [description, setDescription] = useState("Открытый каталог полезных AI-инструментов с понятными карточками, сравнением и пользовательскими подборками.");
  const [repository, setRepository] = useState("neurodelo/open-tools-hub");
  const [license, setLicense] = useState<OpenSourceProject["license"]>("MIT");
  const [stack, setStack] = useState("Next.js, TypeScript, PostgreSQL");
  const [needs, setNeeds] = useState("Frontend, QA, Документация");
  const [beginnerFriendly, setBeginnerFriendly] = useState(true);
  const slug = useMemo(() => uniqueSlug(title, state.projects.map((project) => project.slug)), [state.projects, title]);

  if (!open) return null;
  function close() { setStep(0); setPublished(false); onClose(); }

  async function publish(status: OpenSourceProject["status"]) {
    const id = `project-${Date.now()}`;
    const project: OpenSourceProject = {
      id,
      slug,
      title: title.trim() || "Новый open-source проект",
      tagline: description.trim().slice(0, 90) || "Открытый проект сообщества",
      summary: description.trim() || "Описание будет добавлено позже.",
      description: description.trim() || "Автор пока не добавил подробное описание.",
      license,
      stage: "Идея",
      status,
      progress: 8,
      members: 1,
      contributors: 1,
      openTasks: 3,
      repository: repository.trim() || `${state.profile.nickname}/${slug}`,
      defaultBranch: "main",
      stack: splitList(stack),
      needs: splitList(needs),
      tags: ["Open source", beginnerFriendly ? "Beginner friendly" : "Community"],
      beginnerFriendly,
      active: status === "published",
      initials: initials(title),
      ownerId: state.profile.nickname,
      ownerName: state.profile.name,
      createdAt: "только что",
      updatedAt: "только что",
      subscribers: 1,
      forumThreads: 0,
      readme: `${title} — открытый проект сообщества. Цели, локальный запуск и архитектура будут описаны в этом разделе.`,
      contributionGuide: "Выберите задачу, оставьте комментарий, создайте отдельную ветку и отправьте небольшой Pull Request с проверкой результата.",
      codeOfConduct: "Общаемся уважительно, не публикуем секреты и личные данные, обсуждаем результат, а не личность участника.",
      roadmap: [
        { id: `${id}-road-1`, title: "Проверить идею", summary: "Собрать обратную связь и уточнить основные сценарии.", state: "active", progress: 25, targetVersion: "research", dueLabel: "первый этап" },
        { id: `${id}-road-2`, title: "Собрать прототип", summary: "Подготовить первый кликабельный вариант и локальный запуск.", state: "planned", progress: 0, targetVersion: "v0.1", dueLabel: "после исследования" },
      ],
      roles: [
        { id: `${id}-role-1`, title: "Frontend contributor", skill: "Frontend", minLevel: 2, slots: 2, filled: 0, summary: "Каркас интерфейса и адаптивность.", mentorAvailable: true },
        { id: `${id}-role-2`, title: "QA contributor", skill: "Тестирование", minLevel: 1, slots: 2, filled: 0, summary: "Проверка сценариев и понятные баг-репорты.", mentorAvailable: true },
      ],
      tasks: [
        { id: `${id}-task-1`, projectId: id, project: title, title: "Собрать каркас первого экрана", category: "Frontend", kind: "Код", difficulty: "Средняя", rewardXp: 380, estimatedTime: "4–6 часов", applicants: 0, slots: 1, requiredLevel: 3, summary: "Собрать базовый экран по описанным сценариям и добавить мобильное состояние.", skills: ["React", "CSS", "Accessibility"], issueLabel: "first-feature", mentorReview: true, repositoryPath: "issues/1" },
        { id: `${id}-task-2`, projectId: id, project: title, title: "Подготовить CONTRIBUTING.md", category: "Документация", kind: "Документация", difficulty: "Начальная", rewardXp: 160, estimatedTime: "1–2 часа", applicants: 0, slots: 1, requiredLevel: 1, summary: "Описать ветки, проверки, оформление Pull Request и правила общения.", skills: ["Markdown", "Git", "Docs"], issueLabel: "documentation", mentorReview: false, repositoryPath: "issues/2" },
        { id: `${id}-task-3`, projectId: id, project: title, title: "Провести UX-разбор идеи", category: "Дизайн", kind: "Исследование", difficulty: "Начальная", rewardXp: 240, estimatedTime: "2–3 часа", applicants: 0, slots: 2, requiredLevel: 2, summary: "Проверить понятность сценариев и предложить улучшения до разработки.", skills: ["UX", "Research", "Figma"], issueLabel: "research", mentorReview: true, repositoryPath: "discussions/1" },
      ],
      news: [{ id: `${id}-news-1`, title: "Проект создан", summary: "Открыт набор первых участников и сбор обратной связи.", publishedAt: "только что", author: state.profile.name, pinned: true }],
      releases: [],
      faq: [{ id: `${id}-faq-1`, question: "Как помочь проекту?", answer: "Выберите открытую задачу или предложите улучшение в обсуждении проекта." }],
      xpPolicy: { requiresAcceptedResult: true, requiresMergeForCode: true, reviewXp: 60, documentationXp: 90, beginnerMultiplier: 1.15, maxTaskXp: 900 },
    };
    await createProject(project);
    setPublished(true);
    onCreated?.(id);
  }

  return <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Создание open-source проекта">
    <button className="modal-backdrop" onClick={close} aria-label="Закрыть окно" />
    <section className="modal-card wizard-card">
      <header className="modal-header"><div><Badge tone="violet"><Sparkles />ИИ-конструктор проекта</Badge><h2>{published ? "Проект подготовлен" : "Опубликовать open-source проект"}</h2><p>Созданный проект сразу получает публичную страницу, roadmap, первые роли, задачи и редактируемые правила XP.</p></div><button className="icon-button" onClick={close} aria-label="Закрыть"><X /></button></header>
      {!published ? <>
        <div className="wizard-progress">{steps.map((item, index) => <div className={index <= step ? "active" : ""} key={item}><span>{index < step ? <CheckCircle2 /> : index + 1}</span><small>{item}</small></div>)}</div>
        <div className="wizard-body">
          {step === 0 ? <div className="wizard-step"><label className="field-label">Название проекта</label><input value={title} onChange={(event) => setTitle(event.target.value)} /><label className="field-label">Что создаём и кому это поможет?</label><textarea value={description} onChange={(event) => setDescription(event.target.value)} /><div className="assistant-hint"><Sparkles /><div><strong>Публичный адрес</strong><span>/p/{slug}</span></div></div></div> : null}
          {step === 1 ? <div className="wizard-step form-grid"><label><span>Репозиторий</span><input value={repository} onChange={(event) => setRepository(event.target.value)} /></label><label><span>Лицензия</span><select value={license} onChange={(event) => setLicense(event.target.value as OpenSourceProject["license"])}><option>MIT</option><option>Apache-2.0</option><option>GPL-3.0</option><option>MPL-2.0</option></select></label><label><span>Стек</span><input value={stack} onChange={(event) => setStack(event.target.value)} /></label><label><span>Основная ветка</span><input value="main" readOnly /></label><div className="scope-note"><GitFork /><div><strong>Открытый репозиторий</strong><span>Участники видят код, лицензию, roadmap и правила участия.</span></div></div></div> : null}
          {step === 2 ? <div className="wizard-step"><label className="field-label">Кого ищем</label><input value={needs} onChange={(event) => setNeeds(event.target.value)} /><div className="project-task-seed"><article><Code2 /><div><strong>Собрать каркас каталога</strong><span>Frontend · уровень 3+ · +380 XP</span></div></article><article><FileText /><div><strong>Подготовить CONTRIBUTING.md</strong><span>Документация · уровень 1+ · +160 XP</span></div></article><article><UsersRound /><div><strong>Провести UX-разбор идеи</strong><span>Research · уровень 2+ · +240 XP</span></div></article></div><div className="settings-toggle-row"><div><strong>Подходит новичкам</strong><span>Добавить проект в подборку первого вклада.</span></div><button className={`switch ${beginnerFriendly ? "on" : ""}`} onClick={() => setBeginnerFriendly((value) => !value)}><span /></button></div></div> : null}
          {step === 3 ? <div className="wizard-step publish-review"><div className="review-icon"><CheckCircle2 /></div><h3>Проект готов</h3><p>Можно опубликовать его сразу или сохранить как черновик и доработать в полном редакторе.</p><div className="publish-checks"><span><CheckCircle2 />Лицензия указана</span><span><CheckCircle2 />Репозиторий описан</span><span><CheckCircle2 />Roadmap создан</span><span><CheckCircle2 />Первые задачи и роли добавлены</span></div></div> : null}
        </div>
        <footer className="modal-footer"><button className="ghost-button" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}><ArrowLeft />Назад</button><div><Progress value={(step + 1) * 25} label={`${step + 1} из 4`} /></div>{step < 3 ? <button className="primary-button" onClick={() => setStep((value) => Math.min(3, value + 1))}>Продолжить <ArrowRight /></button> : <div className="button-row"><button className="ghost-button" disabled={saving} onClick={() => publish("draft")}>Сохранить черновик</button><button className="primary-button" disabled={saving} onClick={() => publish("published")}>Опубликовать</button></div>}</footer>
      </> : <div className="wizard-success"><span><CheckCircle2 /></span><h3>{title} создан</h3><p>Проект сохранён в fallback-состоянии и уже доступен в каталоге, редакторе и по публичному адресу.</p><button className="primary-button" onClick={close}>Открыть редактор</button></div>}
    </section>
  </div>;
}

function splitList(value: string) { return value.split(",").map((item) => item.trim()).filter(Boolean); }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "OS"; }
function uniqueSlug(value: string, used: string[]) {
  const base = value.toLowerCase().trim().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-|-$/g, "") || "open-project";
  if (!used.includes(base)) return base;
  let index = 2;
  while (used.includes(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}
