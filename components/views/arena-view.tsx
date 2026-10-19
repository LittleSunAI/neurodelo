"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Backpack,
  Bot,
  CheckCircle2,
  ChevronUp,
  CircleGauge,
  Clock3,
  Crown,
  Dumbbell,
  Gamepad2,
  Gem,
  Gift,
  Info,
  LockKeyhole,
  Medal,
  Network,
  PackageCheck,
  ListOrdered,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Users,
  WandSparkles,
  Zap,
} from "lucide-react";
import { HeroAvatar } from "@/components/hero-avatar";
import { usePlatform } from "@/components/platform-provider";
import { Badge, Progress } from "@/components/ui/primitives";
import {
  equipmentCatalog,
  getEffectiveStats,
  getProgressionBonuses,
  heroClassDefinitions,
  skillTreeDefinitions,
} from "@/services/game-gateway";
import type {
  BattleResult,
  GameEquipmentSlot,
  GameItemRarity,
  HeroClassId,
  HeroStatId,
  TeamBattleResult,
} from "@/types/platform";

type ArenaTab = "overview" | "inventory" | "skills" | "challenges" | "ranking" | "teams" | "history";

const statLabels: Record<HeroStatId, { title: string; text: string }> = {
  vitality: { title: "Живучесть", text: "Запас сил героя" },
  power: { title: "Сила", text: "Мощность действий" },
  defense: { title: "Защита", text: "Снижение давления" },
  speed: { title: "Скорость", text: "Очередность и инициатива" },
  focus: { title: "Фокус", text: "Точность способностей" },
};

const slotLabels: Record<GameEquipmentSlot, string> = {
  weapon: "Инструмент",
  armor: "Защита",
  charm: "Артефакт",
  companion: "Спутник",
};

const rarityLabels: Record<GameItemRarity, string> = {
  common: "Обычный",
  rare: "Редкий",
  epic: "Эпический",
  legendary: "Легендарный",
};

function BattleLog({ item }: { item: BattleResult | TeamBattleResult }) {
  return <ol className="battle-action-log">{(item.actionLog ?? []).map((line, index) => <li key={`${item.id}-${index}`}><span>{index + 1}</span>{line}</li>)}</ol>;
}

export function ArenaView() {
  const {
    state,
    selectHeroClass,
    allocateHeroStat,
    runTrainingBattle,
    runRankedBattle,
    runTeamBattle,
    equipHeroItem,
    unlockHeroSkill,
    claimGameChallenge,
    gameMode,
    saving,
  } = usePlatform();
  const progression = state.profile.heroProgression;
  const activeHeroImage = state.heroImages.variants.find((item) => item.id === state.heroImages.activeImageId);
  const teamBattlesEnabled = state.moderation.featureFlags.find((item) => item.id === "flag-team-battles")?.enabled !== false;
  const [tab, setTab] = useState<ArenaTab>("overview");
  const [lastResult, setLastResult] = useState<BattleResult | TeamBattleResult | null>(null);
  const [notice, setNotice] = useState("");
  const bonuses = useMemo(() => getProgressionBonuses(progression), [progression]);
  const effectiveStats = useMemo(() => getEffectiveStats(progression), [progression]);
  const currentRank = state.game.leaderboard.find((entry) => entry.isCurrentUser)?.rank ?? progression.season.rank;

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 1800);
  }

  async function chooseClass(classId: HeroClassId) {
    await selectHeroClass(classId);
    flash("Класс и итоговый рейтинг пересчитаны игровым адаптером.");
  }

  async function battle(mode: "training" | "ranked" | "team") {
    const result = mode === "training" ? await runTrainingBattle() : mode === "ranked" ? await runRankedBattle() : await runTeamBattle();
    setLastResult(result);
  }

  return <div className="view-stack">
    <section className="arena-hero panel">
      <div className="arena-copy">
        <Badge tone="violet"><Gamepad2 /> Расширенная игровая основа</Badge>
        <h2>Герой получает класс, экипировку, навыки и сезонный путь</h2>
        <p>Игровая система отделена от профессиональной репутации. Её формулы, каталоги и результаты проходят через game-gateway, поэтому будущую систему из другой игры можно подключить без переписывания страниц.</p>
        <div className="arena-mode-line"><span><Bot />Движок: {gameMode === "fallback" ? "advanced-foundation-v2" : "внешний API"}</span><span><LockKeyhole />Без ставок и денежных наград</span><span><Clock3 />Сезон до {state.game.seasonEndsAt}</span></div>
      </div>
      <div className="arena-avatar"><HeroAvatar config={state.profile.hero} level={progression.level} imageUrl={activeHeroImage?.imageUrl} /><div><strong>{state.profile.name}</strong><span>{heroClassDefinitions[progression.classId].title} · рейтинг {progression.battleRating}</span><Progress value={(progression.xp / progression.xpToNext) * 100} label={`${progression.xp} / ${progression.xpToNext} XP`} /><small>Место #{currentRank} · {state.game.seasonPoints} сезонных очков</small></div></div>
    </section>

    <nav className="arena-tabs panel" aria-label="Разделы игровой системы">
      {([
        ["overview", "Герой", CircleGauge], ["inventory", "Инвентарь", Backpack], ["skills", "Навыки", Network],
        ["challenges", "Испытания", Target], ["ranking", "Рейтинг", ListOrdered], ...(teamBattlesEnabled ? [["teams", "Команды", Users] as const] : []), ["history", "История", Clock3],
      ] as const).map(([id, label, Icon]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><Icon />{label}</button>)}
    </nav>

    {notice ? <div className="inline-success"><CheckCircle2 />{notice}</div> : null}

    {tab === "overview" ? <>
      <section className="panel content-panel">
        <div className="section-title"><div><p>Базовая специализация</p><h2>Класс героя</h2></div><Badge tone="warning">В прототипе класс можно менять</Badge></div>
        <div className="hero-class-grid">{(Object.entries(heroClassDefinitions) as Array<[HeroClassId, typeof heroClassDefinitions[HeroClassId]]>).map(([id, item]) => <button className={`${progression.classId === id ? "selected" : ""} class-${item.accent}`} key={id} onClick={() => chooseClass(id)}><span className="class-icon">{id === "guardian" ? <Shield /> : id === "technomancer" ? <Zap /> : id === "pathfinder" ? <Activity /> : <CircleGauge />}</span><Badge tone={progression.classId === id ? "success" : "default"}>{progression.classId === id ? "Выбран" : "Класс"}</Badge><h3>{item.title}</h3><strong>{item.subtitle}</strong><p>{item.description}</p><div>{Object.entries(item.baseStats).map(([stat, value]) => <span key={stat}>{statLabels[stat as HeroStatId].title}: {value}</span>)}</div></button>)}</div>
      </section>

      <div className="arena-layout">
        <section className="panel content-panel">
          <div className="section-title"><div><p>Распределение очков</p><h2>Характеристики героя</h2></div><Badge tone="violet">Свободно: {progression.unspentPoints}</Badge></div>
          <div className="hero-stat-list">{(Object.keys(statLabels) as HeroStatId[]).map((stat) => <article key={stat}><div><strong>{statLabels[stat].title}</strong><span>{statLabels[stat].text}{bonuses.stats[stat] ? ` · бонус +${bonuses.stats[stat]}` : ""}</span></div><Progress value={Math.min(100, effectiveStats[stat] * 7)} /><b>{effectiveStats[stat]}</b><button className="stat-up-button" disabled={saving || progression.unspentPoints < 1} onClick={() => allocateHeroStat(stat)} aria-label={`Повысить ${statLabels[stat].title}`}><ChevronUp /></button></article>)}</div>
          <div className="game-adapter-note"><Info /><div><strong>Итоговый рейтинг складывается из нескольких слоёв</strong><span>Базовые характеристики + распределённые очки + экипировка + открытые узлы класса. Интерфейс показывает результат, а расчёт остаётся внутри адаптера.</span></div></div>
        </section>

        <aside className="view-stack">
          <section className="panel battle-card"><div className="battle-card-head"><Swords /><div><small>Быстрый бой</small><strong>Выберите режим</strong></div></div><div className="battle-rating"><span><Crown />Ваш рейтинг</span><strong>{progression.battleRating}</strong></div><div className="battle-stats-mini"><span>Победы <strong>{progression.season.wins}</strong></span><span>Поражения <strong>{progression.season.losses}</strong></span><span>Лига <strong>{progression.season.tier}</strong></span></div><div className="battle-mode-buttons"><button className="ghost-button full" disabled={saving} onClick={() => battle("training")}><Dumbbell />Тренировка</button><button className="primary-button full" disabled={saving} onClick={() => battle("ranked")}><Trophy />Рейтинг</button></div><small>Рейтинговый бой меняет сезонные очки, но не профессиональную репутацию.</small></section>
          <section className="panel season-card"><Medal /><div><small>{progression.season.title}</small><strong>Место #{currentRank}</strong><span>{progression.season.tier} · {state.game.seasonPoints} очков</span></div></section>
        </aside>
      </div>
    </> : null}

    {tab === "inventory" ? <section className="panel content-panel">
      <div className="section-title"><div><p>Сменная боевая сборка</p><h2>Инвентарь и экипировка</h2></div><Badge tone="violet">{progression.ownedItemIds.length} предметов</Badge></div>
      <div className="equipment-slots">{(["weapon", "armor", "charm", "companion"] as GameEquipmentSlot[]).map((slot) => { const item = equipmentCatalog.find((entry) => entry.id === progression.equipment[`${slot}Id`]); return <article key={slot}><span>{slot === "weapon" ? <WandSparkles /> : slot === "armor" ? <Shield /> : slot === "charm" ? <Gem /> : <Bot />}</span><small>{slotLabels[slot]}</small><strong>{item?.title ?? "Не выбрано"}</strong><em>{item ? `+${item.ratingBonus} рейтинга` : "Слот свободен"}</em></article>; })}</div>
      <div className="inventory-grid">{equipmentCatalog.map((item) => { const owned = progression.ownedItemIds.includes(item.id); const equipped = progression.equipment[`${item.slot}Id`] === item.id; const lockedByLevel = progression.level < item.requiredLevel; return <article key={item.id} className={`inventory-item rarity-${item.rarity} ${equipped ? "equipped" : ""}`}><div className="inventory-icon">{item.slot === "weapon" ? <WandSparkles /> : item.slot === "armor" ? <Shield /> : item.slot === "charm" ? <Gem /> : <Bot />}</div><div><Badge tone={item.rarity === "legendary" ? "warning" : item.rarity === "epic" ? "violet" : item.rarity === "rare" ? "success" : "default"}>{rarityLabels[item.rarity]}</Badge><h3>{item.title}</h3><p>{item.description}</p><div className="item-bonuses">{Object.entries(item.statBonuses).map(([stat, value]) => <span key={stat}>{statLabels[stat as HeroStatId].title} {Number(value) >= 0 ? "+" : ""}{value}</span>)}<span>Рейтинг +{item.ratingBonus}</span></div></div><button className={equipped ? "ghost-button" : "primary-button"} disabled={!owned || lockedByLevel || saving} onClick={async () => { await equipHeroItem(item.id); flash(`${item.title} установлен в слот «${slotLabels[item.slot]}».`); }}>{equipped ? "Надето" : !owned ? "Не получено" : lockedByLevel ? `Уровень ${item.requiredLevel}` : "Экипировать"}</button></article>; })}</div>
    </section> : null}

    {tab === "skills" ? <section className="panel content-panel">
      <div className="section-title"><div><p>Сменная система прокачки</p><h2>Дерево навыков</h2></div><Badge tone="violet">Очки навыков: {progression.skillPoints}</Badge></div>
      <div className="skill-tree-grid">{skillTreeDefinitions.filter((node) => node.classId === "all" || node.classId === progression.classId).map((node) => { const unlocked = progression.unlockedSkillNodeIds.includes(node.id); const requirementMet = !node.requires || progression.unlockedSkillNodeIds.includes(node.requires); return <article key={node.id} className={unlocked ? "unlocked" : ""}><span className="skill-node-icon">{node.classId === "all" ? <Sparkles /> : <Zap />}</span><div><Badge tone={unlocked ? "success" : "default"}>{unlocked ? "Открыт" : `${node.cost} очк.`}</Badge><h3>{node.title}</h3><p>{node.description}</p><div className="item-bonuses">{Object.entries(node.statBonuses).map(([stat, value]) => <span key={stat}>{statLabels[stat as HeroStatId].title} +{value}</span>)}<span>Рейтинг +{node.ratingBonus}</span></div>{node.requires ? <small>Требуется: {skillTreeDefinitions.find((item) => item.id === node.requires)?.title}</small> : null}</div><button className={unlocked ? "ghost-button" : "primary-button"} disabled={unlocked || !requirementMet || progression.skillPoints < node.cost || saving} onClick={async () => { await unlockHeroSkill(node.id); flash(`Навык «${node.title}» открыт.`); }}>{unlocked ? "Изучено" : !requirementMet ? "Закрыто" : "Изучить"}</button></article>; })}</div>
    </section> : null}

    {tab === "challenges" ? <section className="panel content-panel">
      <div className="section-title"><div><p>Игровые задания</p><h2>Ежедневные и сезонные испытания</h2></div><Badge tone="warning">Обновление: {state.game.lastDailyRefreshAt}</Badge></div>
      <div className="challenge-grid">{state.game.challenges.map((challenge) => <article key={challenge.id} className={challenge.completed ? "completed" : ""}><div className="challenge-head"><span>{challenge.period === "daily" ? <Clock3 /> : challenge.period === "weekly" ? <Target /> : <Crown />}</span><div><Badge tone={challenge.period === "season" ? "warning" : challenge.period === "weekly" ? "violet" : "default"}>{challenge.period === "daily" ? "Ежедневное" : challenge.period === "weekly" ? "Недельное" : "Сезонное"}</Badge><h3>{challenge.title}</h3></div></div><p>{challenge.summary}</p><Progress value={(challenge.progress / challenge.target) * 100} label={`${challenge.progress} / ${challenge.target}`} /><div className="challenge-rewards"><span><Sparkles />+{challenge.rewardHeroXp} XP</span><span><Gift />+{challenge.rewardCommunityPoints} искр</span>{challenge.rewardItemId ? <span><PackageCheck />Предмет</span> : null}</div><button className="primary-button full" disabled={!challenge.completed || challenge.claimed || saving} onClick={async () => { const ok = await claimGameChallenge(challenge.id); if (ok) flash(`Награда за «${challenge.title}» получена.`); }}>{challenge.claimed ? "Получено" : challenge.completed ? "Забрать награду" : `Осталось: ${challenge.target - challenge.progress}`}</button><small>Срок: {challenge.expiresAt}</small></article>)}</div>
    </section> : null}

    {tab === "ranking" ? <section className="panel content-panel">
      <div className="section-title"><div><p>Демонстрационный сезон</p><h2>Таблица рейтинга</h2></div><Badge tone="warning">До {state.game.seasonEndsAt}</Badge></div>
      <div className="leaderboard-list">{state.game.leaderboard.map((entry) => <article key={entry.id} className={entry.isCurrentUser ? "current" : ""}><strong>#{entry.rank}</strong><span className="leader-avatar">{entry.initials}</span><div><h3>{entry.name}</h3><p>{heroClassDefinitions[entry.classId].title} · уровень {entry.level}</p></div><span>{entry.battleRating}<small>рейтинг</small></span><span>{entry.seasonPoints}<small>сезон</small></span></article>)}</div>
      <div className="game-adapter-note"><Info /><div><strong>Рейтинг пока локальный и искусственный</strong><span>После подключения сервера таблица должна рассчитываться только доверенным backend, а клиент будет получать готовые места и очки.</span></div></div>
    </section> : null}

    {tab === "teams" && teamBattlesEnabled ? <div className="arena-layout">
      <section className="panel content-panel"><div className="section-title"><div><p>Совместный режим</p><h2>Командное сражение 3×3</h2></div><Badge tone="violet">Fallback-команда</Badge></div><div className="team-roster"><article><span>ТБ</span><div><strong>{state.profile.name}</strong><small>{heroClassDefinitions[progression.classId].title} · {progression.battleRating}</small></div></article><article><span>ИК</span><div><strong>Иван Крылов</strong><small>Страж · защита команды</small></div></article><article><span>ЕК</span><div><strong>Елена Ким</strong><small>Следопыт · инициатива</small></div></article></div><button className="primary-button full" disabled={saving} onClick={() => battle("team")}><Users />Начать командный бой</button><div className="game-adapter-note"><Info /><div><strong>Командная формула также сменная</strong><span>Сейчас союзники искусственные. Позже сюда можно подключить приглашения, готовность команды и синхронные или асинхронные бои.</span></div></div></section>
      <aside className="panel content-panel"><div className="section-title"><div><p>Последние результаты</p><h2>Командная история</h2></div><Badge>{state.game.teamBattleHistory.length}</Badge></div>{state.game.teamBattleHistory.length ? <div className="team-battle-history">{state.game.teamBattleHistory.map((item) => <article key={item.id}><span className={`battle-outcome ${item.result}`}>{item.result === "win" ? "W" : item.result === "draw" ? "D" : "L"}</span><div><strong>{item.opponentTeam}</strong><small>{item.summary}</small></div><Badge tone={item.result === "win" ? "success" : item.result === "draw" ? "violet" : "warning"}>{item.seasonPoints >= 0 ? "+" : ""}{item.seasonPoints}</Badge></article>)}</div> : <div className="arena-empty"><Users /><strong>Командных боёв нет</strong><span>Запустите первый fallback-бой.</span></div>}</aside>
    </div> : null}

    {tab === "history" ? <section className="panel content-panel">
      <div className="section-title"><div><p>Подробный журнал</p><h2>История сражений</h2></div><Badge>{state.battleHistory.length + state.game.teamBattleHistory.length} записей</Badge></div>
      {state.battleHistory.length || state.game.teamBattleHistory.length ? <div className="advanced-battle-history">{[...state.battleHistory, ...state.game.teamBattleHistory].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((item) => <article key={item.id}><header><span className={`battle-outcome ${item.result}`}>{item.result === "win" ? "W" : item.result === "draw" ? "D" : "L"}</span><div><strong>{"opponentName" in item ? item.opponentName : item.opponentTeam}</strong><small>{"mode" in item ? item.mode === "ranked" ? "Рейтинговый бой" : "Тренировка" : "Командный бой"} · {item.engineVersion}</small></div><Badge tone={item.result === "win" ? "success" : item.result === "draw" ? "violet" : "warning"}>+{item.xpReward} XP</Badge></header><p>{item.summary}</p><BattleLog item={item} /><button className="text-button" onClick={() => battle("opponentTeam" in item ? "team" : item.mode === "ranked" ? "ranked" : "training")}>Повторить похожий бой</button></article>)}</div> : <div className="arena-empty"><Swords /><strong>История пока пуста</strong><span>Запустите тренировочный, рейтинговый или командный бой.</span></div>}
    </section> : null}

    {lastResult ? <section className={`panel battle-result result-${lastResult.result}`}><span>{lastResult.result === "win" ? <Trophy /> : lastResult.result === "draw" ? <Sparkles /> : <Shield />}</span><div><Badge tone={lastResult.result === "win" ? "success" : lastResult.result === "draw" ? "violet" : "warning"}>{lastResult.result === "win" ? "Победа" : lastResult.result === "draw" ? "Ничья" : "Поражение"}</Badge><h2>Бой против «{"opponentName" in lastResult ? lastResult.opponentName : lastResult.opponentTeam}»</h2><p>{lastResult.summary}</p><small>Ваш рейтинг: {"yourRating" in lastResult ? lastResult.yourRating : lastResult.yourTeamRating} · соперник: {"opponentRating" in lastResult ? lastResult.opponentRating : lastResult.opponentTeamRating} · +{lastResult.xpReward} hero XP · {lastResult.engineVersion}</small><BattleLog item={lastResult} /></div></section> : null}
  </div>;
}
