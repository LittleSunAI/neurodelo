"use client";

import { useState } from "react";
import { Award, BookOpenCheck, CheckCircle2, ChevronRight, Flame, LoaderCircle, PlayCircle, Trophy, X } from "lucide-react";
import { Badge, Progress } from "@/components/ui/primitives";
import { courses } from "@/data/mock-data";
import { usePlatform } from "@/components/platform-provider";

export function LearningView() {
  const { state, completeTraining, saving } = usePlatform();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const { profile } = state;
  const completed = profile.trainingTasks.filter((task) => task.completed).length;
  const confirmed = profile.skills.filter((skill) => skill.confirmed).length;

  return <div className="view-stack">
    <section className="learning-hero panel"><div><Badge tone="warning"><Flame size={13} /> Практика сохраняется</Badge><h2>Повышайте уровень через учебные и реальные вклады</h2><p>В fallback-режиме проверка учебного patch имитируется локально. В рабочей версии XP начисляется после ревью, merge или подтверждения наставника.</p><button className="primary-button" onClick={() => document.getElementById("practice-tasks")?.scrollIntoView({ behavior: "smooth" })}>Перейти к практике <ChevronRight size={17} /></button></div><div className="xp-ring"><div><strong>{profile.generalLevel}</strong><span>общий уровень</span></div></div></section>
    <section className="learning-stats"><article className="panel"><BookOpenCheck /><div><strong>{profile.trainingTasks.length}</strong><span>sandbox-задач доступно</span></div></article><article className="panel"><Award /><div><strong>{confirmed}</strong><span>навыка подтверждено</span></div></article><article className="panel"><Trophy /><div><strong>{completed}</strong><span>учебных вкладов</span></div></article></section>

    <section className="panel content-panel" id="practice-tasks"><div className="section-title"><div><p>Подходят вашему профилю</p><h2>Sandbox-вклады</h2></div><Badge tone="violet">Fallback-ревью</Badge></div><div className="practice-grid">{profile.trainingTasks.map((task) => <article className={`practice-card ${task.completed ? "completed" : ""}`} key={task.id}><div className="practice-head"><Badge tone={task.difficulty === "Начальная" ? "success" : "warning"}>{task.difficulty}</Badge><span>+{task.rewardXp} XP</span></div><h3>{task.title}</h3><p>{task.description}</p><div className="practice-footer"><small>{profile.skills.find((skill) => skill.id === task.profession)?.name ?? task.profession}</small>{task.completed ? <Badge tone="success"><CheckCircle2 /> Выполнено · {task.score}%</Badge> : <button className="primary-button small" disabled={saving} onClick={() => completeTraining(task.id)}>{saving ? <LoaderCircle className="spin" /> : <PlayCircle />}Проверить работу</button>}</div></article>)}</div></section>

    <section className="panel content-panel"><div className="section-title"><div><p>Ваша программа</p><h2>Курсы и практикумы</h2></div><button className="text-button" onClick={() => setCatalogOpen(true)}>Каталог курсов</button></div><div className="course-grid">{courses.map((course, index) => <article className="course-card" key={course.title}><div className={`course-art course-art-${index + 1}`}><PlayCircle /></div><Badge tone={course.level === "Начальный" ? "success" : course.level === "Средний" ? "warning" : "danger"}>{course.level}</Badge><h3>{course.title}</h3><p>{course.author} · {course.lessons} занятий</p><div className="course-bottom"><Progress value={course.progress} label={course.progress ? `${course.progress}%` : "Не начат"} /><span>{course.students.toLocaleString("ru-RU")} учеников</span></div></article>)}</div></section>
    {catalogOpen ? <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Каталог курсов"><button className="modal-backdrop" onClick={() => setCatalogOpen(false)} aria-label="Закрыть" /><section className="modal-card community-modal"><header><div><Badge tone="violet">Обучение</Badge><h2>Каталог курсов</h2></div><button className="icon-button" onClick={() => setCatalogOpen(false)} aria-label="Закрыть"><X /></button></header><div className="course-catalog-list">{courses.map((course) => <article key={course.title}><BookOpenCheck /><div><strong>{course.title}</strong><span>{course.author} · {course.lessons} занятий · {course.level}</span></div><Badge tone={course.progress ? "success" : "default"}>{course.progress ? `${course.progress}%` : "Доступен"}</Badge></article>)}</div><footer><button className="primary-button" onClick={() => { setCatalogOpen(false); document.getElementById("practice-tasks")?.scrollIntoView({ behavior: "smooth" }); }}>Перейти к практике</button></footer></section></div> : null}
  </div>;
}
