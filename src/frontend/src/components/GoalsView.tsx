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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  ChevronRight,
  Flame,
  Loader2,
  Plus,
  Target,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AppView } from "../App";
import { TaskCategory } from "../backend.d";
import type { Goal } from "../backend.d";
import {
  calculateStreak,
  nsToDate,
  useAllGoals,
  useCreateGoal,
} from "../hooks/useQueries";
import { SAMPLE_DAILY_TASKS, SAMPLE_GOALS } from "../lib/sampleData";

function CategoryBadge({ category }: { category: TaskCategory }) {
  const config = {
    [TaskCategory.importance]: {
      label: "Importance",
      className: "bg-sapphire/20 text-blue-400 border-blue-500/30",
    },
    [TaskCategory.urgency]: {
      label: "Urgency",
      className: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    },
    [TaskCategory.both]: {
      label: "Both",
      className: "bg-violet/20 text-purple-400 border-purple-500/30",
    },
  };
  const c = config[category];
  return <Badge className={cn("text-xs border", c.className)}>{c.label}</Badge>;
}

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
  index: number;
}

function GoalCard({ goal, onClick, index }: GoalCardProps) {
  const allTasks = SAMPLE_DAILY_TASKS[goal.id.toString()] ?? [];
  const total = allTasks.length;
  const completed = allTasks.filter((t) => t.completed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const streak = calculateStreak(allTasks);
  const daysLeft = Math.max(
    0,
    Math.ceil((Number(goal.dueDate / 1_000_000n) - Date.now()) / 86400000),
  );

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: card acts as button
    <div
      data-ocid={`goals.item.${index}`}
      className="p-5 rounded-2xl bg-card border border-border shadow-card hover:border-primary/30 cursor-pointer transition-all group fade-up"
      style={{ animationDelay: `${(index - 1) * 75}ms` }}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-base truncate">
            {goal.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {goal.description}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 group-hover:text-primary transition-colors mt-0.5" />
      </div>

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <CategoryBadge category={goal.category} />
        <div
          className={cn(
            "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border",
            daysLeft <= 3
              ? "bg-red-500/20 text-red-400 border-red-500/30"
              : daysLeft <= 7
                ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                : "bg-border/50 text-muted-foreground border-border",
          )}
        >
          <CalendarDays className="w-3 h-3" />
          {daysLeft}d left
        </div>
        {streak > 0 && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border",
              streak >= 7
                ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                : "bg-primary/20 text-primary border-primary/30",
            )}
          >
            <Flame className="w-3 h-3" />
            {streak}d
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {completed}/{total} tasks
          </span>
          <span>{pct}%</span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>
    </div>
  );
}

interface NewGoalFormProps {
  onClose: () => void;
}

function NewGoalForm({ onClose }: NewGoalFormProps) {
  const createGoal = useCreateGoal();
  const [form, setForm] = useState({
    title: "",
    description: "",
    why: "",
    category: TaskCategory.importance,
    dueDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.why.trim()) e.why = "Why/motivation is required";
    if (!form.dueDate) e.dueDate = "Due date is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await createGoal.mutateAsync({
        title: form.title,
        description: form.description,
        why: form.why,
        category: form.category,
        dueDate: new Date(form.dueDate),
      });
      toast.success("Goal created! Daily tasks have been distributed.");
      onClose();
    } catch {
      toast.error("Failed to create goal");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="goal-title">Goal Title</Label>
        <Input
          id="goal-title"
          placeholder="e.g., Write Thesis Chapter 3"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          data-ocid="goal_form.title.input"
        />
        {errors.title && (
          <p className="text-xs text-destructive">{errors.title}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="goal-desc">Description</Label>
        <Textarea
          id="goal-desc"
          placeholder="What exactly needs to be done? Include steps, milestones, and requirements..."
          value={form.description}
          onChange={(e) =>
            setForm((p) => ({ ...p, description: e.target.value }))
          }
          rows={3}
          data-ocid="goal_form.description.textarea"
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="goal-why">Why does this matter to you? 💡</Label>
        <Textarea
          id="goal-why"
          placeholder="Your 'why' is your fuel when motivation fades. Be specific and personal..."
          value={form.why}
          onChange={(e) => setForm((p) => ({ ...p, why: e.target.value }))}
          rows={2}
          data-ocid="goal_form.why.textarea"
        />
        {errors.why && <p className="text-xs text-destructive">{errors.why}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Category</Label>
        <div className="flex gap-2">
          {[
            {
              value: TaskCategory.importance,
              label: "Importance",
              className:
                "data-[active=true]:bg-blue-500/20 data-[active=true]:border-blue-500/40 data-[active=true]:text-blue-400",
            },
            {
              value: TaskCategory.urgency,
              label: "Urgency",
              className:
                "data-[active=true]:bg-orange-500/20 data-[active=true]:border-orange-500/40 data-[active=true]:text-orange-400",
            },
            {
              value: TaskCategory.both,
              label: "Both",
              className:
                "data-[active=true]:bg-purple-500/20 data-[active=true]:border-purple-500/40 data-[active=true]:text-purple-400",
            },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              data-active={form.category === opt.value}
              onClick={() => setForm((p) => ({ ...p, category: opt.value }))}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg border border-border text-sm font-medium transition-all",
                "hover:bg-accent",
                opt.className,
              )}
              data-ocid="goal_form.category.select"
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="goal-due">Due Date</Label>
        <Input
          id="goal-due"
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
          min={new Date().toISOString().split("T")[0]}
          data-ocid="goal_form.due_date.input"
        />
        {errors.dueDate && (
          <p className="text-xs text-destructive">{errors.dueDate}</p>
        )}
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
          disabled={createGoal.isPending}
          className="flex-1 bg-primary text-primary-foreground font-semibold"
          data-ocid="goal_form.submit_button"
        >
          {createGoal.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating…
            </>
          ) : (
            "Create Goal"
          )}
        </Button>
      </div>
    </form>
  );
}

interface GoalsViewProps {
  onNavigate: (view: AppView, goal?: Goal) => void;
}

export default function GoalsView({ onNavigate }: GoalsViewProps) {
  const { data: rawGoals, isLoading } = useAllGoals();
  const goals = rawGoals && rawGoals.length > 0 ? rawGoals : SAMPLE_GOALS;
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between fade-up">
        <div>
          <h1 className="font-display text-3xl font-black">Goals</h1>
          <p className="text-muted-foreground mt-1">
            Track your long-term objectives
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-primary text-primary-foreground font-semibold glow-amber"
          data-ocid="goals.add_button"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 text-center"
          data-ocid="goals.empty_state"
        >
          <Target className="w-16 h-16 text-muted-foreground/20 mb-4" />
          <h3 className="font-display font-bold text-xl mb-2">No goals yet</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            Create your first goal and FocusFlow will automatically break it
            down into daily actions.
          </p>
          <Button
            className="mt-4 bg-primary text-primary-foreground"
            onClick={() => setShowForm(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create First Goal
          </Button>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="goals.list"
        >
          {goals.map((goal, i) => (
            <GoalCard
              key={goal.id.toString()}
              goal={goal}
              index={i + 1}
              onClick={() => onNavigate("goal-detail", goal)}
            />
          ))}
        </div>
      )}

      {/* New Goal Modal */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg border-border bg-card shadow-elevated max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-bold text-xl">
              Create New Goal
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Daily tasks will be automatically distributed across your
              timeline.
            </p>
          </DialogHeader>
          <NewGoalForm onClose={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
