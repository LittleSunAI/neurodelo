"use client";

import { useState } from "react";
import { Award, CheckCircle2, Clock3, Coins, Edit3, Eye, Gamepad2, GitMerge, GitPullRequestArrow, Medal, RotateCcw, Save, ShieldCheck, Sparkles, Star, Swords, Trophy } from "lucide-react";
import { HeroAvatar } from "@/components/hero-avatar";
import { Badge, Progress } from "@/components/ui/primitives";
import { usePlatform } from "@/components/platform-provider";
import type { HeroConfig } from "@/types/platform";

type ProfileTab = "overview" | "skills" | "hero" | "portfolio" | "training" | "settings";

const tabs: Array<{ id: ProfileTab; label: string }> = [
  { id: "overview", label: "Обзор" },
  { id: "skills", label: "Навыки" },
  { id: "hero", label: "Герой" },
  { id: "portfolio", label: "Портфолио вкладов" },
  { id: "training", label: "Обучение" },
  { id: "settings", label: "Настройки" },
];

export function ProfileView({ onOpenHeroStudio }: { onOpenHeroStudio: () => void }) {
  const { state, updateProfile, resetDemo, mode, saving } = usePlatform();
  const { profile } = state;
  const activeHeroImage = state.heroImages.variants.find((item) => item.id === state.heroImages.activeImageId);
  const [tab, setTab] = useState<ProfileTab>("overview");
  const [editName, setEditName] = useState(profile.name);
  const initials = profile.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return <div className="view-stack">
    <article className="profile-cover panel"><div className="profile-cover-bg" /><div className="profile-main"><HeroAvatar config={profile.hero} level={profile.heroProgression.level} imageUrl={activeHeroImage?.imageUrl} /><div className="profile-info"><div><Badge tone="success"><CheckCircle2 />Профиль сохранён</Badge><h2>{profile.name}</h2><p>@{profile.nickname} · {profile.country} · герой {profile.heroProgression.level} · профессиональный рейтинг {profile.generalLevel}</p></div><div className="tag-list">{profile.skills.slice(0, 5).map((skill) => <span key={skill.name}>{skill.name}</span>)}</div><div className="profile-actions"><button className="primary-button" onClick={() => setTab("settings")}><Edit3 />Редактировать</button><a className="ghost-button" href={`/u/${profile.publicProfileSlug}`}><Eye />Публичный профиль</a></div></div></div></article>

    <div className="profile-tabs panel">{tabs.map((item) => <button className={tab === item.id ? "active" : ""} key={item.id} onClick={() => setTab(item.id)}>{item.label}</button>)}</div>

    {tab === "overview" ? <div className="profile-layout"><section className="view-stack"><article className="panel content-panel"><div className="section-title"><div><p>Подтверждённые направления</p><h2>Профессиональные уровни</h2></div><button className="text-button" onClick={() => setTab("skills")}>Все навыки</button></div><SkillList /></article><PortfolioGrid compact /></section><aside className="profile-side view-stack"><article className="panel reputation-card"><div className="reputation-ring"><strong>{profile.reputation}</strong><span>репутация</span></div><h3>Надёжный участник</h3><div><span><GitPullRequestArrow />Доведено до ревью <strong>{profile.reliability}%</strong></span><span><Star />Оценка вкладов <strong>{profile.reviewScore}</strong></span><span><GitMerge />Принято вкладов <strong>{profile.mergedContributions}</strong></span><span><ShieldCheck />Рекомендаций <strong>{profile.mentorEndorsements}</strong></span></div></article><article className="panel achievements"><h3>Достижения</h3><div><span className="achievement gold"><Trophy /></span><span className="achievement violet"><Sparkles /></span><span className="achievement cyan"><Award /></span><span className="achievement green"><Medal /></span></div><p>Ещё 2 принятых вклада до достижения «Мастер open source».</p><Progress value={72} /></article><article className="panel profile-game-card"><Gamepad2 /><div><small>Игровой герой</small><h3>{profile.heroProgression.title}</h3><p>Класс: {profile.heroProgression.classId} · боевой рейтинг {profile.heroProgression.battleRating}</p><div><span><Swords />{profile.heroProgression.season.wins} побед</span><span><Coins />{profile.communityPoints} искр</span></div></div></article></aside></div> : null}

    {tab === "skills" ? <article className="panel content-panel"><div className="section-title"><div><p>Раздельная квалификация</p><h2>Навыки и допуски</h2></div><Badge tone="warning">Часть оценок предварительная</Badge></div><SkillList detailed /></article> : null}
    {tab === "hero" ? <HeroEditor onOpenHeroStudio={onOpenHeroStudio} /> : null}
    {tab === "portfolio" ? <PortfolioGrid /> : null}
    {tab === "training" ? <article className="panel content-panel"><div className="section-title"><div><p>История практики</p><h2>Учебные open-source задания</h2></div></div><div className="training-history">{profile.trainingTasks.map((task) => <article key={task.id}><span className={task.completed ? "done" : ""}>{task.completed ? <CheckCircle2 /> : <Clock3 />}</span><div><strong>{task.title}</strong><small>{task.description}</small></div><Badge tone={task.completed ? "success" : "default"}>{task.completed ? `${task.score}%` : "+" + task.rewardXp + " XP"}</Badge></article>)}</div></article> : null}
    {tab === "settings" ? <article className="panel content-panel profile-settings"><div className="section-title"><div><p>Локальные настройки</p><h2>Профиль и режим данных</h2></div><Badge tone={mode === "fallback" ? "warning" : "success"}>{mode === "fallback" ? "Fallback" : "API"}</Badge></div><div className="settings-grid"><label><span>Имя</span><input value={editName} onChange={(event) => setEditName(event.target.value)} /></label><label><span>Ник</span><input value={profile.nickname} onChange={(event) => updateProfile({ nickname: event.target.value })} /></label><label className="settings-toggle"><input type="checkbox" checked={profile.availableForContribution} onChange={(event) => updateProfile({ availableForContribution: event.target.checked })} /><div><strong>Доступен для open-source вкладов</strong><small>Показывать профиль авторам проектов и командам.</small></div></label><label className="settings-toggle"><input type="checkbox" checked={profile.publicThanksEnabled} onChange={(event) => updateProfile({ publicThanksEnabled: event.target.checked })} /><div><strong>Показывать публичные благодарности</strong><small>Отображать слова поддержки в профиле и на стене проекта.</small></div></label><div className="settings-note"><strong>Fallback отключается одной переменной</strong><code>NEXT_PUBLIC_USE_FALLBACKS=false</code><p>После отключения интерфейс начнёт обращаться к `/api/v1`. Локальная имитация больше не используется.</p></div></div><div className="button-row"><button className="primary-button" disabled={saving || editName.trim().length < 2} onClick={() => updateProfile({ name: editName })}><Save />Сохранить имя</button><button className="ghost-button danger-outline" onClick={resetDemo}><RotateCcw />Сбросить локальный профиль</button></div><small className="settings-initials">Текущие инициалы: {initials}</small></article> : null}
  </div>;
}

function SkillList({ detailed = false }: { detailed?: boolean }) {
  const { state } = usePlatform();
  return <div className="profile-skills">{state.profile.skills.map((skill) => <div key={skill.name}><div className="skill-level-box"><strong>{skill.level}</strong><span>уровень</span></div><div><div className="skill-title-line"><strong>{skill.name}</strong><Badge tone={skill.confirmed ? "success" : "warning"}>{skill.confirmed ? "Подтверждён" : "Предварительный"}</Badge></div><p>{skill.level >= 7 ? "Можно брать сложные задачи проектов" : skill.level >= 4 ? "Доступны вклады средней сложности" : "Доступ к beginner-friendly задачам"}{detailed ? ` · источник: ${skill.source ?? "не указан"}` : ""}</p><Progress value={skill.progress} label={`${skill.progress}% до следующего`} /></div></div>)}</div>;
}

function PortfolioGrid({ compact = false }: { compact?: boolean }) {
  const { state, connectGitProfile } = usePlatform();
  return <article className="panel content-panel"><div className="section-title"><div><p>Открытая история результатов</p><h2>Портфолио вкладов</h2></div><button className="text-button" disabled={Boolean(state.git.profile)} onClick={() => void connectGitProfile()}>{state.git.profile ? "Git-профиль подключён" : "Импортировать Git-профиль"}</button></div><div className={`portfolio-grid ${compact ? "compact" : ""}`}>{state.profile.portfolio.map((item, index) => <div className={`portfolio-item p${index % 2 + 1}`} key={item.id}><span>{item.category}</span><h3>{item.title}</h3><p>{item.summary}</p><div className="portfolio-meta-line"><span>{item.contributionType ?? "Contribution"}</span><span>{item.projectLicense ?? "Open source"}</span></div><Badge tone={item.verified ? "success" : "warning"}><ShieldCheck />{item.verified ? "Подтверждено историей проекта" : "На проверке"}</Badge></div>)}</div></article>;
}

function HeroEditor({ onOpenHeroStudio }: { onOpenHeroStudio: () => void }) {
  const { state, updateHero, saving } = usePlatform();
  const hero = state.profile.hero;
  const activeHeroImage = state.heroImages.variants.find((item) => item.id === state.heroImages.activeImageId);
  const update = (patch: Partial<HeroConfig>) => updateHero({ ...hero, ...patch });
  return <article className="panel content-panel hero-profile-editor"><div className="section-title"><div><p>Визуальное развитие</p><h2>Настройка героя</h2></div><Badge tone="violet">Уровень героя {state.profile.heroProgression.level}</Badge></div><div className="hero-builder-grid"><div className="hero-preview panel"><HeroAvatar config={hero} level={state.profile.heroProgression.level} imageUrl={activeHeroImage?.imageUrl} /><strong>{state.profile.name}</strong><span>{state.profile.xp.toLocaleString("ru-RU")} skill XP · {state.profile.heroProgression.xp} hero XP</span></div><div className="hero-controls"><ProfileChoice label="Стиль" value={hero.style} values={[['engineer','Инженер'],['creator','Создатель'],['researcher','Исследователь']]} onChange={(value) => update({ style: value as HeroConfig["style"] })} /><ProfileChoice label="Палитра" value={hero.palette} values={[['cyan','Бирюза'],['violet','Фиолетовый'],['amber','Янтарь'],['green','Зелёный']]} onChange={(value) => update({ palette: value as HeroConfig["palette"] })} /><ProfileChoice label="Инструмент" value={hero.accessory} values={[['laptop','Ноутбук'],['tablet','Планшет'],['headset','Гарнитура']]} onChange={(value) => update({ accessory: value as HeroConfig["accessory"] })} /><small>{saving ? "Сохраняем…" : "Изменения сохраняются автоматически."}</small><button className="primary-button full" onClick={onOpenHeroStudio}><Sparkles />Открыть студию изображения</button></div></div></article>;
}

function ProfileChoice({ label, value, values, onChange }: { label: string; value: string; values: string[][]; onChange: (value: string) => void }) {
  return <div className="hero-control"><strong>{label}</strong><div>{values.map(([id, title]) => <button className={value === id ? "selected" : ""} key={id} onClick={() => onChange(id)}>{title}</button>)}</div></div>;
}
