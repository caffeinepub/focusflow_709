import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  Bell,
  Calendar,
  Clock,
  Loader2,
  Plus,
  RepeatIcon,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DayOfWeek } from "../backend.d";
import type { RecurringTask, TaskInterval } from "../backend.d";
import {
  formatInterval,
  useAllRecurringTasks,
  useCreateRecurringTask,
  useDeleteRecurringTask,
} from "../hooks/useQueries";
import { SAMPLE_RECURRING_TASKS } from "../lib/sampleData";

const DAY_OPTIONS = [
  { value: DayOfWeek.monday, label: "Mon" },
  { value: DayOfWeek.tuesday, label: "Tue" },
  { value: DayOfWeek.wednesday, label: "Wed" },
  { value: DayOfWeek.thursday, label: "Thu" },
  { value: DayOfWeek.friday, label: "Fri" },
  { value: DayOfWeek.saturday, label: "Sat" },
  { value: DayOfWeek.sunday, label: "Sun" },
];

type IntervalType = "daily" | "everyNDays" | "custom";

interface NewRecurringFormProps {
  onClose: () => void;
}

function NewRecurringForm({ onClose }: NewRecurringFormProps) {
  const createRecurring = useCreateRecurringTask();
  const [form, setForm] = useState({
    title: "",
    description: "",
    intervalType: "daily" as IntervalType,
    nDays: "2",
    customDays: [] as DayOfWeek[],
    scheduledTime: "09:00",
    reminderOffsets: ["30"] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.scheduledTime) e.time = "Scheduled time is required";
    if (form.intervalType === "custom" && form.customDays.length === 0)
      e.days = "Select at least one day";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildInterval = (): TaskInterval => {
    if (form.intervalType === "daily")
      return { __kind__: "daily", daily: null };
    if (form.intervalType === "everyNDays")
      return {
        __kind__: "everyNDays",
        everyNDays: BigInt(Number.parseInt(form.nDays) || 2),
      };
    return { __kind__: "custom", custom: form.customDays };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const offsets = form.reminderOffsets
        .map((o) => o.trim())
        .filter(Boolean)
        .map((o) => BigInt(Number.parseInt(o)));
      await createRecurring.mutateAsync({
        title: form.title,
        description: form.description,
        interval: buildInterval(),
        scheduledTime: form.scheduledTime,
        reminderOffsets: offsets,
      });
      toast.success("Recurring task created!");
      onClose();
    } catch {
      toast.error("Failed to create recurring task");
    }
  };

  const toggleDay = (day: DayOfWeek) => {
    setForm((p) => ({
      ...p,
      customDays: p.customDays.includes(day)
        ? p.customDays.filter((d) => d !== day)
        : [...p.customDays, day],
    }));
  };

  const addReminderOffset = () => {
    setForm((p) => ({ ...p, reminderOffsets: [...p.reminderOffsets, "15"] }));
  };

  const removeReminderOffset = (i: number) => {
    setForm((p) => ({
      ...p,
      reminderOffsets: p.reminderOffsets.filter((_, idx) => idx !== i),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Title</Label>
        <Input
          placeholder="e.g., Morning Meditation"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          placeholder="What does this task involve?"
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
          rows={2}
        />
      </div>

      {/* Interval type */}
      <div className="space-y-2">
        <Label>Repeat Interval</Label>
        <div className="flex gap-2">
          {[
            { id: "daily" as IntervalType, label: "Daily" },
            { id: "everyNDays" as IntervalType, label: "Every N Days" },
            { id: "custom" as IntervalType, label: "Custom Days" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setForm((p) => ({ ...p, intervalType: opt.id }))}
              className={cn(
                "flex-1 py-2 px-2 rounded-lg border text-sm font-medium transition-all",
                form.intervalType === opt.id
                  ? "bg-primary/15 border-primary/30 text-primary"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {form.intervalType === "everyNDays" && (
        <div className="space-y-1.5">
          <Label>Every how many days?</Label>
          <Input
            type="number"
            min="1"
            max="365"
            value={form.nDays}
            onChange={(e) => setForm((p) => ({ ...p, nDays: e.target.value }))}
          />
        </div>
      )}

      {form.intervalType === "custom" && (
        <div className="space-y-1.5">
          <Label>Days of the week</Label>
          <div className="flex gap-1.5 flex-wrap">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                  form.customDays.includes(d.value)
                    ? "bg-primary/20 border-primary/40 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
          {errors.days && (
            <p className="text-xs text-destructive">{errors.days}</p>
          )}
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Scheduled Time</Label>
        <Input
          type="time"
          value={form.scheduledTime}
          onChange={(e) =>
            setForm((p) => ({ ...p, scheduledTime: e.target.value }))
          }
        />
        {errors.time && (
          <p className="text-xs text-destructive">{errors.time}</p>
        )}
      </div>

      {/* Reminder offsets */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Reminders (minutes before)</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={addReminderOffset}
            className="h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {form.reminderOffsets.map((offset, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: order-stable reminder list
            <div key={i} className="flex items-center gap-2">
              <Input
                type="number"
                min="1"
                placeholder="Minutes before"
                value={offset}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    reminderOffsets: p.reminderOffsets.map((o, idx) =>
                      idx === i ? e.target.value : o,
                    ),
                  }))
                }
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                min before
              </span>
              {form.reminderOffsets.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeReminderOffset(i)}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                  ×
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={createRecurring.isPending}
          className="flex-1 bg-primary text-primary-foreground font-semibold"
        >
          {createRecurring.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating…
            </>
          ) : (
            "Create Task"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function RecurringTasksView() {
  const { data: rawTasks, isLoading } = useAllRecurringTasks();
  const tasks =
    rawTasks && rawTasks.length > 0 ? rawTasks : SAMPLE_RECURRING_TASKS;
  const deleteRecurringTask = useDeleteRecurringTask();
  const [showForm, setShowForm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<RecurringTask | null>(null);

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    const isSample = !(rawTasks && rawTasks.length > 0);
    if (isSample) {
      toast.info("Cannot delete sample tasks -- create your own tasks first.");
      setTaskToDelete(null);
      return;
    }
    try {
      await deleteRecurringTask.mutateAsync(taskToDelete.id);
      toast.success("Task deleted.");
    } catch {
      toast.error("Failed to delete task.");
    }
    setTaskToDelete(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between fade-up">
        <div>
          <h1 className="font-display text-3xl font-black">Recurring Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Tasks with custom schedules and reminders
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary text-primary-foreground font-semibold glow-amber"
          data-ocid="recurring.add_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="recurring.empty_state"
        >
          <RepeatIcon className="w-16 h-16 text-muted-foreground/20 mb-4" />
          <h3 className="font-display font-bold text-xl mb-2">
            No recurring tasks
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Set up recurring tasks with custom schedules and multiple reminders.
          </p>
          <Button
            className="mt-4 bg-primary text-primary-foreground"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Task
          </Button>
        </div>
      ) : (
        <div className="space-y-3" data-ocid="recurring.list">
          {tasks.map((task, i) => (
            <div
              key={task.id.toString()}
              data-ocid={`recurring.item.${i + 1}`}
              className="p-5 rounded-2xl bg-card border border-border shadow-card hover:border-border/80 transition-all fade-up group"
              style={{ animationDelay: `${i * 75}ms` }}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-bold text-base">
                    {task.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {task.description}
                  </p>
                </div>
                <button
                  type="button"
                  data-ocid={`recurring.delete_button.${i + 1}`}
                  onClick={() => setTaskToDelete(task)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-secondary/80 text-foreground border-border/50 text-xs gap-1.5">
                  <RepeatIcon className="w-3 h-3" />
                  {formatInterval(task.interval)}
                </Badge>
                <Badge className="bg-secondary/80 text-foreground border-border/50 text-xs gap-1.5">
                  <Clock className="w-3 h-3 text-primary" />
                  {task.scheduledTime}
                </Badge>
                {task.reminderOffsets.length > 0 && (
                  <Badge className="bg-secondary/80 text-foreground border-border/50 text-xs gap-1.5">
                    <Bell className="w-3 h-3 text-sapphire" />
                    {task.reminderOffsets.map((o) => `${o}m`).join(", ")} before
                  </Badge>
                )}
                <Badge className="bg-secondary/80 text-foreground border-border/50 text-xs gap-1.5">
                  <Calendar className="w-3 h-3 text-chart-2" />
                  {new Date(
                    Number(task.createdAt / 1_000_000n),
                  ).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg border-border bg-card shadow-elevated max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-xl">
              New Recurring Task
            </DialogTitle>
          </DialogHeader>
          <NewRecurringForm onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!taskToDelete}
        onOpenChange={(open) => !open && setTaskToDelete(null)}
      >
        <AlertDialogContent
          className="border-border bg-card"
          data-ocid="recurring.delete.dialog"
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{taskToDelete?.title}". This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="recurring.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="recurring.delete.confirm_button"
              disabled={deleteRecurringTask.isPending}
            >
              {deleteRecurringTask.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
