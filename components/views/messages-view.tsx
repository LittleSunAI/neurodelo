"use client";

import { useMemo, useRef, useState } from "react";
import {
  Archive, BellOff, Bot, ChevronLeft, Download, Flag, Languages, LoaderCircle, MessageCirclePlus, MoreHorizontal,
  Paperclip, Pin, Reply, Search, Send, ShieldBan, UsersRound, X,
} from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { usePlatform } from "@/components/platform-provider";
import type { ConversationKind, ForumReactionId } from "@/types/platform";
import { protectedFileDownloadUrl, uploadProtectedFile } from "@/services/storage-gateway";

const reactions: { id: ForumReactionId; label: string }[] = [
  { id: "like", label: "👍" }, { id: "helpful", label: "🛠" }, { id: "insightful", label: "💡" }, { id: "thanks", label: "❤️" },
];

export function MessagesView() {
  const {
    state, communityMode, openConversation, sendChatMessage, toggleMessageReaction,
    toggleConversationMute, toggleConversationPin, archiveConversation, blockCommunityUser,
    toggleCommunityTranslation, createConversation, reportCommunityContent,
  } = usePlatform();
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(state.community.lastOpenedConversationId ?? state.community.conversations[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [replyToId, setReplyToId] = useState<string | undefined>();
  const [showOriginal, setShowOriginal] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "direct" | "groups">("all");
  const [attachment, setAttachment] = useState<{ id: string; name: string; type: "image" | "document" | "code"; sizeLabel: string } | null>(null);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const conversations = useMemo(() => state.community.conversations
    .filter((conversation) => !conversation.archived && (filter === "all" || (filter === "direct" ? conversation.kind === "direct" : conversation.kind === "team" || conversation.kind === "project")) && conversation.title.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned)), [filter, query, state.community.conversations]);
  const selected = state.community.conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0];
  const visibleMessages = selected ? state.community.messages.filter((item) => item.conversationId === selected.id) : [];
  const participants = selected ? state.community.participants.filter((participant) => selected.participantIds.includes(participant.id)) : [];
  const otherParticipant = participants.find((participant) => participant.id !== state.profile.nickname);
  const blocked = otherParticipant ? state.preferences.privacy.blockedUserIds.includes(otherParticipant.id) : false;
  const replyTo = visibleMessages.find((item) => item.id === replyToId);

  async function selectConversation(id: string) {
    setSelectedId(id); setMobileChatOpen(true); setMenuOpen(false); await openConversation(id);
  }

  async function submitMessage() {
    if (!selected || !message.trim() || blocked) return;
    await sendChatMessage(selected.id, message.trim(), { replyToId, attachments: attachment ? [attachment] : [] });
    setMessage(""); setReplyToId(undefined); setAttachment(null);
  }

  async function chooseAttachment(file: File | undefined) {
    if (!file) return;
    setAttachmentBusy(true); setAttachmentError(null);
    try {
      const result = await uploadProtectedFile(file, "chat");
      const ext = result.metadata.safeName.split(".").pop()?.toLowerCase();
      const type = result.metadata.mimeType.startsWith("image/") ? "image" : ["ts","tsx","js","jsx","py","sql","json","md","txt"].includes(ext ?? "") ? "code" : "document";
      const sizeLabel = result.metadata.size < 1024 ? `${result.metadata.size} Б` : `${Math.max(1, Math.round(result.metadata.size / 1024))} КБ`;
      setAttachment({ id: result.metadata.id, name: result.metadata.safeName, type, sizeLabel });
    } catch (cause) {
      setAttachmentError(cause instanceof Error ? cause.message : "Не удалось безопасно загрузить файл");
    } finally {
      setAttachmentBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return <>
    <div className={`messages-layout panel messages-v2 ${mobileChatOpen ? "mobile-chat-open" : ""}`}>
      <aside className="chat-list">
        <div className="chat-list-head"><div><h2>Сообщения</h2><small>{communityMode} · {state.community.translationEnabled ? "перевод включён" : "оригиналы"}</small></div><button className="icon-button" onClick={() => setNewChatOpen(true)} title="Новый чат" aria-label="Новый чат"><MessageCirclePlus /></button></div>
        <label className="search-box chat-search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Поиск чатов" /></label>
        <div className="chat-filter-row"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Все</button><button className={filter === "direct" ? "active" : ""} onClick={() => setFilter("direct")}>Личные</button><button className={filter === "groups" ? "active" : ""} onClick={() => setFilter("groups")}>Команды</button></div>
        <div className="chat-items">{conversations.map((conversation) => {
          const last = [...state.community.messages].reverse().find((message) => message.conversationId === conversation.id);
          const participant = state.community.participants.find((item) => conversation.participantIds.includes(item.id) && item.id !== state.profile.nickname);
          return <button className={selected?.id === conversation.id ? "active" : ""} key={conversation.id} onClick={() => void selectConversation(conversation.id)}><span className="chat-avatar">{conversation.initials}<i className={participant?.online ? "online" : ""} /></span><div><strong>{conversation.title}{conversation.pinned ? <Pin size={11} /> : null}</strong><p>{last?.body ?? "Сообщений пока нет"}</p></div><aside><span>{conversation.updatedAt}</span>{conversation.unreadCount ? <em>{conversation.unreadCount}</em> : conversation.muted ? <BellOff size={12} /> : null}</aside></button>;
        })}</div>
      </aside>
      {selected ? <section className="chat-window">
        <header><div className="chat-person"><button className="icon-button mobile-chat-back" onClick={() => setMobileChatOpen(false)} aria-label="Вернуться к списку чатов"><ChevronLeft /></button><span className="chat-avatar">{selected.initials}<i className={otherParticipant?.online ? "online" : ""} /></span><div><strong>{selected.title}</strong><small>{selected.kind === "direct" ? otherParticipant?.role : `${participants.length} участников`} · {state.community.translationEnabled ? "перевод включён" : "перевод выключен"}</small></div></div><div className="chat-header-actions"><button className={state.community.translationEnabled ? "icon-button active" : "icon-button"} onClick={() => void toggleCommunityTranslation()} title="Переключить перевод" aria-label="Переключить перевод" aria-pressed={state.community.translationEnabled}><Languages /></button><button className="icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Открыть меню чата" aria-expanded={menuOpen}><MoreHorizontal /></button>{menuOpen ? <div className="chat-context-menu"><button onClick={() => void toggleConversationPin(selected.id)}><Pin />{selected.pinned ? "Открепить" : "Закрепить"}</button><button onClick={() => void toggleConversationMute(selected.id)}><BellOff />{selected.muted ? "Включить уведомления" : "Отключить уведомления"}</button>{otherParticipant ? <button onClick={() => void blockCommunityUser(otherParticipant.id)}><ShieldBan />{blocked ? "Разблокировать" : "Заблокировать"}</button> : null}<button onClick={async () => { await archiveConversation(selected.id); setMenuOpen(false); setMobileChatOpen(false); const next = conversations.find((item) => item.id !== selected.id); if (next) setSelectedId(next.id); }}><Archive />Архивировать</button></div> : null}</div></header>
        {state.community.translationEnabled && visibleMessages.some((item) => item.originalBody) ? <div className="translation-banner"><Languages /><span>Сообщения на других языках автоматически показаны на русском.</span><button onClick={() => setShowOriginal(!showOriginal)}>{showOriginal ? "Показать перевод" : "Показать оригинал"}</button></div> : null}
        <div className="messages-area"><div className="date-divider">Сегодня</div>{visibleMessages.map((item) => {
          const mine = item.senderId === state.profile.nickname;
          const quoted = visibleMessages.find((messageItem) => messageItem.id === item.replyToId);
          const body = showOriginal && item.originalBody ? item.originalBody : item.body;
          return <div className={`message-bubble ${mine ? "outgoing" : "incoming"}`} key={item.id}>
            {!mine && selected.kind !== "direct" ? <strong>{item.senderName}</strong> : null}
            {quoted ? <blockquote>{quoted.senderName}: {quoted.body}</blockquote> : null}
            <p>{body}</p>
            {item.attachments.map((attachment) => <div className="message-attachment" key={attachment.id}><Paperclip size={13} /><span><strong>{attachment.name}</strong><small>{attachment.type} · {attachment.sizeLabel}</small></span>{/^[0-9a-f-]{36}$/i.test(attachment.id) ? <a className="icon-button" href={protectedFileDownloadUrl(attachment.id)} title="Скачать проверенный файл" aria-label={`Скачать ${attachment.name}`}><Download size={13} /></a> : null}</div>)}
            <span>{item.createdAt}{mine ? ` · ${item.deliveryStatus === "read" ? "✓✓" : "✓"}` : ""}</span>
            {item.translated && !showOriginal ? <small><Languages />Переведено с {item.sourceLanguage === "en" ? "английского" : "русского"}</small> : null}
            <div className="message-actions"><button onClick={() => setReplyToId(item.id)} title="Ответить"><Reply size={12} /></button>{reactions.map((reaction) => <button className={item.currentUserReactions.includes(reaction.id) ? "active" : ""} key={reaction.id} onClick={() => void toggleMessageReaction(item.id, reaction.id)}>{reaction.label}{item.reactions[reaction.id] || ""}</button>)}{!mine ? <button onClick={() => setReportMessageId(item.id)}><Flag size={12} /></button> : null}</div>
          </div>;
        })}{blocked ? <div className="blocked-chat-notice"><ShieldBan /><div><strong>Пользователь заблокирован</strong><span>Отправка сообщений отключена. История сохранена.</span></div></div> : null}</div>
        <footer className={blocked ? "disabled" : ""}>{replyTo ? <div className="chat-reply-preview"><Reply size={13} /><span>{replyTo.senderName}: {replyTo.body}</span><button onClick={() => setReplyToId(undefined)} aria-label="Отменить ответ"><X size={13} /></button></div> : null}{attachment ? <div className="chat-reply-preview"><Paperclip size={13} /><span>{attachment.name} · {attachment.sizeLabel}</span><button onClick={() => setAttachment(null)} aria-label="Удалить вложение"><X size={13} /></button></div> : null}{attachmentError ? <div className="chat-upload-error" role="alert">{attachmentError}</div> : null}<div className="chat-compose-row"><input ref={fileRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,application/pdf,text/plain,text/markdown,.md,.txt" onChange={(event) => void chooseAttachment(event.target.files?.[0])} /><button className="icon-button" aria-label="Прикрепить проверяемый файл" disabled={attachmentBusy || blocked} onClick={() => fileRef.current?.click()}>{attachmentBusy ? <LoaderCircle className="spin" /> : <Paperclip />}</button><input disabled={blocked} value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void submitMessage(); } }} placeholder={blocked ? "Пользователь заблокирован" : "Напишите сообщение…"} /><button className="ai-compose" onClick={() => setMessage((current) => current || "Здравствуйте! Уточните, пожалуйста, ожидаемый результат, ограничения и ссылку на связанную задачу.")}><Bot />AI</button><button className="send-button" aria-label="Отправить сообщение" disabled={!message.trim() || blocked || attachmentBusy} onClick={() => void submitMessage()}><Send /></button></div></footer>
      </section> : <section className="chat-window empty-chat"><UsersRound /><h3>Выберите разговор</h3><p>Личные, проектные и командные чаты хранятся в одном месте.</p></section>}
    </div>
    {newChatOpen ? <NewConversationDialog onClose={() => setNewChatOpen(false)} onCreate={async (input) => { const id = await createConversation(input); setNewChatOpen(false); await selectConversation(id); }} /> : null}
    {reportMessageId ? <MessageReportDialog onClose={() => setReportMessageId(null)} onSubmit={async (reason, details) => { await reportCommunityContent({ targetType: "message", targetId: reportMessageId, reason, details }); setReportMessageId(null); }} /> : null}
  </>;
}

function NewConversationDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (input: { title: string; kind: ConversationKind; participantIds: string[]; projectId?: string }) => Promise<void> }) {
  const { state } = usePlatform();
  const [kind, setKind] = useState<ConversationKind>("direct");
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [projectId, setProjectId] = useState("");
  function toggle(id: string) { setSelected(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]); }
  return <div className="modal-layer" role="dialog" aria-modal="true"><button className="modal-backdrop" onClick={onClose} aria-label="Закрыть окно" /><section className="modal-card community-modal"><header><div><Badge tone="violet">Новый разговор</Badge><h2>Создать чат</h2></div><button className="icon-button" onClick={onClose} aria-label="Закрыть"><X /></button></header><label>Тип<select value={kind} onChange={(event) => setKind(event.target.value as ConversationKind)}><option value="direct">Личный чат</option><option value="team">Групповой чат</option><option value="project">Чат проекта</option></select></label>{kind !== "direct" ? <label>Название<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Название команды или обсуждения" /></label> : null}{kind === "project" ? <label>Проект<select value={projectId} onChange={(event) => { setProjectId(event.target.value); const project = state.projects.find((item) => item.id === event.target.value); if (project) setTitle(`Команда ${project.title}`); }}><option value="">Выберите проект</option>{state.projects.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}</select></label> : null}<div className="participant-picker"><strong>Участники</strong>{state.community.participants.filter((participant) => participant.id !== state.profile.nickname && participant.id !== "system").map((participant) => <button className={selected.includes(participant.id) ? "active" : ""} key={participant.id} onClick={() => { if (kind === "direct") setSelected([participant.id]); else toggle(participant.id); }}><span className="chat-avatar">{participant.initials}<i className={participant.online ? "online" : ""} /></span><div><strong>{participant.name}</strong><small>{participant.role}</small></div><em>{selected.includes(participant.id) ? "Выбран" : "Добавить"}</em></button>)}</div><footer><button className="ghost-button" onClick={onClose}>Отмена</button><button className="primary-button" disabled={selected.length === 0 || (kind !== "direct" && title.trim().length < 3)} onClick={() => { const directParticipant = state.community.participants.find((participant) => participant.id === selected[0]); void onCreate({ title: kind === "direct" ? directParticipant?.name ?? "Личный чат" : title.trim(), kind, participantIds: [state.profile.nickname, ...selected], projectId: projectId || undefined }); }}>Создать чат</button></footer></section></div>;
}

function MessageReportDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (reason: string, details: string) => Promise<void> }) {
  const [reason, setReason] = useState("Оскорбления"); const [details, setDetails] = useState("");
  return <div className="modal-layer" role="dialog" aria-modal="true"><button className="modal-backdrop" onClick={onClose} aria-label="Закрыть окно" /><section className="modal-card community-modal"><header><div><Badge tone="warning">Жалоба</Badge><h2>Пожаловаться на сообщение</h2></div><button className="icon-button" onClick={onClose} aria-label="Закрыть"><X /></button></header><label>Причина<select value={reason} onChange={(event) => setReason(event.target.value)}><option>Оскорбления</option><option>Спам или реклама</option><option>Опасная ссылка</option><option>Мошенничество</option><option>Другое</option></select></label><label>Комментарий<textarea value={details} onChange={(event) => setDetails(event.target.value)} /></label><footer><button className="ghost-button" onClick={onClose}>Отмена</button><button className="primary-button" onClick={() => void onSubmit(reason, details)}>Отправить</button></footer></section></div>;
}
