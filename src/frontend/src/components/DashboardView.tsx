import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Clock, Flame, Target, Zap } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import type { AppView } from "../App";
import type { DailyTask, Goal } from "../backend.d";
import {
  calculateStreak,
  isSameDay,
  nsToDate,
  useAllDailyTasksToday,
  useAllGoals,
  useAllRecurringTasks,
  useCompleteDailyTask,
} from "../hooks/useQueries";
import {
  SAMPLE_DAILY_TASKS,
  SAMPLE_GOALS,
  SAMPLE_RECURRING_TASKS,
} from "../lib/sampleData";

function IntensityBadge({ intensity }: { intensity: bigint }) {
  const n = Number(intensity);
  if (n <= 2)
    return (
      <Badge className="text-[10px] px-1.5 py-0 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
        Light
      </Badge>
    );
  if (n === 3)
    return (
      <Badge className="text-[10px] px-1.5 py-0 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        Medium
      </Badge>
    );
  if (n === 4)
    return (
      <Badge className="text-[10px] px-1.5 py-0 bg-orange-500/20 text-orange-400 border-orange-500/30">
        High
      </Badge>
    );
  return (
    <Badge className="text-[10px] px-1.5 py-0 bg-red-500/20 text-red-400 border-red-500/30">
      Critical
    </Badge>
  );
}

function ProgressRing({ percentage }: { percentage: number }) {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percentage / 100);

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg
        className="w-28 h-28 -rotate-90"
        viewBox="0 0 100 100"
        aria-hidden="true"
        role="presentation"
      >
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="oklch(var(--border))"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="oklch(var(--primary))"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          className={
            percentage > 0
              ? "drop-shadow-[0_0_6px_oklch(0.78_0.16_65/0.6)]"
              : ""
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-black text-2xl text-foreground">
          {percentage}%
        </span>
        <span className="text-[10px] text-muted-foreground">done</span>
      </div>
    </div>
  );
}

interface DashboardViewProps {
  onNavigate: (view: AppView, goal?: Goal) => void;
}

export default function DashboardView({ onNavigate }: DashboardViewProps) {
  const { data: rawGoals, isLoading: goalsLoading } = useAllGoals();
  const { data: rawRecurring, isLoading: recurringLoading } =
    useAllRecurringTasks();

  // Use sample data if empty
  const goals = rawGoals && rawGoals.length > 0 ? rawGoals : SAMPLE_GOALS;
  const recurringTasks =
    rawRecurring && rawRecurring.length > 0
      ? rawRecurring
      : SAMPLE_RECURRING_TASKS;

  const { data: todayTasksData, isLoading: tasksLoading } =
    useAllDailyTasksToday(goals);
  const completeDailyTask = useCompleteDailyTask();

  // For sample data, use SAMPLE_DAILY_TASKS to get today's tasks
  const todayTasks = useMemo(() => {
    if (rawGoals && rawGoals.length > 0 && todayTasksData) {
      return todayTasksData;
    }
    // Sample data mode
    const today = new Date();
    return Object.entries(SAMPLE_DAILY_TASKS).flatMap(([goalId, tasks]) => {
      const goal = SAMPLE_GOALS.find((g) => g.id.toString() === goalId);
      if (!goal) return [];
      return tasks
        .filter((t) => isSameDay(nsToDate(t.day), today))
        .map((t) => ({ task: t, goal }));
    });
  }, [rawGoals, todayTasksData]);

  // Streak data
  const streakData = useMemo(() => {
    return goals.map((goal) => {
      const allTasks: DailyTask[] =
        rawGoals && rawGoals.length > 0
          ? [] // Will be fetched separately — just show 0
          : (SAMPLE_DAILY_TASKS[goal.id.toString()] ?? []);
      return {
        goal,
        streak: calculateStreak(allTasks),
      };
    });
  }, [goals, rawGoals]);

  const totalToday = todayTasks.length;
  const completedToday = todayTasks.filter((t) => t.task.completed).length;
  const progressPct =
    totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  // Today's recurring tasks
  const todayRecurring = recurringTasks
    .filter(() => {
      // Show all for now (interval check would require more complex logic)
      return true;
    })
    .slice(0, 4);

  const handleComplete = async (taskId: bigint) => {
    if (rawGoals && rawGoals.length > 0) {
      try {
        await completeDailyTask.mutateAsync(taskId);
        toast.success("Task completed! 🎉");
      } catch {
        toast.error("Failed to mark task complete");
      }
    } else {
      toast.success("Task completed! 🎉 (Sample mode)");
    }
  };

  const isLoading =
    goalsLoading || (rawGoals && rawGoals.length > 0 && tasksLoading);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="fade-up">
        <h1 className="font-display text-3xl font-black">
          {(() => {
            const h = new Date().getHours();
            if (h < 12) return "Good Morning ☀️";
            if (h < 17) return "Good Afternoon 🌤";
            return "Good Evening 🌙";
          })()}
        </h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Top row: Progress ring + stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 fade-up delay-75">
        {/* Progress ring */}
        <div className="md:col-span-1 p-5 rounded-2xl bg-card border border-border shadow-card flex items-center gap-5">
          {isLoading ? (
            <Skeleton className="w-28 h-28 rounded-full" />
          ) : (
            <ProgressRing percentage={progressPct} />
          )}
          <div>
            <div className="font-display font-black text-2xl text-foreground">
              {completedToday}
              <span className="text-muted-foreground font-normal text-base">
                /{totalToday}
              </span>
            </div>
            <div className="text-sm text-muted-foreground">Today's tasks</div>
            {completedToday === totalToday && totalToday > 0 && (
              <div className="mt-2 text-xs text-primary font-semibold">
                🎉 All done!
              </div>
            )}
          </div>
        </div>

        {/* Stats cards */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-card border border-border shadow-card fade-up delay-150">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-sapphire" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Active Goals
              </span>
            </div>
            <div className="font-display font-black text-3xl text-foreground">
              {goals.length}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              in progress
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-card border border-border shadow-card fade-up delay-225">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Best Streak
              </span>
            </div>
            <div className="font-display font-black text-3xl text-foreground">
              {Math.max(0, ...streakData.map((s) => s.streak))}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">days</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's tasks */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-card border border-border shadow-card fade-up delay-150">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">Today's Focus</h2>
            {totalToday > 0 && (
              <span className="text-xs text-muted-foreground">
                {completedToday}/{totalToday} completed
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : todayTasks.length === 0 ? (
            <div
              className="text-center py-10 text-muted-foreground"
              data-ocid="daily_tasks.empty_state"
            >
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium">No tasks for today</p>
              <p className="text-sm mt-1">Create a goal to get daily tasks</p>
              <button
                type="button"
                onClick={() => onNavigate("goals")}
                className="mt-3 text-primary text-sm hover:underline"
              >
                Create a goal →
              </button>
            </div>
          ) : (
            <div className="space-y-2.5" data-ocid="daily_tasks.list">
              {todayTasks.map(({ task, goal }, index) => (
                <div
                  key={task.id.toString()}
                  className={cn(
                    "flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200",
                    task.completed
                      ? "bg-secondary/30 border-border/50 opacity-60"
                      : "bg-secondary/50 border-border hover:border-border/80",
                  )}
                  data-ocid={`daily_tasks.item.${index + 1}`}
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() =>
                      !task.completed && handleComplete(task.id)
                    }
                    disabled={task.completed || completeDailyTask.isPending}
                    className="flex-shrink-0"
                    data-ocid={`daily_tasks.checkbox.${index + 1}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "text-sm font-medium truncate",
                        task.completed && "line-through text-muted-foreground",
                      )}
                    >
                      {task.title}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {goal.title}
                    </div>
                  </div>
                  <IntensityBadge intensity={task.intensity} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Streak sidebar */}
        <div className="space-y-4">
          {/* Streak cards */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
            <h2 className="font-display font-bold text-lg mb-3">Streaks 🔥</h2>
            <div className="space-y-3">
              {streakData.map(({ goal, streak }) => (
                <div
                  key={goal.id.toString()}
                  className="flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="text-sm font-medium truncate">
                      {goal.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {streak > 0 ? `${streak} day streak` : "No streak yet"}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 font-display font-black text-lg",
                      streak >= 7
                        ? "text-yellow-400"
                        : streak > 0
                          ? "text-primary"
                          : "text-muted-foreground",
                    )}
                  >
                    <span className={streak > 0 ? "flame-pulse" : ""}>
                      {streak >= 7 ? "🔥" : streak > 0 ? "🔥" : "○"}
                    </span>
                    <span>{streak}</span>
                  </div>
                </div>
              ))}
              {streakData.length === 0 && (
                <p className="text-sm text-muted-foreground">No goals yet</p>
              )}
            </div>
          </div>

          {/* Upcoming reminders */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
            <h2 className="font-display font-bold text-base mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sapphire" />
              Reminders Today
            </h2>
            {recurringLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </div>
            ) : todayRecurring.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No recurring tasks scheduled
              </p>
            ) : (
              <div className="space-y-2">
                {todayRecurring.map((task) => (
                  <div
                    key={task.id.toString()}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50 border border-border/50"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate">
                        {task.title}
                      </div>
                    </div>
                    <span className="text-xs font-mono text-primary">
                      {task.scheduledTime}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick nav */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-card">
            <h2 className="font-display font-bold text-base mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                { label: "View all goals", view: "goals" as AppView },
                {
                  label: "Log retrospective",
                  view: "retrospective" as AppView,
                },
                { label: "View insights", view: "insights" as AppView },
              ].map(({ label, view }) => (
                <button
                  type="button"
                  key={view}
                  onClick={() => onNavigate(view)}
                  className="w-full text-left text-sm px-3 py-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground flex items-center justify-between group"
                >
                  {label}
                  <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Goal progress bars */}
      <div className="fade-up delay-300">
        <h2 className="font-display font-bold text-lg mb-3">Goal Progress</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {goals.map((goal, i) => {
            const allTasks =
              rawGoals && rawGoals.length > 0
                ? []
                : (SAMPLE_DAILY_TASKS[goal.id.toString()] ?? []);
            const total = allTasks.length;
            const completed = allTasks.filter(
              (t: DailyTask) => t.completed,
            ).length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            const daysLeft = Math.max(
              0,
              Math.ceil(
                (Number(goal.dueDate / 1_000_000n) - Date.now()) / 86400000,
              ),
            );

            return (
              // biome-ignore lint/a11y/useKeyWithClickEvents: progress card visual
              <div
                key={goal.id.toString()}
                className="p-4 rounded-xl bg-card border border-border shadow-card fade-up cursor-pointer hover:border-primary/30 transition-all"
                style={{ animationDelay: `${i * 75 + 300}ms` }}
                onClick={() => onNavigate("goals")}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="font-display font-semibold text-sm truncate flex-1 mr-2">
                    {goal.title}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0",
                      daysLeft <= 3
                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                        : daysLeft <= 7
                          ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                          : "bg-border/50 text-muted-foreground border-border",
                    )}
                  >
                    {daysLeft}d left
                  </span>
                </div>
                <Progress value={pct} className="h-1.5 mb-1.5" />
                <div className="text-xs text-muted-foreground">
                  {pct}% complete
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
