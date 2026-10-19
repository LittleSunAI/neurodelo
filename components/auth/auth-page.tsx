"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { authGateway } from "@/services/auth-gateway";

type AuthMode = "login" | "register" | "forgot" | "reset" | "verify" | "blocked" | "expired";

const copy: Record<AuthMode, { eyebrow: string; title: string; text: string }> = {
  login: { eyebrow: "Добро пожаловать", title: "Вход в NEURODELO", text: "Открывайте проекты, подтверждайте вклад и развивайте героя." },
  register: { eyebrow: "Новый участник", title: "Создайте аккаунт", text: "После регистрации откроется настройка ролей, навыков и первоначального героя." },
  forgot: { eyebrow: "Восстановление", title: "Вернём доступ", text: "В fallback-режиме письмо имитируется, настоящий пароль нигде не сохраняется." },
  reset: { eyebrow: "Новый пароль", title: "Установите новый пароль", text: "Форма уже готова для будущего серверного токена восстановления." },
  verify: { eyebrow: "Подтверждение почты", title: "Введите код", text: "В fallback подойдёт любой код длиной от четырёх символов." },
  blocked: { eyebrow: "Безопасность", title: "Аккаунт временно ограничен", text: "Макет состояния для модерации и восстановления доступа через поддержку." },
  expired: { eyebrow: "Сессия завершена", title: "Нужно войти снова", text: "Защищённые страницы не открываются после истечения локальной сессии." },
};

export function AuthPage({ mode }: { mode: AuthMode }) {
  const info = copy[mode];
  const [name, setName] = useState("Тимур");
  const [email, setEmail] = useState(authGateway.demoCredentials.email);
  const [password, setPassword] = useState(authGateway.demoCredentials.password);
  const [nextPassword, setNextPassword] = useState("NewDemo123!");
  const [code, setCode] = useState("4821");
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = useMemo(() => mode !== "login" || (email.trim().length > 3 && password.length > 0), [email, mode, password]);

  async function submit() {
    setLoading(true); setError(null); setMessage(null);
    try {
      if (mode === "register") {
        const result = await authGateway.register({ name, email, password, remember });
        if (!result.ok) { setError("Проверьте имя, почту и пароль: пароль должен содержать не менее 8 символов."); return; }
        window.location.assign("/");
      } else if (mode === "login") {
        const result = await authGateway.login({ email, password, remember });
        if (!result.ok) {
          if (result.error === "blocked") window.location.assign("/blocked");
          else if (result.error === "unverified") window.location.assign("/verify-email");
          else setError("Неверная почта или пароль. Для демо используйте данные, указанные ниже.");
          return;
        }
        window.location.assign("/");
      } else if (mode === "forgot") {
        const result = await authGateway.requestPasswordReset(email);
        setMessage(`Демо-ссылка отправлена на ${result.delivery}. Можно открыть экран установки пароля.`);
      } else if (mode === "reset") {
        const result = await authGateway.resetPassword("fallback-token", nextPassword);
        setMessage(result.ok ? "Пароль изменён в fallback-сценарии. Теперь можно войти." : "Пароль должен содержать не менее 8 символов.");
      } else if (mode === "verify") {
        const result = await authGateway.verifyEmail(code);
        setMessage(result.ok ? "Почта подтверждена. Можно перейти ко входу." : "Введите код длиной не менее четырёх символов.");
      }
    } finally { setLoading(false); }
  }

  return <main className="auth-layout">
    <section className="auth-showcase">
      <Link className="auth-brand" href="/"><span className="brand-mark"><span /></span><strong>NEURODELO</strong></Link>
      <div><span className="auth-kicker"><Sparkles />OPEN-SOURCE ПРОСТРАНСТВО</span><h1>Вклад становится видимым.<br/>Герой развивается вместе с вами.</h1><p>Проекты, задачи, подтверждённые навыки, благодарности и игровая система — в одном локально проверяемом корпусе.</p></div>
      <div className="auth-trust"><span><ShieldCheck />Пароли не хранятся в localStorage</span><span><KeyRound />Fallback отключается одной переменной</span></div>
    </section>
    <section className="auth-card-wrap"><article className="auth-card panel">
      <div className="auth-icon">{mode === "blocked" ? <LockKeyhole /> : mode === "verify" ? <Mail /> : <KeyRound />}</div>
      <small>{info.eyebrow}</small><h2>{info.title}</h2><p>{info.text}</p>
      {mode === "register" ? <>
        <label className="auth-field"><span>Имя</span><div><Sparkles /><input name="name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} /></div></label>
        <label className="auth-field"><span>Почта</span><div><Mail /><input name="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div></label>
        <label className="auth-field"><span>Пароль</span><div><LockKeyhole /><input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" className="auth-password-toggle" aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"} title={showPassword ? "Скрыть пароль" : "Показать пароль"} onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
        <div className="auth-row"><label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />Запомнить вход</label><span>Минимум 8 символов</span></div>
        <button type="button" className="primary-button auth-submit" disabled={loading || name.trim().length < 2 || password.length < 8} onClick={submit}>{loading ? <LoaderCircle className="spin" /> : <Sparkles />}Создать аккаунт</button>
      </> : null}
      {mode === "login" ? <>
        <label className="auth-field"><span>Почта</span><div><Mail /><input name="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div></label>
        <label className="auth-field"><span>Пароль</span><div><LockKeyhole /><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" className="auth-password-toggle" aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"} title={showPassword ? "Скрыть пароль" : "Показать пароль"} onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
        <div className="auth-row"><label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />Запомнить меня</label><Link href="/forgot-password">Забыли пароль?</Link></div>
        <button type="button" className="primary-button auth-submit" disabled={!canSubmit || loading} onClick={submit}>{loading ? <LoaderCircle className="spin" /> : <KeyRound />}Войти</button>
        <button type="button" className="ghost-button auth-demo" onClick={() => { setEmail(authGateway.demoCredentials.email); setPassword(authGateway.demoCredentials.password); }}>Заполнить демо-данные</button>
        <div className="auth-demo-note"><strong>Демо-вход</strong><code>{authGateway.demoCredentials.email}</code><code>{authGateway.demoCredentials.password}</code></div><Link className="auth-back" href="/register"><Sparkles />Создать новый аккаунт</Link>
      </> : null}
      {mode === "forgot" ? <><label className="auth-field"><span>Почта</span><div><Mail /><input name="email" type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div></label><button type="button" className="primary-button auth-submit" onClick={submit} disabled={loading}>{loading ? <LoaderCircle className="spin" /> : <Mail />}Отправить ссылку</button></> : null}
      {mode === "reset" ? <><label className="auth-field"><span>Новый пароль</span><div><LockKeyhole /><input name="new-password" type="password" autoComplete="new-password" value={nextPassword} onChange={(e) => setNextPassword(e.target.value)} /></div></label><button type="button" className="primary-button auth-submit" onClick={submit} disabled={loading}>Установить пароль</button></> : null}
      {mode === "verify" ? <><label className="auth-field"><span>Код подтверждения</span><div><Mail /><input name="verification-code" autoComplete="one-time-code" inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value)} /></div></label><button type="button" className="primary-button auth-submit" onClick={submit} disabled={loading}>Подтвердить почту</button></> : null}
      {mode === "blocked" ? <div className="auth-state-box"><LockKeyhole /><strong>Причина в демо</strong><span>Подозрительная активность или решение модерации. Реальная разблокировка потребует серверной проверки.</span></div> : null}
      {mode === "expired" ? <Link className="primary-button auth-submit" href="/login"><KeyRound />Войти снова</Link> : null}
      {error ? <div className="auth-error">{error}</div> : null}{message ? <div className="auth-success"><CheckCircle2 />{message}</div> : null}
      {mode !== "login" && mode !== "register" ? <Link className="auth-back" href="/login"><ArrowLeft />Вернуться ко входу</Link> : null}{mode === "register" ? <Link className="auth-back" href="/login"><ArrowLeft />Уже есть аккаунт</Link> : null}
    </article></section>
  </main>;
}
