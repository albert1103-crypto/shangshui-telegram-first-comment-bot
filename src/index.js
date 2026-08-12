import { UI } from "./ui.js";
import { j, AutomationState, BotState } from "./studio.js";
const NAME="telegram-automation-studio-global";
function stub(env){return env.AUTOMATION_STATE.get(env.AUTOMATION_STATE.idFromName(NAME))}
function proxy(request,env){const u=new URL(request.url);return stub(env).fetch(`https://state.internal${u.pathname}${u.search}`,{method:request.method,headers:request.headers,body:["GET","HEAD"].includes(request.method)?undefined:request.body})}
export default {async fetch(request,env){const u=new URL(request.url);if(request.method==="GET"&&u.pathname==="/")return new Response(UI,{headers:{"content-type":"text/html; charset=utf-8","cache-control":"no-store"}});if(request.method==="GET"&&u.pathname==="/health")return j({ok:true,service:"Telegram Automation Studio",version:2,scheduler:{scanMinutes:45,commentGapMinutes:5}});if(u.pathname.startsWith("/api/"))return proxy(request,env);return j({error:"Not found"},404)},async scheduled(_c,env,ctx){ctx.waitUntil(stub(env).fetch("https://state.internal/api/tick",{method:"POST"}))}};
export { AutomationState, BotState };
