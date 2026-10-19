import fs from "node:fs";
import path from "node:path";
const root=process.cwd();
const spec=JSON.parse(fs.readFileSync(path.join(root,"api","openapi.json"),"utf8"));
const methods=new Set(["get","post","put","patch","delete","options","head"]);
const endpoints=[];
for(const [apiPath,item] of Object.entries(spec.paths)){for(const [method,operation] of Object.entries(item)){if(!methods.has(method))continue;endpoints.push({method:method.toUpperCase(),path:apiPath,operationId:operation.operationId,tag:operation.tags?.[0]??"Other",auth:Boolean(operation.security)});}}
endpoints.sort((a,b)=>a.path.localeCompare(b.path)||a.method.localeCompare(b.method));
fs.writeFileSync(path.join(root,"api","endpoint-registry.json"),`${JSON.stringify({version:spec.info.version,basePath:spec.servers[0].url,count:endpoints.length,endpoints},null,2)}\n`);
console.log(`Endpoint registry: ${endpoints.length}`);
