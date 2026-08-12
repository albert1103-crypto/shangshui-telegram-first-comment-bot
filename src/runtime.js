import { TelegramClient, Api } from "teleproto";
import { StringSession } from "teleproto/sessions/index.js";
import { PromisedWebSockets } from "teleproto/extensions/index.js";
import { buildGeminiBody, parseGemini, safeComment } from "./core.js";

export function classifyTelegramError(error) {
  const raw = String(error?.errorMessage || error?.message || error || "Telegram request failed").trim();
  const upper = raw.toUpperCase();
  const flood = upper.match(/FLOOD_WAIT[_\s:]*(\d+)/) || upper.match(/A_WAIT_(\d+)/);
  if (flood || error?.seconds) {
    const seconds = Math.min(Math.max(Number(error?.seconds || flood?.[1] || 60), 1), 24 * 60 * 60);
    return {
      kind: "flood_wait",
      retryAfterMs: seconds * 1000,
      message: `Telegram rate limit (FLOOD_WAIT_${seconds}); retry scheduled automatically`,
    };
  }
  if (/AUTH_KEY_UNREGISTERED|AUTH_KEY_INVALID|SESSION_REVOKED|SESSION_EXPIRED|USER_DEACTIVATED|AUTH_KEY_PERM_EMPTY/.test(upper)) {
    return { kind: "session_expired", message: "Telegram session expired or was revoked; reconnect this account" };
  }
  return { kind: "telegram_error", message: raw.slice(0, 500) || "Telegram request failed" };
}

export async function makeTelegramClient(settings, session = "") {
  if (!Number(settings.apiId) || !settings.apiHash) throw new Error("Set Telegram API ID and API Hash in Settings first");
  return new TelegramClient(new StringSession(session), Number(settings.apiId), String(settings.apiHash), { connectionRetries: 3, autoReconnect: false, networkSocket: PromisedWebSockets });
}
export async function withTelegram(settings, session, fn) {
  const client = await makeTelegramClient(settings, session);
  try { await client.connect(); return await fn(client); }
  finally { try { await client.disconnect(); } catch {} }
}
export async function listChannelDialogs(client) {
  const dialogs = await client.getDialogs({ limit: 500 });
  return dialogs.filter(d => d?.isChannel || d?.entity?.broadcast || d?.entity?.megagroup).map(d => ({
    id: String(d.id ?? d.entity?.id ?? ""), title: d.title || d.name || "Untitled", username: d.entity?.username || "", entity: d.entity,
  })).filter(d => d.id);
}
export async function requestLoginCode(settings, phone) {
  return withTelegram(settings, "", async client => {
    const sent = await client.sendCode({ apiId:Number(settings.apiId), apiHash:String(settings.apiHash) }, phone, false);
    return { phoneCodeHash: sent.phoneCodeHash, viaApp: Boolean(sent.isCodeViaApp), session: client.session.save() };
  });
}
export async function finishLogin(settings, pending, code, password) {
  const client = await makeTelegramClient(settings, pending.session);
  try {
    await client.connect(); let user;
    try {
      const result = await client.invoke(new Api.auth.SignIn({ phoneNumber: pending.phone, phoneCodeHash: pending.phoneCodeHash, phoneCode: String(code || "").trim() }));
      if (!result?.user) throw new Error("Telegram did not return a user"); user = result.user;
    } catch (e) {
      if (e?.errorMessage !== "SESSION_PASSWORD_NEEDED" && !String(e?.message || "").includes("SESSION_PASSWORD_NEEDED")) throw e;
      if (!password) return { needs2fa:true };
      user = await client.signInWithPassword({ apiId:Number(settings.apiId), apiHash:String(settings.apiHash) }, { password:async()=>String(password), onError:async()=>true });
    }
    return { user:user || await client.getMe(), session:client.session.save() };
  } finally { try { await client.disconnect(); } catch {} }
}
export async function getLatestMessages(settings, account, rules, limit = 50) {
  return withTelegram(settings, account.session, async client => {
    const dialogs = await listChannelDialogs(client), dmap = new Map(dialogs.map(d => [d.id,d])), out = [];
    for (const rule of rules) {
      const dialog = dmap.get(rule.channelId); if (!dialog) { out.push({rule,error:"Channel no longer visible"}); continue; }
      const messages = await client.getMessages(dialog.entity,{limit}); out.push({rule,dialog,messages:messages || []});
    }
    return out;
  });
}
export async function postDiscussionComment(settings, account, job, comment) {
  return withTelegram(settings, account.session, async client => {
    const dialogs = await listChannelDialogs(client), dialog = dialogs.find(d => d.id === job.channelId);
    if (!dialog) throw new Error("Channel not found in account dialogs");
    const discussion = await client.invoke(new Api.messages.GetDiscussionMessage({ peer:dialog.entity, msgId:Number(job.postId) }));
    const root = discussion?.messages?.[0]; if (!root) throw new Error("This post has no accessible discussion thread");
    await client.sendMessage(root.peerId,{ message:comment, replyTo:Number(root.id) });
  });
}
export async function generateGemini(settings, env, postText, language, instruction = "") {
  const key = settings.geminiApiKey || env.GEMINI_API_KEY; if (!key) throw new Error("Gemini API key is not configured");
  const model = settings.geminiModel || env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const { body } = buildGeminiBody({postText,outputLanguage:language,instruction:instruction || settings.aiInstruction,model});
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{method:"POST",headers:{"content-type":"application/json","x-goog-api-key":key},body:JSON.stringify(body)});
  const data = await r.json(); if(!r.ok) throw new Error(data?.error?.message || `Gemini HTTP ${r.status}`);
  return safeComment(parseGemini(data));
}
