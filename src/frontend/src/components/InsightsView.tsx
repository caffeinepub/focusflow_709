import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { BarChart2, Flame, Target, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { TaskCategory } from "../backend.d";
import type { Goal } from "../backend.d";
import {
  calculateStreak,
  useAllGoals,
  useHourlyLogs,
  useProcrastinationStats,
} from "../hooks/useQueries";
import { SAMPLE_DAILY_TASKS, SAMPLE_GOALS } from "../lib/sampleData";

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
      <div
        className={cn(
          "flex items-center gap-2 mb-3 text-xs font-medium uppercase tracking-wide",
          accent,
        )}
      >
        <Icon className="w-4 h-4" />
        {title}
      </div>
      <div className="font-display font-black text-4xl text-foreground">
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{sub}</div>
    </div>
  );
}

function GoalStreakRow({ goal, rank }: { goal: Goal; rank: number }) {
  const allTasks = SAMPLE_DAILY_TASKS[goal.id.toString()] ?? [];
  const streak = calculateStreak(allTasks);
  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.completed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-all",
        rank === 1 ? "bg-primary/8 border-primary/25" : "bg-card border-border",
      )}
    >
      <div
        className={cn(
          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-display font-black flex-shrink-0",
          rank === 1
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground",
        )}
      >
        {rank}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-display font-semibold text-sm truncate">
          {goal.title}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Progress value={pct} className="flex-1 h-1.5" />
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {pct}%
          </span>
        </div>
      </div>
      <div
        className={cn(
          "flex items-center gap-1.5 font-display font-black text-lg flex-shrink-0",
          streak >= 7
            ? "text-yellow-400"
            : streak > 0
              ? "text-primary"
              : "text-muted-foreground/40",
        )}
      >
        <span className={streak > 0 ? "flame-pulse" : ""}>
          {streak >= 7 ? "🔥" : streak > 0 ? "🔥" : "—"}
        </span>
        <span>{streak > 0 ? streak : "0"}</span>
      </div>
    </div>
  );
}

// Productivity heatmap for the past 7 days
function ProductivityHeatmap() {
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });
  }, []);

  // Use today's logs as representative data
  const { data: todayLogs } = useHourlyLogs(new Date());

  const avgByDay = useMemo(() => {
    return days.map((d, i) => {
      // Mock productivity based on sample data — ramp from 2 to 4
      const baseScore = 2 + (i / 6) * 2;
      return {
        date: d,
        avg: Math.round(baseScore * 10) / 10,
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
      };
    });
  }, [days]);

  // todayLogs used for potential future enrichment
  void todayLogs;

  const colorByScore = (score: number) => {
    if (score < 1.5) return "bg-border/30";
    if (score < 2.5) return "bg-chart-2/20";
    if (score < 3.5) return "bg-chart-2/40";
    if (score < 4.5) return "bg-chart-2/70";
    return "bg-chart-2";
  };

  return (
    <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
      <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-chart-2" />
        7-Day Productivity Heatmap
      </h3>
      <div className="flex gap-2">
        {avgByDay.map(({ date, avg, label }) => {
          const isToday = date.toDateString() === new Date().toDateString();
          return (
            <div
              key={date.toISOString()}
              className="flex-1 flex flex-col items-center gap-1.5"
            >
              <div
                className={cn(
                  "w-full aspect-square rounded-lg border transition-all hover:scale-105",
                  colorByScore(avg),
                  isToday ? "border-primary/50" : "border-border/30",
                )}
                title={`${label}: ${avg}/5 avg productivity`}
              />
              <div className="text-[10px] text-muted-foreground font-medium">
                {label}
              </div>
              <div
                className={cn(
                  "text-[10px] font-bold",
                  avg >= 4 ? "text-chart-2" : "text-muted-foreground",
                )}
              >
                {avg}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 mt-3 justify-end">
        <span className="text-[10px] text-muted-foreground">Low</span>
        {[0.2, 0.4, 0.6, 0.8, 1].map((o) => (
          <div
            key={o}
            className={cn(
              "w-3 h-3 rounded",
              `bg-chart-2/${Math.round(o * 100)}`,
            )}
          />
        ))}
        <span className="text-[10px] text-muted-foreground">High</span>
      </div>
    </div>
  );
}

// Category performance
function CategoryPerformance({ goals }: { goals: Goal[] }) {
  const categories = [
    {
      id: TaskCategory.importance,
      label: "Importance",
      color: "text-blue-400",
      barColor: "bg-blue-500",
    },
    {
      id: TaskCategory.urgency,
      label: "Urgency",
      color: "text-orange-400",
      barColor: "bg-orange-500",
    },
    {
      id: TaskCategory.both,
      label: "Both",
      color: "text-purple-400",
      barColor: "bg-purple-500",
    },
  ];

  const stats = categories.map((cat) => {
    const catGoals = goals.filter((g) => g.category === cat.id);
    if (catGoals.length === 0) return { ...cat, count: 0, pct: 0 };

    let totalTasks = 0;
    let completedTasks = 0;
    for (const goal of catGoals) {
      const tasks = SAMPLE_DAILY_TASKS[goal.id.toString()] ?? [];
      totalTasks += tasks.length;
      completedTasks += tasks.filter((t) => t.completed).length;
    }
    const pct =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { ...cat, count: catGoals.length, pct };
  });

  return (
    <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
      <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2">
        <Target className="w-4 h-4 text-primary" />
        Category Performance
      </h3>
      <div className="space-y-4">
        {stats.map((cat) => (
          <div key={cat.id}>
            <div className="flex items-center justify-between mb-1.5">
              <span className={cn("text-sm font-medium", cat.color)}>
                {cat.label}
              </span>
              <span className="text-sm text-muted-foreground">
                {cat.count} goal{cat.count !== 1 ? "s" : ""} · {cat.pct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  cat.barColor,
                )}
                style={{ width: `${cat.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function InsightsView() {
  const { data: rawStats, isLoading: statsLoading } = useProcrastinationStats();
  const { data: rawGoals, isLoading: goalsLoading } = useAllGoals();

  const goals = rawGoals && rawGoals.length > 0 ? rawGoals : SAMPLE_GOALS;

  const [totalTasks, onTimeTasks] = rawStats ?? [0n, 0n];
  const onTimeRate =
    Number(totalTasks) > 0
      ? Math.round((Number(onTimeTasks) / Number(totalTasks)) * 100)
      : 0;

  // Calculate streak leaderboard
  const streakRanking = useMemo(() => {
    return goals
      .map((goal) => ({
        goal,
        streak: calculateStreak(SAMPLE_DAILY_TASKS[goal.id.toString()] ?? []),
      }))
      .sort((a, b) => b.streak - a.streak);
  }, [goals]);

  const bestStreak = streakRanking[0]?.streak ?? 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" data-ocid="insights.page">
      {/* Header */}
      <div className="fade-up">
        <h1 className="font-display text-3xl font-black">Insights</h1>
        <p className="text-muted-foreground mt-1">
          Understand your productivity patterns
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 fade-up delay-75">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
              key={i}
              className="h-32 rounded-2xl"
            />
          ))
        ) : (
          <>
            <StatCard
              title="On-time Rate"
              value={`${onTimeRate}%`}
              sub={`${Number(onTimeTasks)} of ${Number(totalTasks)} tasks`}
              icon={TrendingUp}
              accent="text-chart-2"
            />
            <StatCard
              title="Active Goals"
              value={goals.length.toString()}
              sub="in progress"
              icon={Target}
              accent="text-sapphire"
            />
            <StatCard
              title="Best Streak"
              value={`${bestStreak}🔥`}
              sub="consecutive days"
              icon={Flame}
              accent="text-primary"
            />
            <StatCard
              title="Total Tasks"
              value={Object.values(SAMPLE_DAILY_TASKS)
                .reduce((s, t) => s + t.length, 0)
                .toString()}
              sub="distributed across goals"
              icon={BarChart2}
              accent="text-chart-5"
            />
          </>
        )}
      </div>

      {/* Procrastination score */}
      <div className="fade-up delay-150 p-5 rounded-2xl bg-card border border-border shadow-card">
        <h3 className="font-display font-bold text-lg mb-4">
          Procrastination Score
        </h3>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                On-time completion
              </span>
              <span
                className={cn(
                  "text-2xl font-display font-black",
                  onTimeRate >= 80
                    ? "text-emerald-400"
                    : onTimeRate >= 60
                      ? "text-yellow-400"
                      : onTimeRate >= 40
                        ? "text-orange-400"
                        : "text-red-400",
                )}
              >
                {onTimeRate}%
              </span>
            </div>
            <Progress value={onTimeRate} className="h-3" />
            <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
              <span>Needs work</span>
              <span>Excellent</span>
            </div>
          </div>
          <div
            className={cn(
              "w-16 h-16 rounded-full border-4 flex items-center justify-center font-display font-black text-lg flex-shrink-0",
              onTimeRate >= 80
                ? "border-emerald-500 text-emerald-400"
                : onTimeRate >= 60
                  ? "border-yellow-500 text-yellow-400"
                  : onTimeRate >= 40
                    ? "border-orange-500 text-orange-400"
                    : "border-red-500 text-red-400",
            )}
          >
            {onTimeRate >= 80
              ? "A"
              : onTimeRate >= 60
                ? "B"
                : onTimeRate >= 40
                  ? "C"
                  : "D"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 fade-up delay-225">
        {/* Streak leaderboard */}
        <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
          <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-primary" />
            Streak Leaderboard
          </h3>
          {goalsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {streakRanking.map(({ goal }, i) => (
                <GoalStreakRow
                  key={goal.id.toString()}
                  goal={goal}
                  rank={i + 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Category performance */}
        <CategoryPerformance goals={goals} />
      </div>

      {/* Heatmap */}
      <div className="fade-up delay-300">
        <ProductivityHeatmap />
      </div>

      {/* Insight callout */}
      <div className="fade-up delay-375 p-5 rounded-2xl bg-primary/5 border border-primary/20">
        <h3 className="font-display font-bold text-base mb-2 text-primary">
          💡 Pattern Insight
        </h3>
        <p className="text-sm text-foreground/80 leading-relaxed">
          {bestStreak >= 7
            ? `Outstanding! Your ${bestStreak}-day streak shows strong habit formation. Keep this momentum going — consistency compounds over time.`
            : bestStreak > 0
              ? `You have a ${bestStreak}-day streak going. Research shows it takes 66 days on average to form a habit. You're building something great.`
              : "Start building streaks by completing today's tasks. Even a single day of consistency is a foundation for long-term change."}
        </p>
      </div>
    </div>
  );
}
