"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Accessibility, Bell, CheckCircle2, ChevronDown, Menu, Search, Settings, Sparkles, UserRound, X } from "lucide-react";
import type { RoleId, TextScale, ViewId } from "@/types/platform";
import { usePlatform } from "@/components/platform-provider";

const roleLabels: Record<RoleId, string> = { contributor: "Контрибьютор", maintainer: "Автор проекта", mentor: "Наставник" };

export function Topbar({ title, role, onRoleChange, onMenu, onOpenAi, onGoProfile, onGoSettings, onNavigate }: { title: string; role: RoleId; onRoleChange: (role: RoleId) => void; onMenu: () => void; onOpenAi: () => void; onGoProfile: () => void; onGoSettings: () => void; onNavigate: (view: ViewId) => void }) {
  const { state, updatePreferences, markNotificationRead } = usePlatform();
  const profile = state.profile;
  const appearance = state.preferences.appearance;
  const availableRoles = useMemo(() => profile.roles.length ? profile.roles : ["contributor" as RoleId], [profile.roles]);
  const initials = profile.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "НД";
  const [roleOpen, setRoleOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!availableRoles.includes(role)) onRoleChange(availableRoles[0]);
  }, [availableRoles, onRoleChange, role]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
        window.setTimeout(() => searchRef.current?.focus(), 0);
      }
      if (event.key === "Escape") {
        setRoleOpen(false); setNotificationsOpen(false); setProfileOpen(false); setSearchOpen(false); setAccessibilityOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function closePopovers(except?: "role" | "notifications" | "profile" | "search" | "accessibility") {
    if (except !== "role") setRoleOpen(false);
    if (except !== "notifications") setNotificationsOpen(false);
    if (except !== "profile") setProfileOpen(false);
    if (except !== "search") setSearchOpen(false);
    if (except !== "accessibility") setAccessibilityOpen(false);
  }

  async function patchAppearance(patch: Partial<typeof appearance>) {
    await updatePreferences({ appearance: { ...appearance, ...patch } });
  }

  return (
    <header className="topbar">
      <div className="topbar-title">
        <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Открыть меню"><Menu size={21} /></button>
        <div><small>Open-source пространство</small><h1>{title}</h1></div>
      </div>
      <div className="topbar-actions">
        <div className="role-switch-wrap topbar-role">
          <button className="role-switch" aria-expanded={roleOpen} aria-haspopup="menu" onClick={() => { closePopovers("role"); setRoleOpen((value) => !value); }}><span>{roleLabels[role]}</span><ChevronDown /></button>
          {roleOpen ? <div className="top-popover role-popover" role="menu" aria-label="Выбор роли">{availableRoles.map((item) => <button role="menuitemradio" aria-checked={role === item} className={role === item ? "active" : ""} key={item} onClick={() => { onRoleChange(item); setRoleOpen(false); }}><span>{roleLabels[item]}</span>{role === item ? <CheckCircle2 /> : null}</button>)}</div> : null}
        </div>
        <label className="search-box"><Search size={17} /><span className="sr-only">Поиск</span><input ref={searchRef} aria-label="Найти проекты, задачи и людей" onFocus={() => { closePopovers("search"); setSearchOpen(true); }} placeholder="Найти проекты, задачи, людей…" /><kbd>Ctrl K</kbd></label>
        {searchOpen ? <div className="top-popover search-popover" role="dialog" aria-label="Быстрый поиск"><div className="popover-title"><strong>Быстрый поиск</strong><button onClick={() => setSearchOpen(false)} aria-label="Закрыть поиск"><X /></button></div><button onClick={() => { onNavigate("projects"); setSearchOpen(false); }}><span className="result-icon">P</span><div><strong>Open Companion</strong><small>Apache-2.0 · 14 открытых задач</small></div></button><button onClick={() => { onNavigate("contributions"); setSearchOpen(false); }}><span className="result-icon">#</span><div><strong>Issue #142: мобильная навигация</strong><small>Frontend · +420 XP</small></div></button><button onClick={() => { onNavigate("people"); setSearchOpen(false); }}><span className="result-icon">М</span><div><strong>Михаил Орлов</strong><small>Мейнтейнер · 126 вкладов</small></div></button></div> : null}
        <button className="ai-button" onClick={onOpenAi}><Sparkles size={17} /><span>Помощник</span></button>
        <div className="popover-anchor topbar-accessibility">
          <button className="icon-button" aria-label="Быстрые настройки доступности" aria-expanded={accessibilityOpen} onClick={() => { closePopovers("accessibility"); setAccessibilityOpen((value) => !value); }}><Accessibility size={19} /></button>
          {accessibilityOpen ? <div className="top-popover accessibility-popover" role="dialog" aria-label="Быстрые настройки доступности"><div className="popover-title"><strong>Доступность</strong><button onClick={() => setAccessibilityOpen(false)} aria-label="Закрыть настройки доступности"><X /></button></div><div className="quick-a11y-group"><span>Размер текста</span><div>{([['compact','A−'],['normal','A'],['large','A+']] as Array<[TextScale,string]>).map(([id,label]) => <button key={id} className={appearance.textScale === id ? "active" : ""} aria-pressed={appearance.textScale === id} onClick={() => patchAppearance({ textScale: id })}>{label}</button>)}</div></div><label className="quick-toggle"><span>Высокий контраст</span><input type="checkbox" checked={appearance.highContrast} onChange={(event) => patchAppearance({ highContrast: event.target.checked })} /></label><label className="quick-toggle"><span>Уменьшить движение</span><input type="checkbox" checked={appearance.reduceMotion} onChange={(event) => patchAppearance({ reduceMotion: event.target.checked })} /></label><button className="popover-footer" onClick={() => { onGoSettings(); setAccessibilityOpen(false); }}>Все настройки интерфейса</button></div> : null}
        </div>
        <div className="popover-anchor topbar-notifications">
          <button className="icon-button notification-button" onClick={() => { closePopovers("notifications"); setNotificationsOpen((value) => !value); }} aria-label={`Уведомления: ${state.notifications.filter((item) => !item.read).length} непрочитано`} aria-expanded={notificationsOpen}><Bell size={19} />{state.notifications.filter((item) => !item.read).length ? <span aria-hidden="true">{state.notifications.filter((item) => !item.read).length}</span> : null}</button>
          {notificationsOpen ? <div className="top-popover notification-popover" role="dialog" aria-label="Уведомления"><div className="popover-title"><strong>Уведомления</strong><button onClick={() => setNotificationsOpen(false)} aria-label="Закрыть уведомления"><X /></button></div>{state.notifications.slice(0, 4).map((item) => <article key={item.id} className={item.read ? "read" : "unread"}><span className={`notice-mark ${item.kind === "security" ? "orange" : item.kind === "contribution" ? "green" : "violet"}`} /><button onClick={() => { void markNotificationRead(item.id); if (item.actionView) onNavigate(item.actionView); setNotificationsOpen(false); }}><strong>{item.title}</strong><small>{item.message} · {item.createdAt}</small></button></article>)}{state.notifications.length === 0 ? <div className="notification-popover-empty">Новых событий нет</div> : null}<button className="popover-footer" onClick={() => { onNavigate("notifications"); setNotificationsOpen(false); }}>Показать все уведомления</button></div> : null}
        </div>
        <div className="popover-anchor topbar-profile">
          <button className="profile-chip" onClick={() => { closePopovers("profile"); setProfileOpen((value) => !value); }} aria-label="Меню профиля" aria-expanded={profileOpen}><span>{initials}</span><div><strong>{profile.name}</strong><small>Герой {profile.heroProgression.level}</small></div></button>
          {profileOpen ? <div className="top-popover profile-popover" role="menu" aria-label="Меню профиля"><div className="profile-popover-head"><span>{initials}</span><div><strong>{profile.name}</strong><small>{roleLabels[role]}</small></div></div><button role="menuitem" onClick={() => { onGoProfile(); setProfileOpen(false); }}><UserRound />Открыть профиль</button><button role="menuitem" onClick={() => { onGoSettings(); setProfileOpen(false); }}><Settings />Настройки</button></div> : null}
        </div>
      </div>
    </header>
  );
}
