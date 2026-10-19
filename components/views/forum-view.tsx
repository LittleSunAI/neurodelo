"use client";

import { useMemo, useState } from "react";
import {
  Bookmark, CheckCircle2, ChevronLeft, Flag, Flame, Heart, Lightbulb, MessageSquare,
  Pin, Plus, Quote, Search, Send, ThumbsUp, UsersRound, X,
} from "lucide-react";
import { Badge } from "@/components/ui/primitives";
import { usePlatform } from "@/components/platform-provider";
import type { ForumReactionId } from "@/types/platform";

const reactionMeta: Record<ForumReactionId, { label: string; icon: typeof Heart }> = {
  like: { label: "Нравится", icon: ThumbsUp },
  helpful: { label: "Полезно", icon: CheckCircle2 },
  insightful: { label: "Интересно", icon: Lightbulb },
  thanks: { label: "Спасибо", icon: Heart },
};

export function ForumView() {
  const {
    state, communityMode, createForumThread, addForumReply, toggleForumReaction,
    toggleForumBookmark, markForumSolution, reportCommunityContent,
  } = usePlatform();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("all");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: "thread" | "post"; id: string } | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  const threads = useMemo(() => state.community.forumThreads.filter((thread) => {
    if (categoryId !== "all" && categoryId !== "bookmarks" && thread.categoryId !== categoryId) return false;
    const haystack = `${thread.title} ${thread.summary} ${thread.tags.join(" ")}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  }).sort((a, b) => Number(b.pinned) - Number(a.pinned)), [categoryId, query, state.community.forumThreads]);

  const selected = selectedThreadId ? state.community.forumThreads.find((thread) => thread.id === selectedThreadId) : undefined;
  if (selected) {
    return <ThreadScreen
      threadId={selected.id}
      onBack={() => setSelectedThreadId(null)}
      onReport={(type, id) => setReportTarget({ type, id })}
      onBookmark={() => void toggleForumBookmark(selected.id)}
      onReply={(body, quotePostId) => addForumReply(selected.id, body, quotePostId)}
      onReaction={toggleForumReaction}
      onMarkSolution={(postId) => markForumSolution(selected.id, postId)}
    />;
  }

  return <>
    <div className="forum-layout forum-layout-v2">
      <section className="panel content-panel">
        <div className="page-intro">
          <div>
            <div className="badge-row"><Badge tone="violet">Сообщество</Badge><Badge tone={communityMode === "fallback" ? "success" : "warning"}>{communityMode}</Badge></div>
            <h2>Форум, разборы и взаимопомощь</h2>
            <p>Создавайте темы, отвечайте, цитируйте, отмечайте полезные решения и обсуждайте конкретные open-source проекты.</p>
          </div>
          <button className="primary-button" onClick={() => setCreateOpen(true)}><Plus size={16} />Создать тему</button>
        </div>
        <label className="search-box forum-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Найти обсуждение, тег или проект" /></label>
        <div className="forum-filter-row">
          <button className={categoryId === "all" ? "active" : ""} onClick={() => setCategoryId("all")}>Все темы</button>
          <button className={categoryId === "bookmarks" ? "active" : ""} onClick={() => setCategoryId("bookmarks")}><Bookmark size={14} />Закладки</button>
          <span>{threads.length} обсуждений</span>
        </div>
        <div className="forum-topics forum-topics-v2">
          {(categoryId === "bookmarks" ? threads.filter((thread) => thread.bookmarkedByCurrentUser) : threads).map((thread) => {
            const category = state.community.forumCategories.find((item) => item.id === thread.categoryId);
            return <button className="forum-topic-button" key={thread.id} onClick={() => setSelectedThreadId(thread.id)}>
              <div className="topic-icon">{thread.hot ? <Flame /> : thread.status === "solved" ? <CheckCircle2 /> : <MessageSquare />}</div>
              <div className="topic-main">
                <div>{thread.pinned ? <Pin size={13} /> : null}<Badge>{category?.title ?? "Общее"}</Badge>{thread.status === "solved" ? <Badge tone="success">Решено</Badge> : null}</div>
                <h3>{thread.title}</h3><p>{thread.summary}</p>
                <small>{thread.authorName} · {thread.updatedAt} · {thread.tags.join(" · ")}</small>
              </div>
              <div className="topic-numbers"><span><MessageSquare />{thread.replyCount}</span><span><UsersRound />{thread.views}</span>{thread.bookmarkedByCurrentUser ? <Bookmark className="bookmark-active" /> : null}</div>
            </button>;
          })}
          {threads.length === 0 ? <div className="empty-community-state"><Search /><h3>Ничего не найдено</h3><p>Измените запрос или создайте новую тему.</p></div> : null}
        </div>
      </section>
      <aside className="view-stack">
        <article className="panel forum-categories"><h3>Разделы</h3><button className={categoryId === "all" ? "active" : ""} onClick={() => setCategoryId("all")}><span>Все обсуждения</span><em>{state.community.forumThreads.length}</em></button>{state.community.forumCategories.map((item) => <button className={categoryId === item.id ? "active" : ""} key={item.id} onClick={() => setCategoryId(item.id)}><span>{item.icon} {item.title}</span><em>{item.threadCount}</em></button>)}</article>
        <article className="panel community-card"><UsersRound /><h3>12 480 участников</h3><p>Сегодня в обсуждениях участвовали 684 человека. Открыто жалоб: {state.community.reports.filter((item) => item.status === "open").length}.</p><button className="ghost-button full" onClick={() => setRulesOpen(true)}>Правила сообщества</button></article>
      </aside>
    </div>
    {createOpen ? <CreateThreadDialog onClose={() => setCreateOpen(false)} onCreate={async (input) => { const thread = await createForumThread(input); setCreateOpen(false); setSelectedThreadId(thread.id); }} /> : null}
    {reportTarget ? <ReportDialog onClose={() => setReportTarget(null)} onSubmit={async (reason, details) => { await reportCommunityContent({ targetType: reportTarget.type, targetId: reportTarget.id, reason, details }); setReportTarget(null); }} /> : null}
    {rulesOpen ? <CommunityRulesDialog onClose={() => setRulesOpen(false)} /> : null}
  </>;
}

function ThreadScreen({ threadId, onBack, onReport, onBookmark, onReply, onReaction, onMarkSolution }: {
  threadId: string;
  onBack: () => void;
  onReport: (type: "thread" | "post", id: string) => void;
  onBookmark: () => void;
  onReply: (body: string, quotePostId?: string) => Promise<unknown>;
  onReaction: (postId: string, reaction: ForumReactionId) => Promise<void>;
  onMarkSolution: (postId: string) => Promise<void>;
}) {
  const { state } = usePlatform();
  const thread = state.community.forumThreads.find((item) => item.id === threadId)!;
  const posts = state.community.forumPosts.filter((post) => post.threadId === threadId);
  const category = state.community.forumCategories.find((item) => item.id === thread.categoryId);
  const [reply, setReply] = useState("");
  const [quotePostId, setQuotePostId] = useState<string | undefined>();
  const quoted = posts.find((post) => post.id === quotePostId);

  async function submitReply() {
    if (!reply.trim()) return;
    await onReply(reply.trim(), quotePostId);
    setReply(""); setQuotePostId(undefined);
  }

  return <div className="view-stack forum-thread-screen">
    <article className="panel thread-header-card">
      <button className="ghost-button compact" onClick={onBack}><ChevronLeft size={15} />К темам</button>
      <div className="thread-heading"><div><Badge>{category?.title}</Badge>{thread.status === "solved" ? <Badge tone="success">Решено</Badge> : null}</div><h2>{thread.title}</h2><p>{thread.summary}</p><small>{thread.authorName} · {thread.createdAt} · {thread.views} просмотров</small></div>
      <div className="button-row"><button className={thread.bookmarkedByCurrentUser ? "secondary-button active" : "secondary-button"} onClick={onBookmark}><Bookmark size={15} />{thread.bookmarkedByCurrentUser ? "В закладках" : "Сохранить"}</button><button className="ghost-button" onClick={() => onReport("thread", thread.id)}><Flag size={15} />Пожаловаться</button></div>
    </article>
    <section className="forum-post-list">
      {posts.map((post, index) => <article className={`panel forum-post-card ${post.acceptedAnswer ? "accepted" : ""}`} key={post.id}>
        <aside><span className="chat-avatar">{post.authorInitials}</span><strong>{post.authorName}</strong><small>{post.authorId === state.profile.nickname ? "Это вы" : "Участник"}</small></aside>
        <div className="forum-post-content">
          <header><span>#{index + 1} · {post.createdAt}</span>{post.acceptedAnswer ? <Badge tone="success"><CheckCircle2 size={12} />Принятый ответ</Badge> : null}</header>
          {post.quotePostId ? <blockquote>{posts.find((item) => item.id === post.quotePostId)?.body ?? "Цитируемое сообщение"}</blockquote> : null}
          <p>{post.body}</p>
          <footer><div className="forum-reactions">{(Object.keys(reactionMeta) as ForumReactionId[]).map((reaction) => { const Icon = reactionMeta[reaction].icon; const active = post.currentUserReactions.includes(reaction); return <button className={active ? "active" : ""} key={reaction} title={reactionMeta[reaction].label} onClick={() => void onReaction(post.id, reaction)}><Icon size={13} />{post.reactions[reaction] || ""}</button>; })}</div><div><button onClick={() => setQuotePostId(post.id)}><Quote size={13} />Цитировать</button>{thread.authorId === state.profile.nickname && thread.status !== "solved" && post.authorId !== state.profile.nickname ? <button onClick={() => void onMarkSolution(post.id)}><CheckCircle2 size={13} />Отметить решением</button> : null}<button onClick={() => onReport("post", post.id)}><Flag size={13} /></button></div></footer>
        </div>
      </article>)}
    </section>
    <article className="panel forum-reply-editor">
      <h3>Ответить в теме</h3>
      {quoted ? <div className="quote-preview"><Quote size={14} /><span>{quoted.authorName}: {quoted.body}</span><button onClick={() => setQuotePostId(undefined)}><X size={13} /></button></div> : null}
      <textarea value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Напишите полезный и уважительный ответ…" />
      <div><small>Markdown будет подключён на серверном этапе. Сейчас ответ сохраняется через fallback.</small><button className="primary-button" onClick={() => void submitReply()} disabled={!reply.trim()}><Send size={15} />Отправить</button></div>
    </article>
  </div>;
}

function CreateThreadDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (input: { categoryId: string; projectId?: string; title: string; summary: string; tags: string[] }) => Promise<void> }) {
  const { state } = usePlatform();
  const [categoryId, setCategoryId] = useState(state.community.forumCategories[0]?.id ?? "general");
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  return <div className="modal-layer" role="dialog" aria-modal="true"><button className="modal-backdrop" onClick={onClose} aria-label="Закрыть окно" /><section className="modal-card community-modal"><header><div><Badge tone="violet">Новая тема</Badge><h2>Начать обсуждение</h2></div><button className="icon-button" onClick={onClose} aria-label="Закрыть"><X /></button></header><label>Раздел<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>{state.community.forumCategories.map((category) => <option value={category.id} key={category.id}>{category.title}</option>)}</select></label><label>Проект, необязательно<select value={projectId} onChange={(event) => setProjectId(event.target.value)}><option value="">Без проекта</option>{state.projects.map((project) => <option value={project.id} key={project.id}>{project.title}</option>)}</select></label><label>Заголовок<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="О чём хотите поговорить?" /></label><label>Первое сообщение<textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Опишите ситуацию, контекст и ожидаемый результат" /></label><label>Теги<input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="Git, React, помощь" /></label><footer><button className="ghost-button" onClick={onClose}>Отмена</button><button className="primary-button" disabled={title.trim().length < 5 || summary.trim().length < 10} onClick={() => void onCreate({ categoryId, projectId: projectId || undefined, title: title.trim(), summary: summary.trim(), tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) })}>Опубликовать</button></footer></section></div>;
}

function ReportDialog({ onClose, onSubmit }: { onClose: () => void; onSubmit: (reason: string, details: string) => Promise<void> }) {
  const [reason, setReason] = useState("Спам или реклама");
  const [details, setDetails] = useState("");
  return <div className="modal-layer" role="dialog" aria-modal="true"><button className="modal-backdrop" onClick={onClose} aria-label="Закрыть окно" /><section className="modal-card community-modal"><header><div><Badge tone="warning">Жалоба</Badge><h2>Сообщить модераторам</h2></div><button className="icon-button" onClick={onClose} aria-label="Закрыть"><X /></button></header><label>Причина<select value={reason} onChange={(event) => setReason(event.target.value)}><option>Спам или реклама</option><option>Оскорбления</option><option>Опасная ссылка</option><option>Нарушение авторских прав</option><option>Другое</option></select></label><label>Комментарий<textarea value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Что именно нужно проверить?" /></label><footer><button className="ghost-button" onClick={onClose}>Отмена</button><button className="primary-button" onClick={() => void onSubmit(reason, details)}>Отправить жалобу</button></footer></section></div>;
}


function CommunityRulesDialog({ onClose }: { onClose: () => void }) {
  return <div className="modal-layer" role="dialog" aria-modal="true" aria-label="Правила сообщества"><button className="modal-backdrop" onClick={onClose} aria-label="Закрыть окно" /><section className="modal-card community-modal"><header><div><Badge tone="violet">Сообщество</Badge><h2>Правила общения</h2></div><button className="icon-button" onClick={onClose} aria-label="Закрыть"><X /></button></header><ol className="community-rules-list"><li><strong>Уважайте людей.</strong> Обсуждайте результат и идеи, а не личность участника.</li><li><strong>Не публикуйте секреты.</strong> Пароли, токены, приватный код и персональные данные запрещены.</li><li><strong>Давайте проверяемый контекст.</strong> Для технического вопроса укажите шаги, ошибку и ожидаемое поведение.</li><li><strong>Без спама и обмана.</strong> Реклама, накрутка XP и ложные благодарности отправляются на модерацию.</li><li><strong>Соблюдайте лицензии.</strong> Указывайте источники и условия использования материалов.</li></ol><footer><button className="primary-button" onClick={onClose}>Понятно</button></footer></section></div>;
}
