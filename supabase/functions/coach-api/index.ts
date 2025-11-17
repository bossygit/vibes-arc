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
  // Gérer les requêtes OPTIONS (preflight CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname;

  // Authentification par API key
  const apiKey = req.headers.get("x-api-key") || url.searchParams.get("api_key");
  const validApiKey = Deno.env.get("COACH_API_KEY");

  if (!validApiKey) {
    return jsonResponse({ error: "API key not configured on server" }, 500);
  }

  if (!apiKey || apiKey !== validApiKey) {
    return jsonResponse({ error: "Unauthorized - Invalid API key" }, 401);
  }

  // Récupérer le user_id depuis le query parameter
  const userId = url.searchParams.get("user_id");
  if (!userId) {
    return jsonResponse({ error: "user_id parameter is required" }, 400);
  }

  // Initialiser le client Supabase admin
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Supabase configuration missing" }, 500);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Router basé sur le path
  try {
    if (path.endsWith("/habits")) {
      return await handleGetHabits(adminClient, userId);
    } else if (path.endsWith("/stats")) {
      return await handleGetStats(adminClient, userId);
    } else if (path.endsWith("/today")) {
      return await handleGetToday(adminClient, userId);
    } else if (path.endsWith("/motivation")) {
      return await handleGetMotivation(adminClient, userId);
    } else {
      return jsonResponse({
        error: "Unknown endpoint",
        availableEndpoints: ["/habits", "/stats", "/today", "/motivation"],
      }, 404);
    }
  } catch (error) {
    console.error("API Error:", error);
    return jsonResponse({ error: (error as Error).message }, 500);
  }
});

// GET /habits - Récupérer toutes les habitudes avec progression détaillée
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
    // Récupérer les identités liées
    const { data: linkedIdentities } = await adminClient
      .from("habit_identities")
      .select("identity_id, identities(name)")
      .eq("habit_id", habit.id);

    // Récupérer la progression
    const { data: progressData } = await adminClient
      .from("habit_progress")
      .select("day_index, completed")
      .eq("habit_id", habit.id)
      .order("day_index");

    const progress = new Array(habit.total_days).fill(false);
    progressData?.forEach((item) => {
      progress[item.day_index] = item.completed;
    });

    // Calculer le streak actuel
    let currentStreak = 0;
    for (let i = progress.length - 1; i >= 0; i--) {
      if (progress[i]) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Taux de complétion
    const completed = progress.filter((p) => p).length;
    const completionRate = habit.total_days > 0
      ? (completed / habit.total_days) * 100
      : 0;

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

// GET /stats - Statistiques globales de l'utilisateur
async function handleGetStats(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
): Promise<Response> {
  // Récupérer les habitudes
  const { data: habits, error: habitsError } = await adminClient
    .from("habits")
    .select("id, name, total_days")
    .eq("user_id", userId);

  if (habitsError) throw habitsError;

  const habitIds = habits?.map((h) => h.id) || [];

  // Calculer la progression totale
  let totalProgress = 0;
  if (habitIds.length > 0) {
    const { count } = await adminClient
      .from("habit_progress")
      .select("id", { count: "exact" })
      .eq("completed", true)
      .in("habit_id", habitIds);
    totalProgress = count || 0;
  }

  // Calculer le taux de complétion global
  const totalPossible = habits?.reduce((sum, h) => sum + h.total_days, 0) || 0;
  const overallCompletionRate = totalPossible > 0
    ? (totalProgress / totalPossible) * 100
    : 0;

  // Récupérer les identités
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

// GET /today - Habitudes du jour (dernière case de chaque habitude)
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
    // Récupérer la dernière case (jour actuel)
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
  const completionRate = todayHabits.length > 0
    ? (habitsCompleted / todayHabits.length) * 100
    : 0;

  const dailyStats: DailyStats = {
    date: new Date().toISOString().split("T")[0],
    habitsTotal: todayHabits.length,
    habitsCompleted,
    completionRate: Math.round(completionRate * 10) / 10,
    todayHabits,
  };

  return jsonResponse({ today: dailyStats });
}

// GET /motivation - Générer un message de motivation basé sur les progrès
async function handleGetMotivation(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
): Promise<Response> {
  // Récupérer les stats du jour
  const todayResponse = await handleGetToday(adminClient, userId);
  const todayData = await todayResponse.json();
  const today = todayData.today;

  // Récupérer les habitudes complètes pour le contexte
  const habitsResponse = await handleGetHabits(adminClient, userId);
  const habitsData = await habitsResponse.json();
  const habits = habitsData.habits;

  // Générer le message de motivation
  let message = "🌟 Vibes Arc Coach\n\n";

  // Salutation selon l'heure
  const hour = new Date().getHours();
  if (hour < 12) {
    message += "☀️ Bonjour ! ";
  } else if (hour < 18) {
    message += "🌤️ Bon après-midi ! ";
  } else {
    message += "🌙 Bonsoir ! ";
  }

  // Message principal basé sur le taux de complétion
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

  // Habitudes à compléter
  const incompleteHabits = today.todayHabits.filter((h: any) => !h.completed);
  if (incompleteHabits.length > 0) {
    message += "📋 Habitudes du jour :\n";
    incompleteHabits.forEach((habit: any) => {
      const emoji = habit.type === "start" ? "✅" : "🛑";
      message += `${emoji} ${habit.name}\n`;
    });
    message += "\n";
  }

  // Highlight des meilleures séries
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

  // Citation motivante
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
      topStreaks: topStreaks.map((h: HabitData) => ({
        name: h.name,
        streak: h.currentStreak,
      })),
    },
  });
}

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

