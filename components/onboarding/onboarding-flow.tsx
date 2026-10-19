"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Globe2, LoaderCircle, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import { HeroAvatar } from "@/components/hero-avatar";
import { usePlatform } from "@/components/platform-provider";
import { Badge, Progress } from "@/components/ui/primitives";
import { defaultProfile } from "@/services/platform-gateway";
import { calculateBattleRating, heroClassDefinitions } from "@/services/game-gateway";
import type { ExperienceLevel, HeroConfig, ProfessionId, RoleId, Skill, UserProfile } from "@/types/platform";

const roleOptions: Array<{ id: RoleId; title: string; text: string }> = [
  { id: "contributor", title: "Контрибьютор", text: "Помогать open-source проектам, отправлять вклад и развивать навыки." },
  { id: "maintainer", title: "Автор проекта", text: "Публиковать открытые проекты, вести roadmap и принимать вклад сообщества." },
  { id: "mentor", title: "Наставник", text: "Проверять учебные и реальные вклады, обучать и вести практикумы." },
];

const professionOptions: Array<{ id: ProfessionId; title: string }> = [
  { id: "frontend", title: "Frontend" },
  { id: "backend", title: "Backend" },
  { id: "database", title: "Базы данных" },
  { id: "design", title: "Дизайн" },
  { id: "qa", title: "Тестирование" },
  { id: "ai", title: "AI-инструменты" },
  { id: "management", title: "Управление проектами" },
];

const goalOptions = ["Помогать open-source проектам", "Собрать подтверждённое портфолио", "Найти команду", "Запустить свой проект", "Учиться", "Стать наставником"];

export function OnboardingFlow() {
  const { completeOnboarding, generateHero, assessSkills, loadDemo, saving, mode } = usePlatform();
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState<"hero" | "skills" | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    ...defaultProfile,
    name: "",
    nickname: "",
    roles: ["contributor"],
    primaryRole: "contributor",
    goals: ["Помогать open-source проектам"],
    professions: ["frontend", "ai"],
    experience: "starter",
    skills: [],
    portfolio: [],
    generalLevel: 1,
    xp: 0,
    heroProgression: {
      ...defaultProfile.heroProgression,
      level: 1,
      xp: 0,
      xpToNext: 250,
      unspentPoints: 2,
      stats: { ...heroClassDefinitions.architect.baseStats },
      battleRating: calculateBattleRating(heroClassDefinitions.architect.baseStats, 1),
      season: { ...defaultProfile.heroProgression.season, tier: "Новичок", rank: 0, wins: 0, losses: 0 },
      unlockedRewardIds: ["frame-starter", "badge-code"],
    },
    reputation: 50,
    reliability: 50,
    availableForContribution: true,
    mergedContributions: 0,
    reviewScore: 0,
    mentorEndorsements: 0,
    gratitudeReceived: 0,
    communityPoints: 0,
    publicThanksEnabled: true,
  });

  const steps = ["Профиль", "Роли", "Направления", "Герой", "Оценка"];
  const canContinue = useMemo(() => {
    if (step === 1) return profile.name.trim().length >= 2 && profile.nickname.trim().length >= 2;
    if (step === 2) return profile.roles.length > 0 && profile.goals.length > 0;
    if (step === 3) return profile.professions.length > 0;
    if (step === 5) return skills.length > 0;
    return true;
  }, [profile, skills, step]);

  function toggleRole(id: RoleId) {
    setProfile((current) => {
      const roles = current.roles.includes(id) ? current.roles.filter((role) => role !== id) : [...current.roles, id];
      const safeRoles = roles.length ? roles : [id];
      return { ...current, roles: safeRoles, primaryRole: safeRoles.includes(current.primaryRole) ? current.primaryRole : safeRoles[0] };
    });
  }

  function toggleProfession(id: ProfessionId) {
    setProfile((current) => ({ ...current, professions: current.professions.includes(id) ? current.professions.filter((item) => item !== id) : [...current.professions, id] }));
  }

  function toggleGoal(goal: string) {
    setProfile((current) => ({ ...current, goals: current.goals.includes(goal) ? current.goals.filter((item) => item !== goal) : [...current.goals, goal] }));
  }

  async function generate() {
    setBusy("hero");
    const hero = await generateHero({ professions: profile.professions, experience: profile.experience, preferredPalette: profile.hero.palette });
    setProfile((current) => ({ ...current, hero }));
    setBusy(null);
  }

  async function runAssessment() {
    setBusy("skills");
    const result = await assessSkills({ professions: profile.professions, experience: profile.experience });
    setSkills(result);
    setProfile((current) => ({ ...current, skills: result, generalLevel: Math.max(1, Math.round(result.reduce((sum, item) => sum + item.level, 0) / result.length)) }));
    setBusy(null);
  }

  async function finish() {
    await completeOnboarding({ ...profile, skills });
  }

  return (
    <div className="onboarding-shell">
      <div className="onboarding-backdrop" />
      <section className="onboarding-card panel">
        <header className="onboarding-head">
          <div className="onboarding-brand"><span className="brand-mark"><span /></span><div><strong>NEURODELO</strong><small>Первичная настройка профиля</small></div></div>
          <div className="onboarding-mode"><Badge tone={mode === "fallback" ? "warning" : "success"}>{mode === "fallback" ? "Тестовый fallback" : "Рабочий API"}</Badge><button className="text-button" onClick={loadDemo}>Открыть демо</button></div>
        </header>

        <div className="onboarding-progress">
          {steps.map((label, index) => <div className={step > index + 1 ? "done" : step === index + 1 ? "active" : ""} key={label}><span>{step > index + 1 ? <Check /> : index + 1}</span><small>{label}</small></div>)}
        </div>

        <div className="onboarding-body">
          {step === 1 ? <IdentityStep profile={profile} setProfile={setProfile} /> : null}
          {step === 2 ? <RoleStep profile={profile} toggleRole={toggleRole} toggleGoal={toggleGoal} /> : null}
          {step === 3 ? <ProfessionStep profile={profile} toggleProfession={toggleProfession} setProfile={setProfile} /> : null}
          {step === 4 ? <HeroStep profile={profile} setProfile={setProfile} onGenerate={generate} busy={busy === "hero"} /> : null}
          {step === 5 ? <AssessmentStep profile={profile} skills={skills} onRun={runAssessment} busy={busy === "skills"} /> : null}
        </div>

        <footer className="onboarding-footer">
          <button className="ghost-button" disabled={step === 1} onClick={() => setStep((value) => Math.max(1, value - 1))}><ArrowLeft />Назад</button>
          <div><small>Шаг {step} из {steps.length}</small><Progress value={(step / steps.length) * 100} /></div>
          {step < 5 ? <button className="primary-button" disabled={!canContinue} onClick={() => setStep((value) => Math.min(5, value + 1))}>Продолжить<ArrowRight /></button> : <button className="primary-button" disabled={!canContinue || saving} onClick={finish}>{saving ? <LoaderCircle className="spin" /> : <CheckCircle2 />}Создать профиль</button>}
        </footer>
      </section>
    </div>
  );
}

function IdentityStep({ profile, setProfile }: { profile: UserProfile; setProfile: (updater: (value: UserProfile) => UserProfile) => void }) {
  return <div className="onboarding-step"><div className="step-heading"><Badge tone="violet"><Globe2 /> Шаг 1</Badge><h1>Создадим основу профиля</h1><p>Эти данные будут видны другим участникам. Позже всё можно изменить.</p></div><div className="onboarding-form two"><label><span>Имя</span><input value={profile.name} onChange={(event) => setProfile((value) => ({ ...value, name: event.target.value }))} placeholder="Например, Тимур" /></label><label><span>Ник</span><input value={profile.nickname} onChange={(event) => setProfile((value) => ({ ...value, nickname: event.target.value.replace(/\s/g, "") }))} placeholder="например, tbv" /></label><label><span>Язык интерфейса</span><select value={profile.language} onChange={(event) => setProfile((value) => ({ ...value, language: event.target.value as UserProfile["language"] }))}><option value="ru">Русский</option><option value="en">English</option></select></label><label><span>Страна</span><input value={profile.country} onChange={(event) => setProfile((value) => ({ ...value, country: event.target.value }))} /></label></div></div>;
}

function RoleStep({ profile, toggleRole, toggleGoal }: { profile: UserProfile; toggleRole: (id: RoleId) => void; toggleGoal: (goal: string) => void }) {
  return <div className="onboarding-step"><div className="step-heading"><Badge tone="violet"><ShieldCheck /> Шаг 2</Badge><h1>Как вы будете пользоваться платформой?</h1><p>Можно выбрать несколько ролей и переключаться между ними.</p></div><div className="role-choice-grid">{roleOptions.map((item) => <button className={profile.roles.includes(item.id) ? "selected" : ""} key={item.id} onClick={() => toggleRole(item.id)}><span>{profile.roles.includes(item.id) ? <Check /> : null}</span><strong>{item.title}</strong><p>{item.text}</p></button>)}</div><div className="choice-section"><strong>Главные цели</strong><div className="choice-chips">{goalOptions.map((goal) => <button className={profile.goals.includes(goal) ? "selected" : ""} key={goal} onClick={() => toggleGoal(goal)}>{goal}</button>)}</div></div></div>;
}

function ProfessionStep({ profile, toggleProfession, setProfile }: { profile: UserProfile; toggleProfession: (id: ProfessionId) => void; setProfile: (updater: (value: UserProfile) => UserProfile) => void }) {
  const experience: Array<{ id: ExperienceLevel; title: string; text: string }> = [
    { id: "starter", title: "Начинаю", text: "Нужны учебные задания и базовая проверка." },
    { id: "junior", title: "Есть практика", text: "Выполнял небольшие задачи и проекты." },
    { id: "middle", title: "Работаю уверенно", text: "Могу самостоятельно вести направление." },
    { id: "senior", title: "Большой опыт", text: "Готов к сложным проектам и проверке навыков." },
  ];
  return <div className="onboarding-step"><div className="step-heading"><Badge tone="violet"><Sparkles /> Шаг 3</Badge><h1>Выберите профессиональные направления</h1><p>Общий уровень отвечает за развитие героя, а доступ к вкладам и ролям в проектах определяется отдельными подтверждёнными навыками.</p></div><div className="profession-grid">{professionOptions.map((item) => <button className={profile.professions.includes(item.id) ? "selected" : ""} key={item.id} onClick={() => toggleProfession(item.id)}><span>{profile.professions.includes(item.id) ? <Check /> : null}</span>{item.title}</button>)}</div><div className="experience-grid">{experience.map((item) => <button className={profile.experience === item.id ? "selected" : ""} key={item.id} onClick={() => setProfile((value) => ({ ...value, experience: item.id }))}><strong>{item.title}</strong><small>{item.text}</small></button>)}</div></div>;
}

function HeroStep({ profile, setProfile, onGenerate, busy }: { profile: UserProfile; setProfile: (updater: (value: UserProfile) => UserProfile) => void; onGenerate: () => void; busy: boolean }) {
  const setHero = (patch: Partial<HeroConfig>) => setProfile((value) => ({ ...value, hero: { ...value.hero, ...patch } }));
  return <div className="onboarding-step hero-builder"><div className="step-heading"><Badge tone="violet"><WandSparkles /> Шаг 4</Badge><h1>Создайте визуального героя</h1><p>Герой будет развиваться вместе с общим уровнем. Все параметры сохраняются отдельно и легко меняются.</p></div><div className="hero-builder-grid"><div className="hero-preview panel"><HeroAvatar config={profile.hero} level={profile.generalLevel} /><strong>{profile.name || "Ваш герой"}</strong><span>Начальный образ · уровень {profile.generalLevel}</span></div><div className="hero-controls"><ControlChoices label="Стиль" options={[['engineer','Инженер'],['creator','Создатель'],['researcher','Исследователь']]} value={profile.hero.style} onChange={(value) => setHero({ style: value as HeroConfig["style"] })} /><ControlChoices label="Палитра" options={[['cyan','Бирюзовая'],['violet','Фиолетовая'],['amber','Янтарная'],['green','Зелёная']]} value={profile.hero.palette} onChange={(value) => setHero({ palette: value as HeroConfig["palette"] })} /><ControlChoices label="Инструмент" options={[['laptop','Ноутбук'],['tablet','Планшет'],['headset','Гарнитура']]} value={profile.hero.accessory} onChange={(value) => setHero({ accessory: value as HeroConfig["accessory"] })} /><button className="primary-button full" disabled={busy} onClick={onGenerate}>{busy ? <LoaderCircle className="spin" /> : <WandSparkles />}Подобрать образ через ИИ</button></div></div></div>;
}

function ControlChoices({ label, options, value, onChange }: { label: string; options: string[][]; value: string; onChange: (value: string) => void }) {
  return <div className="hero-control"><strong>{label}</strong><div>{options.map(([id, title]) => <button className={value === id ? "selected" : ""} key={id} onClick={() => onChange(id)}>{title}</button>)}</div></div>;
}

function AssessmentStep({ profile, skills, onRun, busy }: { profile: UserProfile; skills: Skill[]; onRun: () => void; busy: boolean }) {
  return <div className="onboarding-step"><div className="step-heading"><Badge tone="violet"><CheckCircle2 /> Шаг 5</Badge><h1>Предварительная оценка навыков</h1><p>В тестовом режиме результат рассчитывается искусственно. Позже здесь будут реальные тесты, история Pull Request, открытое портфолио и проверка наставником.</p></div>{skills.length === 0 ? <div className="assessment-empty panel"><ShieldCheck /><h3>Готово к оценке</h3><p>Опыт: <strong>{profile.experience}</strong>. Направлений выбрано: <strong>{profile.professions.length}</strong>.</p><button className="primary-button" disabled={busy} onClick={onRun}>{busy ? <LoaderCircle className="spin" /> : <Sparkles />}Провести тестовую оценку</button></div> : <div className="assessment-results">{skills.map((skill) => <article className="panel" key={skill.name}><div><strong>{skill.name}</strong><Badge tone={skill.confirmed ? "success" : "warning"}>{skill.confirmed ? "Предварительно подтверждён" : "Нужна практика"}</Badge></div><span>{skill.level}</span><Progress value={skill.progress} label={`${skill.progress}% до следующего уровня`} /></article>)}</div>}</div>;
}
