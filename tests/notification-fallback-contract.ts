import { defaultState, platformGateway } from "../services/platform-gateway";
import { fallbackConfig } from "../lib/fallback-config";
class MemoryStorage { values = new Map<string,string>(); getItem(k:string){return this.values.get(k)??null} setItem(k:string,v:string){this.values.set(k,v)} removeItem(k:string){this.values.delete(k)} }
const storage = new MemoryStorage();
(globalThis as unknown as {window:{localStorage:MemoryStorage}}).window={localStorage:storage};
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message)}
async function main(){
  assert(defaultState.version===12,"Notification schema должна иметь версию 12");
  assert(defaultState.notifications.length>=3&&defaultState.notifications.some((item)=>!item.read),"Должны существовать демонстрационные уведомления");
  const changed={...defaultState,notifications:defaultState.notifications.map((item,index)=>({...item,read:index===0?true:item.read}))};
  await platformGateway.saveState(changed);const restored=await platformGateway.loadState();assert(restored.notifications[0].read,"Статус прочтения должен сохраняться");
  storage.removeItem(fallbackConfig.storageKey);storage.setItem(fallbackConfig.previousStorageKey,JSON.stringify({...defaultState,version:11,notifications:undefined}));
  const migrated=await platformGateway.loadState();assert(migrated.version===12&&migrated.notifications.length>0,"Состояние версии 11 должно получить уведомления");
  console.log(JSON.stringify({schemaVersion:12,seeded:"ok",persistence:"ok",migrationFromV11:"ok"},null,2));
}
main().catch((error)=>{console.error(error);process.exitCode=1});
