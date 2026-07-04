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

type ReviewPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "midyear" | "yearly";

const WIDGET_APP_START = new Date(2025, 9, 1); // 1 Oct 2025 — same as web app

function dateToDayIndex(d: Date): number {
  const base = new Date(WIDGET_APP_START);
  base.setHours(0, 0, 0, 0);
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return Math.floor((copy.getTime() - base.getTime()) / 86_400_000);
}

function todayDayIndex(): number {
  return dateToDayIndex(new Date());
}

function dayIndexToISO(idx: number): string {
  const d = new Date(WIDGET_APP_START);
  d.setDate(d.getDate() + idx);
  return d.toISOString().split("T")[0];
}

function getPeriodRange(period: ReviewPeriod): {
  startDate: Date;
  endDate: Date;
  compareStartDate: Date | null;
  compareEndDate: Date | null;
} {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  const endDate = new Date(now);
  let startDate: Date;
  let compareStartDate: Date | null = null;
  let compareEndDate: Date | null = null;

  switch (period) {
    case "daily": {
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      compareStartDate = new Date(startDate);
      compareStartDate.setDate(compareStartDate.getDate() - 1);
      compareEndDate = new Date(compareStartDate);
      compareEndDate.setHours(23, 59, 59, 999);
      break;
    }
    case "weekly": {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      compareEndDate = new Date(startDate);
      compareEndDate.setDate(compareEndDate.getDate() - 1);
      compareEndDate.setHours(23, 59, 59, 999);
      compareStartDate = new Date(compareEndDate);
      compareStartDate.setDate(compareStartDate.getDate() - 6);
      compareStartDate.setHours(0, 0, 0, 0);
      break;
    }
    case "monthly": {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      compareEndDate = new Date(startDate);
      compareEndDate.setDate(compareEndDate.getDate() - 1);
      compareEndDate.setHours(23, 59, 59, 999);
      compareStartDate = new Date(compareEndDate);
      compareStartDate.setDate(compareStartDate.getDate() - 29);
      compareStartDate.setHours(0, 0, 0, 0);
      break;
    }
    case "quarterly": {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 89);
      startDate.setHours(0, 0, 0, 0);
      compareEndDate = new Date(startDate);
      compareEndDate.setDate(compareEndDate.getDate() - 1);
      compareEndDate.setHours(23, 59, 59, 999);
      compareStartDate = new Date(compareEndDate);
      compareStartDate.setDate(compareStartDate.getDate() - 89);
      compareStartDate.setHours(0, 0, 0, 0);
      break;
    }
    case "midyear": {
      startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);
      compareStartDate = new Date(now.getFullYear() - 1, 0, 1);
      compareStartDate.setHours(0, 0, 0, 0);
      compareEndDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      compareEndDate.setHours(23, 59, 59, 999);
      break;
    }
    case "yearly": {
      startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);
      compareStartDate = new Date(now.getFullYear() - 1, 0, 1);
      compareStartDate.setHours(0, 0, 0, 0);
      compareEndDate = new Date(now.getFullYear() - 1, 11, 31);
      compareEndDate.setHours(23, 59, 59, 999);
      break;
    }
    default:
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
  }

  return { startDate, endDate, compareStartDate, compareEndDate };
}

function computeStreak(completedDays: number[]): { current: number; longest: number } {
  if (completedDays.length === 0) return { current: 0, longest: 0 };
  const sorted = [...new Set(completedDays)].sort((a, b) => a - b);
  let longest = 1;
  let current = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === sorted[i - 1] + 1) {
      run++;
    } else {
      longest = Math.max(longest, run);
      run = 1;
    }
  }
  longest = Math.max(longest, run);

  const todayIdx = todayDayIndex();
  const set = new Set(sorted);
  if (set.has(todayIdx)) {
    current = 1;
    for (let d = todayIdx - 1; d >= 0; d--) {
      if (set.has(d)) current++;
      else break;
    }
  } else if (set.has(todayIdx - 1)) {
    current = 1;
    for (let d = todayIdx - 2; d >= 0; d--) {
      if (set.has(d)) current++;
      else break;
    }
  } else {
    current = 0;
  }

  return { current, longest };
}

function completionRateForRange(
  progressByDay: Map<number, Set<number>>,
  habitIds: number[],
  startIdx: number,
  endIdx: number,
): number {
  if (habitIds.length === 0 || endIdx < startIdx) return 0;
  let totalSlots = 0;
  let completed = 0;
  for (let d = startIdx; d <= endIdx; d++) {
    totalSlots += habitIds.length;
    const daySet = progressByDay.get(d);
    if (daySet) completed += daySet.size;
  }
  return totalSlots > 0 ? Math.round((completed / totalSlots) * 1000) / 10 : 0;
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
    } else if (path.endsWith("/review-context")) {
      const period = (url.searchParams.get("period") || "weekly") as ReviewPeriod;
      return await handleGetReviewContext(adminClient, userId, period);
    } else if (path.endsWith("/psychology") && req.method === "POST") {
      return await handlePostPsychology(adminClient, userId, req);
    } else if (path.endsWith("/psychology")) {
      return await handleGetPsychology(adminClient, userId);
    } else if (path.endsWith("/knowledge-graph") && req.method === "POST") {
      return await handlePostKnowledgeGraph(adminClient, userId, req);
    } else if (path.endsWith("/knowledge-graph")) {
      return await handleGetKnowledgeGraph(adminClient, userId);
    } else {
      return jsonResponse({
        error: "Unknown endpoint",
        availableEndpoints: [
          "/habits", "/stats", "/today", "/motivation", "/profile",
          "/insights (POST)", "/review-context", "/psychology", "/knowledge-graph",
        ],
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
// GET /review-context — Aggregated data for coaching reviews
// ============================================================
async function handleGetReviewContext(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  period: ReviewPeriod,
): Promise<Response> {
  const validPeriods: ReviewPeriod[] = ["daily", "weekly", "monthly", "quarterly", "midyear", "yearly"];
  if (!validPeriods.includes(period)) {
    return jsonResponse({ error: `period must be one of: ${validPeriods.join(", ")}` }, 400);
  }

  const { startDate, endDate, compareStartDate, compareEndDate } = getPeriodRange(period);
  const startIdx = dateToDayIndex(startDate);
  const endIdx = dateToDayIndex(endDate);
  const compareStartIdx = compareStartDate ? dateToDayIndex(compareStartDate) : null;
  const compareEndIdx = compareEndDate ? dateToDayIndex(compareEndDate) : null;

  const habitsResponse = await handleGetHabits(adminClient, userId);
  const habitsData = await habitsResponse.json();
  const habits: HabitData[] = habitsData.habits || [];

  const statsResponse = await handleGetStats(adminClient, userId);
  const statsData = await statsResponse.json();
  const stats: UserStats = statsData.stats;

  const todayResponse = await handleGetToday(adminClient, userId);
  const todayData = await todayResponse.json();

  const { data: profile } = await adminClient
    .from("coach_full_context")
    .select("*")
    .eq("user_id", userId)
    .single();

  const { data: insights } = await adminClient
    .from("coach_insights")
    .select("insight_type, content, created_at")
    .eq("user_id", userId)
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: false })
    .limit(30);

  const habitIds = habits.map((h) => h.id);
  const progressByDay = new Map<number, Set<number>>();

  if (habitIds.length > 0) {
    const { data: progressRows } = await adminClient
      .from("habit_progress")
      .select("habit_id, day_index")
      .in("habit_id", habitIds)
      .eq("completed", true)
      .gte("day_index", Math.max(0, compareStartIdx ?? startIdx))
      .lte("day_index", endIdx);

    for (const row of progressRows || []) {
      const di = row.day_index as number;
      if (!progressByDay.has(di)) progressByDay.set(di, new Set());
      progressByDay.get(di)!.add(row.habit_id as number);
    }
  }

  const habitAnalytics = habits.map((habit) => {
    const completedDays: number[] = [];
    for (const [dayIdx, set] of progressByDay.entries()) {
      if (set.has(habit.id)) completedDays.push(dayIdx);
    }
    const streaks = computeStreak(completedDays);
    const periodRate = completionRateForRange(progressByDay, [habit.id], startIdx, endIdx);
    const compareRate = compareStartIdx !== null && compareEndIdx !== null
      ? completionRateForRange(progressByDay, [habit.id], compareStartIdx, compareEndIdx)
      : null;
    const trend = compareRate !== null ? periodRate - compareRate : null;

    return {
      id: habit.id,
      name: habit.name,
      type: habit.type,
      completionRate: habit.completionRate,
      periodCompletionRate: periodRate,
      compareCompletionRate: compareRate,
      trend,
      currentStreak: streaks.current,
      longestStreak: streaks.longest,
      linkedIdentities: habit.linkedIdentities,
    };
  });

  const overallPeriodRate = completionRateForRange(progressByDay, habitIds, startIdx, endIdx);
  const overallCompareRate = compareStartIdx !== null && compareEndIdx !== null
    ? completionRateForRange(progressByDay, habitIds, compareStartIdx, compareEndIdx)
    : null;

  const topPerforming = habitAnalytics
    .filter((h) => h.periodCompletionRate >= 70)
    .sort((a, b) => b.periodCompletionRate - a.periodCompletionRate)
    .slice(0, 5);

  const struggling = habitAnalytics
    .filter((h) => h.periodCompletionRate < 40)
    .sort((a, b) => a.periodCompletionRate - b.periodCompletionRate)
    .slice(0, 5);

  const improving = habitAnalytics
    .filter((h) => h.trend !== null && h.trend > 10)
    .sort((a, b) => (b.trend ?? 0) - (a.trend ?? 0))
    .slice(0, 5);

  const declining = habitAnalytics
    .filter((h) => h.trend !== null && h.trend < -10)
    .sort((a, b) => (a.trend ?? 0) - (b.trend ?? 0))
    .slice(0, 5);

  const dailyBreakdown: Array<{ date: string; completionRate: number; completed: number; total: number }> = [];
  for (let d = startIdx; d <= endIdx; d++) {
    const daySet = progressByDay.get(d) || new Set();
    dailyBreakdown.push({
      date: dayIndexToISO(d),
      completionRate: habitIds.length > 0
        ? Math.round((daySet.size / habitIds.length) * 1000) / 10
        : 0,
      completed: daySet.size,
      total: habitIds.length,
    });
  }

  let psychology: Record<string, unknown> = {};
  const { data: psychRows } = await adminClient
    .from("psychology_snapshots")
    .select("module_type, data, synced_at")
    .eq("user_id", userId)
    .order("synced_at", { ascending: false });

  if (psychRows) {
    for (const row of psychRows) {
      if (!psychology[row.module_type as string]) {
        psychology[row.module_type as string] = row.data;
      }
    }
  }

  return jsonResponse({
    period: {
      type: period,
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
      compareStart: compareStartDate?.toISOString().split("T")[0] ?? null,
      compareEnd: compareEndDate?.toISOString().split("T")[0] ?? null,
      dayIndexStart: startIdx,
      dayIndexEnd: endIdx,
    },
    habits: {
      total: habits.length,
      analytics: habitAnalytics,
      topPerforming,
      struggling,
      improving,
      declining,
    },
    stats: {
      overall: stats,
      periodCompletionRate: overallPeriodRate,
      compareCompletionRate: overallCompareRate,
      trend: overallCompareRate !== null ? overallPeriodRate - overallCompareRate : null,
    },
    today: todayData.today,
    dailyBreakdown,
    profile: profile ?? null,
    insights: insights ?? [],
    psychology,
  });
}

// ============================================================
// GET/POST /psychology — Psychology module sync
// ============================================================
async function handleGetPsychology(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
): Promise<Response> {
  const { data, error } = await adminClient
    .from("psychology_snapshots")
    .select("module_type, data, synced_at")
    .eq("user_id", userId)
    .order("synced_at", { ascending: false });

  if (error) return jsonResponse({ error: error.message }, 500);

  const latest: Record<string, unknown> = {};
  for (const row of data || []) {
    if (!latest[row.module_type as string]) {
      latest[row.module_type as string] = { data: row.data, synced_at: row.synced_at };
    }
  }
  return jsonResponse({ psychology: latest });
}

async function handlePostPsychology(
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

  const { module_type, data } = body as { module_type: string; data: Record<string, unknown> };
  const validModules = [
    "inner_child", "priming", "manifestation", "focus_wheel",
    "money_mindset", "magic_gratitude", "environment",
  ];
  if (!module_type || !validModules.includes(module_type)) {
    return jsonResponse({ error: `module_type must be one of: ${validModules.join(", ")}` }, 400);
  }
  if (!data) return jsonResponse({ error: "data is required" }, 400);

  const { error } = await adminClient.from("psychology_snapshots").insert({
    user_id: userId,
    module_type,
    data,
  });
  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ success: true });
}

// ============================================================
// GET/POST /knowledge-graph — Personal knowledge graph edges
// ============================================================
async function handleGetKnowledgeGraph(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
): Promise<Response> {
  const { data, error } = await adminClient
    .from("knowledge_graph_edges")
    .select("*")
    .eq("user_id", userId)
    .order("detected_at", { ascending: false })
    .limit(100);

  if (error) return jsonResponse({ error: error.message }, 500);
  return jsonResponse({ edges: data ?? [] });
}

async function handlePostKnowledgeGraph(
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

  const patterns = (body.patterns || [body]) as Array<Record<string, unknown>>;
  const inserted = [];

  for (const p of patterns) {
    const { source_type, source_id, target_type, target_id, relationship, strength, evidence } = p;
    if (!source_type || !source_id || !target_type || !target_id || !relationship) continue;

    const { data, error } = await adminClient
      .from("knowledge_graph_edges")
      .upsert({
        user_id: userId,
        source_type,
        source_id,
        target_type,
        target_id,
        relationship,
        strength: strength ?? 0.5,
        evidence: evidence ?? [],
      }, { onConflict: "user_id,source_type,source_id,target_type,target_id,relationship" })
      .select()
      .single();

    if (!error && data) inserted.push(data);
  }

  return jsonResponse({ success: true, inserted: inserted.length, edges: inserted });
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
