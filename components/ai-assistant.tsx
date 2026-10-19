"use client";
import { useState } from "react";
import { Bot, ChevronRight, Search, Send, Sparkles, X } from "lucide-react";

const suggestions = ["Подбери open-source проект", "Объясни выбранный репозиторий", "Найди задачу под мой уровень", "Помоги подготовить Pull Request"];

export function AiAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: "bot" | "user"; text: string }[]>([{ role: "bot", text: "Здравствуйте. Я помогу выбрать проект, понять структуру репозитория, найти подходящую задачу и подготовить вклад к ревью." }]);
  const [input, setInput] = useState("");
  function send(text = input) { if (!text.trim()) return; setMessages((current) => [...current, { role: "user", text }, { role: "bot", text: "В макете я показываю сценарий ответа. В рабочей версии помощник получит только разрешённые публичные данные проекта: README, issue, roadmap, правила вклада и результаты проверок." }]); setInput(""); }
  return <><aside className={`ai-drawer ${open ? "open" : ""}`}><header><div><span><Sparkles /></span><div><strong>ИИ-помощник</strong><small>Объясняет и направляет, но не принимает вклад</small></div></div><button className="icon-button" onClick={onClose} aria-label="Закрыть помощника"><X /></button></header><div className="ai-context"><Bot /><div><strong>Контекст: open-source платформа</strong><span>Можно спросить про проекты, задачи, Git и обучение</span></div></div><div className="ai-messages">{messages.map((message, index) => <div className={`ai-message ${message.role}`} key={index}>{message.role === "bot" ? <span><Bot /></span> : null}<p>{message.text}</p></div>)}{messages.length === 1 ? <div className="ai-suggestions">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => send(suggestion)}>{suggestion}<ChevronRight /></button>)}</div> : null}</div><footer><label><Search /><textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} placeholder="Спросите про проект или вклад…" /></label><button onClick={() => send()} aria-label="Отправить сообщение помощнику"><Send /></button></footer></aside>{open ? <button className="drawer-backdrop" onClick={onClose} aria-label="Закрыть помощника" /> : null}</>;
}
