import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
const source=path.resolve(process.env.NEURODELO_DATA_DIR||".data");
if(!existsSync(source)){console.error(`Нет каталога данных: ${source}`);process.exit(1)}
const stamp=new Date().toISOString().replace(/[:.]/g,"-");const target=path.resolve("backups",`neurodelo-data-${stamp}`);mkdirSync(path.dirname(target),{recursive:true});cpSync(source,target,{recursive:true,errorOnExist:true});writeFileSync(path.join(target,"BACKUP_INFO.json"),JSON.stringify({createdAt:new Date().toISOString(),source,format:1},null,2)+"\n");console.log(target);
