import {
  Award, Bell, BookOpen, CircleUserRound, Code2, FolderKanban, Gamepad2, GitPullRequestArrow,
  GitBranch, GraduationCap, HandCoins, Image, LayoutDashboard, MessagesSquare, Settings, ShieldCheck, UsersRound, X,
} from "lucide-react";
import { brand } from "@/data/mock-data";
import type { NavigationItem, RoleId, ViewId } from "@/types/platform";

const navigation: NavigationItem[] = [
  { id: "dashboard", label: "Обзор", icon: LayoutDashboard },
  { id: "projects", label: "Open-source проекты", icon: FolderKanban, badge: 4 },
  { id: "contributions", label: "Задачи для вклада", icon: GitPullRequestArrow, badge: 5 },
  { id: "people", label: "Участники", icon: UsersRound },
  { id: "recognition", label: "Признание и награды", icon: Award, badge: 3 },
  { id: "arena", label: "Герои и арена", icon: Gamepad2 },
  { id: "heroStudio", label: "Образ героя", icon: Image },
  { id: "learning", label: "Обучение", icon: GraduationCap },
  { id: "git", label: "Git-интеграция", icon: GitBranch, badge: 2 },
  { id: "project", label: "Рабочая комната", icon: Code2 },
  { id: "requests", label: "Запросы сообщества", icon: HandCoins, badge: 3 },
  { id: "forum", label: "Форум", icon: BookOpen },
  { id: "messages", label: "Сообщения", icon: MessagesSquare, badge: 5 },
  { id: "notifications", label: "Уведомления", icon: Bell },
  { id: "admin", label: "Модерация", icon: ShieldCheck, badge: 4 },
  { id: "profile", label: "Мой профиль", icon: CircleUserRound },
];

const roleHint: Record<RoleId, { title: string; value: string; text: string }> = {
  contributor: { title: "Активный вклад", value: "1 / 3", text: "Берите только то, что сможете довести до ревью" },
  maintainer: { title: "Открытые задачи", value: "14", text: "3 вклада ожидают проверки команды" },
  mentor: { title: "Проверки вкладов", value: "4", text: "2 работы подходят для разбора сегодня" },
};

export function Sidebar({ active, role, onSelect, open, onClose, showAdmin, showRequests }: { active: ViewId; role: RoleId; onSelect: (id: ViewId) => void; open: boolean; onClose: () => void; showAdmin: boolean; showRequests: boolean }) {
  const hint = roleHint[role];
  return (
    <>
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`} aria-label="Боковая панель">
        <button className="sidebar-close icon-button" onClick={onClose} aria-label="Закрыть меню"><X /></button>
        <button className="brand" onClick={() => onSelect("dashboard")} aria-label="На главную">
          <span className="brand-mark"><span /></span>
          <span><strong>{brand.name}</strong><small>{brand.subtitle}</small></span>
        </button>
        <nav className="nav-list" aria-label="Главная навигация">
          {navigation.filter((item) => (item.id !== "admin" || showAdmin) && (item.id !== "requests" || showRequests)).map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={active === item.id ? "nav-item active" : "nav-item"} aria-current={active === item.id ? "page" : undefined} onClick={() => { onSelect(item.id); onClose(); }}>
                <Icon size={19} />
                <span>{item.label}</span>
                {item.badge ? <em>{item.badge}</em> : null}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-bottom">
          <div className="capacity-card">
            <div><span>{hint.title}</span><strong>{hint.value}</strong></div>
            <div className="mini-progress"><span style={{ width: role === "contributor" ? "34%" : role === "maintainer" ? "68%" : "72%" }} /></div>
            <small>{hint.text}</small>
          </div>
          <button className={active === "settings" ? "nav-item active" : "nav-item"} aria-current={active === "settings" ? "page" : undefined} onClick={() => { onSelect("settings"); onClose(); }}><Settings size={19} /><span>Настройки</span></button>
        </div>
      </aside>
      {open ? <button className="sidebar-backdrop" onClick={onClose} aria-label="Закрыть меню" /> : null}
    </>
  );
}
