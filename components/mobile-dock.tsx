"use client";

import { FolderKanban, LayoutDashboard, MessagesSquare, UserRound, Wrench } from "lucide-react";
import type { ViewId } from "@/types/platform";

const items: Array<{ id: ViewId; label: string; icon: typeof LayoutDashboard }> = [
  { id: "dashboard", label: "Обзор", icon: LayoutDashboard },
  { id: "projects", label: "Проекты", icon: FolderKanban },
  { id: "contributions", label: "Задачи", icon: Wrench },
  { id: "messages", label: "Чаты", icon: MessagesSquare },
  { id: "profile", label: "Профиль", icon: UserRound },
];

export function MobileDock({ active, onSelect }: { active: ViewId; onSelect: (id: ViewId) => void }) {
  return <nav className="mobile-dock" aria-label="Мобильная навигация">
    {items.map(({ id, label, icon: Icon }) => <button key={id} type="button" className={active === id ? "active" : ""} aria-current={active === id ? "page" : undefined} onClick={() => onSelect(id)}><Icon /><span>{label}</span></button>)}
  </nav>;
}
