import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

interface IncomingMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  device_id?: string;
  messages?: IncomingMessage[];
  provider?: "gemini" | "groq";
  reset?: boolean;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = req.headers.get("x-api-key") ?? new URL(req.url).searchParams.get("api_key");
  const validApiKey = Deno.env.get("COACH_API_KEY");
  if (!validApiKey) return jsonResponse({ error: "API key not configured on server" }, 500);
  if (!apiKey || apiKey !== validApiKey) {
    return jsonResponse({ error: "Unauthorized - Invalid API key" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Supabase configuration missing" }, 500);
  }
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, "");

  try {
    if (req.method === "GET" && path.endsWith("/history")) {
      const deviceId = url.searchParams.get("device_id");
      if (!deviceId) return jsonResponse({ error: "device_id is required" }, 400);
      const userId = await resolveUserId(admin, deviceId);
      if (!userId) return jsonResponse({ error: "Device not linked" }, 403);
      const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 200);
      return await handleGetHistory(admin, userId, limit);
    }

    if (req.method === "DELETE" && path.endsWith("/history")) {
      const deviceId = url.searchParams.get("device_id");
      if (!deviceId) return jsonResponse({ error: "device_id is required" }, 400);
      const userId = await resolveUserId(admin, deviceId);
      if (!userId) return jsonResponse({ error: "Device not linked" }, 403);
      return await handleDeleteHistory(admin, userId);
    }

    if (req.method === "POST" && path.endsWith("/insights")) {
      return await handleSaveInsight(admin, req);
    }

    if (req.method === "POST") {
      return await handleChat(admin, req);
    }

    return jsonResponse({
      error: "Unknown endpoint",
      availableEndpoints: ["POST /", "GET /history", "DELETE /history", "POST /insights"],
    }, 404);
  } catch (error) {
    console.error("coach-chat error:", error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});

// ============================================================
// Helpers : device -> user
// ============================================================

async function resolveUserId(
  admin: ReturnType<typeof createClient>,
  deviceId: string,
): Promise<string | null> {
  const { data, error } = await admin
    .from("device_widgets")
    .select("user_id")
    .eq("device_id", deviceId)
    .maybeSingle();
  if (error || !data || !data.user_id) return null;
  return data.user_id as string;
}

// ============================================================
// POST / : chat
// ============================================================

async function handleChat(
  admin: ReturnType<typeof createClient>,
  req: Request,
): Promise<Response> {
  let body: ChatRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const deviceId = (body.device_id ?? "").trim();
  if (!deviceId) return jsonResponse({ error: "device_id is required" }, 400);

  const userId = await resolveUserId(admin, deviceId);
  if (!userId) return jsonResponse({ error: "Device not linked" }, 403);

  if (body.reset) {
    await admin.from("coach_messages").delete().eq("user_id", userId);
    await admin.from("coach_memory").delete().eq("user_id", userId);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return jsonResponse({ error: "messages must be a non-empty array" }, 400);
  }
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== "user" || !lastMessage.content?.trim()) {
    return jsonResponse({ error: "last message must be a non-empty user message" }, 400);
  }

  const provider: "gemini" | "groq" = body.provider === "groq" ? "groq" : "gemini";

  const { data: profile } = await admin
    .from("coach_full_context")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const systemPrompt = profile
    ? buildSystemPrompt(profile as Record<string, unknown>)
    : FALLBACK_SYSTEM_PROMPT;

  const userContext = await buildUserContext(admin, userId);

  const systemMessage = `${systemPrompt}\n\n📊 DONNÉES DE L'UTILISATEUR :\n${JSON.stringify(userContext, null, 2)}`;

  let reply: string;
  try {
    reply = provider === "groq"
      ? await callGroq(systemMessage, messages)
      : await callGemini(systemMessage, messages);
  } catch (primaryError) {
    console.warn(`${provider} failed, trying fallback`, primaryError);
    try {
      reply = provider === "groq"
        ? await callGemini(systemMessage, messages)
        : await callGroq(systemMessage, messages);
    } catch (fallbackError) {
      return jsonResponse({
        error: "Coach AI providers failed",
        detail: (fallbackError as Error).message,
      }, 502);
    }
  }

  const { data: inserted, error: insertError } = await admin
    .from("coach_messages")
    .insert([
      { user_id: userId, role: "user", content: lastMessage.content, provider },
      { user_id: userId, role: "assistant", content: reply, provider },
    ])
    .select("id");

  if (insertError) {
    console.error("Failed to persist messages:", insertError);
  }

  try {
    await updateCoachMemory(admin, userId, messages, reply);
  } catch (memError) {
    console.warn("Memory update failed:", memError);
  }

  return jsonResponse({
    reply,
    provider,
    message_id: inserted?.[inserted.length - 1]?.id ?? null,
  });
}

// ============================================================
// GET /history
// ============================================================

async function handleGetHistory(
  admin: ReturnType<typeof createClient>,
  userId: string,
  limit: number,
): Promise<Response> {
  const { data, error } = await admin
    .from("coach_messages")
    .select("id, role, content, provider, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return jsonResponse({ error: error.message }, 500);

  const messages = (data ?? []).slice().reverse();
  return jsonResponse({ messages });
}

// ============================================================
// DELETE /history
// ============================================================

async function handleDeleteHistory(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<Response> {
  const { error: msgErr } = await admin.from("coach_messages").delete().eq("user_id", userId);
  if (msgErr) return jsonResponse({ error: msgErr.message }, 500);
  const { error: memErr } = await admin.from("coach_memory").delete().eq("user_id", userId);
  if (memErr) return jsonResponse({ error: memErr.message }, 500);
  return jsonResponse({ success: true });
}

// ============================================================
// POST /insights : résout device -> user et insère dans coach_insights
// ============================================================

async function handleSaveInsight(
  admin: ReturnType<typeof createClient>,
  req: Request,
): Promise<Response> {
  let body: {
    device_id?: string;
    insight_type?: string;
    content?: string;
    completion_rate?: number;
    related_habit_id?: number;
  };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }
  const deviceId = (body.device_id ?? "").trim();
  if (!deviceId) return jsonResponse({ error: "device_id is required" }, 400);
  const userId = await resolveUserId(admin, deviceId);
  if (!userId) return jsonResponse({ error: "Device not linked" }, 403);

  const insightType = body.insight_type ?? "coaching_note";
  const content = (body.content ?? "").trim();
  if (!content) return jsonResponse({ error: "content is required" }, 400);

  const validTypes = [
    "pattern_detected",
    "breakthrough",
    "relapse_note",
    "identity_shift",
    "coaching_note",
  ];
  if (!validTypes.includes(insightType)) {
    return jsonResponse({ error: `insight_type must be one of: ${validTypes.join(", ")}` }, 400);
  }

  const { error } = await admin.from("coach_insights").insert({
    user_id: userId,
    insight_type: insightType,
    content,
    completion_rate_at_time: body.completion_rate ?? null,
    related_habit_id: body.related_habit_id ?? null,
  });
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true });
}

// ============================================================
// User context (habits + today + memory)
// ============================================================

async function buildUserContext(
  admin: ReturnType<typeof createClient>,
  userId: string,
): Promise<Record<string, unknown>> {
  const { data: habits } = await admin
    .from("habits")
    .select("id, name, type, total_days, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const habitSummaries = [];
  let totalCompletedToday = 0;
  let totalActiveToday = 0;
  const todayHabits = [];

  for (const habit of habits ?? []) {
    const { data: progressData } = await admin
      .from("habit_progress")
      .select("day_index, completed")
      .eq("habit_id", habit.id)
      .order("day_index");

    const progress: boolean[] = new Array(habit.total_days).fill(false);
    progressData?.forEach((item: { day_index: number; completed: boolean }) => {
      if (item.day_index >= 0 && item.day_index < progress.length) {
        progress[item.day_index] = item.completed;
      }
    });

    let currentStreak = 0;
    for (let i = progress.length - 1; i >= 0; i--) {
      if (progress[i]) currentStreak++;
      else break;
    }

    const completed = progress.filter(Boolean).length;
    const completionRate = habit.total_days > 0
      ? Math.round((completed / habit.total_days) * 1000) / 10
      : 0;

    const lastDay = progress.length - 1;
    const doneToday = lastDay >= 0 ? progress[lastDay] : false;

    habitSummaries.push({
      id: habit.id,
      nom: habit.name,
      type: habit.type === "start" ? "À démarrer" : "À arrêter",
      série_actuelle: currentStreak,
      taux_complétion: `${completionRate}%`,
      fait_aujourd_hui: doneToday ? "Oui" : "Non",
    });

    todayHabits.push({
      id: habit.id,
      name: habit.name,
      type: habit.type,
      completed: doneToday,
    });

    totalActiveToday += 1;
    if (doneToday) totalCompletedToday += 1;
  }

  const today = {
    date: new Date().toISOString().split("T")[0],
    habitsTotal: totalActiveToday,
    habitsCompleted: totalCompletedToday,
    completionRate: totalActiveToday > 0
      ? Math.round((totalCompletedToday / totalActiveToday) * 1000) / 10
      : 0,
    restantes: todayHabits.filter((h) => !h.completed).map((h) => h.name),
  };

  const { data: memRow } = await admin
    .from("coach_memory")
    .select("summary, key_facts, conversation_count, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  const memory = memRow
    ? {
      résumé: memRow.summary ?? "",
      faits: memRow.key_facts ?? [],
      sessions: memRow.conversation_count ?? 0,
      maj: memRow.updated_at ?? null,
    }
    : null;

  const context: Record<string, unknown> = {
    résumé_du_jour: today,
    habitudes: habitSummaries,
    restantes_aujourd_hui: today.restantes,
  };
  if (memory) context.mémoire = memory;

  return context;
}

// ============================================================
// Coach memory update (same spirit as web updateMemoryFromConversation)
// ============================================================

async function updateCoachMemory(
  admin: ReturnType<typeof createClient>,
  userId: string,
  incomingMessages: IncomingMessage[],
  assistantReply: string,
): Promise<void> {
  const full = [...incomingMessages, { role: "assistant" as const, content: assistantReply }];
  if (full.length < 4) return;

  const { data: existing } = await admin
    .from("coach_memory")
    .select("summary, conversation_count")
    .eq("user_id", userId)
    .maybeSingle();

  const previousSummary = existing?.summary ?? "";
  const conversationCount = (existing?.conversation_count ?? 0) + 1;

  const recent = full.slice(-10);
  const snippet = recent
    .map((m) => `${m.role === "user" ? "User" : "Coach"}: ${m.content.slice(0, 100)}`)
    .join(" | ");
  const prefix = previousSummary ? `${previousSummary}\n` : "";
  const dateFr = new Date().toLocaleDateString("fr-FR");
  let summary = `${prefix}[${dateFr}] ${snippet.slice(0, 400)}`;
  if (summary.length > 2000) summary = summary.slice(-2000);

  await admin
    .from("coach_memory")
    .upsert({
      user_id: userId,
      summary,
      conversation_count: conversationCount,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
}

// ============================================================
// LLM providers
// ============================================================

async function callGemini(
  systemMessage: string,
  messages: IncomingMessage[],
): Promise<string> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body = {
    system_instruction: { parts: [{ text: systemMessage }] },
    contents,
    generationConfig: {
      temperature: 0.85,
      maxOutputTokens: 1500,
      topP: 0.95,
    },
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini empty response");
  return text;
}

async function callGroq(
  systemMessage: string,
  messages: IncomingMessage[],
): Promise<string> {
  const apiKey = Deno.env.get("GROQ_API_KEY");
  if (!apiKey) throw new Error("GROQ_API_KEY not configured");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemMessage },
        ...messages,
      ],
      temperature: 0.85,
      max_tokens: 1500,
      top_p: 0.95,
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Groq empty response");
  return text;
}

// ============================================================
// System prompt (cloned from coach-api to stay consistent)
// ============================================================

const FALLBACK_SYSTEM_PROMPT = `Tu es le coach personnel de l'utilisateur - son allié dans la durée, jamais son juge.
Tu réponds toujours en français, direct, chaleureux, ancré dans le réel.
Si aucune donnée de profil n'est disponible, reste prudent, pose des questions et encourage l'utilisateur à finaliser sa base de connaissance.`;

function buildSystemPrompt(profile: Record<string, any>): string {
  const ps = profile.psychological_profile || {};
  const cs = profile.coaching_style || {};
  const pr = profile.practices || {};
  const goals = (profile.life_goals || []) as Array<{ horizon: string; label: string }>;
  const insights = (profile.recent_insights || []) as Array<{ content: string; insight_type: string }>;
  const anxietyEvents = (profile.active_anxiety_events || []) as Array<{ trigger_label: string; intensity: number }>;

  const shortTermGoals = goals
    .filter((g) => g.horizon === "court_terme")
    .map((g) => `• ${g.label}`)
    .join("\n");

  const recentInsightsText = insights.length > 0
    ? insights.map((i) => `• [${i.insight_type}] ${i.content}`).join("\n")
    : "Aucun insight enregistré encore.";

  const activeAnxiety = anxietyEvents.length > 0
    ? anxietyEvents.map((e) => `• ${e.trigger_label} (intensité: ${e.intensity}/10)`).join("\n")
    : "Aucun événement actif.";

  return `Tu es le coach personnel de ${profile.full_name} — son allié dans la durée, jamais son juge.
Tu combines une connaissance profonde de qui il est avec ses données réelles du moment.
Tu réponds TOUJOURS en français. Tu es direct, chaleureux, ancré dans le réel.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## QUI EST-IL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${profile.full_name}, ${profile.profession}.
Localisation : ${profile.location}.
Il a construit Vibes Arc lui-même — il sait comment le système fonctionne.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## SES DÉFIS PROFONDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Défis principaux : ${(ps.challenges || []).join(", ")}

Triggers d'anxiété :
${(ps.anxiety_triggers || []).map((t: string) => `• ${t}`).join("\n")}

Patterns d'auto-sabotage :
${(ps.self_sabotage_patterns || []).map((p: string) => `• ${p}`).join("\n")}

Événements d'anxiété actuellement actifs :
${activeAnxiety}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## SES FORCES (à rappeler quand l'anxiété parle)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${(ps.strengths || []).map((s: string) => `• ${s}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## SES PRATIQUES ET RESSOURCES INTERNES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Routine matinale : ${(pr.morning_routine || []).join(" → ")}
Frameworks : ${(pr.frameworks || []).join(", ")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## COMMENT LUI PARLER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ton : ${cs.tone || "bienveillant_mais_direct"}

Approches à privilégier :
${(cs.preferred_approach || []).map((a: string) => `✅ ${a}`).join("\n")}

À éviter absolument :
${(cs.avoid || []).map((a: string) => `❌ ${a}`).join("\n")}

Protocole décrochage (si taux < ${cs.relapse_protocol?.threshold_completion_rate || 40}%) :
${(cs.relapse_protocol?.steps || []).map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## SES OBJECTIFS (court terme)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${shortTermGoals}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## INSIGHTS RÉCENTS DU COACH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${recentInsightsText}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## NOTES DU COACH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${profile.coach_notes}

Combine toujours ce profil avec les données d'habitudes du moment pour des conseils ancrés et précis.`;
}
