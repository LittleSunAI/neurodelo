import {
  equipmentCatalog,
  gameGateway,
  heroClassDefinitions,
  skillTreeDefinitions,
} from "../services/game-gateway";
import { defaultGameState, defaultHeroProgression } from "../services/platform-gateway";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  assert(gameGateway.mode === "fallback", "Игровой gateway должен быть в fallback-режиме");

  const guardian = await gameGateway.selectClass(defaultHeroProgression, "guardian");
  assert(guardian.classId === "guardian", "Класс должен переключаться");
  assert(guardian.stats.defense === heroClassDefinitions.guardian.baseStats.defense, "Класс должен вернуть базовые характеристики");

  const withPoint = { ...guardian, unspentPoints: 1 };
  const upgraded = await gameGateway.allocateStat(withPoint, "defense");
  assert(upgraded.stats.defense === guardian.stats.defense + 1, "Очко характеристики должно применяться");
  assert(upgraded.unspentPoints === 0, "Свободное очко должно списываться");
  assert(upgraded.battleRating > guardian.battleRating, "Рейтинг должен пересчитываться");

  const equipTarget = equipmentCatalog.find((item) => item.id === "charm-rapid-token");
  assert(equipTarget, "В каталоге должен быть тестовый артефакт");
  const equipped = await gameGateway.equipItem(upgraded, equipTarget.id);
  assert(equipped.equipment.charmId === equipTarget.id, "Предмет должен устанавливаться в подходящий слот");
  assert(equipped.battleRating >= upgraded.battleRating, "Экипировка не должна уменьшать итоговый рейтинг");

  const skillTarget = skillTreeDefinitions.find((node) => node.id === "skill-guardian-wall");
  assert(skillTarget, "В дереве должен быть классовый узел");
  const withSkillPoints = { ...equipped, skillPoints: 5, unlockedSkillNodeIds: ["skill-steady-start"] };
  const skilled = await gameGateway.unlockSkill(withSkillPoints, skillTarget.id);
  assert(skilled.unlockedSkillNodeIds.includes(skillTarget.id), "Навык должен открываться");
  assert(skilled.skillPoints === 3, "Стоимость навыка должна списываться");

  const training = await gameGateway.runTrainingBattle(skilled, 0);
  assert(training.result.engineVersion === "advanced-foundation-v2", "Результат должен содержать новую версию движка");
  assert((training.result.actionLog?.length ?? 0) >= 3, "Бой должен содержать подробный журнал");

  const ranked = await gameGateway.runRankedBattle(training.progression, 1);
  assert(ranked.result.mode === "ranked", "Рейтинговый бой должен иметь отдельный режим");
  assert(typeof ranked.result.seasonPoints === "number", "Рейтинговый бой должен менять сезонные очки");

  const team = await gameGateway.runTeamBattle(ranked.progression, 0);
  assert(team.result.allyNames.length === 2, "Командный бой должен содержать союзников");
  assert(team.result.actionLog.length >= 3, "Командный бой должен содержать журнал действий");

  const challenge = { ...defaultGameState.challenges[0], progress: 1, completed: true };
  const claimed = await gameGateway.claimChallenge(team.progression, challenge);
  assert(claimed.challenge.claimed, "Завершённое испытание должно отмечаться полученным");
  assert(claimed.progression.xp !== team.progression.xp || claimed.progression.level > team.progression.level, "Испытание должно начислять hero XP");

  const leaderboard = gameGateway.updateLeaderboard(defaultGameState.leaderboard, claimed.progression, 900, "Тестовый герой");
  assert(leaderboard.some((entry) => entry.isCurrentUser && entry.seasonPoints === 900), "Рейтинг должен обновлять запись текущего пользователя");

  console.log(JSON.stringify({
    mode: gameGateway.mode,
    classSelection: "ok",
    statAllocation: "ok",
    equipment: "ok",
    skillTree: "ok",
    trainingBattle: "ok",
    rankedBattle: "ok",
    teamBattle: "ok",
    challenges: "ok",
    leaderboard: "ok",
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
