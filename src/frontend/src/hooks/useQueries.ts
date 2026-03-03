import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DailyTask,
  Goal,
  HourlyLog,
  RecurringTask,
  TaskCategory,
  TaskInterval,
  UserProfile,
} from "../backend.d";
import { useActor } from "./useActor";

// ─── Time helpers ───────────────────────────────────────────────────────────
export function nowNs(): bigint {
  return BigInt(Date.now()) * 1_000_000n;
}
export function dateToNs(d: Date): bigint {
  return BigInt(d.getTime()) * 1_000_000n;
}
export function nsToDate(ns: bigint): Date {
  return new Date(Number(ns / 1_000_000n));
}
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ─── Goals ──────────────────────────────────────────────────────────────────
export function useAllGoals() {
  const { actor, isFetching } = useActor();
  return useQuery<Goal[]>({
    queryKey: ["goals"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllGoals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateGoal() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      title: string;
      description: string;
      why: string;
      category: TaskCategory;
      dueDate: Date;
    }) => {
      if (!actor) throw new Error("Not connected");
      const id = await actor.createGoal(
        vars.title,
        vars.description,
        vars.why,
        vars.category,
        dateToNs(vars.dueDate),
      );
      return id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["goals"] });
      void qc.invalidateQueries({ queryKey: ["dailyTasks"] });
    },
  });
}

// ─── Daily Tasks ─────────────────────────────────────────────────────────────
export function useDailyTasksForGoal(goalId: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery<DailyTask[]>({
    queryKey: ["dailyTasks", goalId?.toString()],
    queryFn: async () => {
      if (!actor || goalId === null) return [];
      return actor.getDailyTasksForGoal(goalId);
    },
    enabled: !!actor && !isFetching && goalId !== null,
  });
}

export function useCompleteDailyTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: bigint) => {
      if (!actor) throw new Error("Not connected");
      await actor.completeDailyTask(taskId);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["dailyTasks"] });
    },
  });
}

// ─── All daily tasks (for dashboard) ─────────────────────────────────────────
export function useAllDailyTasksToday(goals: Goal[]) {
  const { actor, isFetching } = useActor();
  return useQuery<{ task: DailyTask; goal: Goal }[]>({
    queryKey: [
      "allDailyTasksToday",
      goals.map((g) => g.id.toString()).join(","),
    ],
    queryFn: async () => {
      if (!actor || goals.length === 0) return [];
      const today = new Date();
      const results = await Promise.all(
        goals.map(async (goal) => {
          const tasks = await actor.getDailyTasksForGoal(goal.id);
          return tasks
            .filter((t) => isSameDay(nsToDate(t.day), today))
            .map((t) => ({ task: t, goal }));
        }),
      );
      return results.flat();
    },
    enabled: !!actor && !isFetching && goals.length > 0,
  });
}

// ─── Recurring Tasks ─────────────────────────────────────────────────────────
export function useAllRecurringTasks() {
  const { actor, isFetching } = useActor();
  return useQuery<RecurringTask[]>({
    queryKey: ["recurringTasks"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllRecurringTasks();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateRecurringTask() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      title: string;
      description: string;
      interval: TaskInterval;
      scheduledTime: string;
      reminderOffsets: bigint[];
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createRecurringTask(
        vars.title,
        vars.description,
        vars.interval,
        vars.scheduledTime,
        vars.reminderOffsets,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["recurringTasks"] });
    },
  });
}

// ─── Hourly Logs ──────────────────────────────────────────────────────────────
export function useHourlyLogs(day: Date) {
  const { actor, isFetching } = useActor();
  return useQuery<HourlyLog[]>({
    queryKey: ["hourlyLogs", day.toDateString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHourlyLogs(dateToNs(day));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddHourlyLog() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      day: Date;
      hour: bigint;
      mood: bigint;
      productivity: bigint;
      comment: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.addHourlyLog(
        dateToNs(vars.day),
        vars.hour,
        vars.mood,
        vars.productivity,
        vars.comment,
      );
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: ["hourlyLogs", vars.day.toDateString()],
      });
    },
  });
}

// ─── Procrastination Stats ────────────────────────────────────────────────────
export function useProcrastinationStats() {
  const { actor, isFetching } = useActor();
  return useQuery<[bigint, bigint]>({
    queryKey: ["procrastinationStats"],
    queryFn: async () => {
      if (!actor) return [0n, 0n];
      return actor.getProcrastinationStats();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Morning Prompt ───────────────────────────────────────────────────────────
export function useHasSeenMorningPrompt() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["morningPrompt"],
    queryFn: async () => {
      if (!actor) return true;
      return actor.hasSeenMorningPrompt();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMarkPromptSeen() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not connected");
      await actor.markPromptSeen();
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["morningPrompt"] });
    },
  });
}

// ─── User Profile ─────────────────────────────────────────────────────────────
export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveUserProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not connected");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

// ─── Streak calculation ───────────────────────────────────────────────────────
export function calculateStreak(tasks: DailyTask[]): number {
  const completed = tasks
    .filter((t) => t.completed)
    .map((t) => nsToDate(t.day));

  if (completed.length === 0) return 0;

  // Get unique dates sorted descending
  const uniqueDates = Array.from(
    new Set(completed.map((d) => d.toDateString())),
  )
    .map((s) => new Date(s))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  const today = new Date();

  for (let i = 0; i < uniqueDates.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (uniqueDates[i] && isSameDay(uniqueDates[i]!, expected)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

// ─── Interval display ─────────────────────────────────────────────────────────
export function formatInterval(interval: TaskInterval): string {
  if (interval.__kind__ === "daily") return "Daily";
  if (interval.__kind__ === "everyNDays")
    return `Every ${interval.everyNDays} days`;
  if (interval.__kind__ === "custom") {
    return interval.custom
      .map((d) => d.charAt(0).toUpperCase() + d.slice(1, 3))
      .join(", ");
  }
  return "Unknown";
}
