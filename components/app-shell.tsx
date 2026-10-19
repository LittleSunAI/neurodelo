"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, DatabaseZap, LoaderCircle } from "lucide-react";
import type { RoleId, ViewId } from "@/types/platform";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { AiAssistant } from "@/components/ai-assistant";
import { CreateProjectWizard } from "@/components/create-project-wizard";
import { CreateRequestWizard } from "@/components/create-request-wizard";
import { DashboardView } from "@/components/views/dashboard-view";
import { ContributionsView } from "@/components/views/tasks-view";
import { PeopleView } from "@/components/views/people-view";
import { ProjectsView } from "@/components/views/teams-view";
import { LearningView } from "@/components/views/learning-view";
import { ProjectView } from "@/components/views/project-view";
import { RequestsView } from "@/components/views/requests-view";
import { ForumView } from "@/components/views/forum-view";
import { MessagesView } from "@/components/views/messages-view";
import { ProfileView } from "@/components/views/profile-view";
import { RecognitionView } from "@/components/views/recognition-view";
import { ArenaView } from "@/components/views/arena-view";
import { SettingsView } from "@/components/views/settings-view";
import { HeroStudioView } from "@/components/views/hero-studio-view";
import { ProjectEditorView } from "@/components/views/project-editor-view";
import { GitIntegrationView } from "@/components/views/git-integration-view";
import { AdminView } from "@/components/views/admin-view";
import { NotificationsView } from "@/components/views/notifications-view";
import { hasPermission } from "@/lib/security/permissions";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { AccessibilitySync } from "@/components/accessibility-sync";
import { MobileDock } from "@/components/mobile-dock";
import { usePlatform } from "@/components/platform-provider";

const titles: Record<ViewId, string> = {
  dashboard: "Обзор",
  projects: "Open-source проекты",
  contributions: "Задачи для вклада",
  people: "Участники сообщества",
  recognition: "Признание и награды",
  arena: "Герои и арена",
  heroStudio: "Образ героя",
  learning: "Обучение",
  git: "Git-интеграция",
  project: "Рабочая комната проекта",
  projectEditor: "Редактор проекта",
  requests: "Запросы сообщества",
  forum: "Форум",
  messages: "Сообщения",
  profile: "Мой профиль",
  settings: "Настройки",
  notifications: "Уведомления",
  admin: "Администрирование и модерация",
};

export function AppShell() {
  const { state, hydrated, authHydrated, authSession } = usePlatform();
  const sync = <AccessibilitySync appearance={state.preferences.appearance} />;
  if (!hydrated || !authHydrated) return <>{sync}<div className="platform-loader" role="status" aria-live="polite"><LoaderCircle className="spin" /><strong>Загружаем профиль</strong><span>Проверяем локальное состояние и fallback-сервисы.</span></div></>;
  if (!authSession.authenticated) return <>{sync}<LoginRedirect /></>;
  if (!state.onboardingCompleted) return <>{sync}<OnboardingFlow /></>;
  return <>{sync}<HydratedShell initialRole={state.profile.primaryRole} /></>;
}

function HydratedShell({ initialRole }: { initialRole: RoleId }) {
  const { state, saving, error, mode, gameMode, heroImageMode, gitMode, communityMode, moderationMode, authSession, selectProject, createConversation, openConversation, sendChatMessage } = usePlatform();
  const [view, setView] = useState<ViewId>("dashboard");
  const [role, setRole] = useState<RoleId>(initialRole);
  const [aiOpen, setAiOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [createRequestOpen, setCreateRequestOpen] = useState(false);
  const showAdmin = hasPermission(authSession.roles, "moderation.view");
  const showRequests = state.moderation.featureFlags.find((item) => item.id === "flag-paid-requests")?.enabled !== false;
  const queryHandled = useRef(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (queryHandled.current) return;
    queryHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("project");
    const messageTo = params.get("message");
    const inviteTo = params.get("invite");
    if (projectId) {
      void selectProject(projectId).then(() => setView(params.get("edit") === "1" ? "projectEditor" : "project"));
    } else if (messageTo || inviteTo) {
      const targetId = messageTo ?? inviteTo!;
      const participant = state.community.participants.find((item) => item.id === targetId || item.name.toLowerCase().replaceAll("ё", "е").replace(/[^a-zа-я0-9]+/gi, "-").replace(/^-|-$/g, "") === targetId);
      if (participant) {
        const existing = state.community.conversations.find((conversation) => conversation.kind === "direct" && conversation.participantIds.includes(participant.id));
        void (async () => {
          const conversationId = existing?.id ?? await createConversation({ title: participant.name, kind: "direct", participantIds: [state.profile.nickname, participant.id] });
          await openConversation(conversationId);
          if (inviteTo) await sendChatMessage(conversationId, "Приглашаю вас посмотреть мои open-source проекты и обсудить возможный вклад.");
          setView("messages");
        })();
      } else {
        window.setTimeout(() => setView("people"), 0);
      }
    }
    if (projectId || messageTo || inviteTo) window.history.replaceState({}, "", window.location.pathname);
  }, [createConversation, openConversation, selectProject, sendChatMessage, state.community.conversations, state.community.participants, state.profile.nickname]);



  useEffect(() => {
    document.title = `${titles[view]} — NEURODELO`;
    mainRef.current?.focus({ preventScroll: true });
  }, [view]);

  function changeRole(nextRole: RoleId) {
    setRole(nextRole);
    setView("dashboard");
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Перейти к основному содержимому</a>
      <div className="sr-only" aria-live="polite" aria-atomic="true">Открыт раздел: {titles[view]}</div>
      <Sidebar active={view} role={role} onSelect={setView} open={menuOpen} onClose={() => setMenuOpen(false)} showAdmin={showAdmin} showRequests={showRequests} />
      <div className="app-main">
        <Topbar title={titles[view]} role={role} onRoleChange={changeRole} onMenu={() => setMenuOpen(true)} onOpenAi={() => setAiOpen(true)} onGoProfile={() => setView("profile")} onGoSettings={() => setView("settings")} onNavigate={setView} />
        {error ? <div className="runtime-alert"><AlertTriangle /><span>{error}</span></div> : null}
        <main ref={mainRef} id="main-content" className="workspace" tabIndex={-1} aria-label={titles[view]}>
          {view === "dashboard" && <DashboardView role={role} onCreateProject={() => setCreateProjectOpen(true)} onGoContributions={() => setView("contributions")} onGoProject={() => setView("project")} onGoPeople={() => setView("people")} onGoLearning={() => setView("learning")} onGoProjects={() => setView("projects")} />}
          {view === "projects" && <ProjectsView onCreateProject={() => setCreateProjectOpen(true)} onOpenWorkspace={async (projectId) => { await selectProject(projectId); setView("project"); }} onEditProject={async (projectId) => { await selectProject(projectId); setView("projectEditor"); }} />}
          {view === "contributions" && <ContributionsView role={role} onGoProject={() => setView("project")} />}
          {view === "people" && <PeopleView onCreateTask={() => setCreateProjectOpen(true)} onMessage={async (name) => {
            const participant = state.community.participants.find((item) => item.name === name);
            if (!participant) { setView("messages"); return; }
            const existing = state.community.conversations.find((conversation) => conversation.kind === "direct" && conversation.participantIds.includes(participant.id));
            if (existing) await openConversation(existing.id);
            else await createConversation({ title: participant.name, kind: "direct", participantIds: [state.profile.nickname, participant.id] });
            setView("messages");
          }} />}
          {view === "recognition" && <RecognitionView role={role} />}
          {view === "arena" && <ArenaView />}
          {view === "heroStudio" && <HeroStudioView />}
          {view === "learning" && <LearningView />}
          {view === "git" && <GitIntegrationView onOpenProject={() => setView("project")} />}
          {view === "project" && <ProjectView role={role} onOpenRecognition={() => setView("recognition")} onOpenGit={() => setView("git")} onEditProject={() => setView("projectEditor")} />}
          {view === "projectEditor" && <ProjectEditorView onBack={() => setView("projects")} onOpenPublic={(slug) => window.open(`/p/${slug}`, "_blank", "noopener,noreferrer")} />}
          {view === "requests" && <RequestsView onCreateRequest={() => setCreateRequestOpen(true)} />}
          {view === "forum" && <ForumView />}
          {view === "messages" && <MessagesView />}
          {view === "profile" && <ProfileView onOpenHeroStudio={() => setView("heroStudio")} />}
          {view === "settings" && <SettingsView />}
          {view === "notifications" && <NotificationsView onNavigate={setView} />}
          {view === "admin" && showAdmin && <AdminView />}
        </main>
      </div>
      <MobileDock active={view} onSelect={setView} />
      <div className={`runtime-mode ${mode}`}><DatabaseZap />{mode === "fallback" ? "Data fallback" : "Data API"} · {gameMode === "fallback" ? "Game fallback" : "Game API"} · {heroImageMode === "fallback" ? "Hero fallback" : "fal.ai"} · {gitMode === "fallback" ? "Git fallback" : "Git API"} · {communityMode === "fallback" ? "Community fallback" : "Community API"} · {moderationMode === "fallback" ? "Moderation fallback" : "Moderation API"}{saving ? <LoaderCircle className="spin" /> : null}</div>
      <AiAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
      <CreateProjectWizard open={createProjectOpen} onClose={() => setCreateProjectOpen(false)} onCreated={() => setView("projectEditor")} />
      <CreateRequestWizard open={createRequestOpen} onClose={() => setCreateRequestOpen(false)} />
    </div>
  );
}

function LoginRedirect() {
  useEffect(() => { window.location.replace("/login"); }, []);
  return <div className="platform-loader"><LoaderCircle className="spin" /><strong>Переходим ко входу</strong><span>Защищённая часть требует локальную или серверную сессию.</span></div>;
}
