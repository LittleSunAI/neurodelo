"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Check, CircleX, CloudCog, Crop, Download, ImagePlus, LoaderCircle, Palette,
  RotateCcw, Save, ShieldCheck, Sparkles, Trash2, Upload, WandSparkles,
} from "lucide-react";
import { HeroAvatar } from "@/components/hero-avatar";
import { Badge, Progress, SectionTitle } from "@/components/ui/primitives";
import { usePlatform } from "@/components/platform-provider";
import { normalizeHeroImage, validateHeroImageFile } from "@/lib/image-processing";
import type {
  HeroImageBackground,
  HeroImageGenerationInput,
  HeroImageMood,
  HeroImagePreset,
  HeroImageVariant,
} from "@/types/platform";
import type { HeroImageProgress } from "@/services/hero-image-gateway";

type StudioTab = "generate" | "upload" | "history";

const presetLabels: Record<HeroImagePreset, string> = {
  cinematic: "Кино",
  anime: "Аниме",
  pixel: "Пиксель",
  illustration: "Иллюстрация",
  realistic: "Реализм",
};
const moodLabels: Record<HeroImageMood, string> = { calm: "Спокойный", focused: "Собранный", triumphant: "Победитель", mysterious: "Таинственный" };
const backgroundLabels: Record<HeroImageBackground, string> = { workshop: "Мастерская", space: "Космос", forest: "Лес", city: "Город", abstract: "Абстракция" };

export function HeroStudioView() {
  const {
    state, heroImageMode, generateHeroImage, addUploadedHeroImage,
    setActiveHeroImage, deleteHeroImage,
  } = usePlatform();
  const [tab, setTab] = useState<StudioTab>("generate");
  const [prompt, setPrompt] = useState("Уверенный создатель open-source проектов, технологичная одежда, дружелюбный образ");
  const [negativePrompt, setNegativePrompt] = useState("текст, логотип, лишние пальцы, двойное лицо");
  const [preset, setPreset] = useState<HeroImagePreset>("cinematic");
  const [mood, setMood] = useState<HeroImageMood>("focused");
  const [background, setBackground] = useState<HeroImageBackground>("workshop");
  const [progress, setProgress] = useState<HeroImageProgress | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [falQuota, setFalQuota] = useState<{ maxGenerations: number; usedGenerations: number; remainingGenerations: number; estimatedDailyLimitUsd: number; estimatedSpentUsd: number; remainingEstimatedUsd: number } | null>(null);
  const [generating, setGenerating] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState("Мой образ");
  const [zoom, setZoom] = useState(1);
  const [positionX, setPositionX] = useState(0);
  const [positionY, setPositionY] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const library = state.heroImages;
  const active = useMemo(() => library.variants.find((item) => item.id === library.activeImageId), [library]);

  useEffect(() => () => { abortRef.current?.abort(); }, []);
  useEffect(() => {
    if (heroImageMode !== "fal-api") return;
    let active = true;
    fetch("/api/v1/hero-images/quota", { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((quota) => { if (active && quota) setFalQuota(quota); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [heroImageMode, library.totalGenerated]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  async function startGeneration() {
    if (prompt.trim().length < 3) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setGenerationError(null);
    setGenerating(true);
    setProgress({ status: "queued", percent: 3, label: "Подготавливаем запрос" });
    const input: HeroImageGenerationInput = {
      prompt: prompt.trim(), negativePrompt: negativePrompt.trim(), preset, mood, background,
      palette: state.profile.hero.palette, classId: state.profile.heroProgression.classId,
    };
    try {
      await generateHeroImage(input, { signal: controller.signal, onProgress: setProgress });
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") setProgress({ status: "cancelled", percent: 0, label: "Генерация отменена" });
      else {
        setGenerationError(cause instanceof Error ? cause.message : "Не удалось создать образ");
        setProgress({ status: "failed", percent: 0, label: "Ошибка генерации" });
      }
    } finally {
      abortRef.current = null;
      setGenerating(false);
    }
  }

  function chooseFile(nextFile: File | null) {
    if (!nextFile) return;
    const error = validateHeroImageFile(nextFile);
    if (error) { setUploadError(error); return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setUploadTitle(nextFile.name.replace(/\.[^.]+$/, "") || "Мой образ");
    setUploadError(null);
    setZoom(1); setPositionX(0); setPositionY(0);
  }

  async function saveUpload() {
    if (!file) return;
    setUploading(true); setUploadError(null);
    try {
      const normalized = await normalizeHeroImage(file, { zoom, x: positionX, y: positionY });
      await addUploadedHeroImage({ ...normalized, title: uploadTitle });
      setTab("history");
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    } catch (cause) {
      setUploadError(cause instanceof Error ? cause.message : "Не удалось сохранить изображение");
    } finally { setUploading(false); }
  }

  function cancelGeneration() { abortRef.current?.abort(); }

  return <div className="view-stack hero-studio-view">
    <section className="panel hero-studio-hero">
      <div className="hero-studio-copy">
        <Badge tone="violet"><WandSparkles /> Студия образа</Badge>
        <h2>Создайте главный портрет героя</h2>
        <p>Составной герой остаётся безопасным запасным вариантом. Загруженный или сгенерированный портрет можно включить одной кнопкой и так же легко заменить.</p>
        <div className="hero-studio-stats"><span><strong>{library.variants.length}</strong> вариантов</span><span><strong>{library.totalGenerated}</strong> генераций</span><span><strong>{library.totalUploaded}</strong> загрузок</span></div>
      </div>
      <div className="hero-studio-current">
        <HeroAvatar config={state.profile.hero} level={state.profile.heroProgression.level} imageUrl={active?.imageUrl} imageAlt={`Герой ${state.profile.name}`} />
        <div><strong>{active?.title ?? "Составной герой"}</strong><span>{active ? sourceLabel(active) : "Встроенный редактор · всегда доступен"}</span></div>
      </div>
      <div className={`hero-provider-state ${heroImageMode}`}><CloudCog /><div><strong>{heroImageMode === "fallback" ? "Локальная имитация" : "fal.ai через сервер"}</strong><span>{heroImageMode === "fallback" ? "Не тратит деньги и не отправляет файлы наружу" : "Ключ хранится только на серверной стороне"}</span>{falQuota ? <small>Сегодня: {falQuota.usedGenerations}/{falQuota.maxGenerations} генераций · ${falQuota.estimatedSpentUsd.toFixed(2)} из ${falQuota.estimatedDailyLimitUsd.toFixed(2)}</small> : null}</div></div>
    </section>

    <div className="hero-studio-tabs panel">
      <button className={tab === "generate" ? "active" : ""} onClick={() => setTab("generate")}><Sparkles />Создать</button>
      <button className={tab === "upload" ? "active" : ""} onClick={() => setTab("upload")}><Upload />Загрузить</button>
      <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}><RotateCcw />История <span>{library.variants.length}</span></button>
    </div>

    {tab === "generate" ? <section className="hero-studio-grid">
      <article className="panel content-panel hero-generation-form">
        <SectionTitle eyebrow="Fallback сейчас · fal.ai позже" title="Новый образ через ИИ" action={<Badge tone={heroImageMode === "fallback" ? "warning" : "success"}>{heroImageMode}</Badge>} />
        <label className="wide-field"><span>Что должно быть в образе</span><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={800} /><small>{prompt.length}/800</small></label>
        <label className="wide-field"><span>Что исключить</span><input value={negativePrompt} onChange={(event) => setNegativePrompt(event.target.value)} /></label>
        <ChoiceRow title="Стиль" values={presetLabels} selected={preset} onSelect={(value) => setPreset(value as HeroImagePreset)} />
        <ChoiceRow title="Настроение" values={moodLabels} selected={mood} onSelect={(value) => setMood(value as HeroImageMood)} />
        <ChoiceRow title="Фон" values={backgroundLabels} selected={background} onSelect={(value) => setBackground(value as HeroImageBackground)} />
        {progress ? <div className={`hero-generation-progress status-${progress.status}`}><div><LoaderCircle className={progress.status === "generating" || progress.status === "queued" ? "spin" : ""}/><strong>{progress.label}</strong><span>{progress.percent}%</span></div><Progress value={progress.percent} /></div> : null}
        {generationError ? <div className="inline-error"><CircleX />{generationError}</div> : null}
        <div className="button-row"><button className="primary-button" onClick={startGeneration} disabled={generating || prompt.trim().length < 3}>{progress?.status === "generating" || progress?.status === "queued" ? <LoaderCircle className="spin" /> : <WandSparkles />}Создать вариант</button>{generating ? <button className="ghost-button" onClick={cancelGeneration}><CircleX />Отменить</button> : null}</div>
      </article>
      <aside className="panel hero-generation-preview"><HeroAvatar config={state.profile.hero} level={state.profile.heroProgression.level} imageUrl={active?.imageUrl}/><h3>{active?.title ?? "Предпросмотр героя"}</h3><p>Новый результат автоматически станет основным. Предыдущие варианты сохранятся в истории.</p><div className="safety-note"><ShieldCheck /><span>Профессиональные уровни и игровые характеристики не зависят от выбранной картинки.</span></div></aside>
    </section> : null}

    {tab === "upload" ? <section className="hero-studio-grid">
      <article className="panel content-panel hero-upload-panel">
        <SectionTitle eyebrow="JPG · PNG · WebP" title="Загрузить свою картинку" action={<Badge>До 5 МБ</Badge>} />
        {!previewUrl ? <label className="hero-dropzone"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} /><ImagePlus /><strong>Выберите изображение героя</strong><span>Файл будет локально уменьшен до 512×512 и сохранён в fallback-хранилище.</span></label> : <>
          <div className="hero-crop-stage"><div className="hero-crop-image" style={{ backgroundImage: `url(${JSON.stringify(previewUrl).slice(1, -1)})`, backgroundSize: `${zoom * 100}%`, backgroundPosition: `${50 + positionX / 2}% ${50 + positionY / 2}%` }} /><span className="crop-guide" /></div>
          <div className="crop-controls"><RangeControl icon={<Crop />} label="Масштаб" min={1} max={2.5} step={0.05} value={zoom} onChange={setZoom} /><RangeControl icon={<Palette />} label="Сдвиг по горизонтали" min={-100} max={100} step={1} value={positionX} onChange={setPositionX} /><RangeControl icon={<Palette />} label="Сдвиг по вертикали" min={-100} max={100} step={1} value={positionY} onChange={setPositionY} /></div>
          <label className="wide-field"><span>Название варианта</span><input value={uploadTitle} onChange={(event) => setUploadTitle(event.target.value)} maxLength={60} /></label>
          <div className="button-row"><button className="primary-button" onClick={saveUpload} disabled={uploading}>{uploading ? <LoaderCircle className="spin" /> : <Save />}Обрезать и сохранить</button><button className="ghost-button" onClick={() => { setFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}><Trash2 />Выбрать другой</button></div>
        </>}
        {uploadError ? <div className="inline-error"><CircleX />{uploadError}</div> : null}
      </article>
      <aside className="panel hero-upload-info"><Upload /><h3>Что происходит с файлом</h3><ol><li>Формат и размер проверяются в браузере.</li><li>Изображение обрезается в квадрат и сжимается.</li><li>В fallback-режиме оно остаётся только в локальном хранилище.</li><li>При настоящем backend файл будет загружаться в отдельное хранилище.</li></ol></aside>
    </section> : null}

    {tab === "history" ? <section className="panel content-panel">
      <SectionTitle eyebrow="Можно вернуть любой вариант" title="История образов" action={active ? <button className="ghost-button" onClick={() => setActiveHeroImage(undefined)}><RotateCcw />Составной герой</button> : <Badge tone="success"><Check />Составной герой активен</Badge>} />
      {library.variants.length ? <div className="hero-variant-grid">{library.variants.map((variant) => <VariantCard key={variant.id} variant={variant} active={variant.id === library.activeImageId} onActivate={() => setActiveHeroImage(variant.id)} onDelete={() => deleteHeroImage(variant.id)} />)}</div> : <div className="hero-empty-history"><ImagePlus /><h3>Сохранённых вариантов пока нет</h3><p>Создайте локальный fallback-образ или загрузите собственную картинку.</p><button className="primary-button" onClick={() => setTab("generate")}>Создать первый вариант</button></div>}
      {library.generationHistory.length ? <div className="generation-history"><h3>Журнал генераций</h3>{library.generationHistory.slice(0, 8).map((item) => <article key={item.id}><span className={`job-dot ${item.status}`}/><div><strong>{item.prompt}</strong><small>{item.provider} · {new Date(item.createdAt).toLocaleString("ru-RU")}</small></div><Badge tone={item.status === "ready" ? "success" : item.status === "failed" ? "danger" : "warning"}>{item.status}</Badge></article>)}</div> : null}
    </section> : null}
  </div>;
}

function sourceLabel(variant: HeroImageVariant) {
  if (variant.source === "upload") return "Загружено пользователем";
  if (variant.source === "fal") return `fal.ai · ${variant.modelId ?? "модель"}`;
  if (variant.source === "fallback") return "Локальная fallback-генерация";
  return "Составной герой";
}

function ChoiceRow({ title, values, selected, onSelect }: { title: string; values: Record<string, string>; selected: string; onSelect: (value: string) => void }) {
  return <div className="hero-choice-row"><strong>{title}</strong><div>{Object.entries(values).map(([value, label]) => <button key={value} className={selected === value ? "selected" : ""} onClick={() => onSelect(value)}>{label}</button>)}</div></div>;
}

function RangeControl({ icon, label, value, min, max, step, onChange }: { icon: ReactNode; label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return <label className="range-control"><span>{icon}<strong>{label}</strong><em>{value.toFixed(step < 1 ? 2 : 0)}</em></span><input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))}/></label>;
}

function VariantCard({ variant, active, onActivate, onDelete }: { variant: HeroImageVariant; active: boolean; onActivate: () => void; onDelete: () => void }) {
  return <article className={`hero-variant-card ${active ? "active" : ""}`}>
    <div className="hero-variant-image" role="img" aria-label={variant.title} style={{ backgroundImage: `url(${JSON.stringify(variant.imageUrl).slice(1, -1)})` }}>{active ? <Badge tone="success"><Check />Основной</Badge> : null}</div>
    <div className="hero-variant-body"><strong>{variant.title}</strong><span>{sourceLabel(variant)}</span><small>{new Date(variant.createdAt).toLocaleString("ru-RU")} · {variant.width}×{variant.height}</small></div>
    <div className="hero-variant-actions"><button className="primary-button" onClick={onActivate} disabled={active}>{active ? <Check /> : <Download />}{active ? "Используется" : "Выбрать"}</button><button className="icon-button" onClick={onDelete} aria-label={`Удалить ${variant.title}`}><Trash2 /></button></div>
  </article>;
}
