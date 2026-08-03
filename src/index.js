const SOURCE_CHANNEL_USERNAME = "vieclamsrilankashangshui";
const JOB_URL = "https://t.me/vieclamsrilankashangshui/356";
const APPLY_URL = "https://t.me/shangshuiDD";

const COMMENT_TEXT = [
  "🇱🇰 <b>SHANG SHUI SRI LANKA – TUYỂN DỤNG</b>",
  "",
  "Ứng viên vui lòng xem các vị trí đang tuyển hoặc liên hệ trực tiếp để được tư vấn và hỗ trợ ứng tuyển.",
  "",
  "✅ Thông tin rõ ràng • Hỗ trợ trực tiếp • Cập nhật thường xuyên",
].join("\n");

const textEncoder = new TextEncoder();

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

async function deriveWebhookSecret(token) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    textEncoder.encode(`shangshui:first-comment:${token}`),
  );
  return base64Url(new Uint8Array(digest));
}

async function telegramCall(token, method, payload = {}) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const raw = await response.text();
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(`Telegram returned invalid JSON (HTTP ${response.status})`);
  }

  if (!response.ok || !data.ok) {
    const code = data.error_code ?? response.status;
    const description = data.description ?? "Unknown Telegram error";
    const error = new Error(`Telegram API ${code}: ${description}`);
    error.telegram = data;
    throw error;
  }

  return data.result;
}

function sourceChannelUsername(message) {
  const candidates = [
    message?.sender_chat?.username,
    message?.forward_origin?.chat?.username,
    message?.forward_from_chat?.username,
  ];
  const found = candidates.find((value) => typeof value === "string" && value);
  return found ? found.toLowerCase().replace(/^@/, "") : null;
}

function buttonPayload(includeStyles = true) {
  const jobButton = {
    text: "💼 Vị trí đang tuyển",
    url: JOB_URL,
  };
  const applyButton = {
    text: "📩 Liên hệ ứng tuyển",
    url: APPLY_URL,
  };

  if (includeStyles) {
    jobButton.style = "primary";
    applyButton.style = "success";
  }

  return {
    inline_keyboard: [[jobButton, applyButton]],
  };
}

async function sendFirstComment(token, chatId, messageId) {
  const base = {
    chat_id: chatId,
    text: COMMENT_TEXT,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    reply_parameters: {
      message_id: messageId,
      allow_sending_without_reply: false,
    },
  };

  try {
    return await telegramCall(token, "sendMessage", {
      ...base,
      reply_markup: buttonPayload(true),
    });
  } catch (error) {
    const description = String(error?.message ?? "").toLowerCase();
    if (!description.includes("style") && !description.includes("inline keyboard")) {
      throw error;
    }

    return telegramCall(token, "sendMessage", {
      ...base,
      reply_markup: buttonPayload(false),
    });
  }
}

async function configureWebhook(request, env) {
  if (!env.BOT_TOKEN) {
    return html(`<!doctype html><meta charset="utf-8"><title>SHANG SHUI Bot</title>
      <style>body{font-family:system-ui;max-width:760px;margin:60px auto;padding:0 20px;line-height:1.6}code{background:#eee;padding:2px 6px;border-radius:5px}</style>
      <h1>ยังไม่ได้ตั้ง BOT_TOKEN</h1>
      <p>เปิด Cloudflare Worker → Settings → Variables and Secrets → เพิ่ม Secret ชื่อ <code>BOT_TOKEN</code> แล้ว Deploy ใหม่</p>`, 503);
  }

  const origin = new URL(request.url).origin;
  const secret = await deriveWebhookSecret(env.BOT_TOKEN);
  const webhookPath = `/telegram/${secret.slice(0, 32)}`;
  const webhookUrl = `${origin}${webhookPath}`;

  try {
    const me = await telegramCall(env.BOT_TOKEN, "getMe");
    await telegramCall(env.BOT_TOKEN, "setWebhook", {
      url: webhookUrl,
      secret_token: secret,
      allowed_updates: ["message"],
      drop_pending_updates: false,
      max_connections: 40,
    });
    const info = await telegramCall(env.BOT_TOKEN, "getWebhookInfo");

    return html(`<!doctype html>
      <html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>SHANG SHUI Telegram Bot</title>
      <style>
        body{font-family:system-ui,-apple-system,sans-serif;background:#0b1220;color:#e7eefc;margin:0;padding:40px 18px}
        main{max-width:760px;margin:auto;background:#111b2e;border:1px solid #263855;border-radius:18px;padding:28px}
        h1{margin-top:0}.ok{color:#55e6a5}.box{background:#0b1424;border-radius:12px;padding:16px;margin:14px 0}
        code{word-break:break-all;color:#9fc5ff}a{color:#7eb3ff}
      </style></head><body><main>
      <h1>SHANG SHUI First Comment Bot</h1>
      <p class="ok"><strong>✓ เชื่อมต่อและตั้ง Webhook สำเร็จ</strong></p>
      <div class="box">
        <div>Bot: <strong>@${escapeHtml(me.username ?? "unknown")}</strong></div>
        <div>Source channel: <strong>@${escapeHtml(SOURCE_CHANNEL_USERNAME)}</strong></div>
        <div>Webhook status: <strong>${info.url === webhookUrl ? "Active" : "Check required"}</strong></div>
        <div>Pending updates: <strong>${Number(info.pending_update_count ?? 0)}</strong></div>
      </div>
      <p>ขั้นตอนสุดท้าย: เพิ่มบอทเป็น Admin ใน Discussion Group ที่เชื่อมกับ Channel แล้วโพสต์ใหม่ใน Channel เพื่อทดสอบ</p>
      <p><a href="/health">เปิด Health Check</a></p>
      </main></body></html>`);
  } catch (error) {
    return html(`<!doctype html><meta charset="utf-8"><title>Setup failed</title>
      <style>body{font-family:system-ui;max-width:760px;margin:60px auto;padding:0 20px;line-height:1.6}pre{white-space:pre-wrap;background:#fee;padding:16px;border-radius:8px}</style>
      <h1>ตั้งค่าไม่สำเร็จ</h1><pre>${escapeHtml(error?.message ?? error)}</pre>
      <p>ตรวจว่า BOT_TOKEN เป็น Token ใหม่และไม่มีช่องว่างหรือบรรทัดเกิน</p>`, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return configureWebhook(request, env);
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({
        ok: true,
        service: "SHANG SHUI Telegram First Comment Bot",
        source_channel: `@${SOURCE_CHANNEL_USERNAME}`,
        token_configured: Boolean(env.BOT_TOKEN),
      });
    }

    if (!env.BOT_TOKEN) return json({ ok: false, error: "BOT_TOKEN missing" }, 503);

    const secret = await deriveWebhookSecret(env.BOT_TOKEN);
    const expectedPath = `/telegram/${secret.slice(0, 32)}`;

    if (request.method === "POST" && url.pathname === expectedPath) {
      const provided = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (provided !== secret) return json({ ok: false }, 403);

      let update;
      try {
        update = await request.json();
      } catch {
        return json({ ok: false, error: "Invalid JSON" }, 400);
      }

      const updateId = update?.update_id;
      if (!Number.isInteger(updateId)) return json({ ok: true, ignored: "no update_id" });

      const message = update?.message;
      if (!message || message.is_automatic_forward !== true) {
        return json({ ok: true, ignored: "not automatic forward" });
      }

      const source = sourceChannelUsername(message);
      if (source !== SOURCE_CHANNEL_USERNAME.toLowerCase()) {
        return json({ ok: true, ignored: "another source channel" });
      }

      const chatId = message?.chat?.id;
      const messageId = message?.message_id;
      if (!Number.isInteger(chatId) || !Number.isInteger(messageId)) {
        return json({ ok: false, error: "Missing chat/message ID" }, 400);
      }

      const cache = caches.default;
      const mediaGroupId = message?.media_group_id;
      const dedupeId = mediaGroupId
        ? `media:${chatId}:${mediaGroupId}`
        : `update:${updateId}`;
      const dedupeUrl = `https://dedupe.internal/${encodeURIComponent(dedupeId)}`;
      const dedupeRequest = new Request(dedupeUrl, { method: "GET" });
      const seen = await cache.match(dedupeRequest);
      if (seen) return json({ ok: true, duplicate: true });

      try {
        const sent = await sendFirstComment(env.BOT_TOKEN, chatId, messageId);
        await cache.put(
          dedupeRequest,
          new Response("1", {
            headers: { "Cache-Control": "public, max-age=86400" },
          }),
        );
        return json({
          ok: true,
          commented: true,
          comment_message_id: sent?.message_id ?? null,
        });
      } catch (error) {
        return json({ ok: false, error: String(error?.message ?? error) }, 500);
      }
    }

    return json({ ok: false, error: "Not found" }, 404);
  },
};
