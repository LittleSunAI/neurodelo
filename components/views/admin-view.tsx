"use client";
import { useMemo, useState } from "react";
import { AlertOctagon, BadgeCheck, ExternalLink, Eye, FileWarning, Flag, History, Link2, ListChecks, Scale, ShieldCheck, SlidersHorizontal, UserX } from "lucide-react";
import { usePlatform } from "@/components/platform-provider";
import { Badge } from "@/components/ui/primitives";
import type { ModerationAction, ModerationCase, ModerationPriority } from "@/types/platform";

type Tab = "overview" | "cases" | "links" | "appeals" | "flags" | "audit";
const tabs: { id: Tab; label: string }[] = [
  { id: "overview", label: "Обзор" }, { id: "cases", label: "Очередь" }, { id: "links", label: "Ссылки" }, { id: "appeals", label: "Апелляции" }, { id: "flags", label: "Функции" }, { id: "audit", label: "Журнал" },
];
const priorityLabel: Record<ModerationPriority, string> = { low: "Низкий", medium: "Средний", high: "Высокий", critical: "Критический" };
const actions: { id: ModerationAction; label: string }[] = [
  { id: "approve", label: "Одобрить" }, { id: "dismiss", label: "Отклонить жалобу" }, { id: "warn", label: "Предупредить" }, { id: "restrict", label: "Ограничить" }, { id: "suspend", label: "Приостановить" }, { id: "remove-content", label: "Скрыть контент" },
];

export function AdminView() {
  const { state, moderationMode, assignModerationCase, resolveModerationCase, reviewModerationAppeal, reviewExternalLink, toggleFeatureFlag, saving } = usePlatform();
  const [tab, setTab] = useState<Tab>("overview");
  const [selected, setSelected] = useState<ModerationCase | null>(null);
  const [action, setAction] = useState<ModerationAction>("warn");
  const [reason, setReason] = useState("");
  const [appealReason, setAppealReason] = useState<Record<string,string>>({});
  const [linkNote, setLinkNote] = useState<Record<string,string>>({});
  const openCases = state.moderation.cases.filter((item) => !["resolved","dismissed"].includes(item.status));
  const critical = state.moderation.cases.filter((item) => item.priority === "critical" || item.priority === "high").length;
  const pendingLinks = state.moderation.externalLinks.filter((item) => item.status === "pending").length;
  const openAppeals = state.moderation.appeals.filter((item) => ["open","reviewing"].includes(item.status)).length;
  const statusCounts = useMemo(() => state.moderation.cases.reduce<Record<string,number>>((acc,item) => ({...acc,[item.status]:(acc[item.status]??0)+1}),{}),[state.moderation.cases]);

  async function applyDecision() { if (!selected) return; const ok = await resolveModerationCase(selected.id, action, reason); if (ok) { setSelected(null); setReason(""); } }

  return <div className="view-stack admin-console">
    <section className="panel admin-hero"><div><Badge tone="violet"><ShieldCheck /> Административный контур</Badge><h2>Модерация с доказательствами, апелляциями и полным журналом</h2><p>Fallback показывает будущий рабочий процесс. Решения сохраняются локально, но не имеют юридической силы и легко заменяются серверным API.</p></div><div className="admin-mode-card"><span>Режим</span><strong>{moderationMode === "fallback" ? "Moderation fallback" : "Moderation API"}</strong><small>Проверяющий: {state.moderation.activeReviewer}</small></div></section>
    <section className="panel admin-tabs">{tabs.map((item)=><button key={item.id} className={tab===item.id?"active":""} onClick={()=>setTab(item.id)}>{item.label}</button>)}</section>

    {tab === "overview" ? <><section className="admin-kpi-grid">
      <article className="panel"><ListChecks/><strong>{openCases.length}</strong><span>дел требуют внимания</span></article>
      <article className="panel"><AlertOctagon/><strong>{critical}</strong><span>высокий приоритет</span></article>
      <article className="panel"><Link2/><strong>{pendingLinks}</strong><span>ссылок на проверке</span></article>
      <article className="panel"><Scale/><strong>{openAppeals}</strong><span>открытых апелляций</span></article>
    </section><section className="admin-overview-grid"><article className="panel content-panel"><div className="section-title"><div><p>Срез очереди</p><h2>Статусы дел</h2></div></div><div className="admin-status-list">{Object.entries(statusCounts).map(([key,value])=><div key={key}><span>{key}</span><strong>{value}</strong></div>)}</div></article><article className="panel content-panel"><div className="section-title"><div><p>Активные ограничения</p><h2>Санкции</h2></div></div><div className="admin-sanctions">{state.moderation.sanctions.map((item)=><article key={item.id}><UserX/><div><strong>{item.userName}</strong><span>{item.reason}</span><small>{item.action} · {item.expiresAt ?? "без срока"}</small></div></article>)}</div></article></section></> : null}

    {tab === "cases" ? <section className="panel content-panel"><div className="section-title"><div><p>Жалобы, проекты и спорные начисления</p><h2>Очередь модерации</h2></div><Badge tone="warning"><FileWarning />{openCases.length} открыто</Badge></div><div className="moderation-case-list">{state.moderation.cases.map((item)=><article key={item.id} className={`priority-${item.priority}`}><header><div><Badge tone={item.priority === "critical" || item.priority === "high" ? "danger" : item.priority === "medium" ? "warning" : "default"}>{priorityLabel[item.priority]}</Badge><h3>{item.title}</h3></div><span>{item.status}</span></header><p>{item.summary}</p><div className="case-meta"><span>Объект: {item.subjectName}</span><span>Источник: {item.reporterName}</span><span>{item.createdAt}</span></div><div className="case-evidence">{item.evidence.map((entry)=><span key={entry.id}>{entry.label}: {entry.value}</span>)}</div><footer>{!item.assignedTo && !["resolved","dismissed"].includes(item.status) ? <button className="ghost-button small" onClick={()=>assignModerationCase(item.id)}>Взять на проверку</button> : null}<button className="primary-button small" disabled={["resolved","dismissed"].includes(item.status)} onClick={()=>{setSelected(item);setReason("");}}>Рассмотреть</button></footer></article>)}</div></section> : null}

    {tab === "links" ? <section className="panel content-panel"><div className="section-title"><div><p>Каталог сообществ и внешняя поддержка</p><h2>Проверка ссылок</h2></div><Badge tone="violet"><ExternalLink />{pendingLinks} ожидают</Badge></div><div className="external-review-grid">{state.moderation.externalLinks.map((item)=><article key={item.id}><header><Link2/><div><h3>{item.ownerName}</h3><small>{item.platform} · риск {item.riskScore}/100</small></div><Badge tone={item.status === "approved" ? "success" : item.status === "rejected" ? "danger" : "warning"}>{item.status}</Badge></header><a href={item.url} target="_blank" rel="noreferrer">{item.url}</a><textarea value={linkNote[item.id] ?? item.note ?? ""} onChange={(e)=>setLinkNote({...linkNote,[item.id]:e.target.value})} placeholder="Комментарий проверяющего"/><footer><button className="ghost-button small" onClick={()=>reviewExternalLink(item.id,"rejected",linkNote[item.id]??"Ссылка не прошла проверку")}>Отклонить</button><button className="primary-button small" onClick={()=>reviewExternalLink(item.id,"approved",linkNote[item.id]??"Проверено")}>Одобрить</button></footer></article>)}</div></section> : null}

    {tab === "appeals" ? <section className="panel content-panel"><div className="section-title"><div><p>Право на повторное рассмотрение</p><h2>Апелляции</h2></div><Badge tone="warning"><Scale />{openAppeals} открыто</Badge></div><div className="appeal-list">{state.moderation.appeals.map((item)=><article key={item.id}><header><div><h3>Дело {item.caseId}</h3><small>{item.submittedBy} · {item.createdAt}</small></div><Badge tone={item.status === "overturned" ? "success" : item.status === "rejected" ? "danger" : "warning"}>{item.status}</Badge></header><p>{item.reason}</p><textarea value={appealReason[item.id] ?? item.resolution ?? ""} onChange={(e)=>setAppealReason({...appealReason,[item.id]:e.target.value})} placeholder="Результат повторной проверки"/><footer><button className="ghost-button small" onClick={()=>reviewModerationAppeal(item.id,"rejected",appealReason[item.id]??"Оснований для изменения решения не найдено")}>Отклонить</button><button className="ghost-button small" onClick={()=>reviewModerationAppeal(item.id,"upheld",appealReason[item.id]??"Первоначальное решение подтверждено")}>Подтвердить решение</button><button className="primary-button small" onClick={()=>reviewModerationAppeal(item.id,"overturned",appealReason[item.id]??"Решение отменено после повторной проверки")}>Удовлетворить</button></footer></article>)}</div></section> : null}

    {tab === "flags" ? <section className="panel content-panel"><div className="section-title"><div><p>Безопасное включение модулей</p><h2>Feature flags</h2></div><Badge tone="violet"><SlidersHorizontal />{state.moderation.featureFlags.filter((item)=>item.enabled).length} включено</Badge></div><div className="feature-flag-list">{state.moderation.featureFlags.map((item)=><article key={item.id}><Flag/><div><h3>{item.label}</h3><p>{item.description}</p><small>{item.audience} · изменил {item.updatedBy} · {item.updatedAt}</small></div><button className={item.enabled?"toggle-control on":"toggle-control"} onClick={()=>toggleFeatureFlag(item.id)} aria-label={`Переключить ${item.label}`}><span/></button></article>)}</div></section> : null}

    {tab === "audit" ? <section className="panel content-panel"><div className="section-title"><div><p>Ничего не исчезает бесследно</p><h2>Журнал действий</h2></div><Badge tone="success"><History />{state.moderation.auditLog.length} событий</Badge></div><div className="moderation-audit-list">{state.moderation.auditLog.map((item)=><article key={item.id}><History/><div><strong>{item.action}</strong><span>{item.details}</span><small>{item.actorName} · {item.createdAt} · {item.targetId}</small></div></article>)}</div></section> : null}

    {selected ? <div className="modal-layer" role="dialog" aria-modal="true"><section className="modal-card admin-decision-modal"><button className="modal-close" onClick={()=>setSelected(null)} aria-label="Закрыть">×</button><Badge tone="warning"><Eye />Решение по делу</Badge><h2>{selected.title}</h2><p>{selected.summary}</p><label>Действие<select value={action} onChange={(e)=>setAction(e.target.value as ModerationAction)}>{actions.map((item)=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label>Обоснование<textarea value={reason} onChange={(e)=>setReason(e.target.value)} placeholder="Не менее 6 символов. Решение попадёт в журнал."/></label><button className="primary-button" disabled={saving || reason.trim().length < 6} onClick={applyDecision}><BadgeCheck />Сохранить решение</button><small>Нейросеть может подготовить сводку, но окончательное решение принимает человек.</small></section></div> : null}
  </div>;
}
