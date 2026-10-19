"use client";

import { useMemo, useState } from "react";
import { Bell, CheckCheck, ExternalLink, Mail, MailCheck, ShieldCheck, Trash2 } from "lucide-react";
import { usePlatform } from "@/components/platform-provider";
import { Badge, SectionTitle } from "@/components/ui/primitives";
import type { NotificationKind, ViewId } from "@/types/platform";

const kindLabels: Record<NotificationKind, string> = {
  message: "Сообщение", project: "Проект", contribution: "Вклад", recognition: "Благодарность",
  security: "Безопасность", game: "Игра", system: "Система",
};

export function NotificationsView({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const { state, markNotificationRead, markAllNotificationsRead, deleteNotification, sendTestEmail, requestBrowserNotifications } = usePlatform();
  const [filter, setFilter] = useState<"all" | "unread" | "security">("all");
  const [result, setResult] = useState<string | null>(null);
  const items = useMemo(() => state.notifications.filter((item) => filter === "all" || (filter === "unread" ? !item.read : item.kind === "security")), [filter, state.notifications]);
  const unread = state.notifications.filter((item) => !item.read).length;

  async function testEmail() {
    setResult("Отправляем тестовое письмо…");
    const response = await sendTestEmail();
    setResult(response.ok ? response.provider === "preview" ? `Email preview: ${response.preview ?? "готов"}` : "Тестовое письмо отправлено." : response.error ?? "Не удалось отправить письмо.");
  }

  async function enableBrowser() {
    const permission = await requestBrowserNotifications();
    setResult(permission === "unsupported" ? "Этот браузер не поддерживает уведомления." : permission === "granted" ? "Уведомления браузера разрешены." : "Разрешение не выдано.");
  }

  return <div className="view-stack notifications-view">
    <section className="panel content-panel">
      <SectionTitle eyebrow="Центр событий" title="Уведомления" action={<Badge tone={unread ? "warning" : "success"}><Bell />{unread ? `${unread} непрочитано` : "Всё прочитано"}</Badge>} />
      <div className="notification-toolbar">
        <div className="segmented-control" aria-label="Фильтр уведомлений">
          {([['all','Все'],['unread','Непрочитанные'],['security','Безопасность']] as const).map(([id,label]) => <button key={id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)}>{label}</button>)}
        </div>
        <div className="button-row">
          <button className="ghost-button" onClick={() => void markAllNotificationsRead()} disabled={!unread}><CheckCheck />Прочитать все</button>
          <button className="ghost-button" onClick={() => void testEmail()}><Mail />Проверить email</button>
          <button className="ghost-button" onClick={() => void enableBrowser()}><MailCheck />Уведомления браузера</button>
        </div>
      </div>
      {result ? <div className="inline-success" role="status"><ShieldCheck />{result}</div> : null}
      <div className="notification-list">
        {items.length ? items.map((item) => <article key={item.id} className={`notification-card ${item.read ? "read" : "unread"}`}>
          <span className={`notification-kind kind-${item.kind}`}><Bell /></span>
          <div className="notification-copy"><div><Badge>{kindLabels[item.kind]}</Badge><small>{item.createdAt}</small></div><strong>{item.title}</strong><p>{item.message}</p></div>
          <div className="notification-actions">
            {!item.read ? <button className="ghost-button" onClick={() => void markNotificationRead(item.id)}><CheckCheck />Прочитано</button> : null}
            {item.actionView ? <button className="primary-button" onClick={() => { void markNotificationRead(item.id); onNavigate(item.actionView!); }}><ExternalLink />Открыть</button> : null}
            {item.actionPath ? <a className="primary-button" href={item.actionPath}><ExternalLink />Перейти</a> : null}
            <button className="icon-button" onClick={() => void deleteNotification(item.id)} aria-label={`Удалить уведомление: ${item.title}`}><Trash2 /></button>
          </div>
        </article>) : <div className="empty-state"><Bell /><h3>Нет уведомлений</h3><p>В этом фильтре пока нет событий.</p></div>}
      </div>
    </section>
  </div>;
}
