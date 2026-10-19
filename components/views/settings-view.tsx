"use client";

import { useMemo, useRef, useState } from "react";
import { Bell, CheckCircle2, Download, Eye, FileUp, KeyRound, Laptop, LogOut, Mail, MonitorCog, Save, Shield, ShieldAlert, Smartphone, Trash2, UserRound, XCircle } from "lucide-react";
import { usePlatform } from "@/components/platform-provider";
import { Badge, SectionTitle } from "@/components/ui/primitives";
import type { ContactPermission, PlatformPreferences, ProfileVisibility, TextScale, ThemeMode } from "@/types/platform";
import { downloadPortableData, importPortableDataFile } from "@/services/storage-gateway";

type SettingsTab = "account" | "profile" | "privacy" | "notifications" | "appearance" | "security";
const tabs: Array<{ id: SettingsTab; label: string; icon: typeof UserRound }> = [
  { id: "account", label: "Аккаунт", icon: UserRound },
  { id: "profile", label: "Профиль", icon: Eye },
  { id: "privacy", label: "Приватность", icon: Shield },
  { id: "notifications", label: "Уведомления", icon: Bell },
  { id: "appearance", label: "Интерфейс", icon: MonitorCog },
  { id: "security", label: "Безопасность", icon: KeyRound },
];

export function SettingsView() {
  const { state, updateProfile, updatePreferences, authSession, securityDevices, logout, changePassword, revokeDevice, revokeOtherDevices, exportLocalData, deleteLocalAccount, blockCommunityUser, sendTestEmail, requestBrowserNotifications, saving, mode } = usePlatform();
  const { profile, preferences } = state;
  const [tab, setTab] = useState<SettingsTab>("account");
  const [name, setName] = useState(profile.name);
  const [nickname, setNickname] = useState(profile.nickname);
  const [bio, setBio] = useState(profile.bio);
  const [website, setWebsite] = useState(profile.website);
  const [github, setGithub] = useState(profile.github);
  const [telegram, setTelegram] = useState(profile.telegram);
  const [currentPassword, setCurrentPassword] = useState("Demo123!");
  const [nextPassword, setNextPassword] = useState("");
  const [passwordResult, setPasswordResult] = useState<string | null>(null);
  const [dangerOpen, setDangerOpen] = useState(false);
  const [notificationTestResult, setNotificationTestResult] = useState<string | null>(null);
  const [dataTransferResult, setDataTransferResult] = useState<string | null>(null);
  const [dataTransferBusy, setDataTransferBusy] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);
  const initials = useMemo(() => profile.name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(), [profile.name]);

  async function saveAccount() {
    await updateProfile({ name: name.trim(), nickname: nickname.trim(), publicProfileSlug: nickname.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-") });
  }
  async function saveProfile() { await updateProfile({ bio, website, github, telegram }); }
  async function updatePrivacy(patch: Partial<PlatformPreferences["privacy"]>) { await updatePreferences({ privacy: { ...preferences.privacy, ...patch } }); }
  async function updateNotifications(patch: Partial<PlatformPreferences["notifications"]>) { await updatePreferences({ notifications: { ...preferences.notifications, ...patch } }); }
  async function updateAppearance(patch: Partial<PlatformPreferences["appearance"]>) { await updatePreferences({ appearance: { ...preferences.appearance, ...patch } }); }
  async function downloadExport() {
    setDataTransferBusy(true); setDataTransferResult(null);
    try {
      let blob: Blob;
      try { blob = await downloadPortableData(); }
      catch { blob = new Blob([exportLocalData()], { type: "application/json" }); }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `neurodelo-${profile.nickname}-export.json`; anchor.click();
      URL.revokeObjectURL(url);
      setDataTransferResult("Экспорт подготовлен. Контрольная сумма включена в серверный формат.");
    } catch (cause) {
      setDataTransferResult(cause instanceof Error ? cause.message : "Не удалось экспортировать данные");
    } finally { setDataTransferBusy(false); }
  }
  async function importExportFile(file: File | undefined) {
    if (!file) return;
    setDataTransferBusy(true); setDataTransferResult(null);
    try {
      const preview = await importPortableDataFile(file, true);
      const confirmed = window.confirm(`Импортировать профиль @${preview.summary.nickname}, ${preview.summary.projects} проектов и ${preview.summary.notifications} уведомлений? Текущее локальное состояние будет заменено.`);
      if (!confirmed) { setDataTransferResult("Импорт отменён после безопасной предварительной проверки."); return; }
      await importPortableDataFile(file, false);
      setDataTransferResult("Импорт завершён. Страница будет перезагружена.");
      window.setTimeout(() => window.location.reload(), 500);
    } catch (cause) {
      setDataTransferResult(cause instanceof Error ? cause.message : "Не удалось импортировать данные");
    } finally { setDataTransferBusy(false); if (importRef.current) importRef.current.value = ""; }
  }
  async function submitPassword() {
    const result = await changePassword(currentPassword, nextPassword);
    setPasswordResult(result.ok ? "Пароль изменён в локальном серверном хранилище." : result.error ?? "Не удалось изменить пароль.");
    if (result.ok) setNextPassword("");
  }

  return <div className="settings-page view-stack">
    <article className="panel settings-hero">
      <div><Badge tone="violet"><Shield />Центр управления</Badge><h2>Настройки аккаунта и профиля</h2><p>Профиль хранится локально, а аккаунт и email уже проходят через защищённые серверные маршруты `/api/v1`.</p></div>
      <div className="settings-account-summary"><span>{initials}</span><div><strong>{profile.name}</strong><small>{authSession.email ?? "demo@neurodelo.local"}</small></div><Badge tone={mode === "fallback" ? "warning" : "success"}>{mode === "fallback" ? "Fallback" : "API"}</Badge></div>
    </article>

    <div className="settings-layout">
      <aside className="panel settings-nav">{tabs.map(({ id, label, icon: Icon }) => <button className={tab === id ? "active" : ""} key={id} onClick={() => setTab(id)}><Icon />{label}</button>)}</aside>
      <section className="panel content-panel settings-content">
        {tab === "account" ? <>
          <SectionTitle eyebrow="Основные данные" title="Аккаунт" action={<Badge tone="success"><CheckCircle2 />Сессия активна</Badge>} />
          <div className="form-grid two"><label><span>Имя</span><input value={name} onChange={(e) => setName(e.target.value)} /></label><label><span>Ник</span><input value={nickname} onChange={(e) => setNickname(e.target.value)} /></label><label><span>Почта</span><input value={authSession.email ?? "demo@neurodelo.local"} disabled /></label><label><span>Публичный адрес</span><input value={`/u/${profile.publicProfileSlug}`} disabled /></label></div>
          <div className="button-row"><button className="primary-button" onClick={saveAccount} disabled={saving || name.trim().length < 2}><Save />Сохранить</button><a className="ghost-button" href={`/u/${profile.publicProfileSlug}`}><Eye />Открыть публичный профиль</a></div>
          <div className="settings-divider" />
          <SectionTitle eyebrow="Данные пользователя" title="Экспорт и удаление" />
          <input ref={importRef} className="sr-only" type="file" accept="application/json,.json" onChange={(event) => void importExportFile(event.target.files?.[0])} />
          <div className="danger-grid"><button className="settings-action-card" onClick={() => void downloadExport()} disabled={dataTransferBusy}><Download /><div><strong>Экспортировать данные</strong><span>Скачать подписанный контрольной суммой переносимый JSON-пакет.</span></div></button><button className="settings-action-card" onClick={() => importRef.current?.click()} disabled={dataTransferBusy}><FileUp /><div><strong>Импортировать данные</strong><span>Предварительно проверить пакет и восстановить профиль, проекты и настройки.</span></div></button><button className="settings-action-card danger" onClick={() => setDangerOpen(true)}><Trash2 /><div><strong>Удалить локальный аккаунт</strong><span>Очистить fallback-сессию и локальные данные этого прототипа.</span></div></button></div>
          {dataTransferResult ? <div className="inline-success" role="status"><CheckCircle2 />{dataTransferResult}</div> : null}
          {dangerOpen ? <div className="danger-confirm"><ShieldAlert /><div><strong>Удалить локальные данные?</strong><span>Это действие очищает только данные прототипа в браузере.</span></div><button className="ghost-button" onClick={() => setDangerOpen(false)}>Отмена</button><button className="primary-button danger-button" onClick={deleteLocalAccount}>Удалить</button></div> : null}
        </> : null}

        {tab === "profile" ? <>
          <SectionTitle eyebrow="То, что видят другие" title="Личная и публичная страницы" />
          <label className="wide-field"><span>О себе</span><textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={420} /><small>{bio.length}/420</small></label>
          <div className="form-grid two"><label><span>Сайт</span><input value={website} onChange={(e) => setWebsite(e.target.value)} /></label><label><span>GitHub</span><input value={github} onChange={(e) => setGithub(e.target.value)} /></label><label><span>Telegram</span><input value={telegram} onChange={(e) => setTelegram(e.target.value)} /></label><label><span>Языки</span><input value={profile.spokenLanguages.join(", ")} onChange={(e) => updateProfile({ spokenLanguages: e.target.value.split(",").map(v => v.trim()).filter(Boolean) })} /></label></div>
          <div className="chip-editor"><strong>Интересы</strong><div>{profile.interests.map((item) => <span key={item}>{item}</span>)}</div></div>
          <div className="button-row"><button className="primary-button" onClick={saveProfile}><Save />Сохранить профиль</button><a className="ghost-button" href={`/u/${profile.publicProfileSlug}`}><Eye />Предпросмотр</a></div>
        </> : null}

        {tab === "privacy" ? <>
          <SectionTitle eyebrow="Контроль видимости" title="Приватность" />
          <SelectSetting label="Видимость профиля" value={preferences.privacy.profileVisibility} values={[['public','Всем'],['community','Только сообществу'],['private','Только мне']]} onChange={(value) => updatePrivacy({ profileVisibility: value as ProfileVisibility })} />
          <SelectSetting label="Кто может писать" value={preferences.privacy.messagePermission} values={[['everyone','Все'],['community','Участники сообщества'],['nobody','Никто']]} onChange={(value) => updatePrivacy({ messagePermission: value as ContactPermission })} />
          <SelectSetting label="Кто может приглашать" value={preferences.privacy.invitePermission} values={[['everyone','Все'],['community','Участники сообщества'],['nobody','Никто']]} onChange={(value) => updatePrivacy({ invitePermission: value as ContactPermission })} />
          <ToggleSetting label="Показывать благодарности" text="Публичные слова поддержки будут видны на странице." checked={preferences.privacy.showThanks} onChange={(value) => updatePrivacy({ showThanks: value })} />
          <ToggleSetting label="Показывать активность" text="Отображать принятые вклады и последние события." checked={preferences.privacy.showActivity} onChange={(value) => updatePrivacy({ showActivity: value })} />
          <ToggleSetting label="Показывать историю боёв" text="Игровая история не влияет на профессиональный уровень." checked={preferences.privacy.showBattleHistory} onChange={(value) => updatePrivacy({ showBattleHistory: value })} />
          <ToggleSetting label="Разрешить поиск профиля" text="Профиль появится в каталоге участников." checked={preferences.privacy.searchable} onChange={(value) => updatePrivacy({ searchable: value })} />
          <div className="blocked-list"><strong>Заблокированные пользователи</strong>{preferences.privacy.blockedUserIds.length === 0 ? <span>Список пуст. Заблокировать человека можно в меню личного чата.</span> : <div className="blocked-users">{preferences.privacy.blockedUserIds.map((userId) => { const participant = state.community.participants.find((item) => item.id === userId); return <button key={userId} onClick={() => void blockCommunityUser(userId)}><span className="chat-avatar">{participant?.initials ?? "?"}</span><div><strong>{participant?.name ?? userId}</strong><small>Сообщения отключены</small></div><em>Разблокировать</em></button>; })}</div>}</div>
        </> : null}

        {tab === "notifications" ? <>
          <SectionTitle eyebrow="Не пропустить важное" title="Уведомления" />
          <ToggleSetting label="Новые сообщения" text="Личные и командные чаты." checked={preferences.notifications.messages} onChange={(value) => updateNotifications({ messages: value })} />
          <ToggleSetting label="Приглашения в проекты" text="Новые роли и предложения команд." checked={preferences.notifications.projectInvites} onChange={(value) => updateNotifications({ projectInvites: value })} />
          <ToggleSetting label="Ревью вклада" text="Комментарии и запросы изменений." checked={preferences.notifications.contributionReviews} onChange={(value) => updateNotifications({ contributionReviews: value })} />
          <ToggleSetting label="Вклад принят" text="Pull Request или другой результат принят проектом." checked={preferences.notifications.pullRequestAccepted} onChange={(value) => updateNotifications({ pullRequestAccepted: value })} />
          <ToggleSetting label="Благодарности" text="Публичное спасибо или официальная награда." checked={preferences.notifications.thanksReceived} onChange={(value) => updateNotifications({ thanksReceived: value })} />
          <ToggleSetting label="Повышение уровня" text="Профессиональный или игровой уровень." checked={preferences.notifications.levelUp} onChange={(value) => updateNotifications({ levelUp: value })} />
          <SelectSetting label="Почтовая сводка" value={preferences.notifications.emailDigest} values={[['off','Выключена'],['daily','Ежедневно'],['weekly','Раз в неделю']]} onChange={(value) => updateNotifications({ emailDigest: value as PlatformPreferences['notifications']['emailDigest'] })} />          <ToggleSetting label="Транзакционные письма" text="Подтверждение почты, восстановление пароля и важные изменения аккаунта." checked={preferences.notifications.emailTransactional} onChange={(value) => updateNotifications({ emailTransactional: value })} />
          <ToggleSetting label="Оповещения безопасности" text="Новый вход, изменение пароля и действия модерации." checked={preferences.notifications.emailSecurityAlerts} onChange={(value) => updateNotifications({ emailSecurityAlerts: value })} />
          <ToggleSetting label="Уведомления браузера" text="Показывать разрешённые уведомления, когда вкладка не активна." checked={preferences.notifications.browserNotifications} onChange={(value) => updateNotifications({ browserNotifications: value })} />
          <div className="button-row"><button className="ghost-button" onClick={async () => { const result = await sendTestEmail(); setNotificationTestResult(result.ok ? result.provider === "preview" ? `Preview готов: ${result.preview ?? "локальный режим"}` : "Тестовое письмо отправлено." : result.error ?? "Не удалось отправить письмо."); }}><Mail />Проверить email</button><button className="ghost-button" onClick={async () => { const permission = await requestBrowserNotifications(); setNotificationTestResult(permission === "granted" ? "Уведомления браузера включены." : permission === "unsupported" ? "Браузер не поддерживает уведомления." : "Разрешение не выдано."); }}><Bell />Разрешить в браузере</button></div>
          {notificationTestResult ? <div className="inline-success" role="status"><CheckCircle2 />{notificationTestResult}</div> : null}

        </> : null}

        {tab === "appearance" ? <>
          <SectionTitle eyebrow="Доступность" title="Интерфейс" />
          <SelectSetting label="Тема" value={preferences.appearance.theme} values={[['dark','Тёмная'],['light','Светлая'],['system','Как в системе']]} onChange={(value) => updateAppearance({ theme: value as ThemeMode })} />
          <SelectSetting label="Размер текста" value={preferences.appearance.textScale} values={[['compact','Компактный'],['normal','Обычный'],['large','Крупный']]} onChange={(value) => updateAppearance({ textScale: value as TextScale })} />
          <ToggleSetting label="Уменьшить анимации" text="Для чувствительности к движению и слабых устройств." checked={preferences.appearance.reduceMotion} onChange={(value) => updateAppearance({ reduceMotion: value })} />
          <ToggleSetting label="Повышенный контраст" text="Усилить границы и читаемость элементов." checked={preferences.appearance.highContrast} onChange={(value) => updateAppearance({ highContrast: value })} />
          <div className="appearance-preview"><span className="brand-mark"><span /></span><div><strong>Предпросмотр оформления</strong><small>Тема, масштаб текста, контраст и уменьшение движения применяются ко всему интерфейсу сразу.</small></div></div>
        </> : null}

        {tab === "security" ? <>
          <SectionTitle eyebrow="Сессии и пароль" title="Безопасность" action={<Badge tone="success">Signed session</Badge>} />
          <div className="form-grid two"><label><span>Текущий пароль</span><input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></label><label><span>Новый пароль</span><input type="password" value={nextPassword} onChange={(e) => setNextPassword(e.target.value)} placeholder="10+ символов, регистр и цифра" /></label></div>
          <div className="button-row"><button className="primary-button" onClick={submitPassword} disabled={nextPassword.length < 10}><KeyRound />Сменить пароль</button><button className="ghost-button" onClick={logout}><LogOut />Выйти</button></div>
          {passwordResult ? <div className="inline-success"><CheckCircle2 />{passwordResult}</div> : null}
          <div className="settings-divider" />
          <SectionTitle eyebrow="Активные входы" title="Устройства" action={<button className="text-button" onClick={revokeOtherDevices}>Завершить остальные</button>} />
          <div className="device-list">{securityDevices.map((device) => <article key={device.id}>{device.name.includes("Android") ? <Smartphone /> : <Laptop />}<div><strong>{device.name}</strong><span>{device.browser} · {device.location} · {device.lastActiveAt}</span></div>{device.current ? <Badge tone="success">Текущее</Badge> : <button className="icon-button" onClick={() => revokeDevice(device.id)} aria-label="Завершить сессию"><XCircle /></button>}</article>)}</div>
          <div className="security-placeholder"><Shield /><div><strong>Двухфакторная авторизация</strong><span>Интерфейс и API-контракт будут готовы следующим проходом безопасности. Настоящие секреты нельзя хранить в браузере.</span></div><button className="ghost-button" disabled>Подключить позже</button></div>
          <div className="login-history"><strong>История входов</strong>{state.loginHistory.map((event) => <article key={event.id}><span className={event.result === "success" ? "ok" : "fail"} /><div><strong>{event.device}</strong><small>{event.location} · {event.createdAt}</small></div><Badge tone={event.result === "success" ? "success" : "danger"}>{event.result === "success" ? "Успешно" : "Отклонено"}</Badge></article>)}</div>
        </> : null}
      </section>
    </div>
  </div>;
}

function ToggleSetting({ label, text, checked, onChange }: { label: string; text: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="settings-toggle-row"><div><strong>{label}</strong><span>{text}</span></div><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /></label>;
}
function SelectSetting({ label, value, values, onChange }: { label: string; value: string; values: string[][]; onChange: (value: string) => void }) {
  return <div className="settings-select-row"><strong>{label}</strong><div>{values.map(([id, title]) => <button className={value === id ? "selected" : ""} key={id} onClick={() => onChange(id)}>{title}</button>)}</div></div>;
}
