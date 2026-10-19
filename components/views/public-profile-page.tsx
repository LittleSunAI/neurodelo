"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Award, CheckCircle2, GitBranch, Globe2, HeartHandshake, Languages, Mail, MapPin, MessageCircle, ShieldCheck, Sparkles, Swords, Trophy, UserPlus } from "lucide-react";
import { HeroAvatar } from "@/components/hero-avatar";
import { Badge, Progress } from "@/components/ui/primitives";
import { defaultState, platformGateway } from "@/services/platform-gateway";
import { authGateway } from "@/services/auth-gateway";
import { validateUserExternalUrl } from "@/lib/server/url-policy";
import type { AuthSession } from "@/types/platform";
import { specialists } from "@/data/mock-data";
import type { PlatformState } from "@/types/platform";

export function PublicProfilePage({ nickname }: { nickname: string }) {
  const [state, setState] = useState<PlatformState>(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [viewer, setViewer] = useState<AuthSession>({ authenticated: false, remembered: false, status: "active" });
  useEffect(() => { Promise.all([platformGateway.loadState(), authGateway.load()]).then(([nextState, auth]) => { setState(nextState); setViewer(auth.session); }).finally(() => setLoaded(true)); }, []);
  const ownProfile = state.profile;
  const normalized = (value: string) => value.toLowerCase().replaceAll("ё", "е").replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-|-$/g, "");
  const specialist = specialists.find((item) => normalized(item.name) === nickname);
  const profile = specialist ? { ...ownProfile, name: specialist.name, nickname, publicProfileSlug: nickname, bio: `${specialist.role}. Участник сообщества с подтверждёнными open-source вкладами.`, interests: specialist.skills, reliability: specialist.reliability, reviewScore: specialist.rating, mergedContributions: specialist.contributions, availableForContribution: specialist.available, github: nickname, website: "", telegram: "" } : ownProfile;
  const activeHeroImage = specialist ? undefined : state.heroImages.variants.find((item) => item.id === state.heroImages.activeImageId);
  const publicPortfolio = specialist ? state.recognitionRecords.filter((item) => item.contributorName === specialist.name).map((item) => ({ id: item.id, title: item.title, category: item.projectName, summary: item.summary, verified: item.verified, contributionType: item.kind, projectLicense: "Open source" })) : profile.portfolio;
  const publicKudos = specialist ? state.kudosRecords.filter((item) => item.toContributorName === specialist.name) : state.kudosRecords;
  if (!loaded) return <main className="public-profile-shell"><div className="platform-loader"><Sparkles className="spin"/><strong>Загружаем публичный профиль</strong></div></main>;
  const isOwn = !specialist && (nickname === profile.publicProfileSlug || nickname === profile.nickname) && viewer.authenticated;
  const privacy = state.preferences.privacy;
  const canView = isOwn || specialist || privacy.profileVisibility === "public" || (privacy.profileVisibility === "community" && viewer.authenticated);
  const canMessage = viewer.authenticated && (privacy.messagePermission === "everyone" || privacy.messagePermission === "community");
  const canInvite = viewer.authenticated && (privacy.invitePermission === "everyone" || privacy.invitePermission === "community");
  const githubUrl = profile.github ? validateUserExternalUrl(`https://github.com/${profile.github.replace(/^@/, "")}`) : null;
  const telegramUrl = profile.telegram ? validateUserExternalUrl(`https://t.me/${profile.telegram.replace(/^@/, "")}`) : null;
  const websiteUrl = profile.website ? validateUserExternalUrl(profile.website) : null;
  if (!canView) return <main className="public-profile-shell"><header className="public-profile-top"><Link href="/" className="auth-brand"><span className="brand-mark"><span /></span><strong>NEURODELO</strong></Link></header><section className="panel public-project-missing"><ShieldCheck/><h1>Профиль закрыт</h1><p>Владелец ограничил видимость этой страницы.</p><Link href={viewer.authenticated ? "/" : "/login"} className="primary-button">{viewer.authenticated ? "Вернуться" : "Войти"}</Link></section></main>;
  return <main className="public-profile-shell">
    <header className="public-profile-top"><Link href="/" className="auth-brand"><span className="brand-mark"><span /></span><strong>NEURODELO</strong></Link><nav><Link href="/">Платформа</Link><Link href="/login">Войти</Link></nav></header>
    <section className="public-profile-cover panel"><div className="public-profile-glow"/><div className="public-avatar-wrap"><HeroAvatar config={profile.hero} level={profile.heroProgression.level} imageUrl={activeHeroImage?.imageUrl}/><span className="online-dot"/></div><div className="public-profile-main"><Badge tone="success"><CheckCircle2/>Подтверждённый участник</Badge><h1>{profile.name}</h1><p>@{profile.nickname} · {profile.heroProgression.title}</p><div className="public-meta"><span><MapPin/>{profile.country}</span><span><Languages/>{profile.spokenLanguages.join(" · ")}</span><span><Globe2/>Open-source contributor</span></div><div className="tag-list">{profile.interests.map((item)=><span key={item}>{item}</span>)}</div></div><div className="public-actions">{canMessage ? <button className="primary-button" onClick={() => window.location.assign(`/?message=${encodeURIComponent(profile.nickname)}`)}><MessageCircle/>Написать</button> : null}{canInvite ? <button className="ghost-button" onClick={() => window.location.assign(`/?invite=${encodeURIComponent(profile.nickname)}`)}><UserPlus/>Пригласить в проект</button> : null}{!viewer.authenticated && !isOwn ? <Link className="primary-button" href={`/login?returnTo=${encodeURIComponent(`/u/${nickname}`)}`}><MessageCircle/>Войти для связи</Link> : null}{isOwn ? <Link className="ghost-button" href="/">Редактировать</Link> : null}</div></section>
    <div className="public-profile-grid">
      <section className="view-stack">
        <article className="panel content-panel"><div className="section-title"><div><p>О пользователе</p><h2>Коротко обо мне</h2></div></div><p className="public-bio">{profile.bio}</p><div className="public-links">{githubUrl ? <a href={githubUrl} target="_blank" rel="noopener noreferrer"><GitBranch/>github.com/{profile.github}</a> : null}{websiteUrl ? <a href={websiteUrl} target="_blank" rel="noopener noreferrer"><Globe2/>{profile.website}</a> : null}{telegramUrl ? <a href={telegramUrl} target="_blank" rel="noopener noreferrer"><Mail/>{profile.telegram}</a> : null}</div></article>
        <article className="panel content-panel"><div className="section-title"><div><p>Подтверждённые направления</p><h2>Профессиональные навыки</h2></div><Badge tone="violet">Skill XP {profile.xp}</Badge></div><div className="public-skill-grid">{profile.skills.map((skill)=><article key={skill.name}><div><strong>{skill.name}</strong><Badge tone={skill.confirmed ? "success" : "warning"}>{skill.confirmed ? "Подтверждён" : "Предварительный"}</Badge></div><b>{skill.level}</b><Progress value={skill.progress}/><small>{skill.progress}% до следующего уровня</small></article>)}</div></article>
        {privacy.showActivity || isOwn || specialist ? <article className="panel content-panel"><div className="section-title"><div><p>Открытая история</p><h2>Портфолио вкладов</h2></div></div><div className="portfolio-grid">{publicPortfolio.map((item, index)=><div className={`portfolio-item p${index%2+1}`} key={item.id}><span>{item.category}</span><h3>{item.title}</h3><p>{item.summary}</p><Badge tone={item.verified ? "success":"warning"}><ShieldCheck/>{item.verified ? "Подтверждено":"На проверке"}</Badge></div>)}</div></article> : null}
        {privacy.showThanks || isOwn || specialist ? <article className="panel content-panel"><div className="section-title"><div><p>Признание сообщества</p><h2>Благодарности</h2></div><Badge tone="warning"><HeartHandshake/>{specialist ? publicKudos.length : profile.gratitudeReceived}</Badge></div><div className="public-thanks">{publicKudos.slice(0,3).map((item)=><article key={item.id}><HeartHandshake/><div><strong>{item.fromName}</strong><p>{item.message}</p><small>{item.createdAt}</small></div></article>)}</div></article> : null}
      </section>
      <aside className="view-stack">
        <article className="panel public-stat-card"><div><Award/><strong>{profile.reputation}</strong><span>репутация</span></div><div><ShieldCheck/><strong>{profile.reliability}%</strong><span>надёжность</span></div><div><Trophy/><strong>{profile.mergedContributions}</strong><span>вкладов</span></div></article>
        {privacy.showBattleHistory || isOwn || specialist ? <article className="panel public-hero-card"><HeroAvatar config={profile.hero} level={profile.heroProgression.level} imageUrl={activeHeroImage?.imageUrl}/><h3>{profile.heroProgression.title}</h3><p>Класс: {profile.heroProgression.classId}</p><div><span><Swords/>{profile.heroProgression.battleRating} рейтинг</span><span><Sparkles/>{profile.communityPoints} искр</span></div></article> : null}
        {privacy.showActivity || isOwn || specialist ? <article className="panel public-availability"><span className={profile.availableForContribution ? "available":"busy"}/><div><strong>{profile.availableForContribution ? "Доступен для вкладов":"Сейчас занят"}</strong><p>Можно отправить приглашение в open-source проект.</p></div></article> : null}
      </aside>
    </div>
  </main>;
}
