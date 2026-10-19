import { createHash } from "node:crypto";
import { getPersistentStore } from "./persistence";

export type EmailTemplate = "welcome" | "password-reset" | "security-alert" | "digest" | "test";
export type EmailDelivery = { ok: boolean; provider: "resend" | "preview"; id: string; preview?: string; error?: string; replayed?: boolean };

type EmailDeliveryRecord = {
  id: string;
  idempotencyKey: string;
  emailHash: string;
  emailDomain: string;
  template: EmailTemplate;
  provider: "resend" | "preview";
  ok: boolean;
  error?: string;
  providerId?: string;
  createdAt: string;
  updatedAt: string;
};

const NS = "email-deliveries";

function escapeHtml(value: string) { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] ?? character); }
function render(template: EmailTemplate, values: Record<string, string>) {
  const name = escapeHtml(values.name || "участник"), actionUrl = escapeHtml(values.actionUrl || ""), message = escapeHtml(values.message || "");
  const title = { welcome: "Добро пожаловать в NEURODELO", "password-reset": "Восстановление доступа", "security-alert": "Важное событие безопасности", digest: "Сводка уведомлений NEURODELO", test: "Проверка email-уведомлений" }[template];
  const body = template === "password-reset"
    ? `<p>Здравствуйте, ${name}.</p><p>Для установки нового пароля откройте ссылку:</p><p><a href="${actionUrl}">Восстановить доступ</a></p>`
    : `<p>Здравствуйте, ${name}.</p><p>${message || "Email-уведомления настроены и готовы к работе."}</p>${actionUrl ? `<p><a href="${actionUrl}">Открыть NEURODELO</a></p>` : ""}`;
  return { title, html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:24px;color:#152033"><h1>${title}</h1>${body}<hr/><p style="font-size:12px;color:#667085">NEURODELO · open-source пространство</p></div>`, text: `${title}\n\n${values.message || ""}\n${values.actionUrl || ""}`.trim() };
}
function hashEmail(email: string) { return createHash("sha256").update(email).digest("base64url"); }
function recordKey(idempotencyKey: string) { return createHash("sha256").update(idempotencyKey).digest("base64url"); }

export async function sendTransactionalEmail(input: { to: string; template: EmailTemplate; variables: Record<string, string>; idempotencyKey: string }): Promise<EmailDelivery> {
  const email = input.to.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, provider: "preview", id: "invalid", error: "Некорректный email" };
  const store = getPersistentStore();
  const key = recordKey(input.idempotencyKey);
  const existing = store.get<EmailDeliveryRecord>(NS, key);
  if (existing?.ok) return { ok: true, provider: existing.provider, id: existing.providerId || existing.id, replayed: true };
  const now = new Date().toISOString();
  const base: EmailDeliveryRecord = {
    id: crypto.randomUUID(), idempotencyKey: input.idempotencyKey, emailHash: hashEmail(email), emailDomain: email.split("@")[1] || "unknown",
    template: input.template, provider: "preview", ok: false, createdAt: existing?.createdAt || now, updatedAt: now,
  };
  const content = render(input.template, input.variables), apiKey = process.env.RESEND_API_KEY, from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    const result: EmailDelivery = { ok: true, provider: "preview", id: `preview-${Date.now()}`, preview: `${content.title}: ${content.text}` };
    store.set<EmailDeliveryRecord>(NS, key, { ...base, provider: "preview", ok: true, providerId: result.id });
    return result;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(3000, Number(process.env.EMAIL_REQUEST_TIMEOUT_MS || 10000)));
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": input.idempotencyKey.slice(0, 256) },
      body: JSON.stringify({ from, to: [email], subject: content.title, html: content.html, text: content.text }), cache: "no-store", signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({})) as { id?: string; message?: string; error?: { message?: string } };
    if (!response.ok) {
      const error = payload.error?.message || payload.message || `Resend ${response.status}`;
      store.set<EmailDeliveryRecord>(NS, key, { ...base, provider: "resend", ok: false, error });
      return { ok: false, provider: "resend", id: "failed", error };
    }
    const id = payload.id || `resend-${Date.now()}`;
    store.set<EmailDeliveryRecord>(NS, key, { ...base, provider: "resend", ok: true, providerId: id });
    return { ok: true, provider: "resend", id };
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError" ? "Email provider timeout" : "Email provider unavailable";
    store.set<EmailDeliveryRecord>(NS, key, { ...base, provider: "resend", ok: false, error: message });
    return { ok: false, provider: "resend", id: "failed", error: message };
  } finally { clearTimeout(timeout); }
}

export function listEmailDeliveryEvents(limit = 100) {
  return getPersistentStore().entries<EmailDeliveryRecord>(NS).map(([, value]) => value).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, Math.max(1, Math.min(limit, 1000)));
}
