import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Flame,
  Quote,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { DailyTask, Goal } from "../backend.d";
import { TaskCategory } from "../backend.d";
import {
  calculateStreak,
  isSameDay,
  nsToDate,
  useCompleteDailyTask,
  useDailyTasksForGoal,
} from "../hooks/useQueries";
import { SAMPLE_DAILY_TASKS } from "../lib/sampleData";

function IntensityBadge({ intensity }: { intensity: bigint }) {
  const n = Number(intensity);
  const configs = [
    null,
    {
      label: "1 – Light",
      cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    },
    {
      label: "2 – Light",
      cls: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    },
    {
      label: "3 – Medium",
      cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    },
    {
      label: "4 – High",
      cls: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    },
    {
      label: "5 – Critical",
      cls: "bg-red-500/20 text-red-400 border-red-500/30",
    },
  ];
  const c = configs[n] ?? configs[1]!;
  return (
    <Badge className={cn("text-[10px] px-1.5 py-0 border", c.cls)}>
      {c.label}
    </Badge>
  );
}

function IntensityDot({ intensity }: { intensity: bigint }) {
  const n = Number(intensity);
  const colors = [
    "",
    "bg-emerald-500",
    "bg-emerald-400",
    "bg-yellow-400",
    "bg-orange-400",
    "bg-red-500",
  ];
  return (
    <div
      className={cn(
        "w-2.5 h-2.5 rounded-full flex-shrink-0",
        colors[n] ?? colors[1],
      )}
    />
  );
}

// Group tasks by week
function groupByWeek(
  tasks: DailyTask[],
): { week: number; label: string; tasks: DailyTask[] }[] {
  if (tasks.length === 0) return [];
  const sorted = [...tasks].sort((a, b) => Number(a.day - b.day));
  const startDate = nsToDate(sorted[0]!.day);
  const groups: Map<number, DailyTask[]> = new Map();

  for (const task of sorted) {
    const d = nsToDate(task.day);
    const diffDays = Math.floor((d.getTime() - startDate.getTime()) / 86400000);
    const week = Math.floor(diffDays / 7) + 1;
    if (!groups.has(week)) groups.set(week, []);
    groups.get(week)!.push(task);
  }

  return Array.from(groups.entries()).map(([week, tasks]) => {
    const firstDate = nsToDate(tasks[0]!.day);
    const lastDate = nsToDate(tasks[tasks.length - 1]!.day);
    const label = `Week ${week} · ${firstDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${lastDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    return { week, label, tasks };
  });
}

interface GoalDetailViewProps {
  goal: Goal;
  onBack: () => void;
}

export default function GoalDetailView({ goal, onBack }: GoalDetailViewProps) {
  const { data: backendTasks, isLoading } = useDailyTasksForGoal(goal.id);
  const completeDailyTask = useCompleteDailyTask();
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([1]));
  const [activeTab, setActiveTab] = useState<"tasks" | "timeline">("tasks");

  // Use sample data if backend returns empty
  const tasks =
    backendTasks && backendTasks.length > 0
      ? backendTasks
      : (SAMPLE_DAILY_TASKS[goal.id.toString()] ?? []);

  const streak = calculateStreak(tasks);
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const daysLeft = Math.max(
    0,
    Math.ceil((Number(goal.dueDate / 1_000_000n) - Date.now()) / 86400000),
  );

  const weekGroups = useMemo(() => groupByWeek(tasks), [tasks]);

  const categoryConfig = {
    [TaskCategory.importance]: {
      label: "Importance",
      className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    [TaskCategory.urgency]: {
      label: "Urgency",
      className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    },
    [TaskCategory.both]: {
      label: "Both",
      className: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    },
  }[goal.category];

  const toggleWeek = (week: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  };

  const handleComplete = async (taskId: bigint) => {
    if (backendTasks && backendTasks.length > 0) {
      try {
        await completeDailyTask.mutateAsync(taskId);
        toast.success("Task completed! 🎉");
      } catch {
        toast.error("Failed to mark complete");
      }
    } else {
      toast.success("Task marked complete! (Sample mode)");
    }
  };

  // Timeline view — intensity heatmap
  const today = new Date();

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Back button */}
      <div className="fade-up">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Goals
        </Button>
      </div>

      {/* Header */}
      <div className="fade-up delay-75 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-3xl font-black leading-tight">
            {goal.title}
          </h1>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge className={cn("border text-xs", categoryConfig.className)}>
              {categoryConfig.label}
            </Badge>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            <span>
              Due:{" "}
              {new Date(Number(goal.dueDate / 1_000_000n)).toLocaleDateString(
                "en-US",
                { month: "long", day: "numeric", year: "numeric" },
              )}
            </span>
            <span
              className={cn(
                "ml-1 text-xs px-1.5 py-0.5 rounded-full border",
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
          {streak > 0 && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm",
                streak >= 7 ? "text-yellow-400" : "text-primary",
              )}
            >
              <span className={streak > 0 ? "flame-pulse" : ""}>🔥</span>
              <span className="font-bold">{streak}</span>
              <span className="text-muted-foreground">day streak</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {completed} of {total} tasks completed
            </span>
            <span className="font-display font-bold text-primary">{pct}%</span>
          </div>
          <Progress value={pct} className="h-2" />
        </div>
      </div>

      {/* Description */}
      <div className="fade-up delay-150 p-4 rounded-xl bg-card border border-border">
        <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
          Description
        </h3>
        <p className="text-sm leading-relaxed text-foreground/90">
          {goal.description}
        </p>
      </div>

      {/* Why quote */}
      {goal.why && (
        <div className="fade-up delay-225 relative p-5 rounded-xl bg-primary/5 border-l-4 border-primary">
          <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
          <div className="flex items-start gap-3">
            <div className="w-1 h-full rounded-full bg-primary/20" />
            <div>
              <p className="font-serif text-lg italic leading-relaxed text-foreground/90">
                "{goal.why}"
              </p>
              <p className="mt-2 text-xs text-primary font-semibold uppercase tracking-wide">
                Your Why
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab switcher */}
      <div className="fade-up delay-300 flex gap-1 p-1 rounded-xl bg-secondary/50 border border-border w-fit">
        {[
          { id: "tasks" as const, label: "Task Checklist" },
          { id: "timeline" as const, label: "Timeline View" },
        ].map((tab) => (
          <button
            type="button"
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab.id
                ? "bg-card text-foreground shadow-card border border-border"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks / Timeline */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      ) : activeTab === "tasks" ? (
        <div className="space-y-3 fade-up">
          {weekGroups.map(({ week, label, tasks: weekTasks }) => {
            const isExpanded = expandedWeeks.has(week);
            const weekCompleted = weekTasks.filter((t) => t.completed).length;
            return (
              <div
                key={week}
                className="rounded-xl bg-card border border-border overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleWeek(week)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-display font-semibold text-sm">
                      {label}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {weekCompleted}/{weekTasks.length}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3 space-y-2 border-t border-border/50">
                    {weekTasks.map((task, _idx) => {
                      const isToday = isSameDay(nsToDate(task.day), today);
                      return (
                        <div
                          key={task.id.toString()}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg transition-all",
                            isToday && "bg-primary/5 border border-primary/20",
                            task.completed && "opacity-60",
                          )}
                        >
                          <IntensityDot intensity={task.intensity} />
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() =>
                              !task.completed && handleComplete(task.id)
                            }
                            disabled={
                              task.completed || completeDailyTask.isPending
                            }
                            className="flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div
                              className={cn(
                                "text-sm font-medium",
                                task.completed &&
                                  "line-through text-muted-foreground",
                              )}
                            >
                              {task.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {nsToDate(task.day).toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                              {isToday && (
                                <span className="ml-2 text-primary font-semibold">
                                  Today
                                </span>
                              )}
                            </div>
                          </div>
                          <IntensityBadge intensity={task.intensity} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Timeline heatmap */
        <div className="fade-up p-5 rounded-2xl bg-card border border-border">
          <h3 className="font-display font-semibold mb-4">
            Intensity Timeline
          </h3>
          <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10 md:grid-cols-14 lg:grid-cols-19">
            {tasks.map((task, i) => {
              const n = Number(task.intensity);
              const colors = [
                "",
                "bg-emerald-500/30 border-emerald-500/20",
                "bg-emerald-500/50 border-emerald-500/30",
                "bg-yellow-500/50 border-yellow-500/30",
                "bg-orange-500/60 border-orange-500/40",
                "bg-red-500/70 border-red-500/50",
              ];
              const isToday2 = isSameDay(nsToDate(task.day), today);
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: timeline cells use stable index
                  key={i}
                  title={`Day ${i + 1}: ${task.title} (Intensity ${n})`}
                  className={cn(
                    "aspect-square rounded border text-[8px] flex items-center justify-center font-bold transition-transform hover:scale-110",
                    colors[n] ?? colors[1],
                    task.completed && "opacity-80",
                    isToday2 &&
                      "ring-2 ring-primary ring-offset-1 ring-offset-card",
                  )}
                >
                  {task.completed ? "✓" : n}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {[
              { label: "Light (1-2)", cls: "bg-emerald-500/30" },
              { label: "Medium (3)", cls: "bg-yellow-500/50" },
              { label: "High (4)", cls: "bg-orange-500/60" },
              { label: "Critical (5)", cls: "bg-red-500/70" },
            ].map((l) => (
              <div
                key={l.label}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <div className={cn("w-3 h-3 rounded", l.cls)} />
                {l.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
