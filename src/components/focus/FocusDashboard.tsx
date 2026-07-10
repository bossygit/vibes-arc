import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Calendar, Flame, Trophy, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
} from 'recharts';
import SupabaseDatabaseClient from '@/database/supabase-client';
import { computeFocusStats, MILESTONES } from '@/utils/focusStatsUtils';
import type { FocusStats, FocusHoldRecord } from '@/utils/focusStatsUtils';

// ─── Carte stat ────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = 'indigo',
}: {
  icon: React.FC<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
  };
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3">
      <div className={`p-2 rounded-lg ${colorMap[color] || colorMap.indigo}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Graphique de tendance 30 jours ────────────────────────────────

function TrendChart({ data }: { data: { date: string; max: number }[] }) {
  if (data.length === 0) return null;
  const chartData = data.map((d) => ({
    date: d.date.slice(5), // MM-DD
    max: Math.round(d.max * 10) / 10,
  }));
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-indigo-500" />
        Record quotidien — 30 derniers jours
      </h4>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#94a3b8" interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" domain={[0, 'dataMax + 5']} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(value: number) => [`${value}s`, 'Record']}
            />
            <Line
              type="monotone"
              dataKey="max"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ r: 3, fill: '#6366f1' }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Distribution des paliers ──────────────────────────────────────

function TierDistribution({ dist }: { dist: Record<number, number> }) {
  const data = MILESTONES.map((ms, i) => ({
    name: `${ms}s`,
    count: dist[i + 1] || 0,
  }));
  // Add "sous 17s" as tier 0
  data.unshift({ name: '<17s', count: dist[0] || 0 });

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-indigo-500" />
        Distribution des paliers
      </h4>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <ReBarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" allowDecimals={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
          </ReBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Weekly summary ────────────────────────────────────────────────

function WeeklySummary({ trend }: { trend: FocusStats['weeklyTrend'] }) {
  if (trend.length === 0) return null;
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Calendar className="w-4 h-4 text-indigo-500" />
        7 derniers jours
      </h4>
      <div className="space-y-2">
        {trend.map((day) => (
          <div key={day.date} className="flex items-center gap-3 text-sm">
            <span className="w-20 text-slate-500 font-mono text-xs">
              {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
            </span>
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (day.maxSeconds / 68) * 100)}%` }}
                transition={{ duration: 0.5, delay: 0.1 }}
              />
            </div>
            <span className="w-16 text-right font-mono text-xs text-slate-600">
              {day.sessions}x · {Math.round(day.avgSeconds)}s
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main dashboard ────────────────────────────────────────────────

const FocusDashboard: React.FC = () => {
  const [stats, setStats] = useState<FocusStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const db = SupabaseDatabaseClient.getInstance();
        const data = await db.getFocusAggregates(90);
        const records: FocusHoldRecord[] = data.map((r: any) => ({
          id: r.id,
          duration_seconds: r.duration_seconds,
          intention_label: r.intention_label,
          milestone_reached: r.milestone_reached,
          started_at: r.started_at,
        }));
        setStats(computeFocusStats(records));
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="card max-w-2xl mx-auto text-center py-8 text-slate-400 text-sm">
        Chargement des statistiques…
      </div>
    );
  }

  if (!stats || stats.totalSessions === 0) {
    return (
      <div className="card max-w-2xl mx-auto text-center py-8 text-slate-400 text-sm">
        Fais ta première séance pour voir tes statistiques ici.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4 max-w-2xl mx-auto"
    >
      <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-indigo-500" />
        Dashboard Focus
      </h3>

      {/* Cartes stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={BarChart3}
          label="Sessions"
          value={`${stats.totalSessions}`}
          sub="total"
          color="indigo"
        />
        <StatCard
          icon={Trophy}
          label="Record"
          value={`${stats.allTimeBest.toFixed(1)}s`}
          sub={stats.allTimeBestDate ? `le ${new Date(stats.allTimeBestDate).toLocaleDateString('fr-FR')}` : undefined}
          color="amber"
        />
        <StatCard
          icon={Flame}
          label="Série"
          value={`${stats.streak}j`}
          sub="consécutifs"
          color="rose"
        />
        <StatCard
          icon={TrendingUp}
          label="Moy. 7j"
          value={`${Math.round(stats.recentAverage)}s`}
          sub={`${stats.weeklyTrend.length} jours actifs`}
          color="emerald"
        />
      </div>

      {/* Graphiques */}
      <TrendChart data={stats.last30Days} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TierDistribution dist={stats.tierDistribution} />
        <WeeklySummary trend={stats.weeklyTrend} />
      </div>
    </motion.div>
  );
};

export default FocusDashboard;
