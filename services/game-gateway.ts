import { gameConfig, gameRuntimeMode } from "../lib/game-config";
import type {
  BattleResult,
  GameChallenge,
  GameItem,
  GameLeaderboardEntry,
  GameSkillNode,
  HeroClassId,
  HeroProgression,
  HeroStatId,
  HeroStats,
  TeamBattleResult,
} from "../types/platform";

export const heroClassDefinitions: Record<HeroClassId, { title: string; subtitle: string; description: string; baseStats: HeroStats; accent: string }> = {
  guardian: {
    title: "Страж",
    subtitle: "Надёжность и защита",
    description: "Выдерживает давление, помогает команде и получает бонус к защите.",
    baseStats: { vitality: 8, power: 4, defense: 9, speed: 3, focus: 6 },
    accent: "green",
  },
  technomancer: {
    title: "Техномант",
    subtitle: "Сила инструментов",
    description: "Сильнее раскрывает способности и делает ставку на мощность и концентрацию.",
    baseStats: { vitality: 5, power: 9, defense: 4, speed: 5, focus: 8 },
    accent: "violet",
  },
  pathfinder: {
    title: "Следопыт",
    subtitle: "Скорость и инициатива",
    description: "Быстро реагирует, первым начинает ход и лучше использует тактические возможности.",
    baseStats: { vitality: 5, power: 6, defense: 4, speed: 9, focus: 6 },
    accent: "cyan",
  },
  architect: {
    title: "Архитектор",
    subtitle: "Баланс и стратегия",
    description: "Универсальный класс с ровными характеристиками и высоким фокусом.",
    baseStats: { vitality: 6, power: 6, defense: 6, speed: 5, focus: 8 },
    accent: "amber",
  },
};

export const equipmentCatalog: GameItem[] = [
  { id: "weapon-debug-blade", title: "Клинок отладки", description: "Усиливает точные атаки и поиск слабых мест.", slot: "weapon", rarity: "common", requiredLevel: 1, ratingBonus: 18, statBonuses: { power: 1, focus: 1 }, icon: "sword" },
  { id: "weapon-neural-staff", title: "Нейронный посох", description: "Редкий инструмент техноманта с высоким фокусом.", slot: "weapon", rarity: "epic", requiredLevel: 12, ratingBonus: 54, statBonuses: { power: 2, focus: 3 }, icon: "wand" },
  { id: "armor-reviewer-cloak", title: "Плащ ревьюера", description: "Помогает выдерживать замечания и возвращаться с улучшением.", slot: "armor", rarity: "rare", requiredLevel: 6, ratingBonus: 34, statBonuses: { vitality: 1, defense: 2 }, icon: "cloak" },
  { id: "armor-guardian-shell", title: "Оболочка хранителя", description: "Тяжёлая защита для командных сражений.", slot: "armor", rarity: "legendary", requiredLevel: 18, ratingBonus: 76, statBonuses: { vitality: 3, defense: 4, speed: -1 }, icon: "shield" },
  { id: "charm-focus-core", title: "Ядро концентрации", description: "Увеличивает эффективность способностей.", slot: "charm", rarity: "common", requiredLevel: 1, ratingBonus: 16, statBonuses: { focus: 2 }, icon: "gem" },
  { id: "charm-rapid-token", title: "Токен быстрого цикла", description: "Даёт инициативу в начале боя.", slot: "charm", rarity: "rare", requiredLevel: 8, ratingBonus: 31, statBonuses: { speed: 2, focus: 1 }, icon: "token" },
  { id: "companion-repo-owl", title: "Сова репозитория", description: "Замечает скрытые ошибки и усиливает фокус.", slot: "companion", rarity: "rare", requiredLevel: 5, ratingBonus: 29, statBonuses: { focus: 2, defense: 1 }, icon: "owl" },
  { id: "companion-merge-drone", title: "Merge-дрон", description: "Легендарный спутник для сильных командных сборок.", slot: "companion", rarity: "legendary", requiredLevel: 20, ratingBonus: 82, statBonuses: { power: 2, speed: 2, focus: 2 }, icon: "drone" },
];

export const skillTreeDefinitions: GameSkillNode[] = [
  { id: "skill-steady-start", classId: "all", title: "Уверенный старт", description: "Небольшой бонус к живучести для любого класса.", cost: 1, ratingBonus: 10, statBonuses: { vitality: 1 } },
  { id: "skill-review-focus", classId: "all", title: "Фокус ревью", description: "Повышает концентрацию после проверки результата.", cost: 1, requires: "skill-steady-start", ratingBonus: 12, statBonuses: { focus: 1 } },
  { id: "skill-guardian-wall", classId: "guardian", title: "Стена команды", description: "Страж получает усиленную защиту.", cost: 2, requires: "skill-steady-start", ratingBonus: 24, statBonuses: { defense: 2 } },
  { id: "skill-guardian-anchor", classId: "guardian", title: "Надёжный якорь", description: "Живучесть и защита для длинного боя.", cost: 3, requires: "skill-guardian-wall", ratingBonus: 38, statBonuses: { vitality: 2, defense: 1 } },
  { id: "skill-tech-overclock", classId: "technomancer", title: "Разгон инструментов", description: "Сила и фокус техноманта растут.", cost: 2, requires: "skill-steady-start", ratingBonus: 25, statBonuses: { power: 2, focus: 1 } },
  { id: "skill-tech-chain", classId: "technomancer", title: "Цепная автоматизация", description: "Дополнительная мощность сложных действий.", cost: 3, requires: "skill-tech-overclock", ratingBonus: 40, statBonuses: { power: 2, speed: 1 } },
  { id: "skill-path-first", classId: "pathfinder", title: "Первый ход", description: "Следопыт чаще перехватывает инициативу.", cost: 2, requires: "skill-steady-start", ratingBonus: 24, statBonuses: { speed: 2 } },
  { id: "skill-path-momentum", classId: "pathfinder", title: "Импульс", description: "Скорость превращается в дополнительную силу.", cost: 3, requires: "skill-path-first", ratingBonus: 39, statBonuses: { speed: 2, power: 1 } },
  { id: "skill-arch-plan", classId: "architect", title: "План боя", description: "Архитектор усиливает фокус и защиту.", cost: 2, requires: "skill-steady-start", ratingBonus: 25, statBonuses: { focus: 2, defense: 1 } },
  { id: "skill-arch-system", classId: "architect", title: "Системное мышление", description: "Сбалансированное усиление ключевых характеристик.", cost: 3, requires: "skill-arch-plan", ratingBonus: 42, statBonuses: { power: 1, defense: 1, focus: 2 } },
];

function wait(ms: number = gameConfig.artificialDelayMs) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return fetch(`/api/v1/game${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  }).then(async (response) => {
    if (!response.ok) throw new Error(`Game API недоступен: ${response.status}`);
    return response.json() as Promise<T>;
  });
}

export function calculateBattleRating(stats: HeroStats, level: number, extraRating: number = 0) {
  return Math.round(
    stats.vitality * 8 +
    stats.power * 10 +
    stats.defense * 9 +
    stats.speed * 8 +
    stats.focus * 7 +
    level * 14 +
    extraRating,
  );
}

function addBonuses(base: HeroStats, bonus: Partial<HeroStats>): HeroStats {
  return {
    vitality: Math.max(1, base.vitality + (bonus.vitality ?? 0)),
    power: Math.max(1, base.power + (bonus.power ?? 0)),
    defense: Math.max(1, base.defense + (bonus.defense ?? 0)),
    speed: Math.max(1, base.speed + (bonus.speed ?? 0)),
    focus: Math.max(1, base.focus + (bonus.focus ?? 0)),
  };
}

export function getProgressionBonuses(current: HeroProgression) {
  const stats: Partial<HeroStats> = {};
  let ratingBonus = 0;
  const addStatBonuses = (bonuses: Partial<HeroStats>) => {
    for (const key of Object.keys(bonuses) as HeroStatId[]) stats[key] = (stats[key] ?? 0) + (bonuses[key] ?? 0);
  };
  const equippedIds = Object.values(current.equipment).filter((id): id is string => Boolean(id));
  for (const id of equippedIds) {
    const item = equipmentCatalog.find((entry) => entry.id === id);
    if (!item) continue;
    addStatBonuses(item.statBonuses);
    ratingBonus += item.ratingBonus;
  }
  for (const id of current.unlockedSkillNodeIds) {
    const node = skillTreeDefinitions.find((entry) => entry.id === id);
    if (!node || (node.classId !== "all" && node.classId !== current.classId)) continue;
    addStatBonuses(node.statBonuses);
    ratingBonus += node.ratingBonus;
  }
  return { stats, ratingBonus };
}

export function getEffectiveStats(current: HeroProgression): HeroStats {
  return addBonuses(current.stats, getProgressionBonuses(current).stats);
}

export function recalculateProgression(current: HeroProgression): HeroProgression {
  const bonuses = getProgressionBonuses(current);
  return {
    ...current,
    battleRating: calculateBattleRating(addBonuses(current.stats, bonuses.stats), current.level, bonuses.ratingBonus),
    modelVersion: gameConfig.engineVersion,
  };
}

function nextProgressionForClass(current: HeroProgression, classId: HeroClassId): HeroProgression {
  return recalculateProgression({
    ...current,
    classId,
    stats: { ...heroClassDefinitions[classId].baseStats },
    title: heroClassDefinitions[classId].title,
  });
}

function grantHeroXp(current: HeroProgression, amount: number) {
  let xp = current.xp + amount;
  let level = current.level;
  let xpToNext = current.xpToNext;
  let unspentPoints = current.unspentPoints;
  let skillPoints = current.skillPoints;
  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    xpToNext = Math.round(xpToNext * 1.18);
    unspentPoints += 2;
    skillPoints += 1;
  }
  return recalculateProgression({ ...current, xp, level, xpToNext, unspentPoints, skillPoints });
}

function tierForPoints(points: number): HeroProgression["season"]["tier"] {
  if (points >= 1600) return "Платина";
  if (points >= 900) return "Золото";
  if (points >= 350) return "Серебро";
  if (points >= 100) return "Бронза";
  return "Новичок";
}

function battleResult(current: HeroProgression, opponentName: string, opponentClass: HeroClassId, opponentRating: number, index: number, ranked: boolean) {
  const effective = getEffectiveStats(current);
  const advantage = current.battleRating - opponentRating + effective.focus * 2 + effective.speed + (index % 3) * 4;
  const result: BattleResult["result"] = Math.abs(advantage) < 9 ? "draw" : advantage > 0 ? "win" : "loss";
  const xpReward = ranked ? (result === "win" ? 120 : result === "draw" ? 70 : 42) : (result === "win" ? 90 : result === "draw" ? 55 : 35);
  const seasonPoints = ranked ? (result === "win" ? 34 : result === "draw" ? 12 : -18) : 0;
  const progressionWithXp = grantHeroXp(current, xpReward);
  const nextPoints = Math.max(0, (current.season.rank ? 500 : 0) + seasonPoints);
  const progression = {
    ...progressionWithXp,
    season: {
      ...progressionWithXp.season,
      wins: progressionWithXp.season.wins + (result === "win" ? 1 : 0),
      losses: progressionWithXp.season.losses + (result === "loss" ? 1 : 0),
      tier: ranked ? tierForPoints(nextPoints) : progressionWithXp.season.tier,
      rank: ranked ? Math.max(1, progressionWithXp.season.rank + (result === "win" ? -5 : result === "loss" ? 4 : -1)) : progressionWithXp.season.rank,
    },
  };
  const actionLog = [
    `${effective.speed >= 8 ? "Ваш герой" : opponentName} получил инициативу.`,
    `Основное действие использовало силу ${effective.power} и фокус ${effective.focus}.`,
    `Защита героя поглотила часть давления: ${effective.defense}.`,
    result === "win" ? "Финальная комбинация принесла победу." : result === "draw" ? "Оба героя сохранили равновесие." : "Соперник выиграл финальный обмен.",
  ];
  return {
    progression,
    result: {
      id: `battle-${Date.now()}-${index}`,
      opponentName,
      opponentClass,
      result,
      yourRating: current.battleRating,
      opponentRating,
      xpReward,
      seasonPoints,
      mode: ranked ? "ranked" : "training",
      actionLog,
      summary: result === "win" ? "Герой победил благодаря итоговому рейтингу, экипировке и выбранным навыкам." : result === "draw" ? "Силы оказались почти равны. Оба героя получили опыт." : "Соперник оказался сильнее, но герой получил опыт и запись в журнал.",
      createdAt: new Date().toISOString(),
      engineVersion: gameConfig.engineVersion,
    } satisfies BattleResult,
  };
}

export function progressChallenges(challenges: GameChallenge[], event: "battle" | "ranked-win" | "team-battle" | "contribution") {
  return challenges.map((challenge) => {
    if (challenge.claimed) return challenge;
    const matches =
      (event === "battle" && challenge.id === "daily-battle") ||
      (event === "ranked-win" && challenge.id === "weekly-ranked") ||
      (event === "team-battle" && challenge.id === "weekly-team") ||
      (event === "contribution" && challenge.id === "season-contribution");
    if (!matches) return challenge;
    const progress = Math.min(challenge.target, challenge.progress + 1);
    return { ...challenge, progress, completed: progress >= challenge.target };
  });
}

export const gameGateway = {
  mode: gameRuntimeMode,

  async selectClass(current: HeroProgression, classId: HeroClassId): Promise<HeroProgression> {
    if (gameRuntimeMode === "api") return apiRequest<HeroProgression>("/class", { method: "PUT", body: JSON.stringify({ current, classId }) });
    await wait();
    return nextProgressionForClass(current, classId);
  },

  async allocateStat(current: HeroProgression, stat: HeroStatId): Promise<HeroProgression> {
    if (gameRuntimeMode === "api") return apiRequest<HeroProgression>("/stats/allocate", { method: "POST", body: JSON.stringify({ current, stat }) });
    await wait(90);
    if (current.unspentPoints < 1) return current;
    const stats = { ...current.stats, [stat]: current.stats[stat] + 1 };
    return recalculateProgression({ ...current, stats, unspentPoints: current.unspentPoints - 1 });
  },

  async equipItem(current: HeroProgression, itemId: string): Promise<HeroProgression> {
    if (gameRuntimeMode === "api") return apiRequest<HeroProgression>("/equipment/equip", { method: "POST", body: JSON.stringify({ current, itemId }) });
    await wait(100);
    const item = equipmentCatalog.find((entry) => entry.id === itemId);
    if (!item || !current.ownedItemIds.includes(itemId) || current.level < item.requiredLevel) return current;
    return recalculateProgression({ ...current, equipment: { ...current.equipment, [`${item.slot}Id`]: item.id } });
  },

  async unlockSkill(current: HeroProgression, skillId: string): Promise<HeroProgression> {
    if (gameRuntimeMode === "api") return apiRequest<HeroProgression>("/skills/unlock", { method: "POST", body: JSON.stringify({ current, skillId }) });
    await wait(100);
    const node = skillTreeDefinitions.find((entry) => entry.id === skillId);
    if (!node || current.unlockedSkillNodeIds.includes(skillId) || current.skillPoints < node.cost) return current;
    if (node.classId !== "all" && node.classId !== current.classId) return current;
    if (node.requires && !current.unlockedSkillNodeIds.includes(node.requires)) return current;
    return recalculateProgression({ ...current, skillPoints: current.skillPoints - node.cost, unlockedSkillNodeIds: [...current.unlockedSkillNodeIds, skillId] });
  },

  async runTrainingBattle(current: HeroProgression, battleIndex: number): Promise<{ progression: HeroProgression; result: BattleResult }> {
    if (gameRuntimeMode === "api") return apiRequest<{ progression: HeroProgression; result: BattleResult }>("/battle/training", { method: "POST", body: JSON.stringify({ current }) });
    await wait(420);
    const opponents: Array<{ name: string; classId: HeroClassId; offset: number }> = [
      { name: "Ночной Кодер", classId: "technomancer", offset: -18 },
      { name: "Страж Репозитория", classId: "guardian", offset: 22 },
      { name: "Быстрый Контрибьютор", classId: "pathfinder", offset: 5 },
      { name: "Архитектор Веток", classId: "architect", offset: 12 },
    ];
    const opponent = opponents[battleIndex % opponents.length];
    return battleResult(current, opponent.name, opponent.classId, Math.max(120, current.battleRating + opponent.offset), battleIndex, false);
  },

  async runRankedBattle(current: HeroProgression, battleIndex: number): Promise<{ progression: HeroProgression; result: BattleResult }> {
    if (gameRuntimeMode === "api") return apiRequest<{ progression: HeroProgression; result: BattleResult }>("/battle/ranked", { method: "POST", body: JSON.stringify({ current }) });
    await wait(520);
    const opponents: Array<{ name: string; classId: HeroClassId; offset: number }> = [
      { name: "Merge Master", classId: "architect", offset: 14 },
      { name: "Zero-Day Pathfinder", classId: "pathfinder", offset: 28 },
      { name: "CI Guardian", classId: "guardian", offset: 36 },
      { name: "Prompt Technomancer", classId: "technomancer", offset: 8 },
    ];
    const opponent = opponents[battleIndex % opponents.length];
    return battleResult(current, opponent.name, opponent.classId, Math.max(180, current.battleRating + opponent.offset), battleIndex, true);
  },

  async runTeamBattle(current: HeroProgression, battleIndex: number): Promise<{ progression: HeroProgression; result: TeamBattleResult }> {
    if (gameRuntimeMode === "api") return apiRequest<{ progression: HeroProgression; result: TeamBattleResult }>("/battle/team", { method: "POST", body: JSON.stringify({ current }) });
    await wait(600);
    const teams = ["Команда Legacy Breakers", "Гильдия Clean Build", "Орден Open Source"];
    const opponentTeam = teams[battleIndex % teams.length];
    const yourTeamRating = current.battleRating + 780 + (battleIndex % 3) * 22;
    const opponentTeamRating = current.battleRating + 750 + ((battleIndex + 1) % 3) * 32;
    const delta = yourTeamRating - opponentTeamRating + current.stats.focus * 3;
    const result: TeamBattleResult["result"] = Math.abs(delta) < 18 ? "draw" : delta > 0 ? "win" : "loss";
    const xpReward = result === "win" ? 150 : result === "draw" ? 90 : 55;
    const seasonPoints = result === "win" ? 48 : result === "draw" ? 18 : -12;
    const progression = grantHeroXp(current, xpReward);
    return {
      progression,
      result: {
        id: `team-battle-${Date.now()}-${battleIndex}`,
        allyNames: ["Иван Крылов", "Елена Ким"],
        opponentTeam,
        result,
        yourTeamRating,
        opponentTeamRating,
        xpReward,
        seasonPoints,
        summary: result === "win" ? "Команда победила благодаря распределению ролей и совместной защите." : result === "draw" ? "Команды завершили бой в равновесии." : "Соперники лучше использовали командную комбинацию.",
        actionLog: ["Страж команды принял первый удар.", "Техномант усилил общее действие.", "Следопыт перехватил инициативу.", result === "win" ? "Совместная способность завершила бой." : "Финальная комбинация не дала преимущества."],
        createdAt: new Date().toISOString(),
        engineVersion: gameConfig.engineVersion,
      },
    };
  },

  async claimChallenge(current: HeroProgression, challenge: GameChallenge): Promise<{ progression: HeroProgression; challenge: GameChallenge; communityPoints: number }> {
    if (gameRuntimeMode === "api") return apiRequest<{ progression: HeroProgression; challenge: GameChallenge; communityPoints: number }>("/challenges/claim", { method: "POST", body: JSON.stringify({ current, challenge }) });
    await wait(100);
    if (!challenge.completed || challenge.claimed) return { progression: current, challenge, communityPoints: 0 };
    const ownedItemIds = challenge.rewardItemId && !current.ownedItemIds.includes(challenge.rewardItemId) ? [...current.ownedItemIds, challenge.rewardItemId] : current.ownedItemIds;
    return {
      progression: grantHeroXp({ ...current, ownedItemIds }, challenge.rewardHeroXp),
      challenge: { ...challenge, claimed: true },
      communityPoints: challenge.rewardCommunityPoints,
    };
  },

  updateLeaderboard(entries: GameLeaderboardEntry[], current: HeroProgression, seasonPoints: number, currentName: string) {
    const next = entries.map((entry) => entry.isCurrentUser ? { ...entry, name: currentName, classId: current.classId, level: current.level, battleRating: current.battleRating, seasonPoints } : entry);
    return next.sort((a, b) => b.seasonPoints - a.seasonPoints || b.battleRating - a.battleRating).map((entry, index) => ({ ...entry, rank: index + 1 }));
  },

  contributionReward(skillXp: number) {
    const heroXp = Math.max(15, Math.round(skillXp * 0.28));
    const communityPoints = Math.max(1, Math.min(12, Math.round(skillXp / 90)));
    return { heroXp, communityPoints };
  },
};
