import type {
  BattleResult,
  ContributionTask,
  HeroImageVariant,
  HeroProgression,
  ModerationCase,
  OpenSourceProject,
  RecognitionRecord,
  UserProfile,
  XpTransaction,
} from "./platform";

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown> | null;
  requestId?: string;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PageMeta;
}

export interface ApiSuccess<T> {
  data: T;
  requestId?: string;
}

export interface ApiFailure {
  error: ApiErrorPayload;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;

export interface RegisterAccountRequest {
  email: string;
  password: string;
  displayName: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface CreateProjectRequest {
  slug: string;
  title: string;
  tagline: string;
  summary: string;
  description: string;
  license: OpenSourceProject["license"];
  stage: OpenSourceProject["stage"];
  repository?: string;
  defaultBranch: string;
  stack: string[];
  needs: string[];
  tags: string[];
  beginnerFriendly: boolean;
}

export interface CreateContributionRequest {
  projectId: string;
  taskId?: string;
  title: string;
  summary: string;
  kind: ContributionTask["kind"];
}

export interface AcceptContributionRequest {
  reviewNote: string;
  skillXp: number;
  heroXp: number;
  communityPoints?: number;
}

export interface CreateKudosRequest {
  recognitionId: string;
  category: "quality" | "initiative" | "mentorship" | "rescue" | "documentation" | "kindness";
  message: string;
}

export interface RunBattleRequest {
  mode: "training" | "ranked" | "team";
  opponentId?: string;
}

export interface ApiContractMap {
  "GET /users/me": UserProfile;
  "GET /projects": PaginatedResponse<OpenSourceProject>;
  "GET /projects/{slug}/tasks": ContributionTask[];
  "GET /recognition/contributions/{id}": RecognitionRecord;
  "GET /recognition/xp-transactions": XpTransaction[];
  "GET /game/profile": HeroProgression;
  "POST /game/battles": BattleResult;
  "GET /moderation/cases": ModerationCase[];
  "POST /users/me/hero-images/generate": HeroImageVariant;
}

export type StoredFileApi = {
  id: string;
  ownerAccountId: string;
  scope: "avatar" | "project" | "chat" | "attachment" | "document";
  originalName: string;
  safeName: string;
  mimeType: string;
  size: number;
  sha256: string;
  status: "quarantined" | "approved" | "rejected";
  width?: number;
  height?: number;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
};

export type PortableDataEnvelopeApi<TState = unknown> = {
  format: "neurodelo-portable-data";
  version: 1;
  exportedAt: string;
  sourceRelease: string;
  state: TState;
  checksum: string;
};

export type BackgroundJobApi = {
  id: string;
  type: string;
  deduplicationKey?: string;
  status: "queued" | "processing" | "completed" | "failed" | "cancelled";
  attempts: number;
  maxAttempts: number;
  availableAt: number;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  updatedAt: string;
};
