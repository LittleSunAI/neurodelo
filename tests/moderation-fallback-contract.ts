import { defaultModerationState, defaultState, platformGateway } from "../services/platform-gateway";
import { moderationGateway } from "../services/moderation-gateway";
import { fallbackConfig } from "../lib/fallback-config";
class MemoryStorage { private values = new Map<string,string>(); getItem(k:string){return this.values.get(k)??null} setItem(k:string,v:string){this.values.set(k,v)} removeItem(k:string){this.values.delete(k)} }
const storage=new MemoryStorage(); (globalThis as unknown as {window:{localStorage:MemoryStorage}}).window={localStorage:storage};
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}
async function main(){
  assert(moderationGateway.mode==="fallback","Должен быть fallback режим");
  const source=defaultModerationState.cases[0];
  const assigned=await moderationGateway.assignCase({item:source,reviewer:"Тестовый модератор"});
  assert(assigned.item.status==="reviewing"&&assigned.item.assignedTo==="Тестовый модератор","Назначение дела должно работать");
  const resolved=await moderationGateway.resolveCase({item:assigned.item,action:"warn",reason:"Подтверждённое нарушение правил общения",actorName:"Тестовый модератор"});
  assert(resolved.item.status==="resolved"&&resolved.decision.action==="warn","Решение должно закрывать дело");
  const appeal=await moderationGateway.createAppeal({caseId:source.id,submittedBy:"Пользователь",reason:"Прошу повторно проверить контекст"});
  const reviewed=await moderationGateway.reviewAppeal({appeal,outcome:"overturned",reason:"Новый контекст меняет оценку",reviewerName:"Старший модератор"});
  assert(reviewed.appeal.status==="overturned","Апелляция должна пересматриваться");
  const link=await moderationGateway.reviewExternalLink({link:defaultModerationState.externalLinks[0],status:"approved",note:"Ссылка проверена",reviewerName:"Модератор"});
  assert(link.link.status==="approved","Ссылка должна одобряться");
  const flag=await moderationGateway.toggleFeatureFlag({flag:defaultModerationState.featureFlags[0],actorName:"Администратор"});
  assert(flag.flag.enabled!==defaultModerationState.featureFlags[0].enabled,"Feature flag должен переключаться");
  storage.setItem(fallbackConfig.previousStorageKey,JSON.stringify({...defaultState,version:10,moderation:undefined}));
  const migrated=await platformGateway.loadState();
  assert(migrated.version===12&&migrated.moderation.cases.length>0,"Версия 10 должна мигрировать в 11");
  console.log(JSON.stringify({schemaVersion:12,assign:"ok",decision:"ok",appeal:"ok",links:"ok",featureFlags:"ok",migrationFromV10:"ok"},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1});
