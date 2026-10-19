import { communityGateway } from "../services/community-gateway";
import { defaultState, platformGateway } from "../services/platform-gateway";
import { fallbackConfig } from "../lib/fallback-config";

class MemoryStorage {
  private values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

const storage = new MemoryStorage();
(globalThis as unknown as { window: { localStorage: MemoryStorage } }).window = { localStorage: storage };

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

async function main() {
  assert(communityGateway.mode === "fallback", "Community gateway должен работать в fallback-режиме");
  const state = await platformGateway.loadState();
  assert(state.version === 12, "Схема сообщества должна использовать версию 11");
  assert(state.community.forumThreads.length >= 4, "Должны существовать демонстрационные темы");
  assert(state.community.conversations.some((item) => item.kind === "direct"), "Должен существовать личный чат");
  assert(state.community.conversations.some((item) => item.kind === "project"), "Должен существовать проектный чат");

  const thread = await communityGateway.createThread({
    categoryId: "general", title: "Fallback contract topic", summary: "Проверяем создание темы через изолированный gateway.",
    authorId: "tbv", authorName: "Тимур", authorInitials: "ТБ", tags: ["test"], status: "open", pinned: false, hot: false,
  });
  assert(thread.id.startsWith("thread-"), "Fallback должен создавать id темы");

  const post = await communityGateway.createPost({ threadId: thread.id, authorId: "tbv", authorName: "Тимур", authorInitials: "ТБ", body: "Первый ответ" });
  const reacted = communityGateway.toggleReaction(post, "helpful");
  assert(reacted.reactions.helpful === 1 && reacted.currentUserReactions.includes("helpful"), "Реакция должна включаться");
  const unreacted = communityGateway.toggleReaction(reacted, "helpful");
  assert(unreacted.reactions.helpful === 0, "Реакция должна выключаться");

  const translated = await communityGateway.translate("I reviewed the pull request. Please add keyboard tests and update the changelog.", "en", "ru");
  assert(translated.includes("Pull Request"), "Fallback-перевод должен возвращать русскую версию известной фразы");

  const message = await communityGateway.createMessage({
    conversationId: "conv-mikhail", senderId: "tbv", senderName: "Тимур", body: "Проверка сообщения",
    sourceLanguage: "ru", displayLanguage: "ru", translated: false, attachments: [],
  });
  assert(message.deliveryStatus === "sent", "Новое сообщение должно иметь статус sent");

  const report = await communityGateway.createReport({ targetType: "message", targetId: message.id, reason: "Тест", details: "Контрактная проверка" });
  assert(report.status === "open", "Новая жалоба должна быть открыта");

  await platformGateway.saveState({ ...state, community: { ...state.community, forumThreads: [thread, ...state.community.forumThreads], forumPosts: [post, ...state.community.forumPosts], messages: [...state.community.messages, message], reports: [report] } });
  const restored = await platformGateway.loadState();
  assert(restored.community.forumThreads.some((item) => item.id === thread.id), "Тема должна сохраняться");
  assert(restored.community.messages.some((item) => item.id === message.id), "Сообщение должно сохраняться");

  storage.removeItem(fallbackConfig.storageKey);
  storage.setItem(fallbackConfig.previousStorageKey, JSON.stringify({ ...defaultState, version: 7, community: undefined }));
  const migrated = await platformGateway.loadState();
  assert(migrated.version === 12, "Состояние версии 7 должно мигрировать в версию 11");
  assert(migrated.community.forumCategories.length > 0, "Миграция должна добавить форум");

  console.log(JSON.stringify({ mode: communityGateway.mode, schemaVersion: migrated.version, forum: "ok", messages: "ok", translation: "ok", reports: "ok", migrationFromV7: "ok" }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
