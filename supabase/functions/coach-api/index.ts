import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

interface HabitData {
  id: number;
  name: string;
  type: "start" | "stop";
  totalDays: number;
  progress: boolean[];
  currentStreak: number;
  completionRate: number;
  linkedIdentities: string[];
  createdAt: string;
}

interface DailyStats {
  date: string;
  habitsTotal: number;
  habitsCompleted: number;
  completionRate: number;
  todayHabits: Array<{
    id: number;
    name: string;
    type: string;
    completed: boolean;
  }>;
}

interface UserStats {
  totalHabits: number;
  activeHabits: number;
  totalProgress: number;
  overallCompletionRate: number;
  identities: Array<{
    id: number;
    name: string;
    description?: string;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  const apiKey = req.headers.get("x-api-key") || url.searchParams.get("api_key");
  const validApiKey = Deno.env.get("COACH_API_KEY");

  if (!validApiKey) {
    return jsonResponse({ error: "API key not configured on server" }, 500);
  }

  if (!apiKey || apiKey !== validApiKey) {
    return jsonResponse({ error: "Unauthorized - Invalid API key" }, 401);
  }

  const userId = url.searchParams.get("user_id");
  if (!userId) {
    return jsonResponse({ error: "user_id parameter is required" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Supabase configuration missing" }, 500);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    if (path.endsWith("/habits")) {
      return await handleGetHabits(adminClient, userId);
    } else if (path.endsWith("/stats")) {
      return await handleGetStats(adminClient, userId);
    } else if (path.endsWith("/today")) {
      return await handleGetToday(adminClient, userId);
    } else if (path.endsWith("/motivation")) {
      return await handleGetMotivation(adminClient, userId);
    } else if (path.endsWith("/profile")) {
      return await handleGetProfile(adminClient, userId);
    } else if (path.endsWith("/insights") && req.method === "POST") {
      return await handlePostInsight(adminClient, userId, req);
    } else {
      return jsonResponse({
        error: "Unknown endpoint",
        availableEndpoints: ["/habits", "/stats", "/today", "/motivation", "/profile", "/insights (POST)"],
      }, 404);
    }
  } catch (error) {
    console.error("API Error:", error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});

// ============================================================
// GET /profile — Profil complet + system prompt pour le coach
// ============================================================
async function handleGetProfile(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
): Promise<Response> {
  const { data: profile, error } = await adminClient
    .from("coach_full_context")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !profile) {
    return jsonResponse({
      error: "Profile not found. Make sure user_knowledge_base has an entry for this user.",
      detail: error?.message,
    }, 404);
  }

  const systemPrompt = buildSystemPrompt(profile);
  return jsonResponse({ profile, system_prompt: systemPrompt });
}

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

// ============================================================
// POST /insights — Sauvegarder un insight de session
// ============================================================
async function handlePostInsight(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  req: Request,
): Promise<Response> {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { insight_type, content, completion_rate, related_habit_id } = body as {
    insight_type: string;
    content: string;
    completion_rate?: number;
    related_habit_id?: number;
  };

  if (!insight_type || !content) {
    return jsonResponse({ error: "insight_type and content are required" }, 400);
  }

  const validTypes = ["pattern_detected", "breakthrough", "relapse_note", "identity_shift", "coaching_note"];
  if (!validTypes.includes(insight_type)) {
    return jsonResponse({ error: `insight_type must be one of: ${validTypes.join(", ")}` }, 400);
  }

  const { error } = await adminClient
    .from("coach_insights")
    .insert({
      user_id: userId,
      insight_type,
      content,
      completion_rate_at_time: completion_rate ?? null,
      related_habit_id: related_habit_id ?? null,
    });

  if (error) {
    return jsonResponse({ error: error.message }, 500);
  }

  return jsonResponse({ success: true, message: "Insight saved successfully" });
}

// ============================================================
// GET /habits
// ============================================================
async function handleGetHabits(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
) {
  const { data: habits, error: habitsError } = await adminClient
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (habitsError) throw habitsError;

  const result: HabitData[] = [];

  for (const habit of habits || []) {
    const { data: linkedIdentities } = await adminClient
      .from("habit_identities")
      .select("identity_id, identities(name)")
      .eq("habit_id", habit.id);

    const { data: progressData } = await adminClient
      .from("habit_progress")
      .select("day_index, completed")
      .eq("habit_id", habit.id)
      .order("day_index");

    const progress = new Array(habit.total_days).fill(false);
    progressData?.forEach((item) => {
      progress[item.day_index] = item.completed;
    });

    let currentStreak = 0;
    for (let i = progress.length - 1; i >= 0; i--) {
      if (progress[i]) currentStreak++;
      else break;
    }

    const completed = progress.filter((p) => p).length;
    const completionRate = habit.total_days > 0 ? (completed / habit.total_days) * 100 : 0;

    result.push({
      id: habit.id,
      name: habit.name,
      type: habit.type,
      totalDays: habit.total_days,
      progress,
      currentStreak,
      completionRate: Math.round(completionRate * 10) / 10,
      linkedIdentities: linkedIdentities?.map((li: any) => li.identities?.name).filter(Boolean) || [],
      createdAt: habit.created_at,
    });
  }

  return jsonResponse({ habits: result });
}

// ============================================================
// GET /stats
// ============================================================
async function handleGetStats(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
): Promise<Response> {
  const { data: habits, error: habitsError } = await adminClient
    .from("habits")
    .select("id, name, total_days")
    .eq("user_id", userId);

  if (habitsError) throw habitsError;

  const habitIds = habits?.map((h) => h.id) || [];

  let totalProgress = 0;
  if (habitIds.length > 0) {
    const { count } = await adminClient
      .from("habit_progress")
      .select("id", { count: "exact" })
      .eq("completed", true)
      .in("habit_id", habitIds);
    totalProgress = count || 0;
  }

  const totalPossible = habits?.reduce((sum, h) => sum + h.total_days, 0) || 0;
  const overallCompletionRate = totalPossible > 0 ? (totalProgress / totalPossible) * 100 : 0;

  const { data: identities } = await adminClient
    .from("identities")
    .select("id, name, description")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const stats: UserStats = {
    totalHabits: habits?.length || 0,
    activeHabits: habits?.length || 0,
    totalProgress,
    overallCompletionRate: Math.round(overallCompletionRate * 10) / 10,
    identities: identities || [],
  };

  return jsonResponse({ stats });
}

// ============================================================
// GET /today
// ============================================================
async function handleGetToday(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
): Promise<Response> {
  const { data: habits, error: habitsError } = await adminClient
    .from("habits")
    .select("id, name, type, total_days")
    .eq("user_id", userId);

  if (habitsError) throw habitsError;

  const todayHabits = [];

  for (const habit of habits || []) {
    const lastDayIndex = habit.total_days - 1;
    const { data: progressData } = await adminClient
      .from("habit_progress")
      .select("completed")
      .eq("habit_id", habit.id)
      .eq("day_index", lastDayIndex)
      .single();

    todayHabits.push({
      id: habit.id,
      name: habit.name,
      type: habit.type,
      completed: progressData?.completed || false,
    });
  }

  const habitsCompleted = todayHabits.filter((h) => h.completed).length;
  const completionRate = todayHabits.length > 0 ? (habitsCompleted / todayHabits.length) * 100 : 0;

  const dailyStats: DailyStats = {
    date: new Date().toISOString().split("T")[0],
    habitsTotal: todayHabits.length,
    habitsCompleted,
    completionRate: Math.round(completionRate * 10) / 10,
    todayHabits,
  };

  return jsonResponse({ today: dailyStats });
}

// ============================================================
// GET /motivation
// ============================================================
async function handleGetMotivation(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
): Promise<Response> {
  const todayResponse = await handleGetToday(adminClient, userId);
  const todayData = await todayResponse.json();
  const today = todayData.today;

  const habitsResponse = await handleGetHabits(adminClient, userId);
  const habitsData = await habitsResponse.json();
  const habits = habitsData.habits;

  let message = "🌟 Vibes Arc Coach\n\n";

  const hour = new Date().getHours();
  if (hour < 12) message += "☀️ Bonjour ! ";
  else if (hour < 18) message += "🌤️ Bon après-midi ! ";
  else message += "🌙 Bonsoir ! ";

  if (today.completionRate === 100) {
    message += "Incroyable ! Tu as complété toutes tes habitudes aujourd'hui ! 🎉\n\n";
  } else if (today.completionRate >= 70) {
    message += `Excellent travail ! Tu es à ${today.completionRate}% aujourd'hui. Continue comme ça ! 💪\n\n`;
  } else if (today.completionRate >= 40) {
    message += `Bon départ ! ${today.completionRate}% complété. Tu peux faire encore mieux ! 🚀\n\n`;
  } else if (today.completionRate > 0) {
    message += `C'est un début ! ${today.completionRate}% complété. Chaque petit pas compte ! 🌱\n\n`;
  } else {
    message += "La journée vient de commencer ! Allons-y ensemble ! 💫\n\n";
  }

  const incompleteHabits = today.todayHabits.filter((h: any) => !h.completed);
  if (incompleteHabits.length > 0) {
    message += "📋 Habitudes du jour :\n";
    incompleteHabits.forEach((habit: any) => {
      const emoji = habit.type === "start" ? "✅" : "🛑";
      message += `${emoji} ${habit.name}\n`;
    });
    message += "\n";
  }

  const topStreaks = habits
    .sort((a: HabitData, b: HabitData) => b.currentStreak - a.currentStreak)
    .slice(0, 3)
    .filter((h: HabitData) => h.currentStreak > 0);

  if (topStreaks.length > 0) {
    message += "🔥 Tes meilleures séries :\n";
    topStreaks.forEach((habit: HabitData) => {
      message += `• ${habit.name}: ${habit.currentStreak} jours 🔥\n`;
    });
    message += "\n";
  }

  const quotes = [
    "💭 'Le succès est la somme de petits efforts répétés jour après jour.' - Robert Collier",
    "💭 'Tu n'as pas à être parfait pour commencer, mais tu dois commencer pour être parfait.'",
    "💭 'La discipline est le pont entre les objectifs et l'accomplissement.'",
    "💭 'Chaque jour est une nouvelle opportunité de devenir meilleur.'",
    "💭 'Les petites victoires quotidiennes mènent aux grandes transformations.'",
  ];
  message += quotes[Math.floor(Math.random() * quotes.length)];

  return jsonResponse({
    message,
    stats: {
      completionRate: today.completionRate,
      habitsCompleted: today.habitsCompleted,
      habitsTotal: today.habitsTotal,
      topStreaks: topStreaks.map((h: HabitData) => ({ name: h.name, streak: h.currentStreak })),
    },
  });
}

// ============================================================
// Helper
// ============================================================
function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
