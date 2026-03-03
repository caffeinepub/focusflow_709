import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { BookOpen, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { HourlyLog } from "../backend.d";
import { useAddHourlyLog, useHourlyLogs } from "../hooks/useQueries";
import { SAMPLE_HOURLY_LOGS } from "../lib/sampleData";

const MOOD_EMOJIS = ["", "😫", "😐", "🙂", "😊", "🚀"];
const HOUR_LABELS = [
  "12 AM",
  "1 AM",
  "2 AM",
  "3 AM",
  "4 AM",
  "5 AM",
  "6 AM",
  "7 AM",
  "8 AM",
  "9 AM",
  "10 AM",
  "11 AM",
  "12 PM",
  "1 PM",
  "2 PM",
  "3 PM",
  "4 PM",
  "5 PM",
  "6 PM",
  "7 PM",
  "8 PM",
  "9 PM",
  "10 PM",
  "11 PM",
];

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0] ?? "";
}

interface HourEditorProps {
  hour: number;
  existing?: HourlyLog;
  day: Date;
  onSave: () => void;
}

function HourEditor({ hour, existing, day, onSave }: HourEditorProps) {
  const addLog = useAddHourlyLog();
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [mood, setMood] = useState(Number(existing?.mood ?? 3));
  const [productivity, setProductivity] = useState(
    Number(existing?.productivity ?? 3),
  );

  const handleSave = async () => {
    try {
      await addLog.mutateAsync({
        day,
        hour: BigInt(hour),
        mood: BigInt(mood),
        productivity: BigInt(productivity),
        comment,
      });
      toast.success("Hour logged!");
      onSave();
    } catch {
      toast.error("Failed to save log");
    }
  };

  return (
    <div className="space-y-4 p-4 rounded-xl bg-secondary/30 border border-border">
      <div className="font-display font-bold text-sm text-primary">
        {HOUR_LABELS[hour]}
      </div>

      <div className="space-y-1.5">
        <Label>What did you do?</Label>
        <Textarea
          placeholder="Describe your activity this hour..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Mood</Label>
          <span className="text-2xl">{MOOD_EMOJIS[mood]}</span>
        </div>
        <Slider
          min={1}
          max={5}
          step={1}
          value={[mood]}
          onValueChange={([v]) => v !== undefined && setMood(v)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>😫 Terrible</span>
          <span>🚀 Amazing</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Productivity</Label>
          <span className="text-sm font-bold text-primary">
            {productivity}/5
          </span>
        </div>
        <Slider
          min={1}
          max={5}
          step={1}
          value={[productivity]}
          onValueChange={([v]) => v !== undefined && setProductivity(v)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>None</span>
          <span>Peak</span>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={addLog.isPending}
        className="w-full bg-primary text-primary-foreground font-semibold"
        size="sm"
      >
        {addLog.isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : null}
        Save Log
      </Button>
    </div>
  );
}

export default function RetrospectiveView() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingHour, setEditingHour] = useState<number | null>(null);

  const { data: rawLogs, isLoading } = useHourlyLogs(selectedDate);
  const logs = rawLogs && rawLogs.length > 0 ? rawLogs : SAMPLE_HOURLY_LOGS;

  const logsByHour = useMemo(() => {
    const map = new Map<number, HourlyLog>();
    for (const log of logs) {
      map.set(Number(log.hour), log);
    }
    return map;
  }, [logs]);

  const avgMood = useMemo(() => {
    if (logs.length === 0) return 0;
    const sum = logs.reduce((a, l) => a + Number(l.mood), 0);
    return Math.round((sum / logs.length) * 10) / 10;
  }, [logs]);

  const avgProd = useMemo(() => {
    if (logs.length === 0) return 0;
    const sum = logs.reduce((a, l) => a + Number(l.productivity), 0);
    return Math.round((sum / logs.length) * 10) / 10;
  }, [logs]);

  const prevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
    setEditingHour(null);
  };

  const nextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    if (d <= new Date()) {
      setSelectedDate(d);
      setEditingHour(null);
    }
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const isFuture = selectedDate > new Date();

  // Determine which hours to show (6 AM to 11 PM are most relevant)
  const workHours = Array.from({ length: 18 }, (_, i) => i + 6); // 6 AM - 11 PM

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="fade-up">
        <h1 className="font-display text-3xl font-black">
          Daily Retrospective
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your hour-by-hour productivity
        </p>
      </div>

      {/* Date selector */}
      <div className="flex items-center gap-4 fade-up delay-75">
        <Button
          variant="outline"
          size="icon"
          onClick={prevDay}
          className="h-9 w-9"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={formatDate(selectedDate)}
            onChange={(e) => {
              if (e.target.value)
                setSelectedDate(new Date(`${e.target.value}T00:00:00`));
            }}
            max={formatDate(new Date())}
            className="w-auto"
            data-ocid="retrospective.date.input"
          />
          {isToday && (
            <span className="text-xs text-primary font-semibold">Today</span>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={nextDay}
          disabled={isToday}
          className="h-9 w-9"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3 fade-up delay-150">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card text-center">
          <div className="text-3xl mb-1">
            {avgMood > 0 ? MOOD_EMOJIS[Math.round(avgMood)] : "—"}
          </div>
          <div className="text-lg font-display font-black">
            {avgMood > 0 ? avgMood : "—"}
          </div>
          <div className="text-xs text-muted-foreground">Avg Mood</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-card text-center">
          <div className="text-3xl mb-1 font-display font-black text-primary">
            {avgProd > 0 ? avgProd : "—"}
          </div>
          <div className="text-xs text-muted-foreground mt-4">
            Avg Productivity
          </div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-card text-center">
          <div className="text-3xl font-display font-black text-chart-2 mb-1">
            {logs.length}
          </div>
          <div className="text-xs text-muted-foreground mt-4">Hours Logged</div>
        </div>
      </div>

      {/* Hourly grid */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2 fade-up delay-225">
          <h2 className="font-display font-bold text-lg flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Hour Log
          </h2>

          <div className="space-y-1.5">
            {workHours.map((hour) => {
              const log = logsByHour.get(hour);
              const isEditing = editingHour === hour;

              return (
                <div
                  key={hour}
                  data-ocid={`retrospective.hour.item.${hour + 1}`}
                >
                  {/* biome-ignore lint/a11y/useKeyWithClickEvents: grid slot click */}
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all",
                      isEditing
                        ? "bg-primary/5 border-primary/30"
                        : log
                          ? "bg-card border-border/50 hover:border-border"
                          : "bg-card/50 border-border/30 hover:bg-card hover:border-border/70",
                    )}
                    onClick={() =>
                      !isFuture && setEditingHour(isEditing ? null : hour)
                    }
                  >
                    {/* Hour label */}
                    <div className="w-14 flex-shrink-0 text-xs font-mono text-muted-foreground">
                      {HOUR_LABELS[hour]}
                    </div>

                    {/* Productivity bar */}
                    <div className="w-16 flex-shrink-0">
                      {log ? (
                        <div className="flex gap-0.5 items-end h-5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              // biome-ignore lint/suspicious/noArrayIndexKey: static 5-bar chart
                              key={i}
                              className={cn(
                                "flex-1 rounded-sm transition-all",
                                i < Number(log.productivity)
                                  ? "bg-primary"
                                  : "bg-border",
                              )}
                              style={{ height: `${(i + 1) * 20}%` }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="h-5 flex gap-0.5 items-end">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              // biome-ignore lint/suspicious/noArrayIndexKey: static 5-bar chart
                              key={i}
                              className="flex-1 rounded-sm bg-border/30"
                              style={{ height: `${(i + 1) * 20}%` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Activity text */}
                    <div className="flex-1 min-w-0">
                      {log ? (
                        <p className="text-sm truncate">
                          {log.comment || "No comment"}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground/40 italic">
                          Click to log this hour…
                        </p>
                      )}
                    </div>

                    {/* Mood emoji */}
                    <div className="flex-shrink-0 text-lg">
                      {log ? MOOD_EMOJIS[Number(log.mood)] : ""}
                    </div>
                  </div>

                  {/* Inline editor */}
                  {isEditing && (
                    <div className="mt-1">
                      <HourEditor
                        hour={hour}
                        existing={log}
                        day={selectedDate}
                        onSave={() => setEditingHour(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
