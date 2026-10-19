import { existsSync, rmSync } from "node:fs";import path from "node:path";
if(process.env.CONFIRM_DATA_RESET!=="YES"){console.error("Для удаления данных установите CONFIRM_DATA_RESET=YES");process.exit(1)}const dir=path.resolve(process.env.NEURODELO_DATA_DIR||".data");if(existsSync(dir))rmSync(dir,{recursive:true,force:true});console.log(`Удалено: ${dir}`);
