import { communityConfig, communityRuntimeMode } from "../lib/community-config";
import type {
  ChatMessage,
  CommunityReport,
  ForumPost,
  ForumReactionId,
  ForumThread,
  LanguageCode,
} from "../types/platform";

function wait(ms = communityConfig.artificialDelayMs) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/v1/community${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`Community API недоступен: ${response.status}`);
  return response.json() as Promise<T>;
}

function mockTranslate(text: string, source: LanguageCode, target: LanguageCode) {
  if (source === target) return text;
  const known: Record<string, string> = {
    "I reviewed the pull request. Please add keyboard tests and update the changelog.": "Я проверил Pull Request. Добавьте клавиатурные тесты и обновите changelog.",
    "The checks are green now. You can request another review.": "Теперь все проверки зелёные. Можно повторно запросить ревью.",
    "Thanks, I will update the branch today.": "Спасибо, я обновлю ветку сегодня.",
  };
  return known[text] ?? `[Перевод ${source.toUpperCase()}→${target.toUpperCase()}] ${text}`;
}

export const communityGateway = {
  mode: communityRuntimeMode,

  async createThread(input: Omit<ForumThread, "id" | "createdAt" | "updatedAt" | "views" | "replyCount" | "bookmarkedByCurrentUser">) {
    if (communityRuntimeMode === "api") return apiRequest<ForumThread>("/forum/threads", { method: "POST", body: JSON.stringify(input) });
    await wait(180);
    const now = "только что";
    return { ...input, id: `thread-${Date.now()}`, createdAt: now, updatedAt: now, views: 1, replyCount: 0, bookmarkedByCurrentUser: false };
  },

  async createPost(input: Omit<ForumPost, "id" | "createdAt" | "reactions" | "currentUserReactions" | "acceptedAnswer">) {
    if (communityRuntimeMode === "api") return apiRequest<ForumPost>(`/forum/threads/${input.threadId}/posts`, { method: "POST", body: JSON.stringify(input) });
    await wait(140);
    return { ...input, id: `post-${Date.now()}`, createdAt: "только что", reactions: { like: 0, helpful: 0, insightful: 0, thanks: 0 }, currentUserReactions: [], acceptedAnswer: false };
  },

  async translate(text: string, sourceLanguage: LanguageCode, targetLanguage: LanguageCode) {
    if (communityRuntimeMode === "api") return apiRequest<{ text: string }>("/translate", { method: "POST", body: JSON.stringify({ text, sourceLanguage, targetLanguage }) }).then((value) => value.text);
    await wait(110);
    return mockTranslate(text, sourceLanguage, targetLanguage);
  },

  async createMessage(input: Omit<ChatMessage, "id" | "createdAt" | "deliveryStatus" | "reactions" | "currentUserReactions">) {
    if (communityRuntimeMode === "api") return apiRequest<ChatMessage>(`/conversations/${input.conversationId}/messages`, { method: "POST", body: JSON.stringify(input) });
    await wait(100);
    return { ...input, id: `message-${Date.now()}`, createdAt: "только что", deliveryStatus: "sent" as const, reactions: { like: 0, helpful: 0, insightful: 0, thanks: 0 }, currentUserReactions: [] };
  },

  async createReport(input: Omit<CommunityReport, "id" | "createdAt" | "status">) {
    if (communityRuntimeMode === "api") return apiRequest<CommunityReport>("/reports", { method: "POST", body: JSON.stringify(input) });
    await wait(130);
    return { ...input, id: `report-${Date.now()}`, createdAt: "только что", status: "open" as const };
  },

  toggleReaction<T extends { reactions: Record<ForumReactionId, number>; currentUserReactions: ForumReactionId[] }>(item: T, reaction: ForumReactionId): T {
    const active = item.currentUserReactions.includes(reaction);
    return {
      ...item,
      reactions: { ...item.reactions, [reaction]: Math.max(0, item.reactions[reaction] + (active ? -1 : 1)) },
      currentUserReactions: active ? item.currentUserReactions.filter((id) => id !== reaction) : [...item.currentUserReactions, reaction],
    };
  },
};
