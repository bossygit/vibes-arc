import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type NotificationChannel = "none" | "telegram" | "whatsapp";

interface NotificationPayload {
  mode?: "single" | "fanout";
  reason?: string;
  userId?: string | string[];
  previewMessage?: string;
}

interface UserPrefsRow {
  notif_enabled: boolean | null;
  notif_channel: NotificationChannel | null;
  notif_hour: number | null;
  notif_timezone: string | null;
  telegram_chat_id: string | null;
  telegram_username: string | null;
  whatsapp_number: string | null;
  last_notif_sent_at: string | null;
}

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  whatsappFrom: string;
}

const DEFAULT_APP_URL = Deno.env.get("NOTIFICATIONS_APP_URL") ?? "https://vibes-arc.vercel.app";

serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Méthode non autorisée" }, 405);
  }

  const payload = await parsePayload(req);
  const mode = payload.mode ?? "single";
  const reason = payload.reason ?? "manual-test";

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Variables Supabase manquantes");
    return jsonResponse({ status: "error", reason: "SUPABASE_URL ou SERVICE_ROLE absents" }, 500);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  if (mode === "single") {
    const userId = payload.userId ?? (await resolveUserId(adminClient, req));
    if (!userId) {
      return jsonResponse({ status: "error", reason: "Impossible d'identifier l'utilisateur" }, 401);
    }

    const result = await sendNotificationToUser(adminClient, userId, {
      reason,
      previewMessage: payload.previewMessage,
    });
    return jsonResponse(result, result.status === "sent" ? 200 : 200);
  }

  if (mode === "fanout") {
    // Fanout basique: envoyer aux utilisateurs explicitement passés dans le payload
    const userIds: string[] = Array.isArray(payload.userId) ? payload.userId : payload.userId ? [payload.userId] : [];
    if (userIds.length === 0) {
      return jsonResponse({ status: "error", reason: "Aucun utilisateur fourni pour le mode fanout" }, 400);
    }

    const results = [];
    for (const id of userIds) {
      results.push(await sendNotificationToUser(adminClient, id, { reason }));
    }
    return jsonResponse({ status: "fanout-completed", results });
  }

  return jsonResponse({ status: "error", reason: `Mode ${mode} non supporté` }, 400);
});

async function parsePayload(req: Request): Promise<NotificationPayload> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

async function resolveUserId(adminClient: ReturnType<typeof createClient>, req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;
  const { data, error } = await adminClient.auth.getUser(token);
  if (error || !data?.user) {
    console.warn("Impossible de décoder l'utilisateur", error);
    return null;
  }
  return data.user.id;
}

async function sendNotificationToUser(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  options: { reason: string; previewMessage?: string },
) {
  const prefs = await fetchUserPrefs(adminClient, userId);
  if (!prefs?.notif_enabled) {
    return { status: "skipped", reason: "Notifications désactivées" };
  }

  const channel: NotificationChannel = prefs.notif_channel ?? "none";
  if (channel === "none") {
    return { status: "skipped", reason: "Aucun canal n'est configuré" };
  }

  const message = options.previewMessage ?? (await buildMessage(adminClient, userId, prefs));

  try {
    if (channel === "telegram") {
      const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
      if (!token) {
        return { status: "error", reason: "TELEGRAM_BOT_TOKEN manquant" };
      }
      if (!prefs.telegram_chat_id) {
        return { status: "skipped", reason: "Chat ID Telegram manquant" };
      }

      await sendTelegramMessage(token, prefs.telegram_chat_id, message);
      await markNotificationSent(adminClient, userId);
      return { status: "sent", channel, message: "Notification envoyée sur Telegram" };
    }

    if (channel === "whatsapp") {
      const twilioConfig = readTwilioConfig();
      if (!twilioConfig) {
        return { status: "error", reason: "Configuration Twilio manquante pour WhatsApp" };
      }
      if (!prefs.whatsapp_number) {
        return { status: "skipped", reason: "Numéro WhatsApp absent" };
      }

      await sendWhatsAppMessage(twilioConfig, prefs.whatsapp_number, message);
      await markNotificationSent(adminClient, userId);
      return { status: "sent", channel, message: "Notification envoyée sur WhatsApp" };
    }

    return { status: "error", reason: `Canal ${channel} non supporté` };
  } catch (error) {
    console.error(`Erreur lors de l'envoi (${channel})`, error);
    return { status: "error", reason: (error as Error).message ?? "Erreur inconnue" };
  }
}

async function fetchUserPrefs(adminClient: ReturnType<typeof createClient>, userId: string): Promise<UserPrefsRow | null> {
  const { data, error } = await adminClient
    .from("user_prefs")
    .select(
      "notif_enabled, notif_channel, notif_hour, notif_timezone, telegram_chat_id, telegram_username, whatsapp_number, last_notif_sent_at",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Impossible de charger user_prefs", error);
    return null;
  }

  if (!data) {
    return {
      notif_enabled: false,
      notif_channel: "none",
      notif_hour: 20,
      notif_timezone: "Europe/Paris",
      telegram_chat_id: null,
      telegram_username: null,
      whatsapp_number: null,
      last_notif_sent_at: null,
    };
  }

  return data;
}

async function buildMessage(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  prefs: UserPrefsRow,
): Promise<string> {
  const { data: habits } = await adminClient
    .from("habits")
    .select("id, name, type")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(5);

  const timezone = prefs.notif_timezone || "Europe/Paris";
  const now = new Date();
  const formattedTime = formatLocalTime(now, timezone);

  const lines = [
    "✨ Rappel Vibes Arc",
    `🕒 Il est ${formattedTime} (${timezone}) – moment idéal pour ancrer tes habitudes.`,
  ];

  if (habits && habits.length > 0) {
    lines.push(
      "",
      "🎯 Focalise-toi sur :",
      ...habits.map((habit, index) => {
        const label = habit.type === "stop" ? "à réduire" : "à renforcer";
        return `${index + 1}. ${habit.name} (${label})`;
      }),
    );
  } else {
    lines.push("", "Tu n'as pas encore d'habitude active. Ajoute-en une depuis l'app pour recevoir des rappels ciblés.");
  }

  lines.push("", `✅ Mets à jour tes progrès : ${DEFAULT_APP_URL}`);

  return lines.join("\n");
}

function formatLocalTime(date: Date, timezone: string) {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: timezone,
    }).format(date);
  } catch (_err) {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
}

async function sendTelegramMessage(token: string, chatId: string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  const payload = await response.json();
  if (!response.ok || !payload?.ok) {
    console.error("Réponse Telegram:", payload);
    throw new Error(payload?.description ?? "Échec de l'appel Telegram");
  }
}

function readTwilioConfig(): TwilioConfig | null {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const whatsappFrom = Deno.env.get("TWILIO_WHATSAPP_FROM");
  if (!accountSid || !authToken || !whatsappFrom) {
    return null;
  }
  return { accountSid, authToken, whatsappFrom };
}

async function sendWhatsAppMessage(config: TwilioConfig, to: string, body: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
  const searchParams = new URLSearchParams({
    From: formatWhatsappAddress(config.whatsappFrom),
    To: formatWhatsappAddress(to),
    Body: body,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${config.accountSid}:${config.authToken}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: searchParams.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Twilio error ${response.status}: ${errorText}`);
  }
}

function formatWhatsappAddress(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith("whatsapp:")) {
    return trimmed;
  }
  const digits = trimmed.replace(/[^\d+]/g, "");
  const normalized = digits.startsWith("+") ? digits : `+${digits}`;
  return `whatsapp:${normalized}`;
}

async function markNotificationSent(adminClient: ReturnType<typeof createClient>, userId: string) {
  await adminClient
    .from("user_prefs")
    .update({ last_notif_sent_at: new Date().toISOString() })
    .eq("user_id", userId);
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

