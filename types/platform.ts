import type { LucideIcon } from "lucide-react";

export type RoleId = "contributor" | "maintainer" | "mentor";
export type LanguageCode = "ru" | "en";
export type ExperienceLevel = "starter" | "junior" | "middle" | "senior";
export type ProfessionId = "frontend" | "backend" | "database" | "design" | "qa" | "ai" | "management";
export type HeroStyle = "engineer" | "creator" | "researcher";
export type HeroPalette = "cyan" | "violet" | "amber" | "green";
export type HeroClassId = "guardian" | "technomancer" | "pathfinder" | "architect";
export type HeroStatId = "vitality" | "power" | "defense" | "speed" | "focus";
export type GameItemRarity = "common" | "rare" | "epic" | "legendary";
export type GameEquipmentSlot = "weapon" | "armor" | "charm" | "companion";
export type GameChallengePeriod = "daily" | "weekly" | "season";
export type GameBattleMode = "training" | "ranked" | "team";
export type RewardKind = "frame" | "badge" | "companion" | "title" | "effect";
export type RecognitionCategory = "quality" | "initiative" | "mentorship" | "rescue" | "documentation" | "kindness";
export type XpTransactionKind = "contribution" | "review" | "documentation" | "mentorship" | "manual-adjustment" | "reversal";
export type XpTransactionStatus = "confirmed" | "pending" | "reversed";
export type RecognitionAuditAction = "created" | "official-thanks" | "reported" | "xp-reversed" | "restored";
export type SupportProvider = "github-sponsors" | "open-collective" | "boosty" | "donation-alerts" | "custom";
export type AccountStatus = "active" | "unverified" | "blocked";
export type ProfileVisibility = "public" | "community" | "private";
export type ContactPermission = "everyone" | "community" | "nobody";
export type ThemeMode = "dark" | "light" | "system";
export type TextScale = "compact" | "normal" | "large";
export type HeroImageSource = "composite" | "upload" | "fallback" | "fal";
export type HeroImageStatus = "queued" | "generating" | "ready" | "failed" | "cancelled";
export type HeroImagePreset = "cinematic" | "anime" | "pixel" | "illustration" | "realistic";
export type HeroImageMood = "calm" | "focused" | "triumphant" | "mysterious";
export type HeroImageBackground = "workshop" | "space" | "forest" | "city" | "abstract";
export type GitProviderId = "github";
export type GitConnectionStatus = "disconnected" | "connected" | "expired";
export type GitIssueState = "open" | "closed";
export type GitPullRequestState = "draft" | "open" | "checks" | "ready" | "merged" | "closed";
export type GitCheckConclusion = "pending" | "success" | "failure";
export type ModerationCaseType = "community-report" | "project-review" | "external-link" | "user-risk" | "recognition-dispute";
export type ModerationCaseStatus = "queued" | "reviewing" | "action-required" | "resolved" | "dismissed" | "appealed";
export type ModerationPriority = "low" | "medium" | "high" | "critical";
export type ModerationAction = "approve" | "dismiss" | "warn" | "restrict" | "suspend" | "remove-content" | "restore";
export type AppealStatus = "open" | "reviewing" | "upheld" | "overturned" | "rejected";
export type ExternalLinkReviewStatus = "pending" | "approved" | "rejected";
export type FeatureFlagAudience = "all" | "admins" | "testers";

export type ViewId =
  | "dashboard"
  | "projects"
  | "contributions"
  | "people"
  | "recognition"
  | "arena"
  | "heroStudio"
  | "learning"
  | "git"
  | "project"
  | "projectEditor"
  | "requests"
  | "forum"
  | "messages"
  | "notifications"
  | "profile"
  | "settings"
  | "admin";

export interface NavigationItem {
  id: ViewId;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export interface Skill {
  id?: ProfessionId;
  name: string;
  level: number;
  progress: number;
  confirmed?: boolean;
  source?: "self" | "test" | "mentor" | "project";
}

export type ContributionDifficulty = "Начальная" | "Средняя" | "Высокая";
export type ContributionKind = "Код" | "Документация" | "Дизайн" | "Тестирование" | "Исследование";
export type ProjectStage = "Идея" | "Прототип" | "MVP" | "Развитие";
export type ProjectStatus = "draft" | "published" | "archived";
export type ProjectRoadmapState = "planned" | "active" | "done";

export interface ContributionTask {
  id: string;
  projectId: string;
  project: string;
  title: string;
  category: string;
  kind: ContributionKind;
  difficulty: ContributionDifficulty;
  rewardXp: number;
  estimatedTime: string;
  applicants: number;
  slots: number;
  requiredLevel: number;
  summary: string;
  skills: string[];
  issueLabel: string;
  mentorReview: boolean;
  repositoryPath: string;
}

export interface ProjectRoadmapItem {
  id: string;
  title: string;
  summary: string;
  state: ProjectRoadmapState;
  progress: number;
  targetVersion: string;
  dueLabel: string;
}

export interface ProjectRoleOpening {
  id: string;
  title: string;
  skill: string;
  minLevel: number;
  slots: number;
  filled: number;
  summary: string;
  mentorAvailable: boolean;
}

export interface ProjectNewsItem {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  author: string;
  pinned: boolean;
}

export interface ProjectRelease {
  id: string;
  version: string;
  title: string;
  summary: string;
  publishedAt: string;
  contributionCount: number;
}

export interface ProjectFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface ProjectXpPolicy {
  requiresAcceptedResult: boolean;
  requiresMergeForCode: boolean;
  reviewXp: number;
  documentationXp: number;
  beginnerMultiplier: number;
  maxTaskXp: number;
}

export interface OpenSourceProject {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  summary: string;
  description: string;
  license: "MIT" | "Apache-2.0" | "GPL-3.0" | "MPL-2.0";
  stage: ProjectStage;
  status: ProjectStatus;
  progress: number;
  members: number;
  contributors: number;
  openTasks: number;
  repository: string;
  defaultBranch: string;
  stack: string[];
  needs: string[];
  tags: string[];
  beginnerFriendly: boolean;
  active: boolean;
  initials: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
  subscribers: number;
  forumThreads: number;
  readme: string;
  contributionGuide: string;
  codeOfConduct: string;
  roadmap: ProjectRoadmapItem[];
  roles: ProjectRoleOpening[];
  tasks: ContributionTask[];
  news: ProjectNewsItem[];
  releases: ProjectRelease[];
  faq: ProjectFaqItem[];
  xpPolicy: ProjectXpPolicy;
}


export interface GitProfile {
  provider: GitProviderId;
  username: string;
  displayName: string;
  status: GitConnectionStatus;
  connectedAt: string;
  scopes: string[];
}

export interface GitRepositorySnapshot {
  id: string;
  projectId: string;
  provider: GitProviderId;
  fullName: string;
  description: string;
  visibility: "public" | "private";
  defaultBranch: string;
  stars: number;
  forks: number;
  openIssues: number;
  branches: string[];
  readme: string;
  lastSyncedAt: string;
}

export interface GitIssueRecord {
  id: string;
  repositoryId: string;
  projectId: string;
  number: number;
  title: string;
  summary: string;
  state: GitIssueState;
  labels: string[];
  author: string;
  assignee?: string;
  linkedTaskId?: string;
  updatedAt: string;
}

export interface GitCheckRun {
  id: string;
  name: string;
  conclusion: GitCheckConclusion;
  durationLabel: string;
}

export interface GitPullRequestRecord {
  id: string;
  repositoryId: string;
  projectId: string;
  number: number;
  title: string;
  summary: string;
  author: string;
  branch: string;
  baseBranch: string;
  state: GitPullRequestState;
  linkedTaskId?: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  reviewStatus: "waiting" | "approved" | "changes-requested";
  checks: GitCheckRun[];
  createdAt: string;
  mergedAt?: string;
  xpAwarded: boolean;
}

export interface GitCommitRecord {
  id: string;
  repositoryId: string;
  sha: string;
  message: string;
  author: string;
  branch: string;
  createdAt: string;
  verified: boolean;
  linkedPullRequestId?: string;
}

export interface GitSyncEvent {
  id: string;
  repositoryId: string;
  action: string;
  createdAt: string;
  result: "success" | "warning";
}

export interface GitIntegrationState {
  profile?: GitProfile;
  selectedRepositoryId?: string;
  repositories: GitRepositorySnapshot[];
  issues: GitIssueRecord[];
  pullRequests: GitPullRequestRecord[];
  commits: GitCommitRecord[];
  syncLog: GitSyncEvent[];
}

export interface CommunityRequest {
  id: string;
  title: string;
  author: string;
  type: "Бесплатная помощь" | "Платный запрос";
  budget?: string;
  category: string;
  summary: string;
  responseCount: number;
  publishedAt: string;
  skills: string[];
}

export interface HeroConfig {
  style: HeroStyle;
  palette: HeroPalette;
  accessory: "laptop" | "tablet" | "headset";
  badge: "code" | "spark" | "shield";
}

export interface HeroStats {
  vitality: number;
  power: number;
  defense: number;
  speed: number;
  focus: number;
}

export interface HeroSeason {
  id: string;
  title: string;
  tier: "Новичок" | "Бронза" | "Серебро" | "Золото" | "Платина";
  rank: number;
  wins: number;
  losses: number;
}

export interface HeroLoadout {
  frameId: string;
  badgeId: string;
  companionId: string;
}

export interface GameEquipmentLoadout {
  weaponId?: string;
  armorId?: string;
  charmId?: string;
  companionId?: string;
}

export interface GameItem {
  id: string;
  title: string;
  description: string;
  slot: GameEquipmentSlot;
  rarity: GameItemRarity;
  requiredLevel: number;
  ratingBonus: number;
  statBonuses: Partial<HeroStats>;
  icon: string;
}

export interface GameSkillNode {
  id: string;
  classId: HeroClassId | "all";
  title: string;
  description: string;
  cost: number;
  requires?: string;
  ratingBonus: number;
  statBonuses: Partial<HeroStats>;
}

export interface HeroProgression {
  classId: HeroClassId;
  level: number;
  xp: number;
  xpToNext: number;
  unspentPoints: number;
  stats: HeroStats;
  battleRating: number;
  title: string;
  arenaEnabled: boolean;
  modelVersion: string;
  season: HeroSeason;
  loadout: HeroLoadout;
  unlockedRewardIds: string[];
  skillPoints: number;
  unlockedSkillNodeIds: string[];
  ownedItemIds: string[];
  equipment: GameEquipmentLoadout;
}


export interface HeroImageVariant {
  id: string;
  title: string;
  source: HeroImageSource;
  status: HeroImageStatus;
  imageUrl: string;
  thumbnailUrl?: string;
  createdAt: string;
  width: number;
  height: number;
  fileSize: number;
  mimeType: string;
  prompt?: string;
  negativePrompt?: string;
  modelId?: string;
  preset?: HeroImagePreset;
  mood?: HeroImageMood;
  background?: HeroImageBackground;
  originalFileName?: string;
}

export interface HeroImageGenerationInput {
  prompt: string;
  negativePrompt?: string;
  preset: HeroImagePreset;
  mood: HeroImageMood;
  background: HeroImageBackground;
  palette: HeroPalette;
  classId: HeroClassId;
}

export interface HeroImageGenerationRecord {
  id: string;
  status: HeroImageStatus;
  provider: "fallback" | "fal";
  prompt: string;
  modelId?: string;
  createdAt: string;
  completedAt?: string;
  variantId?: string;
  error?: string;
}

export interface HeroImageLibrary {
  activeImageId?: string;
  variants: HeroImageVariant[];
  generationHistory: HeroImageGenerationRecord[];
  maxVariants: number;
  totalGenerated: number;
  totalUploaded: number;
}

export interface TrainingTask {
  id: string;
  title: string;
  profession: ProfessionId;
  difficulty: "Начальная" | "Средняя";
  description: string;
  rewardXp: number;
  completed: boolean;
  score?: number;
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  summary: string;
  verified: boolean;
  contributionType?: string;
  projectLicense?: string;
}

export interface ProjectContributor {
  id: string;
  name: string;
  initials: string;
  role: string;
  primarySkill: string;
  acceptedContributions: number;
  projectXp: number;
  kudos: number;
  heroClass: HeroClassId;
  status: "active" | "review" | "paused";
  lastContribution: string;
}

export interface RecognitionRecord {
  id: string;
  contributorId: string;
  contributorName: string;
  contributorInitials: string;
  projectId: string;
  projectName: string;
  contributionId: string;
  title: string;
  summary: string;
  kind: ContributionKind;
  acceptedAt: string;
  skillXp: number;
  heroXp: number;
  verified: boolean;
  kudosCount: number;
  categories: RecognitionCategory[];
  releaseIds?: string[];
  xpTransactionIds?: string[];
  moderationStatus?: "clear" | "review" | "revoked";
  officialThanksCount?: number;
  riskFlags?: string[];
}

export interface KudosRecord {
  id: string;
  fromUserId: string;
  fromName: string;
  toContributorId: string;
  toContributorName: string;
  projectId: string;
  contributionId: string;
  category: RecognitionCategory;
  message: string;
  createdAt: string;
  communityPoints: number;
  officialProjectThanks: boolean;
}


export interface XpTransaction {
  id: string;
  contributorId: string;
  contributorName: string;
  projectId: string;
  projectName: string;
  contributionId?: string;
  kind: XpTransactionKind;
  status: XpTransactionStatus;
  skillName: string;
  amount: number;
  heroXp: number;
  communityPoints: number;
  reason: string;
  createdAt: string;
  createdBy: string;
  reversalOfId?: string;
  riskFlags: string[];
}

export interface ReleaseCredit {
  id: string;
  projectId: string;
  projectName: string;
  releaseName: string;
  releasedAt: string;
  summary: string;
  contributorIds: string[];
  contributionIds: string[];
}

export interface RecognitionAuditEvent {
  id: string;
  action: RecognitionAuditAction;
  targetId: string;
  actorName: string;
  reason: string;
  createdAt: string;
}

export interface SupportLink {
  id: string;
  provider: SupportProvider;
  label: string;
  url: string;
  enabled: boolean;
  note: string;
}

export interface RewardCatalogItem {
  id: string;
  kind: RewardKind;
  title: string;
  description: string;
  cost: number;
  rarity: "Обычная" | "Редкая" | "Эпическая" | "Легендарная";
  preview: string;
}

export interface BattleResult {
  id: string;
  opponentName: string;
  opponentClass: HeroClassId;
  result: "win" | "loss" | "draw";
  yourRating: number;
  opponentRating: number;
  xpReward: number;
  summary: string;
  createdAt: string;
  engineVersion: string;
  mode?: GameBattleMode;
  actionLog?: string[];
  seasonPoints?: number;
}

export interface TeamBattleResult {
  id: string;
  allyNames: string[];
  opponentTeam: string;
  result: "win" | "loss" | "draw";
  yourTeamRating: number;
  opponentTeamRating: number;
  xpReward: number;
  seasonPoints: number;
  summary: string;
  actionLog: string[];
  createdAt: string;
  engineVersion: string;
}

export interface GameChallenge {
  id: string;
  title: string;
  summary: string;
  period: GameChallengePeriod;
  progress: number;
  target: number;
  rewardHeroXp: number;
  rewardCommunityPoints: number;
  rewardItemId?: string;
  completed: boolean;
  claimed: boolean;
  expiresAt: string;
}

export interface GameLeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  initials: string;
  classId: HeroClassId;
  level: number;
  battleRating: number;
  seasonPoints: number;
  isCurrentUser: boolean;
}

export interface GameSystemState {
  challenges: GameChallenge[];
  leaderboard: GameLeaderboardEntry[];
  teamBattleHistory: TeamBattleResult[];
  seasonPoints: number;
  seasonEndsAt: string;
  lastDailyRefreshAt: string;
}



export type ForumReactionId = "like" | "helpful" | "insightful" | "thanks";
export type ForumThreadStatus = "open" | "solved" | "locked";
export type CommunityReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type ConversationKind = "direct" | "team" | "project" | "system";
export type MessageDeliveryStatus = "sent" | "delivered" | "read";

export interface ForumCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  threadCount: number;
  color: "cyan" | "violet" | "amber" | "green";
}

export interface ForumThread {
  id: string;
  categoryId: string;
  projectId?: string;
  title: string;
  summary: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  status: ForumThreadStatus;
  pinned: boolean;
  hot: boolean;
  views: number;
  replyCount: number;
  solvedPostId?: string;
  bookmarkedByCurrentUser: boolean;
}

export interface ForumPost {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  body: string;
  createdAt: string;
  editedAt?: string;
  quotePostId?: string;
  reactions: Record<ForumReactionId, number>;
  currentUserReactions: ForumReactionId[];
  acceptedAnswer: boolean;
}

export interface CommunityAttachment {
  id: string;
  name: string;
  type: "image" | "document" | "code";
  sizeLabel: string;
  url?: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  initials: string;
  role: string;
  online: boolean;
  language: LanguageCode;
}

export interface Conversation {
  id: string;
  kind: ConversationKind;
  title: string;
  initials: string;
  participantIds: string[];
  projectId?: string;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  muted: boolean;
  archived: boolean;
  pinned: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  originalBody?: string;
  sourceLanguage: LanguageCode;
  displayLanguage: LanguageCode;
  translated: boolean;
  createdAt: string;
  deliveryStatus: MessageDeliveryStatus;
  replyToId?: string;
  attachments: CommunityAttachment[];
  reactions: Record<ForumReactionId, number>;
  currentUserReactions: ForumReactionId[];
}

export interface CommunityReport {
  id: string;
  targetType: "thread" | "post" | "message" | "user";
  targetId: string;
  reason: string;
  details: string;
  createdAt: string;
  status: CommunityReportStatus;
}

export interface CommunityState {
  forumCategories: ForumCategory[];
  forumThreads: ForumThread[];
  forumPosts: ForumPost[];
  participants: ChatParticipant[];
  conversations: Conversation[];
  messages: ChatMessage[];
  reports: CommunityReport[];
  translationEnabled: boolean;
  lastOpenedConversationId?: string;
}


export interface ModerationEvidence {
  id: string;
  label: string;
  value: string;
  source: "user" | "system" | "git" | "community";
}

export interface ModerationCase {
  id: string;
  type: ModerationCaseType;
  title: string;
  summary: string;
  targetType: "project" | "user" | "thread" | "message" | "link" | "contribution";
  targetId: string;
  subjectName: string;
  reporterName: string;
  priority: ModerationPriority;
  status: ModerationCaseStatus;
  createdAt: string;
  assignedTo?: string;
  tags: string[];
  evidence: ModerationEvidence[];
  decisionId?: string;
  appealId?: string;
}

export interface ModerationDecision {
  id: string;
  caseId: string;
  action: ModerationAction;
  reason: string;
  actorName: string;
  createdAt: string;
  expiresAt?: string;
}

export interface ModerationAppeal {
  id: string;
  caseId: string;
  submittedBy: string;
  reason: string;
  status: AppealStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewerName?: string;
  resolution?: string;
}

export interface ExternalLinkReview {
  id: string;
  ownerName: string;
  label: string;
  url: string;
  platform: "telegram" | "discord" | "github" | "support" | "other";
  status: ExternalLinkReviewStatus;
  riskScore: number;
  submittedAt: string;
  reviewedAt?: string;
  reviewerName?: string;
  note?: string;
}

export interface FeatureFlag {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  audience: FeatureFlagAudience;
  updatedAt: string;
  updatedBy: string;
}

export interface ModerationAuditEvent {
  id: string;
  action: string;
  targetId: string;
  actorName: string;
  details: string;
  createdAt: string;
}

export interface UserSanction {
  id: string;
  userId: string;
  userName: string;
  action: Extract<ModerationAction, "warn" | "restrict" | "suspend">;
  reason: string;
  createdAt: string;
  expiresAt?: string;
  active: boolean;
}

export interface ModerationState {
  cases: ModerationCase[];
  decisions: ModerationDecision[];
  appeals: ModerationAppeal[];
  externalLinks: ExternalLinkReview[];
  featureFlags: FeatureFlag[];
  auditLog: ModerationAuditEvent[];
  sanctions: UserSanction[];
  activeReviewer: string;
}

export interface AuthSession {
  authenticated: boolean;
  accountId?: string;
  email?: string;
  status: AccountStatus;
  remembered: boolean;
  expiresAt?: string;
  lastLoginAt?: string;
  roles?: string[];
}

export interface SecurityDevice {
  id: string;
  name: string;
  browser: string;
  location: string;
  lastActiveAt: string;
  current: boolean;
}

export interface LoginEvent {
  id: string;
  device: string;
  location: string;
  createdAt: string;
  result: "success" | "failed";
}

export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  messagePermission: ContactPermission;
  invitePermission: ContactPermission;
  showThanks: boolean;
  showActivity: boolean;
  showBattleHistory: boolean;
  searchable: boolean;
  blockedUserIds: string[];
}

export type NotificationKind = "message" | "project" | "contribution" | "recognition" | "security" | "game" | "system";

export interface NotificationRecord {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionView?: ViewId;
  actionPath?: string;
}

export interface NotificationSettings {
  messages: boolean;
  projectInvites: boolean;
  contributionReviews: boolean;
  pullRequestAccepted: boolean;
  thanksReceived: boolean;
  levelUp: boolean;
  forumReplies: boolean;
  gameEvents: boolean;
  emailDigest: "off" | "daily" | "weekly";
  emailTransactional: boolean;
  emailSecurityAlerts: boolean;
  browserNotifications: boolean;
}

export interface AppearanceSettings {
  theme: ThemeMode;
  textScale: TextScale;
  reduceMotion: boolean;
  highContrast: boolean;
  language: LanguageCode;
}

export interface PlatformPreferences {
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  appearance: AppearanceSettings;
}

export interface UserProfile {
  name: string;
  nickname: string;
  language: LanguageCode;
  country: string;
  timezone: string;
  roles: RoleId[];
  primaryRole: RoleId;
  goals: string[];
  professions: ProfessionId[];
  experience: ExperienceLevel;
  hero: HeroConfig;
  heroProgression: HeroProgression;
  generalLevel: number;
  xp: number;
  reputation: number;
  reliability: number;
  skills: Skill[];
  trainingTasks: TrainingTask[];
  portfolio: PortfolioItem[];
  availableForContribution: boolean;
  mergedContributions: number;
  reviewScore: number;
  mentorEndorsements: number;
  gratitudeReceived: number;
  communityPoints: number;
  publicThanksEnabled: boolean;
  bio: string;
  interests: string[];
  spokenLanguages: string[];
  website: string;
  github: string;
  telegram: string;
  publicProfileSlug: string;
  supportLinks: SupportLink[];
}

export interface PlatformState {
  version: 12;
  onboardingCompleted: boolean;
  profile: UserProfile;
  claimedContributionIds: string[];
  submittedContributionIds: string[];
  joinedProjectIds: string[];
  savedProjectIds: string[];
  subscribedProjectIds: string[];
  selectedProjectId: string;
  projects: OpenSourceProject[];
  git: GitIntegrationState;
  community: CommunityState;
  moderation: ModerationState;
  recognitionRecords: RecognitionRecord[];
  kudosRecords: KudosRecord[];
  xpTransactions: XpTransaction[];
  releaseCredits: ReleaseCredit[];
  recognitionAuditLog: RecognitionAuditEvent[];
  battleHistory: BattleResult[];
  game: GameSystemState;
  heroImages: HeroImageLibrary;
  preferences: PlatformPreferences;
  securityDevices: SecurityDevice[];
  loginHistory: LoginEvent[];
  notifications: NotificationRecord[];
  completedAt?: string;
}
