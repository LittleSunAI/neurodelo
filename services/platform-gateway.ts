import { fallbackConfig, runtimeMode } from "../lib/fallback-config";
import { heroClassDefinitions, recalculateProgression } from "./game-gateway";
import { openSourceProjects } from "../data/mock-data";
import { createDefaultGitState } from "./git-gateway";
import { defaultCommunityState } from "../data/community-data";
import type {
  HeroConfig,
  HeroProgression,
  KudosRecord,
  PlatformState,
  ProfessionId,
  RecognitionRecord,
  RoleId,
  Skill,
  UserProfile,
  PlatformPreferences,
  SecurityDevice,
  LoginEvent,
  HeroImageLibrary,
  GitIntegrationState,
  CommunityState,
  XpTransaction,
  ReleaseCredit,
  RecognitionAuditEvent,
  GameSystemState,
  ModerationState,
} from "../types/platform";

const skillNames: Record<ProfessionId, string> = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Базы данных",
  design: "Дизайн",
  qa: "Тестирование",
  ai: "AI-инструменты",
  management: "Управление проектами",
};

const baseLevels: Record<UserProfile["experience"], number> = {
  starter: 1,
  junior: 2,
  middle: 4,
  senior: 6,
};

const defaultStats = heroClassDefinitions.architect.baseStats;

export const defaultHeroProgression: HeroProgression = {
  classId: "architect",
  level: 14,
  xp: 460,
  xpToNext: 1000,
  unspentPoints: 3,
  stats: { ...defaultStats },
  battleRating: 0,
  title: "Архитектор сообщества",
  arenaEnabled: true,
  modelVersion: "advanced-foundation-v2",
  season: { id: "foundation-season", title: "Сезон основания", tier: "Серебро", rank: 284, wins: 7, losses: 4 },
  loadout: { frameId: "frame-starter", badgeId: "badge-code", companionId: "companion-none" },
  unlockedRewardIds: ["frame-starter", "badge-code"],
  skillPoints: 4,
  unlockedSkillNodeIds: ["skill-steady-start"],
  ownedItemIds: ["weapon-debug-blade", "armor-reviewer-cloak", "charm-focus-core", "charm-rapid-token", "companion-repo-owl"],
  equipment: { weaponId: "weapon-debug-blade", armorId: "armor-reviewer-cloak", charmId: "charm-focus-core", companionId: "companion-repo-owl" },
};
defaultHeroProgression.battleRating = recalculateProgression(defaultHeroProgression).battleRating;

export const defaultProfile: UserProfile = {
  name: "Тимур",
  nickname: "tbv",
  language: "ru",
  country: "Россия",
  timezone: "Europe/Moscow",
  roles: ["contributor", "maintainer"],
  primaryRole: "contributor",
  goals: ["Помогать open-source проектам", "Собрать подтверждённое портфолио"],
  professions: ["frontend", "ai", "database"],
  experience: "middle",
  hero: { style: "engineer", palette: "cyan", accessory: "laptop", badge: "code" },
  heroProgression: defaultHeroProgression,
  generalLevel: 14,
  xp: 2460,
  reputation: 96,
  reliability: 98,
  skills: [
    { id: "frontend", name: "Frontend", level: 7, progress: 72, confirmed: true, source: "project" },
    { id: "backend", name: "Backend", level: 4, progress: 46, confirmed: true, source: "test" },
    { id: "ai", name: "AI-инструменты", level: 8, progress: 81, confirmed: true, source: "project" },
    { id: "database", name: "Базы данных", level: 5, progress: 58, confirmed: true, source: "mentor" },
  ],
  trainingTasks: [
    { id: "frontend-calculator", title: "Исправить доступность калькулятора", profession: "frontend", difficulty: "Начальная", description: "Внесите учебный patch: добавьте клавиатурное управление, aria-label и мобильную проверку.", rewardXp: 180, completed: false },
    { id: "database-audit", title: "Проверить демонстрационную схему", profession: "database", difficulty: "Средняя", description: "Подготовьте issue с проблемами схемы, индексами и предложением безопасной миграции.", rewardXp: 260, completed: false },
    { id: "ai-brief", title: "Документировать AI-адаптер", profession: "ai", difficulty: "Средняя", description: "Опишите контракт провайдера модели и добавьте пример структурированного ответа.", rewardXp: 300, completed: false },
  ],
  portfolio: [
    { id: "photo-indexer", title: "Smart Photo Indexer", category: "Open-source app", summary: "Архитектура и интерфейс приложения для работы с изображениями.", verified: true, contributionType: "Core contributor", projectLicense: "MIT" },
    { id: "game-companion", title: "Open Companion", category: "Open-source AI", summary: "Система профиля игры и структурированных знаний.", verified: true, contributionType: "Maintainer", projectLicense: "Apache-2.0" },
  ],
  availableForContribution: true,
  mergedContributions: 18,
  reviewScore: 4.9,
  mentorEndorsements: 4,
  gratitudeReceived: 37,
  communityPoints: 84,
  publicThanksEnabled: true,
  bio: "Создаю open-source инструменты, помогаю с интерфейсами и AI-интеграциями. Люблю понятные задачи и честную историю вкладов.",
  interests: ["Open source", "AI-инструменты", "Frontend", "Игровые системы"],
  spokenLanguages: ["Русский", "English"],
  website: "https://example.local/tbv",
  github: "tbv-open",
  telegram: "@tbv_neuro",
  publicProfileSlug: "tbv",
  supportLinks: [
    { id: "support-github", provider: "github-sponsors", label: "GitHub Sponsors", url: "https://github.com/sponsors/tbv-open", enabled: true, note: "Добровольная поддержка open-source работы" },
    { id: "support-collective", provider: "open-collective", label: "Open Collective", url: "https://opencollective.com/neurodelo", enabled: false, note: "Будущий публичный бюджет проекта" },
  ],
};

export const defaultRecognitionRecords: RecognitionRecord[] = [
  {
    id: "recognition-145",
    contributorId: "ivan-k",
    contributorName: "Иван Крылов",
    contributorInitials: "ИК",
    projectId: "open-companion",
    projectName: "Open Companion",
    contributionId: "pr-145",
    title: "Обновил инструкцию запуска на Windows",
    summary: "Проверил установку на чистой системе, уточнил версии Node.js и добавил решения типичных ошибок.",
    kind: "Документация",
    acceptedAt: "сегодня, 09:20",
    skillXp: 180,
    heroXp: 50,
    verified: true,
    kudosCount: 6,
    categories: ["documentation", "quality"],
    releaseIds: ["release-0-10"],
    xpTransactionIds: ["xp-145"],
    moderationStatus: "clear",
    officialThanksCount: 1,
    riskFlags: [],
  },
  {
    id: "recognition-139",
    contributorId: "elena-k",
    contributorName: "Елена Ким",
    contributorInitials: "ЕК",
    projectId: "open-companion",
    projectName: "Open Companion",
    contributionId: "pr-139",
    title: "Подготовила чек-лист доступности",
    summary: "Добавила сценарии клавиатуры, мобильной проверки и понятный шаблон отчёта для новичков.",
    kind: "Тестирование",
    acceptedAt: "вчера, 18:05",
    skillXp: 320,
    heroXp: 90,
    verified: true,
    kudosCount: 12,
    categories: ["mentorship", "quality", "kindness"],
    releaseIds: ["release-0-10"],
    xpTransactionIds: ["xp-139"],
    moderationStatus: "clear",
    officialThanksCount: 1,
    riskFlags: [],
  },
  {
    id: "recognition-132",
    contributorId: "alina-m",
    contributorName: "Алина Морозова",
    contributorInitials: "АМ",
    projectId: "open-companion",
    projectName: "Open Companion",
    contributionId: "design-132",
    title: "Переработала пустые состояния интерфейса",
    summary: "Подготовила визуальные состояния, подписи и адаптацию для маленьких экранов.",
    kind: "Дизайн",
    acceptedAt: "14 июля",
    skillXp: 260,
    heroXp: 73,
    verified: true,
    kudosCount: 9,
    categories: ["initiative", "quality"],
    releaseIds: ["release-0-9"],
    xpTransactionIds: ["xp-132"],
    moderationStatus: "clear",
    officialThanksCount: 1,
    riskFlags: [],
  },
];

export const defaultKudosRecords: KudosRecord[] = [
  {
    id: "kudos-1",
    fromUserId: "maintainer-mikhail",
    fromName: "Михаил Орлов",
    toContributorId: "elena-k",
    toContributorName: "Елена Ким",
    projectId: "open-companion",
    contributionId: "pr-139",
    category: "mentorship",
    message: "Спасибо за понятный чек-лист. После него новичкам стало намного легче готовить первый Pull Request.",
    createdAt: "вчера, 18:40",
    communityPoints: 3,
    officialProjectThanks: true,
  },
  {
    id: "kudos-2",
    fromUserId: "maintainer-mikhail",
    fromName: "Михаил Орлов",
    toContributorId: "alina-m",
    toContributorName: "Алина Морозова",
    projectId: "open-companion",
    contributionId: "design-132",
    category: "initiative",
    message: "Спасибо за инициативу и готовые мобильные варианты — это ускорило релиз.",
    createdAt: "14 июля, 20:15",
    communityPoints: 2,
    officialProjectThanks: true,
  },
];


export const defaultXpTransactions: XpTransaction[] = [
  { id: "xp-145", contributorId: "ivan-k", contributorName: "Иван Крылов", projectId: "open-companion", projectName: "Open Companion", contributionId: "pr-145", kind: "documentation", status: "confirmed", skillName: "Документация", amount: 180, heroXp: 50, communityPoints: 3, reason: "Принята инструкция запуска на Windows", createdAt: "сегодня, 09:20", createdBy: "Git fallback", riskFlags: [] },
  { id: "xp-139", contributorId: "elena-k", contributorName: "Елена Ким", projectId: "open-companion", projectName: "Open Companion", contributionId: "pr-139", kind: "review", status: "confirmed", skillName: "Тестирование", amount: 320, heroXp: 90, communityPoints: 3, reason: "Принят чек-лист доступности", createdAt: "вчера, 18:05", createdBy: "Михаил Орлов", riskFlags: [] },
  { id: "xp-132", contributorId: "alina-m", contributorName: "Алина Морозова", projectId: "open-companion", projectName: "Open Companion", contributionId: "design-132", kind: "contribution", status: "confirmed", skillName: "Дизайн", amount: 260, heroXp: 73, communityPoints: 2, reason: "Приняты пустые состояния интерфейса", createdAt: "14 июля", createdBy: "Михаил Орлов", riskFlags: [] },
  { id: "xp-own-1", contributorId: "tbv", contributorName: "Тимур", projectId: "open-companion", projectName: "Open Companion", contributionId: "pr-own-1", kind: "contribution", status: "confirmed", skillName: "Frontend", amount: 240, heroXp: 70, communityPoints: 2, reason: "Связал профиль героя с публичной страницей", createdAt: "12 июля", createdBy: "Git fallback", riskFlags: [] },
];

export const defaultReleaseCredits: ReleaseCredit[] = [
  { id: "release-0-10", projectId: "open-companion", projectName: "Open Companion", releaseName: "v0.10 Community", releasedAt: "17 июля 2026", summary: "Форум, чаты, перевод и Git-сценарии.", contributorIds: ["ivan-k", "elena-k", "tbv"], contributionIds: ["pr-145", "pr-139", "pr-own-1"] },
  { id: "release-0-9", projectId: "open-companion", projectName: "Open Companion", releaseName: "v0.9 Hero Studio", releasedAt: "14 июля 2026", summary: "Студия героя и публичные страницы.", contributorIds: ["alina-m", "tbv"], contributionIds: ["design-132", "pr-own-1"] },
];

export const defaultRecognitionAuditLog: RecognitionAuditEvent[] = [
  { id: "audit-1", action: "created", targetId: "recognition-145", actorName: "Git fallback", reason: "Pull Request принят и проверки успешны", createdAt: "сегодня, 09:20" },
  { id: "audit-2", action: "official-thanks", targetId: "pr-139", actorName: "Михаил Орлов", reason: "Официальная благодарность проекта", createdAt: "вчера, 18:40" },
];

export const defaultPreferences: PlatformPreferences = {
  privacy: {
    profileVisibility: "public",
    messagePermission: "community",
    invitePermission: "community",
    showThanks: true,
    showActivity: true,
    showBattleHistory: false,
    searchable: true,
    blockedUserIds: [],
  },
  notifications: {
    messages: true,
    projectInvites: true,
    contributionReviews: true,
    pullRequestAccepted: true,
    thanksReceived: true,
    levelUp: true,
    forumReplies: true,
    gameEvents: false,
    emailDigest: "weekly",
    emailTransactional: true,
    emailSecurityAlerts: true,
    browserNotifications: false,
  },
  appearance: {
    theme: "dark",
    textScale: "normal",
    reduceMotion: false,
    highContrast: false,
    language: "ru",
  },
};

export const defaultSecurityDevices: SecurityDevice[] = [
  { id: "device-current", name: "Windows 11 — текущий компьютер", browser: "Chrome", location: "Москва, Россия", lastActiveAt: "сейчас", current: true },
  { id: "device-phone", name: "Android-смартфон", browser: "WebView", location: "Москва, Россия", lastActiveAt: "2 дня назад", current: false },
];

export const defaultLoginHistory: LoginEvent[] = [
  { id: "login-1", device: "Windows 11 · Chrome", location: "Москва, Россия", createdAt: "сегодня, 10:14", result: "success" },
  { id: "login-2", device: "Android · WebView", location: "Москва, Россия", createdAt: "15 июля, 22:08", result: "success" },
  { id: "login-3", device: "Неизвестное устройство", location: "Берлин, Германия", createdAt: "14 июля, 03:11", result: "failed" },
];


export const defaultHeroImages: HeroImageLibrary = {
  activeImageId: undefined,
  variants: [],
  generationHistory: [],
  maxVariants: 8,
  totalGenerated: 0,
  totalUploaded: 0,
};

export const defaultGitState: GitIntegrationState = createDefaultGitState(openSourceProjects, defaultProfile);

export const defaultGameState: GameSystemState = {
  challenges: [
    { id: "daily-battle", title: "Разминка героя", summary: "Проведите один тренировочный или рейтинговый бой.", period: "daily", progress: 0, target: 1, rewardHeroXp: 60, rewardCommunityPoints: 2, completed: false, claimed: false, expiresAt: "обновится завтра" },
    { id: "weekly-ranked", title: "Победа в рейтинге", summary: "Победите в трёх рейтинговых сражениях.", period: "weekly", progress: 1, target: 3, rewardHeroXp: 220, rewardCommunityPoints: 8, rewardItemId: "weapon-neural-staff", completed: false, claimed: false, expiresAt: "5 дней" },
    { id: "weekly-team", title: "Командная синхронизация", summary: "Примите участие в двух командных боях.", period: "weekly", progress: 0, target: 2, rewardHeroXp: 180, rewardCommunityPoints: 6, completed: false, claimed: false, expiresAt: "5 дней" },
    { id: "season-contribution", title: "Герой open source", summary: "Завершите пять подтверждённых вкладов за сезон.", period: "season", progress: 2, target: 5, rewardHeroXp: 500, rewardCommunityPoints: 20, rewardItemId: "companion-merge-drone", completed: false, claimed: false, expiresAt: "43 дня" },
  ],
  leaderboard: [
    { id: "leader-1", rank: 1, name: "Елена Ким", initials: "ЕК", classId: "pathfinder", level: 22, battleRating: 1290, seasonPoints: 1860, isCurrentUser: false },
    { id: "leader-2", rank: 2, name: "Иван Крылов", initials: "ИК", classId: "guardian", level: 20, battleRating: 1245, seasonPoints: 1730, isCurrentUser: false },
    { id: "leader-3", rank: 3, name: "Даниил Соколов", initials: "ДС", classId: "technomancer", level: 19, battleRating: 1198, seasonPoints: 1585, isCurrentUser: false },
    { id: "leader-current", rank: 4, name: "Тимур", initials: "ТБ", classId: "architect", level: 14, battleRating: 0, seasonPoints: 620, isCurrentUser: true },
    { id: "leader-5", rank: 5, name: "Мария Волкова", initials: "МВ", classId: "architect", level: 15, battleRating: 1018, seasonPoints: 590, isCurrentUser: false },
  ],
  teamBattleHistory: [],
  seasonPoints: 620,
  seasonEndsAt: "31 августа 2026",
  lastDailyRefreshAt: "17 июля 2026",
};

export const defaultModerationState: ModerationState = {
  activeReviewer: "Администратор Demo",
  cases: [
    { id: "mod-case-1", type: "community-report", title: "Жалоба на сообщение в проектном чате", summary: "Пользователь сообщает о повторяющихся оскорблениях и давлении на новичка.", targetType: "message", targetId: "msg-team-3", subjectName: "CodeRage", reporterName: "Елена Ким", priority: "high", status: "queued", createdAt: "сегодня, 10:15", tags: ["общение", "повторная жалоба"], evidence: [{ id: "ev-1", label: "Сообщение", value: "Фрагмент сохранён в локальном журнале", source: "community" }, { id: "ev-2", label: "История", value: "2 похожие жалобы за 30 дней", source: "system" }] },
    { id: "mod-case-2", type: "external-link", title: "Проверка внешней Telegram-группы", summary: "Сообщество хочет разместить публичную ссылку в каталоге групп.", targetType: "link", targetId: "link-telegram-1", subjectName: "AI Builders RU", reporterName: "Автопроверка", priority: "medium", status: "reviewing", assignedTo: "Администратор Demo", createdAt: "сегодня, 09:40", tags: ["внешняя ссылка", "telegram"], evidence: [{ id: "ev-3", label: "URL", value: "https://t.me/example_ai_builders", source: "user" }] },
    { id: "mod-case-3", type: "recognition-dispute", title: "Оспаривание отмены XP", summary: "Участник считает, что начисление было отменено без учёта принятого Pull Request.", targetType: "contribution", targetId: "recognition-145", subjectName: "Иван Крылов", reporterName: "Иван Крылов", priority: "medium", status: "appealed", createdAt: "вчера, 20:10", appealId: "appeal-1", tags: ["XP", "апелляция"], evidence: [{ id: "ev-4", label: "Pull Request", value: "#145 merged", source: "git" }] },
    { id: "mod-case-4", type: "project-review", title: "Проверка нового публичного проекта", summary: "Перед публикацией нужно проверить описание, лицензию и внешние ссылки.", targetType: "project", targetId: "photo-indexer", subjectName: "Smart Photo Indexer", reporterName: "Система публикации", priority: "low", status: "action-required", createdAt: "вчера, 17:30", tags: ["проект", "лицензия"], evidence: [{ id: "ev-5", label: "Лицензия", value: "MIT", source: "system" }] },
  ],
  decisions: [],
  appeals: [{ id: "appeal-1", caseId: "mod-case-3", submittedBy: "Иван Крылов", reason: "Pull Request принят, а вклад вошёл в релиз. Прошу пересмотреть отмену.", status: "open", createdAt: "вчера, 20:10" }],
  externalLinks: [
    { id: "link-telegram-1", ownerName: "AI Builders RU", label: "Telegram-группа", url: "https://t.me/example_ai_builders", platform: "telegram", status: "pending", riskScore: 24, submittedAt: "сегодня, 09:40" },
    { id: "link-github-1", ownerName: "Open Companion", label: "GitHub repository", url: "https://github.com/example/open-companion", platform: "github", status: "approved", riskScore: 2, submittedAt: "12 июля", reviewedAt: "12 июля", reviewerName: "Модератор Анна", note: "Публичный open-source репозиторий" },
    { id: "link-discord-1", ownerName: "Pixel Guild", label: "Discord-сервер", url: "https://discord.gg/example", platform: "discord", status: "pending", riskScore: 41, submittedAt: "вчера, 14:20" },
  ],
  featureFlags: [
    { id: "flag-team-battles", label: "Командные бои", description: "Показывать командную арену пользователям.", enabled: true, audience: "all", updatedAt: "сегодня", updatedBy: "Система" },
    { id: "flag-paid-requests", label: "Платные запросы", description: "Второстепенная доска объявлений без гаранта.", enabled: true, audience: "all", updatedAt: "сегодня", updatedBy: "Система" },
    { id: "flag-fal-images", label: "fal.ai генерация", description: "Разрешить серверную генерацию изображений героя.", enabled: false, audience: "testers", updatedAt: "сегодня", updatedBy: "Система" },
    { id: "flag-auto-translate", label: "Автоперевод", description: "Показывать fallback/API перевод сообщений.", enabled: true, audience: "all", updatedAt: "сегодня", updatedBy: "Система" },
    { id: "flag-new-xp-model", label: "Новая формула XP", description: "Тестовая модель начисления за вклад.", enabled: false, audience: "admins", updatedAt: "сегодня", updatedBy: "Система" },
  ],
  auditLog: [{ id: "mod-audit-seed", action: "queue-created", targetId: "mod-case-1", actorName: "Система", details: "Создана очередь демонстрационной модерации", createdAt: "сегодня, 08:00" }],
  sanctions: [{ id: "sanction-1", userId: "spam-bot", userName: "PromoBot", action: "suspend", reason: "Массовые рекламные сообщения", createdAt: "вчера", expiresAt: "через 6 дней", active: true }],
};

export const defaultNotifications = [
  { id: "notice-accepted", kind: "contribution" as const, title: "Ваш вклад принят", message: "Open Companion · +420 XP", createdAt: "сегодня, 10:24", read: false, actionView: "recognition" as const },
  { id: "notice-task", kind: "project" as const, title: "Новая задача для новичков", message: "Документация локального запуска", createdAt: "сегодня, 09:10", read: false, actionView: "contributions" as const },
  { id: "notice-comment", kind: "message" as const, title: "Мейнтейнер оставил комментарий", message: "Нужно добавить один тест", createdAt: "вчера, 21:18", read: true, actionView: "messages" as const },
];

export const defaultState: PlatformState = {
  version: 12,
  onboardingCompleted: false,
  profile: defaultProfile,
  claimedContributionIds: [],
  submittedContributionIds: [],
  joinedProjectIds: ["open-companion"],
  savedProjectIds: ["photo-indexer"],
  subscribedProjectIds: ["open-companion"],
  selectedProjectId: "open-companion",
  projects: safeClone(openSourceProjects),
  git: safeClone(defaultGitState),
  community: safeClone(defaultCommunityState),
  moderation: safeClone(defaultModerationState),
  recognitionRecords: defaultRecognitionRecords,
  kudosRecords: defaultKudosRecords,
  xpTransactions: defaultXpTransactions,
  releaseCredits: defaultReleaseCredits,
  recognitionAuditLog: defaultRecognitionAuditLog,
  battleHistory: [],
  game: { ...safeClone(defaultGameState), leaderboard: defaultGameState.leaderboard.map((entry) => entry.isCurrentUser ? { ...entry, battleRating: defaultHeroProgression.battleRating } : entry) },
  heroImages: defaultHeroImages,
  preferences: defaultPreferences,
  securityDevices: defaultSecurityDevices,
  loginHistory: defaultLoginHistory,
  notifications: safeClone(defaultNotifications),
};

function wait(ms: number = fallbackConfig.artificialDelayMs) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function mapLegacyRole(role: unknown): RoleId {
  if (role === "client") return "maintainer";
  if (role === "mentor") return "mentor";
  return "contributor";
}

function migrateLegacyState(input: unknown): PlatformState {
  if (!input || typeof input !== "object") return safeClone(defaultState);
  const legacy = input as Record<string, unknown>;
  const legacyProfile = (legacy.profile && typeof legacy.profile === "object" ? legacy.profile : {}) as Record<string, unknown>;
  const rawRoles = Array.isArray(legacyProfile.roles) ? legacyProfile.roles : [legacyProfile.primaryRole];
  const roles = Array.from(new Set(rawRoles.filter(Boolean).map(mapLegacyRole)));
  const primaryRole = mapLegacyRole(legacyProfile.primaryRole);
  const legacyHeroProgression = legacyProfile.heroProgression && typeof legacyProfile.heroProgression === "object"
    ? legacyProfile.heroProgression as Partial<HeroProgression>
    : {};
  const heroProgression: HeroProgression = {
    ...safeClone(defaultHeroProgression),
    ...legacyHeroProgression,
    stats: { ...defaultHeroProgression.stats, ...(legacyHeroProgression.stats ?? {}) },
    season: { ...defaultHeroProgression.season, ...(legacyHeroProgression.season ?? {}) },
    loadout: { ...defaultHeroProgression.loadout, ...(legacyHeroProgression.loadout ?? {}) },
    unlockedRewardIds: Array.isArray(legacyHeroProgression.unlockedRewardIds) ? legacyHeroProgression.unlockedRewardIds.filter((id): id is string => typeof id === "string") : defaultHeroProgression.unlockedRewardIds,
    skillPoints: typeof legacyHeroProgression.skillPoints === "number" ? legacyHeroProgression.skillPoints : defaultHeroProgression.skillPoints,
    unlockedSkillNodeIds: Array.isArray(legacyHeroProgression.unlockedSkillNodeIds) ? legacyHeroProgression.unlockedSkillNodeIds.filter((id): id is string => typeof id === "string") : defaultHeroProgression.unlockedSkillNodeIds,
    ownedItemIds: Array.isArray(legacyHeroProgression.ownedItemIds) ? legacyHeroProgression.ownedItemIds.filter((id): id is string => typeof id === "string") : defaultHeroProgression.ownedItemIds,
    equipment: { ...defaultHeroProgression.equipment, ...(legacyHeroProgression.equipment ?? {}) },
  };
  heroProgression.battleRating = recalculateProgression(heroProgression).battleRating;
  const profile: UserProfile = {
    ...safeClone(defaultProfile),
    ...(legacyProfile as Partial<UserProfile>),
    roles: roles.length ? roles : ["contributor"],
    primaryRole: roles.includes(primaryRole) ? primaryRole : roles[0] ?? "contributor",
    heroProgression,
    availableForContribution: typeof legacyProfile.availableForWork === "boolean"
      ? legacyProfile.availableForWork
      : typeof legacyProfile.availableForContribution === "boolean"
        ? legacyProfile.availableForContribution
        : true,
    mergedContributions: typeof legacyProfile.mergedContributions === "number" ? legacyProfile.mergedContributions : defaultProfile.mergedContributions,
    reviewScore: typeof legacyProfile.reviewScore === "number" ? legacyProfile.reviewScore : defaultProfile.reviewScore,
    mentorEndorsements: typeof legacyProfile.mentorEndorsements === "number" ? legacyProfile.mentorEndorsements : defaultProfile.mentorEndorsements,
    gratitudeReceived: typeof legacyProfile.gratitudeReceived === "number" ? legacyProfile.gratitudeReceived : defaultProfile.gratitudeReceived,
    communityPoints: typeof legacyProfile.communityPoints === "number" ? legacyProfile.communityPoints : defaultProfile.communityPoints,
    publicThanksEnabled: typeof legacyProfile.publicThanksEnabled === "boolean" ? legacyProfile.publicThanksEnabled : true,
    bio: typeof legacyProfile.bio === "string" ? legacyProfile.bio : defaultProfile.bio,
    interests: Array.isArray(legacyProfile.interests) ? legacyProfile.interests.filter((value): value is string => typeof value === "string") : defaultProfile.interests,
    spokenLanguages: Array.isArray(legacyProfile.spokenLanguages) ? legacyProfile.spokenLanguages.filter((value): value is string => typeof value === "string") : defaultProfile.spokenLanguages,
    website: typeof legacyProfile.website === "string" ? legacyProfile.website : defaultProfile.website,
    github: typeof legacyProfile.github === "string" ? legacyProfile.github : defaultProfile.github,
    telegram: typeof legacyProfile.telegram === "string" ? legacyProfile.telegram : defaultProfile.telegram,
    publicProfileSlug: typeof legacyProfile.publicProfileSlug === "string" ? legacyProfile.publicProfileSlug : (typeof legacyProfile.nickname === "string" ? legacyProfile.nickname : defaultProfile.publicProfileSlug),
    supportLinks: Array.isArray(legacyProfile.supportLinks) ? legacyProfile.supportLinks as UserProfile["supportLinks"] : safeClone(defaultProfile.supportLinks),
  };
  return {
    version: 12,
    onboardingCompleted: Boolean(legacy.onboardingCompleted),
    completedAt: typeof legacy.completedAt === "string" ? legacy.completedAt : undefined,
    profile,
    claimedContributionIds: Array.isArray(legacy.claimedContributionIds) ? legacy.claimedContributionIds.filter((id): id is string => typeof id === "string") : [],
    submittedContributionIds: Array.isArray(legacy.submittedContributionIds) ? legacy.submittedContributionIds.filter((id): id is string => typeof id === "string") : [],
    joinedProjectIds: Array.isArray(legacy.joinedProjectIds) ? legacy.joinedProjectIds.filter((id): id is string => typeof id === "string") : ["open-companion"],
    savedProjectIds: Array.isArray(legacy.savedProjectIds) ? legacy.savedProjectIds.filter((id): id is string => typeof id === "string") : [],
    subscribedProjectIds: Array.isArray(legacy.subscribedProjectIds) ? legacy.subscribedProjectIds.filter((id): id is string => typeof id === "string") : ["open-companion"],
    selectedProjectId: typeof legacy.selectedProjectId === "string" ? legacy.selectedProjectId : "open-companion",
    projects: Array.isArray(legacy.projects) ? legacy.projects as PlatformState["projects"] : safeClone(openSourceProjects),
    git: legacy.git && typeof legacy.git === "object"
      ? {
          ...safeClone(defaultGitState),
          ...(legacy.git as Partial<GitIntegrationState>),
          repositories: Array.isArray((legacy.git as Partial<GitIntegrationState>).repositories) ? (legacy.git as Partial<GitIntegrationState>).repositories! : safeClone(defaultGitState.repositories),
          issues: Array.isArray((legacy.git as Partial<GitIntegrationState>).issues) ? (legacy.git as Partial<GitIntegrationState>).issues! : safeClone(defaultGitState.issues),
          pullRequests: Array.isArray((legacy.git as Partial<GitIntegrationState>).pullRequests) ? (legacy.git as Partial<GitIntegrationState>).pullRequests! : [],
          commits: Array.isArray((legacy.git as Partial<GitIntegrationState>).commits) ? (legacy.git as Partial<GitIntegrationState>).commits! : safeClone(defaultGitState.commits),
          syncLog: Array.isArray((legacy.git as Partial<GitIntegrationState>).syncLog) ? (legacy.git as Partial<GitIntegrationState>).syncLog! : [],
        }
      : createDefaultGitState(Array.isArray(legacy.projects) ? legacy.projects as PlatformState["projects"] : openSourceProjects, profile),
    community: legacy.community && typeof legacy.community === "object"
      ? {
          ...safeClone(defaultCommunityState),
          ...(legacy.community as Partial<CommunityState>),
          forumCategories: Array.isArray((legacy.community as Partial<CommunityState>).forumCategories) ? (legacy.community as Partial<CommunityState>).forumCategories! : safeClone(defaultCommunityState.forumCategories),
          forumThreads: Array.isArray((legacy.community as Partial<CommunityState>).forumThreads) ? (legacy.community as Partial<CommunityState>).forumThreads! : safeClone(defaultCommunityState.forumThreads),
          forumPosts: Array.isArray((legacy.community as Partial<CommunityState>).forumPosts) ? (legacy.community as Partial<CommunityState>).forumPosts! : safeClone(defaultCommunityState.forumPosts),
          participants: Array.isArray((legacy.community as Partial<CommunityState>).participants) ? (legacy.community as Partial<CommunityState>).participants! : safeClone(defaultCommunityState.participants),
          conversations: Array.isArray((legacy.community as Partial<CommunityState>).conversations) ? (legacy.community as Partial<CommunityState>).conversations! : safeClone(defaultCommunityState.conversations),
          messages: Array.isArray((legacy.community as Partial<CommunityState>).messages) ? (legacy.community as Partial<CommunityState>).messages! : safeClone(defaultCommunityState.messages),
          reports: Array.isArray((legacy.community as Partial<CommunityState>).reports) ? (legacy.community as Partial<CommunityState>).reports! : [],
        }
      : safeClone(defaultCommunityState),
    moderation: legacy.moderation && typeof legacy.moderation === "object"
      ? { ...safeClone(defaultModerationState), ...(legacy.moderation as Partial<ModerationState>), cases: Array.isArray((legacy.moderation as Partial<ModerationState>).cases) ? (legacy.moderation as Partial<ModerationState>).cases! : safeClone(defaultModerationState.cases), decisions: Array.isArray((legacy.moderation as Partial<ModerationState>).decisions) ? (legacy.moderation as Partial<ModerationState>).decisions! : [], appeals: Array.isArray((legacy.moderation as Partial<ModerationState>).appeals) ? (legacy.moderation as Partial<ModerationState>).appeals! : safeClone(defaultModerationState.appeals), externalLinks: Array.isArray((legacy.moderation as Partial<ModerationState>).externalLinks) ? (legacy.moderation as Partial<ModerationState>).externalLinks! : safeClone(defaultModerationState.externalLinks), featureFlags: Array.isArray((legacy.moderation as Partial<ModerationState>).featureFlags) ? (legacy.moderation as Partial<ModerationState>).featureFlags! : safeClone(defaultModerationState.featureFlags), auditLog: Array.isArray((legacy.moderation as Partial<ModerationState>).auditLog) ? (legacy.moderation as Partial<ModerationState>).auditLog! : [], sanctions: Array.isArray((legacy.moderation as Partial<ModerationState>).sanctions) ? (legacy.moderation as Partial<ModerationState>).sanctions! : [] }
      : safeClone(defaultModerationState),
    recognitionRecords: Array.isArray(legacy.recognitionRecords) ? legacy.recognitionRecords as RecognitionRecord[] : safeClone(defaultRecognitionRecords),
    kudosRecords: Array.isArray(legacy.kudosRecords) ? legacy.kudosRecords as KudosRecord[] : safeClone(defaultKudosRecords),
    xpTransactions: Array.isArray(legacy.xpTransactions) ? legacy.xpTransactions as XpTransaction[] : safeClone(defaultXpTransactions),
    releaseCredits: Array.isArray(legacy.releaseCredits) ? legacy.releaseCredits as ReleaseCredit[] : safeClone(defaultReleaseCredits),
    recognitionAuditLog: Array.isArray(legacy.recognitionAuditLog) ? legacy.recognitionAuditLog as RecognitionAuditEvent[] : safeClone(defaultRecognitionAuditLog),
    battleHistory: Array.isArray(legacy.battleHistory) ? legacy.battleHistory as PlatformState["battleHistory"] : [],
    game: legacy.game && typeof legacy.game === "object"
      ? {
          ...safeClone(defaultGameState),
          ...(legacy.game as Partial<GameSystemState>),
          challenges: Array.isArray((legacy.game as Partial<GameSystemState>).challenges) ? (legacy.game as Partial<GameSystemState>).challenges! : safeClone(defaultGameState.challenges),
          leaderboard: Array.isArray((legacy.game as Partial<GameSystemState>).leaderboard) ? (legacy.game as Partial<GameSystemState>).leaderboard! : safeClone(defaultGameState.leaderboard),
          teamBattleHistory: Array.isArray((legacy.game as Partial<GameSystemState>).teamBattleHistory) ? (legacy.game as Partial<GameSystemState>).teamBattleHistory! : [],
        }
      : { ...safeClone(defaultGameState), leaderboard: defaultGameState.leaderboard.map((entry) => entry.isCurrentUser ? { ...entry, name: profile.name, classId: heroProgression.classId, level: heroProgression.level, battleRating: heroProgression.battleRating } : entry) },
    heroImages: legacy.heroImages && typeof legacy.heroImages === "object"
      ? {
          ...safeClone(defaultHeroImages),
          ...(legacy.heroImages as Partial<HeroImageLibrary>),
          variants: Array.isArray((legacy.heroImages as Partial<HeroImageLibrary>).variants) ? (legacy.heroImages as Partial<HeroImageLibrary>).variants! : [],
          generationHistory: Array.isArray((legacy.heroImages as Partial<HeroImageLibrary>).generationHistory) ? (legacy.heroImages as Partial<HeroImageLibrary>).generationHistory! : [],
        }
      : safeClone(defaultHeroImages),
    preferences: legacy.preferences && typeof legacy.preferences === "object"
      ? {
          privacy: { ...defaultPreferences.privacy, ...((legacy.preferences as Partial<PlatformPreferences>).privacy ?? {}) },
          notifications: { ...defaultPreferences.notifications, ...((legacy.preferences as Partial<PlatformPreferences>).notifications ?? {}) },
          appearance: { ...defaultPreferences.appearance, ...((legacy.preferences as Partial<PlatformPreferences>).appearance ?? {}) },
        }
      : safeClone(defaultPreferences),
    securityDevices: Array.isArray(legacy.securityDevices) ? legacy.securityDevices as SecurityDevice[] : safeClone(defaultSecurityDevices),
    loginHistory: Array.isArray(legacy.loginHistory) ? legacy.loginHistory as LoginEvent[] : safeClone(defaultLoginHistory),
    notifications: Array.isArray(legacy.notifications) ? legacy.notifications as PlatformState["notifications"] : safeClone(defaultNotifications),
  };
}

function readLocalState(): PlatformState {
  if (typeof window === "undefined") return safeClone(defaultState);
  const keys = [fallbackConfig.storageKey, fallbackConfig.previousStorageKey, fallbackConfig.legacyStorageKey, fallbackConfig.oldestStorageKey, fallbackConfig.ancientStorageKey];
  for (const key of keys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    try {
      const migrated = migrateLegacyState(JSON.parse(raw));
      if (key !== fallbackConfig.storageKey) writeLocalState(migrated);
      return migrated;
    } catch {
      continue;
    }
  }
  return safeClone(defaultState);
}

function writeLocalState(state: PlatformState) {
  if (typeof window !== "undefined") window.localStorage.setItem(fallbackConfig.storageKey, JSON.stringify(state));
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`API недоступен: ${response.status}`);
  return response.json() as Promise<T>;
}

export const platformGateway = {
  mode: runtimeMode,

  async loadState(): Promise<PlatformState> {
    if (runtimeMode === "api") return apiRequest<PlatformState>("/profile/state");
    if (fallbackConfig.durableLocalState && typeof window !== "undefined") {
      try {
        const response = await fetch("/api/v1/local-state", { credentials: "same-origin", cache: "no-store" });
        if (response.ok) {
          const payload = await response.json() as { state: PlatformState | null };
          if (payload.state) {
            const migrated = migrateLegacyState(payload.state);
            writeLocalState(migrated);
            return migrated;
          }
          const local = readLocalState();
          await fetch("/api/v1/local-state", { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(local) });
          return local;
        }
      } catch { /* fall back to browser persistence when the local API is unavailable */ }
    }
    await wait();
    return readLocalState();
  },

  async saveState(state: PlatformState): Promise<PlatformState> {
    if (runtimeMode === "api") return apiRequest<PlatformState>("/profile/state", { method: "PUT", body: JSON.stringify(state) });
    writeLocalState(state);
    if (fallbackConfig.durableLocalState && typeof window !== "undefined") {
      try {
        const response = await fetch("/api/v1/local-state", { method: "PUT", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(state) });
        if (!response.ok) throw new Error(`Durable local state unavailable: ${response.status}`);
      } catch { /* browser copy remains available as a local fallback */ }
    } else {
      await wait(90);
    }
    return state;
  },

  async sendKudos(input: Omit<KudosRecord, "id" | "createdAt">): Promise<KudosRecord> {
    if (runtimeMode === "api") return apiRequest<KudosRecord>("/recognition/kudos", { method: "POST", body: JSON.stringify(input) });
    await wait(260);
    return {
      ...input,
      id: `kudos-${Date.now()}`,
      createdAt: "только что",
    };
  },

  async reverseXpTransaction(input: { transaction: XpTransaction; reason: string; actorName: string }): Promise<{ original: XpTransaction; reversal: XpTransaction; audit: RecognitionAuditEvent }> {
    if (runtimeMode === "api") return apiRequest("/recognition/xp/reverse", { method: "POST", body: JSON.stringify(input) });
    await wait(220);
    const now = "только что";
    return {
      original: { ...input.transaction, status: "reversed" },
      reversal: {
        id: `xp-reversal-${Date.now()}`,
        contributorId: input.transaction.contributorId,
        contributorName: input.transaction.contributorName,
        projectId: input.transaction.projectId,
        projectName: input.transaction.projectName,
        contributionId: input.transaction.contributionId,
        kind: "reversal",
        status: "confirmed",
        skillName: input.transaction.skillName,
        amount: -Math.abs(input.transaction.amount),
        heroXp: -Math.abs(input.transaction.heroXp),
        communityPoints: -Math.abs(input.transaction.communityPoints),
        reason: input.reason,
        createdAt: now,
        createdBy: input.actorName,
        reversalOfId: input.transaction.id,
        riskFlags: [],
      },
      audit: { id: `audit-${Date.now()}`, action: "xp-reversed", targetId: input.transaction.id, actorName: input.actorName, reason: input.reason, createdAt: now },
    };
  },

  async generateHero(input: Pick<UserProfile, "professions" | "experience"> & { preferredPalette?: HeroConfig["palette"] }): Promise<HeroConfig> {
    if (runtimeMode === "api") return apiRequest<HeroConfig>("/ai/hero", { method: "POST", body: JSON.stringify(input) });
    await wait(520);
    const primary = input.professions[0];
    return {
      style: primary === "design" ? "creator" : primary === "ai" ? "researcher" : "engineer",
      palette: input.preferredPalette ?? (input.experience === "senior" ? "violet" : "cyan"),
      accessory: primary === "design" ? "tablet" : primary === "management" ? "headset" : "laptop",
      badge: primary === "qa" ? "shield" : primary === "ai" ? "spark" : "code",
    };
  },

  async assessSkills(profile: Pick<UserProfile, "professions" | "experience">): Promise<Skill[]> {
    if (runtimeMode === "api") return apiRequest<Skill[]>("/skills/assess", { method: "POST", body: JSON.stringify(profile) });
    await wait(680);
    const base = baseLevels[profile.experience];
    return profile.professions.map((id, index) => ({
      id,
      name: skillNames[id],
      level: Math.max(1, Math.min(8, base + (index === 0 ? 1 : 0))),
      progress: 22 + ((index + base) * 17) % 67,
      confirmed: profile.experience === "starter" ? false : index === 0,
      source: profile.experience === "starter" ? "self" : index === 0 ? "test" : "self",
    }));
  },

  async reset(): Promise<PlatformState> {
    if (runtimeMode === "api") return apiRequest<PlatformState>("/profile/reset", { method: "POST" });
    if (fallbackConfig.durableLocalState && typeof window !== "undefined") {
      await fetch("/api/v1/local-state", { method: "DELETE", credentials: "same-origin" }).catch(() => undefined);
    } else {
      await wait(120);
    }
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(fallbackConfig.storageKey);
      window.localStorage.removeItem(fallbackConfig.previousStorageKey);
      window.localStorage.removeItem(fallbackConfig.legacyStorageKey);
      window.localStorage.removeItem(fallbackConfig.oldestStorageKey);
      window.localStorage.removeItem(fallbackConfig.ancientStorageKey);
    }
    return safeClone(defaultState);
  },
};
