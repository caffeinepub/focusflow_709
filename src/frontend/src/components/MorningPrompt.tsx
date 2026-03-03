import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Sparkles, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useHasSeenMorningPrompt,
  useMarkPromptSeen,
} from "../hooks/useQueries";

const MOTIVATIONAL_MESSAGES = [
  "Every expert was once a beginner. Every journey begins with a single step.",
  "The secret to getting ahead is getting started.",
  "You don't have to be great to start, but you have to start to be great.",
  "Small daily improvements are the key to staggering long-term results.",
  "Focus on progress, not perfection. Progress breeds momentum.",
];

export default function MorningPrompt() {
  const { data: hasSeen, isLoading } = useHasSeenMorningPrompt();
  const markSeen = useMarkPromptSeen();
  const [open, setOpen] = useState(false);
  const [message] = useState(
    () =>
      MOTIVATIONAL_MESSAGES[
        Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)
      ]!,
  );

  useEffect(() => {
    if (!isLoading && hasSeen === false) {
      setOpen(true);
    }
  }, [hasSeen, isLoading]);

  const handleLetsGo = async () => {
    await markSeen.mutateAsync();
    setOpen(false);
  };

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && setOpen(false)}>
      <DialogContent
        className="max-w-md border-border bg-card shadow-elevated"
        data-ocid="morning_prompt.dialog"
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
              <Sun className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl font-bold leading-tight">
                Good Morning! 🌅
              </DialogTitle>
              <p className="text-sm text-muted-foreground">{dateStr}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Motivational quote */}
          <blockquote className="relative pl-4 border-l-2 border-primary/50">
            <Sparkles className="absolute -top-1 -left-1.5 w-3 h-3 text-primary/60" />
            <p className="text-sm italic text-foreground/80 leading-relaxed font-serif">
              "{message}"
            </p>
          </blockquote>

          {/* Daily reminder copy */}
          <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-2">
            <h3 className="font-display font-semibold text-sm text-foreground">
              Today's Plan
            </h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                Review your daily tasks on the dashboard
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-chart-2 flex-shrink-0" />
                Check your progress toward each goal
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-chart-3 flex-shrink-0" />
                Log your hourly activity in the retrospective
              </li>
            </ul>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => setOpen(false)}
            data-ocid="morning_prompt.close_button"
          >
            Remind me later
          </Button>
          <Button
            className="flex-1 bg-primary text-primary-foreground font-display font-semibold glow-amber"
            onClick={handleLetsGo}
            disabled={markSeen.isPending}
            data-ocid="morning_prompt.confirm_button"
          >
            {markSeen.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : null}
            Let's go! 🚀
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
