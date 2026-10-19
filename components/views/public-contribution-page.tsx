"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowLeft, Award, CheckCircle2, ExternalLink, Flag, GitPullRequest, Heart, History, PackageCheck, ShieldCheck } from "lucide-react";
import { usePlatform } from "@/components/platform-provider";
import { Badge } from "@/components/ui/primitives";

export function PublicContributionPage({ id }: { id: string }) {
  const { state, hydrated, authSession, reportCommunityContent } = usePlatform();
  const [reported, setReported] = useState(false);
  const record = state.recognitionRecords.find((item) => item.id === id || item.contributionId === id);
  const kudos = useMemo(() => record ? state.kudosRecords.filter((item) => item.contributionId === record.contributionId) : [], [record, state.kudosRecords]);
  const transactions = useMemo(() => record ? state.xpTransactions.filter((item) => item.contributionId === record.contributionId) : [], [record, state.xpTransactions]);
  const releases = useMemo(() => record ? state.releaseCredits.filter((item) => item.contributionIds.includes(record.contributionId)) : [], [record, state.releaseCredits]);
  if (!hydrated) return <main className="public-page-shell"><section className="public-state-card">Загружаем вклад…</section></main>;
  if (!record) return <main className="public-page-shell"><section className="public-state-card"><AlertTriangle/><h1>Вклад не найден</h1><Link href="/">Вернуться на платформу</Link></section></main>;
  async function report() { if (!record) return; if (!authSession.authenticated) { window.location.assign(`/login?returnTo=${encodeURIComponent(`/contributions/${id}`)}`); return; } await reportCommunityContent({ targetType: "post", targetId: record.id, reason: "Сомнение в корректности подтверждённого вклада", details: `Проверьте карточку ${record.id}` }); setReported(true); }
  return <main className="public-page-shell contribution-public-shell">
    <header className="public-profile-top"><Link href="/"><ArrowLeft/>В платформу</Link><span>NEURODELO · вклад</span></header>
    <section className="public-contribution-hero panel"><div><Badge tone={record.verified ? "success" : "danger"}>{record.verified ? <ShieldCheck/> : <AlertTriangle/>}{record.verified ? "Подтверждено" : "На пересмотре"}</Badge><h1>{record.title}</h1><p>{record.summary}</p><div className="public-contribution-meta"><span><GitPullRequest/>{record.contributionId}</span><span>{record.projectName}</span><span>{record.kind}</span><span>{record.acceptedAt}</span></div></div><div className="public-contribution-score"><strong>+{record.skillXp}</strong><span>skill XP</span><small>+{record.heroXp} hero XP</small></div></section>
    <div className="public-contribution-grid"><section className="panel content-panel"><div className="section-title"><div><p>Проверяемые операции</p><h2>Журнал начисления</h2></div><Badge tone="violet"><History/>{transactions.length}</Badge></div><div className="xp-ledger compact-ledger">{transactions.map((item) => <article key={item.id} className={`xp-ledger-row status-${item.status}`}><div className="xp-ledger-icon"><Award/></div><div><h3>{item.reason}</h3><p>{item.skillName} · {item.createdBy}</p><small>{item.createdAt}</small></div><aside><strong className={item.amount < 0 ? "negative-xp" : "positive-xp"}>{item.amount > 0 ? "+" : ""}{item.amount} XP</strong></aside></article>)}</div></section><aside className="view-stack"><section className="panel content-panel"><div className="section-title"><div><p>Авторство</p><h2>{record.contributorName}</h2></div></div><div className="contribution-author-card"><span>{record.contributorInitials}</span><div><strong>{record.contributorName}</strong><p>{record.projectName}</p><a href={`/u/${record.contributorId}`}>Открыть профиль <ExternalLink/></a></div></div></section><section className="panel content-panel"><div className="section-title"><div><p>Релизы</p><h2>Где использован вклад</h2></div></div><div className="release-mini-list">{releases.map((item) => <article key={item.id}><PackageCheck/><div><strong>{item.releaseName}</strong><small>{item.releasedAt}</small></div></article>)}</div></section></aside></div>
    <section className="panel content-panel"><div className="section-title"><div><p>Человеческое признание</p><h2>Благодарности</h2></div><Badge tone="warning"><Heart/>{kudos.length}</Badge></div><div className="kudos-wall public-kudos-wall">{kudos.map((item) => <article key={item.id}><Heart/><div><strong>{item.fromName}</strong><p>«{item.message}»</p><small>{item.createdAt}{item.officialProjectThanks ? " · официально от проекта" : ""}</small></div></article>)}</div></section>
    <section className="public-contribution-footer panel"><div><CheckCircle2/><div><strong>Карточка не удаляет спорные действия</strong><span>Ошибочное XP отменяется обратной операцией, поэтому история остаётся понятной.</span></div></div><button className="ghost-button" disabled={reported} onClick={report}><Flag/>{reported ? "Жалоба отправлена" : "Сообщить о проблеме"}</button></section>
  </main>;
}
