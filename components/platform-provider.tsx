"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { rewardCatalog } from "@/data/mock-data";
import { gameGateway, progressChallenges, recalculateProgression } from "@/services/game-gateway";
import { defaultProfile, defaultState, platformGateway } from "@/services/platform-gateway";
import { authGateway } from "@/services/auth-gateway";
import { heroImageGateway, type HeroImageProgress } from "@/services/hero-image-gateway";
import { createDefaultGitState, gitGateway } from "@/services/git-gateway";
import { communityGateway } from "@/services/community-gateway";
import { moderationGateway } from "@/services/moderation-gateway";
import type {
  AuthSession,
  BattleResult,
  HeroClassId,
  HeroConfig,
  HeroImageGenerationInput,
  HeroImageVariant,
  HeroProgression,
  HeroStatId,
  GitPullRequestRecord,
  KudosRecord,
  OpenSourceProject,
  ContributionTask,
  ConversationKind,
  ForumReactionId,
  ForumThread,
  ForumPost,
  CommunityReport,
  ChatMessage,
  ProjectNewsItem,
  ProjectRoadmapItem,
  PlatformPreferences,
  PlatformState,
  RecognitionCategory,
  Skill,
  SecurityDevice,
  TeamBattleResult,
  UserProfile,
  ModerationAction,
  ModerationAppeal,
  NotificationRecord,
  ExternalLinkReviewStatus,
} from "@/types/platform";

type SendKudosInput = {
  contributorId: string;
  contributorName: string;
  projectId: string;
  contributionId: string;
  category: RecognitionCategory;
  message: string;
  officialProjectThanks: boolean;
};

type PlatformContextValue = {
  state: PlatformState;
  hydrated: boolean;
  saving: boolean;
  error: string | null;
  mode: "fallback" | "api";
  gameMode: "fallback" | "api";
  heroImageMode: "fallback" | "fal-api";
  gitMode: "fallback" | "api";
  communityMode: "fallback" | "api";
  moderationMode: "fallback" | "api";
  authSession: AuthSession;
  authHydrated: boolean;
  securityDevices: SecurityDevice[];
  completeOnboarding: (profile: UserProfile) => Promise<void>;
  updateProfile: (patch: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (patch: Partial<PlatformPreferences>) => Promise<void>;
  updateHero: (hero: HeroConfig) => Promise<void>;
  assessSkills: (profile: Pick<UserProfile, "professions" | "experience">) => Promise<Skill[]>;
  generateHero: (profile: Pick<UserProfile, "professions" | "experience"> & { preferredPalette?: HeroConfig["palette"] }) => Promise<HeroConfig>;
  completeTraining: (taskId: string) => Promise<void>;
  claimContribution: (taskId: string) => Promise<void>;
  submitContribution: (taskId: string) => Promise<void>;
  joinProject: (projectId: string) => Promise<void>;
  toggleSavedProject: (projectId: string) => Promise<void>;
  selectProject: (projectId: string) => Promise<void>;
  toggleProjectSubscription: (projectId: string) => Promise<void>;
  createProject: (project: OpenSourceProject) => Promise<void>;
  updateProject: (projectId: string, patch: Partial<OpenSourceProject>) => Promise<void>;
  addProjectTask: (projectId: string, task: ContributionTask) => Promise<void>;
  addProjectNews: (projectId: string, news: ProjectNewsItem) => Promise<void>;
  addProjectRoadmapItem: (projectId: string, item: ProjectRoadmapItem) => Promise<void>;
  sendKudos: (input: SendKudosInput) => Promise<KudosRecord | null>;
  reverseXpTransaction: (transactionId: string, reason: string) => Promise<boolean>;
  selectHeroClass: (classId: HeroClassId) => Promise<void>;
  allocateHeroStat: (stat: HeroStatId) => Promise<void>;
  runTrainingBattle: () => Promise<BattleResult | null>;
  runRankedBattle: () => Promise<BattleResult | null>;
  runTeamBattle: () => Promise<TeamBattleResult | null>;
  equipHeroItem: (itemId: string) => Promise<void>;
  unlockHeroSkill: (skillId: string) => Promise<void>;
  claimGameChallenge: (challengeId: string) => Promise<boolean>;
  unlockReward: (rewardId: string) => Promise<boolean>;
  generateHeroImage: (input: HeroImageGenerationInput, options?: { signal?: AbortSignal; onProgress?: (progress: HeroImageProgress) => void }) => Promise<HeroImageVariant>;
  addUploadedHeroImage: (input: Pick<HeroImageVariant, "imageUrl" | "width" | "height" | "fileSize" | "mimeType" | "originalFileName"> & { title?: string }) => Promise<HeroImageVariant>;
  setActiveHeroImage: (variantId?: string) => Promise<void>;
  deleteHeroImage: (variantId: string) => Promise<void>;
  connectGitProfile: () => Promise<void>;
  disconnectGitProfile: () => Promise<void>;
  selectGitRepository: (repositoryId: string) => Promise<void>;
  syncGitRepository: (repositoryId: string) => Promise<void>;
  createGitPullRequest: (taskId: string) => Promise<GitPullRequestRecord | null>;
  runGitChecks: (pullRequestId: string) => Promise<void>;
  mergeGitPullRequest: (pullRequestId: string) => Promise<boolean>;
  createForumThread: (input: { categoryId: string; projectId?: string; title: string; summary: string; tags: string[] }) => Promise<ForumThread>;
  addForumReply: (threadId: string, body: string, quotePostId?: string) => Promise<ForumPost>;
  toggleForumReaction: (postId: string, reaction: ForumReactionId) => Promise<void>;
  toggleForumBookmark: (threadId: string) => Promise<void>;
  markForumSolution: (threadId: string, postId: string) => Promise<void>;
  reportCommunityContent: (input: Omit<CommunityReport, "id" | "createdAt" | "status">) => Promise<CommunityReport>;
  createConversation: (input: { title: string; kind: ConversationKind; participantIds: string[]; projectId?: string }) => Promise<string>;
  openConversation: (conversationId: string) => Promise<void>;
  sendChatMessage: (conversationId: string, body: string, options?: { replyToId?: string; attachments?: ChatMessage["attachments"] }) => Promise<ChatMessage>;
  toggleMessageReaction: (messageId: string, reaction: ForumReactionId) => Promise<void>;
  toggleConversationMute: (conversationId: string) => Promise<void>;
  toggleConversationPin: (conversationId: string) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;
  blockCommunityUser: (userId: string) => Promise<void>;
  toggleCommunityTranslation: () => Promise<void>;
  assignModerationCase: (caseId: string) => Promise<void>;
  resolveModerationCase: (caseId: string, action: ModerationAction, reason: string) => Promise<boolean>;
  createModerationAppeal: (caseId: string, reason: string) => Promise<ModerationAppeal | null>;
  reviewModerationAppeal: (appealId: string, outcome: "upheld" | "overturned" | "rejected", reason: string) => Promise<boolean>;
  reviewExternalLink: (linkId: string, status: ExternalLinkReviewStatus, note: string) => Promise<boolean>;
  toggleFeatureFlag: (flagId: string) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  sendTestEmail: () => Promise<{ ok: boolean; provider?: string; preview?: string; error?: string }>;
  requestBrowserNotifications: () => Promise<NotificationPermission | "unsupported">;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, nextPassword: string) => Promise<{ ok: boolean; error?: string }>;
  revokeDevice: (deviceId: string) => Promise<void>;
  revokeOtherDevices: () => Promise<void>;
  exportLocalData: () => string;
  deleteLocalAccount: () => Promise<void>;
  loadDemo: () => Promise<void>;
  resetDemo: () => Promise<void>;
};

const PlatformContext = createContext<PlatformContextValue | null>(null);

function makeNotification(input: Omit<NotificationRecord, "id" | "createdAt" | "read">): NotificationRecord {
  return { id: `notice-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: "только что", read: false, ...input };
}
function deliverOptionalNotification(record: NotificationRecord, settings: PlatformPreferences["notifications"]) {
  if (typeof window === "undefined") return;
  if (settings.browserNotifications && "Notification" in window && Notification.permission === "granted") {
    try { new Notification(record.title, { body: record.message, tag: record.id }); } catch { /* browser policy may deny */ }
  }
  if (settings.emailTransactional && ["contribution", "recognition", "project", "security"].includes(record.kind)) {
    void fetch("/api/v1/notifications/email/event", {
      method: "POST", credentials: "same-origin",
      headers: { "Content-Type": "application/json", "Idempotency-Key": `notice-${record.id}` },
      body: JSON.stringify({ event: record.kind, eventId: record.id, title: record.title, message: record.message, actionPath: record.actionPath ?? "/" }),
    }).catch(() => undefined);
  }
}

function addHeroXp(current: HeroProgression, amount: number): HeroProgression {
  let xp = current.xp + amount;
  let level = current.level;
  let xpToNext = current.xpToNext;
  let unspentPoints = current.unspentPoints;
  let skillPoints = current.skillPoints;
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    unspentPoints += 2;
    skillPoints += 1;
    xpToNext = Math.round(xpToNext * 1.18);
  }
  return recalculateProgression({ ...current, xp, level, xpToNext, unspentPoints, skillPoints });
}

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlatformState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [authHydrated, setAuthHydrated] = useState(false);
  const [authSession, setAuthSession] = useState<AuthSession>({ authenticated: false, status: "active", remembered: false });
  const [securityDevices, setSecurityDevices] = useState<SecurityDevice[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([platformGateway.loadState(), authGateway.load()])
      .then(([loaded, auth]) => {
        if (!active) return;
        setState(loaded);
        setAuthSession(auth.session);
        setSecurityDevices(auth.devices);
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Не удалось загрузить локальное состояние"); })
      .finally(() => {
        if (!active) return;
        setHydrated(true);
        setAuthHydrated(true);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!authHydrated) return;
    let active = true;
    const refresh = () => authGateway.load().then((snapshot) => { if (active) { setAuthSession(snapshot.session); setSecurityDevices(snapshot.devices); } }).catch(() => undefined);
    const interval = window.setInterval(refresh, 5 * 60 * 1000);
    const onVisibility = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => { active = false; window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisibility); };
  }, [authHydrated]);

  const persist = useCallback(async (next: PlatformState) => {
    setSaving(true);
    setError(null);
    setState(next);
    try {
      await platformGateway.saveState(next);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить изменения");
    } finally {
      setSaving(false);
    }
  }, []);

  const completeOnboarding = useCallback(async (profile: UserProfile) => {
    await persist({
      version: 12,
      onboardingCompleted: true,
      completedAt: new Date().toISOString(),
      profile: { ...profile, heroProgression: profile.heroProgression ?? defaultProfile.heroProgression },
      claimedContributionIds: [],
      submittedContributionIds: [],
      joinedProjectIds: [],
      savedProjectIds: [],
      subscribedProjectIds: [],
      selectedProjectId: "open-companion",
      projects: defaultState.projects,
      git: defaultState.git,
      community: defaultState.community,
      moderation: defaultState.moderation,
      recognitionRecords: defaultState.recognitionRecords,
      kudosRecords: defaultState.kudosRecords,
      xpTransactions: defaultState.xpTransactions,
      releaseCredits: defaultState.releaseCredits,
      recognitionAuditLog: defaultState.recognitionAuditLog,
      battleHistory: [],
      game: defaultState.game,
      heroImages: defaultState.heroImages,
      preferences: defaultState.preferences,
      securityDevices: defaultState.securityDevices,
      loginHistory: defaultState.loginHistory,
      notifications: defaultState.notifications,
    });
  }, [persist]);

  const updateProfile = useCallback(async (patch: Partial<UserProfile>) => {
    await persist({ ...state, profile: { ...state.profile, ...patch } });
  }, [persist, state]);

  const updatePreferences = useCallback(async (patch: Partial<PlatformPreferences>) => {
    await persist({
      ...state,
      preferences: {
        privacy: { ...state.preferences.privacy, ...(patch.privacy ?? {}) },
        notifications: { ...state.preferences.notifications, ...(patch.notifications ?? {}) },
        appearance: { ...state.preferences.appearance, ...(patch.appearance ?? {}) },
      },
    });
  }, [persist, state]);

  const updateHero = useCallback(async (hero: HeroConfig) => {
    await updateProfile({ hero });
  }, [updateProfile]);

  const assessSkills = useCallback((profile: Pick<UserProfile, "professions" | "experience">) => platformGateway.assessSkills(profile), []);
  const generateHero = useCallback((profile: Pick<UserProfile, "professions" | "experience"> & { preferredPalette?: HeroConfig["palette"] }) => platformGateway.generateHero(profile), []);

  const completeTraining = useCallback(async (taskId: string) => {
    const task = state.profile.trainingTasks.find((item) => item.id === taskId);
    if (!task || task.completed) return;
    const trainingTasks = state.profile.trainingTasks.map((item) => item.id === taskId ? { ...item, completed: true, score: 86 } : item);
    const skills = state.profile.skills.map((skill) => skill.id === task.profession ? { ...skill, progress: Math.min(100, skill.progress + 18), confirmed: true, source: "test" as const } : skill);
    const portfolio = [...state.profile.portfolio, { id: `training-${task.id}`, title: task.title, category: "Учебный open-source sandbox", summary: task.description, verified: true, contributionType: "Practice patch", projectLicense: "MIT" }];
    const heroReward = gameGateway.contributionReward(task.rewardXp);
    await updateProfile({
      trainingTasks,
      skills,
      portfolio,
      xp: state.profile.xp + task.rewardXp,
      heroProgression: addHeroXp(state.profile.heroProgression, heroReward.heroXp),
    });
  }, [state.profile, updateProfile]);

  const claimContribution = useCallback(async (taskId: string) => {
    if (state.claimedContributionIds.includes(taskId) || state.submittedContributionIds.includes(taskId)) return;
    await persist({ ...state, claimedContributionIds: [...state.claimedContributionIds, taskId] });
  }, [persist, state]);

  const submitContribution = useCallback(async (taskId: string) => {
    if (state.submittedContributionIds.includes(taskId)) return;
    const task = state.projects.flatMap((project) => project.tasks).find((item) => item.id === taskId);
    if (!task) return;
    const claimedContributionIds = state.claimedContributionIds.filter((id) => id !== taskId);
    const submittedContributionIds = [...state.submittedContributionIds, taskId];
    const categoryToProfession = {
      Frontend: "frontend",
      Backend: "backend",
      "Базы данных": "database",
      Дизайн: "design",
      Тестирование: "qa",
      Документация: "management",
    } as const;
    const targetProfession = categoryToProfession[task.category as keyof typeof categoryToProfession];
    const skills = state.profile.skills.map((item) => item.id === targetProfession ? { ...item, progress: Math.min(100, item.progress + 12), confirmed: true, source: "project" as const } : item);
    const portfolio = state.profile.portfolio.some((item) => item.id === `contribution-${task.id}`)
      ? state.profile.portfolio
      : [...state.profile.portfolio, {
          id: `contribution-${task.id}`,
          title: task.title,
          category: task.project,
          summary: `Демонстрационный вклад принят fallback-проверкой: ${task.summary}`,
          verified: true,
          contributionType: task.kind,
          projectLicense: state.projects.find((project) => project.id === task.projectId)?.license ?? "Open source",
        }];
    const heroReward = gameGateway.contributionReward(task.rewardXp);
    const recognitionId = `recognition-${task.id}`;
    const recognitionRecords = state.recognitionRecords.some((item) => item.id === recognitionId)
      ? state.recognitionRecords
      : [{
          id: recognitionId,
          contributorId: state.profile.nickname,
          contributorName: state.profile.name,
          contributorInitials: state.profile.name.slice(0, 2).toUpperCase(),
          projectId: task.projectId,
          projectName: task.project,
          contributionId: task.id,
          title: task.title,
          summary: task.summary,
          kind: task.kind,
          acceptedAt: "только что",
          skillXp: task.rewardXp,
          heroXp: heroReward.heroXp,
          verified: true,
          kudosCount: 0,
          categories: ["quality" as const],
        }, ...state.recognitionRecords];
    const notification = makeNotification({ kind: "contribution", title: "Вклад принят", message: `${task.project} · +${task.rewardXp} XP`, actionView: "recognition" });
    await persist({
      ...state,
      claimedContributionIds,
      submittedContributionIds,
      recognitionRecords,
      profile: {
        ...state.profile,
        skills,
        portfolio,
        xp: state.profile.xp + task.rewardXp,
        mergedContributions: state.profile.mergedContributions + 1,
        reputation: Math.min(100, state.profile.reputation + 1),
        communityPoints: state.profile.communityPoints + heroReward.communityPoints,
        heroProgression: addHeroXp(state.profile.heroProgression, heroReward.heroXp),
      },
      game: { ...state.game, challenges: progressChallenges(state.game.challenges, "contribution") },
      notifications: [notification, ...state.notifications].slice(0, 80),
    });
    deliverOptionalNotification(notification, state.preferences.notifications);
  }, [persist, state]);

  const joinProject = useCallback(async (projectId: string) => {
    if (state.joinedProjectIds.includes(projectId)) return;
    await persist({ ...state, joinedProjectIds: [...state.joinedProjectIds, projectId] });
  }, [persist, state]);

  const toggleSavedProject = useCallback(async (projectId: string) => {
    const savedProjectIds = state.savedProjectIds.includes(projectId)
      ? state.savedProjectIds.filter((id) => id !== projectId)
      : [...state.savedProjectIds, projectId];
    await persist({ ...state, savedProjectIds });
  }, [persist, state]);

  const selectProject = useCallback(async (projectId: string) => {
    if (!state.projects.some((project) => project.id === projectId)) return;
    await persist({ ...state, selectedProjectId: projectId });
  }, [persist, state]);

  const toggleProjectSubscription = useCallback(async (projectId: string) => {
    const subscribedProjectIds = state.subscribedProjectIds.includes(projectId)
      ? state.subscribedProjectIds.filter((id) => id !== projectId)
      : [...state.subscribedProjectIds, projectId];
    const delta = state.subscribedProjectIds.includes(projectId) ? -1 : 1;
    const projects = state.projects.map((project) => project.id === projectId
      ? { ...project, subscribers: Math.max(0, project.subscribers + delta), updatedAt: "только что" }
      : project);
    await persist({ ...state, subscribedProjectIds, projects });
  }, [persist, state]);

  const createProject = useCallback(async (project: OpenSourceProject) => {
    const projects = [project, ...state.projects.filter((item) => item.id !== project.id && item.slug !== project.slug)];
    const gitSeed = createDefaultGitState([project], state.profile);
    const git = {
      ...state.git,
      selectedRepositoryId: gitSeed.repositories[0]?.id ?? state.git.selectedRepositoryId,
      repositories: [...gitSeed.repositories, ...state.git.repositories.filter((item) => item.projectId !== project.id)],
      issues: [...gitSeed.issues, ...state.git.issues.filter((item) => item.projectId !== project.id)],
      commits: [...gitSeed.commits, ...state.git.commits.filter((item) => item.repositoryId !== gitSeed.repositories[0]?.id)],
    };
    await persist({
      ...state,
      projects,
      git,
      selectedProjectId: project.id,
      joinedProjectIds: state.joinedProjectIds.includes(project.id) ? state.joinedProjectIds : [...state.joinedProjectIds, project.id],
    });
  }, [persist, state]);

  const updateProject = useCallback(async (projectId: string, patch: Partial<OpenSourceProject>) => {
    const projects = state.projects.map((project) => project.id === projectId
      ? { ...project, ...patch, updatedAt: "только что", openTasks: patch.tasks ? patch.tasks.length : project.openTasks }
      : project);
    const updatedProject = projects.find((project) => project.id === projectId);
    const git = updatedProject ? (() => {
      const seed = createDefaultGitState([updatedProject], state.profile);
      const seededIssues = seed.issues.map((issue) => state.git.issues.find((current) => current.linkedTaskId === issue.linkedTaskId) ?? issue);
      return {
        ...state.git,
        repositories: state.git.repositories.map((repository) => repository.projectId === projectId ? {
          ...repository,
          fullName: updatedProject.repository.replace(/^https?:\/\/(www\.)?github\.com\//, "").replace(/\.git$/, "") || repository.fullName,
          description: updatedProject.summary,
          defaultBranch: updatedProject.defaultBranch,
          readme: updatedProject.readme,
          openIssues: updatedProject.tasks.length,
        } : repository),
        issues: [...seededIssues, ...state.git.issues.filter((issue) => issue.projectId !== projectId)],
      };
    })() : state.git;
    await persist({ ...state, projects, git });
  }, [persist, state]);

  const addProjectTask = useCallback(async (projectId: string, task: ContributionTask) => {
    const project = state.projects.find((item) => item.id === projectId);
    if (!project) return;
    const tasks = [task, ...project.tasks.filter((item) => item.id !== task.id)];
    await updateProject(projectId, { tasks, openTasks: tasks.length });
  }, [state.projects, updateProject]);

  const addProjectNews = useCallback(async (projectId: string, news: ProjectNewsItem) => {
    const project = state.projects.find((item) => item.id === projectId);
    if (!project) return;
    await updateProject(projectId, { news: [news, ...project.news] });
  }, [state.projects, updateProject]);

  const addProjectRoadmapItem = useCallback(async (projectId: string, item: ProjectRoadmapItem) => {
    const project = state.projects.find((entry) => entry.id === projectId);
    if (!project) return;
    await updateProject(projectId, { roadmap: [...project.roadmap, item] });
  }, [state.projects, updateProject]);

  const sendKudos = useCallback(async (input: SendKudosInput) => {
    const alreadySent = state.kudosRecords.some((item) => item.fromUserId === state.profile.nickname && item.contributionId === input.contributionId);
    if (alreadySent) return null;
    const communityPoints = input.officialProjectThanks ? 3 : 1;
    const record = await platformGateway.sendKudos({
      fromUserId: state.profile.nickname,
      fromName: state.profile.name,
      toContributorId: input.contributorId,
      toContributorName: input.contributorName,
      projectId: input.projectId,
      contributionId: input.contributionId,
      category: input.category,
      message: input.message,
      communityPoints,
      officialProjectThanks: input.officialProjectThanks,
    });
    const recognitionRecords = state.recognitionRecords.map((item) => item.contributionId === input.contributionId
      ? {
          ...item,
          kudosCount: item.kudosCount + 1,
          officialThanksCount: (item.officialThanksCount ?? 0) + (input.officialProjectThanks ? 1 : 0),
          categories: item.categories.includes(input.category) ? item.categories : [...item.categories, input.category],
        }
      : item);
    const audit = input.officialProjectThanks ? [{
      id: `audit-${Date.now()}`,
      action: "official-thanks" as const,
      targetId: input.contributionId,
      actorName: state.profile.name,
      reason: input.message,
      createdAt: "только что",
    }, ...state.recognitionAuditLog] : state.recognitionAuditLog;
    const notification = makeNotification({ kind: "recognition", title: "Благодарность отправлена", message: `${input.contributorName} · ${input.message}`, actionView: "recognition" });
    await persist({
      ...state,
      recognitionRecords,
      kudosRecords: [record, ...state.kudosRecords],
      recognitionAuditLog: audit,
      notifications: [notification, ...state.notifications].slice(0, 80),
    });
    deliverOptionalNotification(notification, state.preferences.notifications);
    return record;
  }, [persist, state]);

  const reverseXpTransaction = useCallback(async (transactionId: string, reason: string) => {
    const transaction = state.xpTransactions.find((item) => item.id === transactionId);
    if (!transaction || transaction.status !== "confirmed" || transaction.kind === "reversal") return false;
    if (state.xpTransactions.some((item) => item.reversalOfId === transactionId)) return false;
    const result = await platformGateway.reverseXpTransaction({ transaction, reason, actorName: state.profile.name });
    const xpTransactions = state.xpTransactions.map((item) => item.id === transactionId ? result.original : item);
    xpTransactions.unshift(result.reversal);
    const recognitionRecords = state.recognitionRecords.map((item) => item.xpTransactionIds?.includes(transactionId)
      ? { ...item, moderationStatus: "revoked" as const, verified: false, riskFlags: [...(item.riskFlags ?? []), "xp-reversed"] }
      : item);
    const own = transaction.contributorId === state.profile.nickname;
    const profile = own ? {
      ...state.profile,
      xp: Math.max(0, state.profile.xp - transaction.amount),
      communityPoints: Math.max(0, state.profile.communityPoints - transaction.communityPoints),
      heroProgression: { ...state.profile.heroProgression, xp: Math.max(0, state.profile.heroProgression.xp - transaction.heroXp) },
    } : state.profile;
    await persist({ ...state, profile, xpTransactions, recognitionRecords, recognitionAuditLog: [result.audit, ...state.recognitionAuditLog] });
    return true;
  }, [persist, state]);

  const selectHeroClass = useCallback(async (classId: HeroClassId) => {
    const heroProgression = await gameGateway.selectClass(state.profile.heroProgression, classId);
    await updateProfile({ heroProgression });
  }, [state.profile.heroProgression, updateProfile]);

  const allocateHeroStat = useCallback(async (stat: HeroStatId) => {
    const heroProgression = await gameGateway.allocateStat(state.profile.heroProgression, stat);
    await updateProfile({ heroProgression });
  }, [state.profile.heroProgression, updateProfile]);

  const runTrainingBattle = useCallback(async () => {
    const outcome = await gameGateway.runTrainingBattle(state.profile.heroProgression, state.battleHistory.length);
    const challenges = progressChallenges(state.game.challenges, "battle");
    await persist({
      ...state,
      profile: { ...state.profile, heroProgression: outcome.progression },
      battleHistory: [outcome.result, ...state.battleHistory].slice(0, 20),
      game: { ...state.game, challenges, leaderboard: gameGateway.updateLeaderboard(state.game.leaderboard, outcome.progression, state.game.seasonPoints, state.profile.name) },
    });
    return outcome.result;
  }, [persist, state]);

  const runRankedBattle = useCallback(async () => {
    const outcome = await gameGateway.runRankedBattle(state.profile.heroProgression, state.battleHistory.length);
    const won = outcome.result.result === "win";
    const seasonPoints = Math.max(0, state.game.seasonPoints + (outcome.result.seasonPoints ?? 0));
    let challenges = progressChallenges(state.game.challenges, "battle");
    if (won) challenges = progressChallenges(challenges, "ranked-win");
    await persist({
      ...state,
      profile: { ...state.profile, heroProgression: outcome.progression },
      battleHistory: [outcome.result, ...state.battleHistory].slice(0, 20),
      game: {
        ...state.game,
        seasonPoints,
        challenges,
        leaderboard: gameGateway.updateLeaderboard(state.game.leaderboard, outcome.progression, seasonPoints, state.profile.name),
      },
    });
    return outcome.result;
  }, [persist, state]);

  const runTeamBattle = useCallback(async () => {
    const outcome = await gameGateway.runTeamBattle(state.profile.heroProgression, state.game.teamBattleHistory.length);
    const seasonPoints = Math.max(0, state.game.seasonPoints + outcome.result.seasonPoints);
    const challenges = progressChallenges(state.game.challenges, "team-battle");
    await persist({
      ...state,
      profile: { ...state.profile, heroProgression: outcome.progression },
      game: {
        ...state.game,
        seasonPoints,
        challenges,
        teamBattleHistory: [outcome.result, ...state.game.teamBattleHistory].slice(0, 12),
        leaderboard: gameGateway.updateLeaderboard(state.game.leaderboard, outcome.progression, seasonPoints, state.profile.name),
      },
    });
    return outcome.result;
  }, [persist, state]);

  const equipHeroItem = useCallback(async (itemId: string) => {
    const heroProgression = await gameGateway.equipItem(state.profile.heroProgression, itemId);
    await updateProfile({ heroProgression });
  }, [state.profile.heroProgression, updateProfile]);

  const unlockHeroSkill = useCallback(async (skillId: string) => {
    const heroProgression = await gameGateway.unlockSkill(state.profile.heroProgression, skillId);
    await updateProfile({ heroProgression });
  }, [state.profile.heroProgression, updateProfile]);

  const claimGameChallenge = useCallback(async (challengeId: string) => {
    const challenge = state.game.challenges.find((item) => item.id === challengeId);
    if (!challenge || !challenge.completed || challenge.claimed) return false;
    const result = await gameGateway.claimChallenge(state.profile.heroProgression, challenge);
    await persist({
      ...state,
      profile: {
        ...state.profile,
        communityPoints: state.profile.communityPoints + result.communityPoints,
        heroProgression: result.progression,
      },
      game: {
        ...state.game,
        challenges: state.game.challenges.map((item) => item.id === challengeId ? result.challenge : item),
        leaderboard: gameGateway.updateLeaderboard(state.game.leaderboard, result.progression, state.game.seasonPoints, state.profile.name),
      },
    });
    return true;
  }, [persist, state]);

  const unlockReward = useCallback(async (rewardId: string) => {
    const reward = rewardCatalog.find((item) => item.id === rewardId);
    if (!reward) return false;
    const progression = state.profile.heroProgression;
    if (progression.unlockedRewardIds.includes(rewardId)) return true;
    if (state.profile.communityPoints < reward.cost) return false;
    await persist({
      ...state,
      profile: {
        ...state.profile,
        communityPoints: state.profile.communityPoints - reward.cost,
        heroProgression: { ...progression, unlockedRewardIds: [...progression.unlockedRewardIds, rewardId] },
      },
    });
    return true;
  }, [persist, state]);

  const generateHeroImage = useCallback(async (input: HeroImageGenerationInput, options?: { signal?: AbortSignal; onProgress?: (progress: HeroImageProgress) => void }) => {
    try {
      const result = await heroImageGateway.generate(input, options);
      const maxVariants = state.heroImages.maxVariants || 8;
      const variants = [result.variant, ...state.heroImages.variants.filter((item) => item.id !== result.variant.id)].slice(0, maxVariants);
      await persist({
        ...state,
        heroImages: {
          ...state.heroImages,
          activeImageId: result.variant.id,
          variants,
          generationHistory: [result.record, ...state.heroImages.generationHistory].slice(0, 24),
          totalGenerated: state.heroImages.totalGenerated + 1,
        },
      });
      return result.variant;
    } catch (cause) {
      if (cause instanceof Error && cause.name !== "AbortError") {
        const failedRecord = {
          id: `hero-job-failed-${Date.now()}`,
          status: "failed" as const,
          provider: heroImageGateway.mode === "fallback" ? "fallback" as const : "fal" as const,
          prompt: input.prompt,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          error: cause.message,
        };
        await persist({ ...state, heroImages: { ...state.heroImages, generationHistory: [failedRecord, ...state.heroImages.generationHistory].slice(0, 24) } });
      }
      throw cause;
    }
  }, [persist, state]);

  const addUploadedHeroImage = useCallback(async (input: Pick<HeroImageVariant, "imageUrl" | "width" | "height" | "fileSize" | "mimeType" | "originalFileName"> & { title?: string }) => {
    const variant: HeroImageVariant = {
      id: `hero-upload-${Date.now()}`,
      title: input.title?.trim() || "Загруженный образ",
      source: "upload",
      status: "ready",
      imageUrl: input.imageUrl,
      createdAt: new Date().toISOString(),
      width: input.width,
      height: input.height,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      originalFileName: input.originalFileName,
    };
    const maxVariants = state.heroImages.maxVariants || 8;
    const variants = [variant, ...state.heroImages.variants].slice(0, maxVariants);
    await persist({ ...state, heroImages: { ...state.heroImages, activeImageId: variant.id, variants, totalUploaded: state.heroImages.totalUploaded + 1 } });
    return variant;
  }, [persist, state]);

  const setActiveHeroImage = useCallback(async (variantId?: string) => {
    if (variantId && !state.heroImages.variants.some((item) => item.id === variantId && item.status === "ready")) return;
    await persist({ ...state, heroImages: { ...state.heroImages, activeImageId: variantId } });
  }, [persist, state]);

  const deleteHeroImage = useCallback(async (variantId: string) => {
    const variants = state.heroImages.variants.filter((item) => item.id !== variantId);
    const activeImageId = state.heroImages.activeImageId === variantId ? variants[0]?.id : state.heroImages.activeImageId;
    await persist({ ...state, heroImages: { ...state.heroImages, activeImageId, variants } });
  }, [persist, state]);

  const connectGitProfile = useCallback(async () => {
    const git = await gitGateway.connectProfile(state.git, state.profile);
    await persist({ ...state, git });
  }, [persist, state]);

  const disconnectGitProfile = useCallback(async () => {
    const git = await gitGateway.disconnectProfile(state.git);
    await persist({ ...state, git });
  }, [persist, state]);

  const selectGitRepository = useCallback(async (repositoryId: string) => {
    const git = await gitGateway.selectRepository(state.git, repositoryId);
    await persist({ ...state, git });
  }, [persist, state]);

  const syncGitRepository = useCallback(async (repositoryId: string) => {
    const git = await gitGateway.syncRepository(state.git, repositoryId);
    await persist({ ...state, git });
  }, [persist, state]);

  const createGitPullRequest = useCallback(async (taskId: string) => {
    if (!state.git.profile) return null;
    const task = state.projects.flatMap((project) => project.tasks).find((item) => item.id === taskId);
    if (!task) return null;
    const repository = state.git.repositories.find((item) => item.projectId === task.projectId);
    if (!repository) return null;
    const result = await gitGateway.createPullRequest(state.git, repository, task, state.profile);
    const claimedContributionIds = state.claimedContributionIds.includes(taskId) ? state.claimedContributionIds : [...state.claimedContributionIds, taskId];
    await persist({ ...state, git: { ...result.state, selectedRepositoryId: repository.id }, claimedContributionIds });
    return result.pullRequest;
  }, [persist, state]);

  const runGitChecks = useCallback(async (pullRequestId: string) => {
    const git = await gitGateway.runChecks(state.git, pullRequestId);
    await persist({ ...state, git });
  }, [persist, state]);

  const mergeGitPullRequest = useCallback(async (pullRequestId: string) => {
    const source = state.git.pullRequests.find((item) => item.id === pullRequestId);
    if (!source || source.state !== "ready") return false;
    const result = await gitGateway.mergePullRequest(state.git, pullRequestId);
    const task = source.linkedTaskId ? state.projects.flatMap((project) => project.tasks).find((item) => item.id === source.linkedTaskId) : undefined;
    if (!task || source.xpAwarded || state.submittedContributionIds.includes(task.id)) {
      await persist({ ...state, git: result.state });
      return true;
    }
    const categoryToProfession = {
      Frontend: "frontend",
      Backend: "backend",
      "Базы данных": "database",
      Дизайн: "design",
      Тестирование: "qa",
      Документация: "management",
    } as const;
    const targetProfession = categoryToProfession[task.category as keyof typeof categoryToProfession];
    const skills = state.profile.skills.map((item) => item.id === targetProfession
      ? { ...item, progress: Math.min(100, item.progress + 12), confirmed: true, source: "project" as const }
      : item);
    const portfolio = state.profile.portfolio.some((item) => item.id === `contribution-${task.id}`)
      ? state.profile.portfolio
      : [...state.profile.portfolio, {
          id: `contribution-${task.id}`,
          title: task.title,
          category: task.project,
          summary: `Вклад подтверждён merged Pull Request #${result.pullRequest.number}: ${task.summary}`,
          verified: true,
          contributionType: task.kind,
          projectLicense: state.projects.find((project) => project.id === task.projectId)?.license ?? "Open source",
        }];
    const heroReward = gameGateway.contributionReward(task.rewardXp);
    const recognitionId = `recognition-${task.id}`;
    const recognitionRecords = state.recognitionRecords.some((item) => item.id === recognitionId)
      ? state.recognitionRecords
      : [{
          id: recognitionId,
          contributorId: state.profile.nickname,
          contributorName: state.profile.name,
          contributorInitials: state.profile.name.slice(0, 2).toUpperCase(),
          projectId: task.projectId,
          projectName: task.project,
          contributionId: task.id,
          title: task.title,
          summary: `Принят Pull Request #${result.pullRequest.number}. ${task.summary}`,
          kind: task.kind,
          acceptedAt: "только что",
          skillXp: task.rewardXp,
          heroXp: heroReward.heroXp,
          verified: true,
          kudosCount: 0,
          categories: ["quality" as const],
        }, ...state.recognitionRecords];
    const notification = makeNotification({ kind: "contribution", title: "Pull Request принят", message: `${task.project} · PR #${result.pullRequest.number} · +${task.rewardXp} XP`, actionView: "git" });
    await persist({
      ...state,
      git: result.state,
      claimedContributionIds: state.claimedContributionIds.filter((id) => id !== task.id),
      submittedContributionIds: [...state.submittedContributionIds, task.id],
      recognitionRecords,
      profile: {
        ...state.profile,
        skills,
        portfolio,
        xp: state.profile.xp + task.rewardXp,
        mergedContributions: state.profile.mergedContributions + 1,
        reputation: Math.min(100, state.profile.reputation + 1),
        communityPoints: state.profile.communityPoints + heroReward.communityPoints,
        heroProgression: addHeroXp(state.profile.heroProgression, heroReward.heroXp),
      },
      game: { ...state.game, challenges: progressChallenges(state.game.challenges, "contribution") },
      notifications: [notification, ...state.notifications].slice(0, 80),
    });
    deliverOptionalNotification(notification, state.preferences.notifications);
    return true;
  }, [persist, state]);

  const createForumThread = useCallback(async (input: { categoryId: string; projectId?: string; title: string; summary: string; tags: string[] }) => {
    const thread = await communityGateway.createThread({
      ...input,
      authorId: state.profile.nickname,
      authorName: state.profile.name,
      authorInitials: state.profile.name.slice(0, 2).toUpperCase(),
      status: "open",
      pinned: false,
      hot: false,
    });
    const firstPost = await communityGateway.createPost({
      threadId: thread.id,
      authorId: state.profile.nickname,
      authorName: state.profile.name,
      authorInitials: state.profile.name.slice(0, 2).toUpperCase(),
      body: input.summary,
    });
    const forumCategories = state.community.forumCategories.map((category) => category.id === input.categoryId ? { ...category, threadCount: category.threadCount + 1 } : category);
    await persist({
      ...state,
      community: {
        ...state.community,
        forumCategories,
        forumThreads: [thread, ...state.community.forumThreads],
        forumPosts: [firstPost, ...state.community.forumPosts],
      },
    });
    return thread;
  }, [persist, state]);

  const addForumReply = useCallback(async (threadId: string, body: string, quotePostId?: string) => {
    const post = await communityGateway.createPost({
      threadId,
      authorId: state.profile.nickname,
      authorName: state.profile.name,
      authorInitials: state.profile.name.slice(0, 2).toUpperCase(),
      body,
      quotePostId,
    });
    const forumThreads = state.community.forumThreads.map((thread) => thread.id === threadId ? { ...thread, replyCount: thread.replyCount + 1, updatedAt: "только что" } : thread);
    await persist({ ...state, community: { ...state.community, forumThreads, forumPosts: [...state.community.forumPosts, post] } });
    return post;
  }, [persist, state]);

  const toggleForumReaction = useCallback(async (postId: string, reaction: ForumReactionId) => {
    const forumPosts = state.community.forumPosts.map((post) => post.id === postId ? communityGateway.toggleReaction(post, reaction) : post);
    await persist({ ...state, community: { ...state.community, forumPosts } });
  }, [persist, state]);

  const toggleForumBookmark = useCallback(async (threadId: string) => {
    const forumThreads = state.community.forumThreads.map((thread) => thread.id === threadId ? { ...thread, bookmarkedByCurrentUser: !thread.bookmarkedByCurrentUser } : thread);
    await persist({ ...state, community: { ...state.community, forumThreads } });
  }, [persist, state]);

  const markForumSolution = useCallback(async (threadId: string, postId: string) => {
    const forumThreads = state.community.forumThreads.map((thread) => thread.id === threadId ? { ...thread, status: "solved" as const, solvedPostId: postId, updatedAt: "только что" } : thread);
    const forumPosts = state.community.forumPosts.map((post) => post.threadId === threadId ? { ...post, acceptedAnswer: post.id === postId } : post);
    await persist({ ...state, community: { ...state.community, forumThreads, forumPosts } });
  }, [persist, state]);

  const reportCommunityContent = useCallback(async (input: Omit<CommunityReport, "id" | "createdAt" | "status">) => {
    const report = await communityGateway.createReport(input);
    await persist({ ...state, community: { ...state.community, reports: [report, ...state.community.reports] } });
    return report;
  }, [persist, state]);

  const createConversation = useCallback(async (input: { title: string; kind: ConversationKind; participantIds: string[]; projectId?: string }) => {
    const id = `conv-${Date.now()}`;
    const initials = input.title.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
    const conversation = { id, ...input, initials, createdAt: "только что", updatedAt: "только что", unreadCount: 0, muted: false, archived: false, pinned: false };
    await persist({ ...state, community: { ...state.community, conversations: [conversation, ...state.community.conversations], lastOpenedConversationId: id } });
    return id;
  }, [persist, state]);

  const openConversation = useCallback(async (conversationId: string) => {
    const conversations = state.community.conversations.map((conversation) => conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation);
    const messages = state.community.messages.map((message) => message.conversationId === conversationId ? { ...message, deliveryStatus: "read" as const } : message);
    await persist({ ...state, community: { ...state.community, conversations, messages, lastOpenedConversationId: conversationId } });
  }, [persist, state]);

  const sendChatMessage = useCallback(async (conversationId: string, body: string, options?: { replyToId?: string; attachments?: ChatMessage["attachments"] }) => {
    const message = await communityGateway.createMessage({
      conversationId,
      senderId: state.profile.nickname,
      senderName: state.profile.name,
      body,
      sourceLanguage: state.profile.language,
      displayLanguage: state.profile.language,
      translated: false,
      replyToId: options?.replyToId,
      attachments: options?.attachments ?? [],
    });
    const conversations = state.community.conversations.map((conversation) => conversation.id === conversationId ? { ...conversation, updatedAt: "только что", unreadCount: 0 } : conversation);
    await persist({ ...state, community: { ...state.community, messages: [...state.community.messages, message], conversations, lastOpenedConversationId: conversationId } });
    return message;
  }, [persist, state]);

  const toggleMessageReaction = useCallback(async (messageId: string, reaction: ForumReactionId) => {
    const messages = state.community.messages.map((message) => message.id === messageId ? communityGateway.toggleReaction(message, reaction) : message);
    await persist({ ...state, community: { ...state.community, messages } });
  }, [persist, state]);

  const toggleConversationMute = useCallback(async (conversationId: string) => {
    const conversations = state.community.conversations.map((conversation) => conversation.id === conversationId ? { ...conversation, muted: !conversation.muted } : conversation);
    await persist({ ...state, community: { ...state.community, conversations } });
  }, [persist, state]);

  const toggleConversationPin = useCallback(async (conversationId: string) => {
    const conversations = state.community.conversations.map((conversation) => conversation.id === conversationId ? { ...conversation, pinned: !conversation.pinned } : conversation);
    await persist({ ...state, community: { ...state.community, conversations } });
  }, [persist, state]);


  const archiveConversation = useCallback(async (conversationId: string) => {
    const conversations = state.community.conversations.map((conversation) => conversation.id === conversationId ? { ...conversation, archived: true, pinned: false } : conversation);
    const next = conversations.find((conversation) => !conversation.archived && conversation.id !== conversationId);
    await persist({ ...state, community: { ...state.community, conversations, lastOpenedConversationId: next?.id } });
  }, [persist, state]);

  const blockCommunityUser = useCallback(async (userId: string) => {
    const blocked = state.preferences.privacy.blockedUserIds.includes(userId);
    const blockedUserIds = blocked ? state.preferences.privacy.blockedUserIds.filter((id) => id !== userId) : [...state.preferences.privacy.blockedUserIds, userId];
    await persist({ ...state, preferences: { ...state.preferences, privacy: { ...state.preferences.privacy, blockedUserIds } } });
  }, [persist, state]);

  const toggleCommunityTranslation = useCallback(async () => {
    const translationEnabled = !state.community.translationEnabled;
    let messages = state.community.messages;
    if (translationEnabled) {
      messages = await Promise.all(state.community.messages.map(async (message) => {
        if (message.sourceLanguage === state.profile.language) return { ...message, body: message.originalBody ?? message.body, displayLanguage: state.profile.language, translated: false };
        const originalBody = message.originalBody ?? message.body;
        const body = await communityGateway.translate(originalBody, message.sourceLanguage, state.profile.language);
        return { ...message, originalBody, body, displayLanguage: state.profile.language, translated: true };
      }));
    } else {
      messages = state.community.messages.map((message) => message.originalBody ? { ...message, body: message.originalBody, displayLanguage: message.sourceLanguage, translated: false } : message);
    }
    await persist({ ...state, community: { ...state.community, translationEnabled, messages } });
  }, [persist, state]);

  const assignModerationCase = useCallback(async (caseId: string) => {
    const item = state.moderation.cases.find((entry) => entry.id === caseId);
    if (!item) return;
    const result = await moderationGateway.assignCase({ item, reviewer: state.moderation.activeReviewer });
    await persist({ ...state, moderation: { ...state.moderation, cases: state.moderation.cases.map((entry) => entry.id === caseId ? result.item : entry), auditLog: [result.audit, ...state.moderation.auditLog] } });
  }, [persist, state]);

  const resolveModerationCase = useCallback(async (caseId: string, action: ModerationAction, reason: string) => {
    const item = state.moderation.cases.find((entry) => entry.id === caseId);
    if (!item || reason.trim().length < 6) return false;
    const result = await moderationGateway.resolveCase({ item, action, reason: reason.trim(), actorName: state.moderation.activeReviewer });
    const sanctions = ["warn", "restrict", "suspend"].includes(action) ? [{ id: `sanction-${Date.now()}`, userId: item.targetId, userName: item.subjectName, action: action as "warn" | "restrict" | "suspend", reason: reason.trim(), createdAt: "только что", expiresAt: action === "suspend" ? "через 7 дней" : undefined, active: true }, ...state.moderation.sanctions] : state.moderation.sanctions;
    await persist({ ...state, moderation: { ...state.moderation, cases: state.moderation.cases.map((entry) => entry.id === caseId ? result.item : entry), decisions: [result.decision, ...state.moderation.decisions], auditLog: [result.audit, ...state.moderation.auditLog], sanctions } });
    return true;
  }, [persist, state]);

  const createModerationAppeal = useCallback(async (caseId: string, reason: string) => {
    const item = state.moderation.cases.find((entry) => entry.id === caseId);
    if (!item || reason.trim().length < 8) return null;
    const appeal = await moderationGateway.createAppeal({ caseId, submittedBy: state.profile.name, reason: reason.trim() });
    await persist({ ...state, moderation: { ...state.moderation, cases: state.moderation.cases.map((entry) => entry.id === caseId ? { ...entry, status: "appealed", appealId: appeal.id } : entry), appeals: [appeal, ...state.moderation.appeals] } });
    return appeal;
  }, [persist, state]);

  const reviewModerationAppeal = useCallback(async (appealId: string, outcome: "upheld" | "overturned" | "rejected", reason: string) => {
    const appeal = state.moderation.appeals.find((entry) => entry.id === appealId);
    if (!appeal || reason.trim().length < 6) return false;
    const result = await moderationGateway.reviewAppeal({ appeal, outcome, reason: reason.trim(), reviewerName: state.moderation.activeReviewer });
    const cases = state.moderation.cases.map((entry) => entry.id === appeal.caseId ? { ...entry, status: outcome === "overturned" ? "dismissed" as const : "resolved" as const } : entry);
    await persist({ ...state, moderation: { ...state.moderation, appeals: state.moderation.appeals.map((entry) => entry.id === appealId ? result.appeal : entry), cases, auditLog: [result.audit, ...state.moderation.auditLog] } });
    return true;
  }, [persist, state]);

  const reviewExternalLink = useCallback(async (linkId: string, status: ExternalLinkReviewStatus, note: string) => {
    const link = state.moderation.externalLinks.find((entry) => entry.id === linkId);
    if (!link || note.trim().length < 4) return false;
    const result = await moderationGateway.reviewExternalLink({ link, status, note: note.trim(), reviewerName: state.moderation.activeReviewer });
    await persist({ ...state, moderation: { ...state.moderation, externalLinks: state.moderation.externalLinks.map((entry) => entry.id === linkId ? result.link : entry), auditLog: [result.audit, ...state.moderation.auditLog] } });
    return true;
  }, [persist, state]);

  const toggleFeatureFlag = useCallback(async (flagId: string) => {
    const flag = state.moderation.featureFlags.find((entry) => entry.id === flagId);
    if (!flag) return;
    const result = await moderationGateway.toggleFeatureFlag({ flag, actorName: state.moderation.activeReviewer });
    await persist({ ...state, moderation: { ...state.moderation, featureFlags: state.moderation.featureFlags.map((entry) => entry.id === flagId ? result.flag : entry), auditLog: [result.audit, ...state.moderation.auditLog] } });
  }, [persist, state]);

  const markNotificationRead = useCallback(async (id: string) => {
    await persist({ ...state, notifications: state.notifications.map((item) => item.id === id ? { ...item, read: true } : item) });
  }, [persist, state]);

  const markAllNotificationsRead = useCallback(async () => {
    await persist({ ...state, notifications: state.notifications.map((item) => ({ ...item, read: true })) });
  }, [persist, state]);

  const deleteNotification = useCallback(async (id: string) => {
    await persist({ ...state, notifications: state.notifications.filter((item) => item.id !== id) });
  }, [persist, state]);

  const sendTestEmail = useCallback(async () => {
    const response = await fetch("/api/v1/notifications/email/test", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "Idempotency-Key": `email-test-${Date.now()}` },
      body: JSON.stringify({ email: authSession.email }),
    });
    const payload = await response.json().catch(() => ({ ok: false, error: `http_${response.status}` })) as { ok: boolean; provider?: string; preview?: string; error?: string };
    return response.ok ? payload : { ...payload, ok: false };
  }, [authSession.email]);

  const requestBrowserNotifications = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported" as const;
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await updatePreferences({ notifications: { ...state.preferences.notifications, browserNotifications: true } });
    }
    return permission;
  }, [state.preferences.notifications, updatePreferences]);

  const logout = useCallback(async () => {
    await authGateway.logout();
    setAuthSession({ authenticated: false, status: "active", remembered: false });
    if (typeof window !== "undefined") window.location.assign("/login");
  }, []);

  const changePassword = useCallback((currentPassword: string, nextPassword: string) => authGateway.changePassword(currentPassword, nextPassword), []);

  const revokeDevice = useCallback(async (deviceId: string) => {
    const devices = await authGateway.revokeDevice(deviceId);
    setSecurityDevices(devices);
    await persist({ ...state, securityDevices: devices });
  }, [persist, state]);

  const revokeOtherDevices = useCallback(async () => {
    const devices = await authGateway.revokeOtherDevices();
    setSecurityDevices(devices);
    await persist({ ...state, securityDevices: devices });
  }, [persist, state]);

  const exportLocalData = useCallback(() => JSON.stringify({ state, auth: { session: authSession, devices: securityDevices } }, null, 2), [authSession, securityDevices, state]);

  const deleteLocalAccount = useCallback(async () => {
    await Promise.all([platformGateway.reset(), authGateway.reset()]);
    setState(defaultState);
    setAuthSession({ authenticated: false, status: "active", remembered: false });
    if (typeof window !== "undefined") window.location.assign("/login?deleted=1");
  }, []);

  const loadDemo = useCallback(async () => {
    await persist({
      ...JSON.parse(JSON.stringify(defaultState)) as PlatformState,
      onboardingCompleted: true,
      completedAt: new Date().toISOString(),
      profile: JSON.parse(JSON.stringify(defaultProfile)) as UserProfile,
      claimedContributionIds: ["oc-142"],
      joinedProjectIds: ["open-companion"],
      savedProjectIds: ["photo-indexer"],
    });
  }, [persist]);

  const resetDemo = useCallback(async () => {
    const reset = await platformGateway.reset();
    setState(reset);
    setError(null);
  }, []);

  const value = useMemo<PlatformContextValue>(() => ({
    state,
    hydrated,
    saving,
    error,
    mode: platformGateway.mode,
    gameMode: gameGateway.mode,
    heroImageMode: heroImageGateway.mode,
    gitMode: gitGateway.mode,
    communityMode: communityGateway.mode,
    moderationMode: moderationGateway.mode,
    authSession,
    authHydrated,
    securityDevices,
    completeOnboarding,
    updateProfile,
    updatePreferences,
    updateHero,
    assessSkills,
    generateHero,
    completeTraining,
    claimContribution,
    submitContribution,
    joinProject,
    toggleSavedProject,
    selectProject,
    toggleProjectSubscription,
    createProject,
    updateProject,
    addProjectTask,
    addProjectNews,
    addProjectRoadmapItem,
    sendKudos,
    reverseXpTransaction,
    selectHeroClass,
    allocateHeroStat,
    runTrainingBattle,
    runRankedBattle,
    runTeamBattle,
    equipHeroItem,
    unlockHeroSkill,
    claimGameChallenge,
    unlockReward,
    generateHeroImage,
    addUploadedHeroImage,
    setActiveHeroImage,
    deleteHeroImage,
    connectGitProfile,
    disconnectGitProfile,
    selectGitRepository,
    syncGitRepository,
    createGitPullRequest,
    runGitChecks,
    mergeGitPullRequest,
    createForumThread,
    addForumReply,
    toggleForumReaction,
    toggleForumBookmark,
    markForumSolution,
    reportCommunityContent,
    createConversation,
    openConversation,
    sendChatMessage,
    toggleMessageReaction,
    toggleConversationMute,
    toggleConversationPin,
    archiveConversation,
    blockCommunityUser,
    toggleCommunityTranslation,
    assignModerationCase,
    resolveModerationCase,
    createModerationAppeal,
    reviewModerationAppeal,
    reviewExternalLink,
    toggleFeatureFlag,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    sendTestEmail,
    requestBrowserNotifications,
    logout,
    changePassword,
    revokeDevice,
    revokeOtherDevices,
    exportLocalData,
    deleteLocalAccount,
    loadDemo,
    resetDemo,
  }), [state, hydrated, authHydrated, authSession, securityDevices, saving, error, completeOnboarding, updateProfile, updatePreferences, updateHero, assessSkills, generateHero, completeTraining, claimContribution, submitContribution, joinProject, toggleSavedProject, selectProject, toggleProjectSubscription, createProject, updateProject, addProjectTask, addProjectNews, addProjectRoadmapItem, sendKudos, reverseXpTransaction, selectHeroClass, allocateHeroStat, runTrainingBattle, runRankedBattle, runTeamBattle, equipHeroItem, unlockHeroSkill, claimGameChallenge, unlockReward, generateHeroImage, addUploadedHeroImage, setActiveHeroImage, deleteHeroImage, connectGitProfile, disconnectGitProfile, selectGitRepository, syncGitRepository, createGitPullRequest, runGitChecks, mergeGitPullRequest, createForumThread, addForumReply, toggleForumReaction, toggleForumBookmark, markForumSolution, reportCommunityContent, createConversation, openConversation, sendChatMessage, toggleMessageReaction, toggleConversationMute, toggleConversationPin, archiveConversation, blockCommunityUser, toggleCommunityTranslation, assignModerationCase, resolveModerationCase, createModerationAppeal, reviewModerationAppeal, reviewExternalLink, toggleFeatureFlag, markNotificationRead, markAllNotificationsRead, deleteNotification, sendTestEmail, requestBrowserNotifications, logout, changePassword, revokeDevice, revokeOtherDevices, exportLocalData, deleteLocalAccount, loadDemo, resetDemo]);

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

export function usePlatform() {
  const value = useContext(PlatformContext);
  if (!value) throw new Error("usePlatform must be used inside PlatformProvider");
  return value;
}
