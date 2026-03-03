import type { DailyTask, Goal, HourlyLog, RecurringTask } from "../backend.d";
import { DayOfWeek, TaskCategory } from "../backend.d";

// Helper to create nanosecond timestamps
function daysFromNow(days: number): bigint {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return BigInt(d.getTime()) * 1_000_000n;
}
function daysAgo(days: number): bigint {
  return daysFromNow(-days);
}
function todayAtHour(h: number): bigint {
  const d = new Date();
  d.setHours(h, 0, 0, 0);
  return BigInt(d.getTime()) * 1_000_000n;
}

const FAKE_PRINCIPAL = {
  isAnonymous: () => false,
  toText: () => "sample-principal",
  toUint8Array: () => new Uint8Array(),
  compareTo: () => "eq",
  _arr: new Uint8Array(),
} as never;

export const SAMPLE_GOALS: Goal[] = [
  {
    id: 1n,
    title: "Write Thesis Chapter 3",
    description:
      "Complete the methodology section covering research design, data collection approach, and statistical analysis framework. Include 3 case studies and literature review synthesis.",
    why: "Finishing my thesis is the culmination of 3 years of dedicated research. This chapter proves the rigor of my approach and brings me closer to graduation and a career in academia.",
    category: TaskCategory.urgency,
    dueDate: daysFromNow(19),
    createdAt: daysAgo(2),
    user: FAKE_PRINCIPAL,
  },
  {
    id: 2n,
    title: "Spanish B2 Certification",
    description:
      "Study vocabulary (500 new words), grammar (subjunctive mood, conditionals), and practice speaking for 30 min daily. Use Anki cards + structured conversation practice.",
    why: "Speaking Spanish fluently will open doors to work in Latin America and connect me with 500 million native speakers. This is my year to finally become bilingual.",
    category: TaskCategory.importance,
    dueDate: daysFromNow(45),
    createdAt: daysAgo(5),
    user: FAKE_PRINCIPAL,
  },
  {
    id: 3n,
    title: "Build Morning Fitness Habit",
    description:
      "Establish a 45-minute morning workout routine: 15 min strength, 20 min cardio, 10 min stretch. Track progress with photos weekly. Target: 5 days/week consistency.",
    why: "My energy levels and mental clarity are directly tied to physical fitness. A strong morning routine sets a winning tone for every day and keeps me sharp for creative work.",
    category: TaskCategory.both,
    dueDate: daysFromNow(30),
    createdAt: daysAgo(10),
    user: FAKE_PRINCIPAL,
  },
];

// Build sample daily tasks for goals
function buildSampleDailyTasks(goal: Goal, totalDays: number): DailyTask[] {
  const tasks: DailyTask[] = [];
  const today = new Date();

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i - 5); // start 5 days ago
    const dayNs = BigInt(d.getTime()) * 1_000_000n;
    const intensity = BigInt(Math.min(5, Math.ceil((i + 1) / (totalDays / 5))));
    const isPast = d < today;
    const isToday = d.toDateString() === today.toDateString();

    tasks.push({
      id: BigInt(goal.id * 100n + BigInt(i)),
      goalId: goal.id,
      title: getSampleTaskTitle(goal.id, i),
      day: dayNs,
      completed: isPast && Math.random() > 0.2,
      intensity,
      createdAt: daysAgo(totalDays - i),
      user: FAKE_PRINCIPAL,
    });

    // Also add today's task explicitly
    if (isToday) {
      tasks[tasks.length - 1]!.completed = false;
    }
  }
  return tasks;
}

function getSampleTaskTitle(goalId: bigint, day: number): string {
  const thesisTasks = [
    "Review existing literature notes",
    "Outline methodology section structure",
    "Write research design paragraph",
    "Draft data collection methods",
    "Summarize case study 1 findings",
    "Write statistical analysis framework",
    "Draft case study 2 overview",
    "Refine argument flow",
    "Add citations and references",
    "Final review and polish",
  ];
  const spanishTasks = [
    "Learn 20 new vocabulary words",
    "Practice subjunctive conjugations",
    "Watch Spanish TV episode (no subtitles)",
    "Write a short paragraph in Spanish",
    "30-min speaking practice session",
    "Review conditional tense rules",
    "Complete grammar exercises",
    "Listen to Spanish podcast",
    "Write diary entry in Spanish",
    "Mock exam practice",
  ];
  const fitnessTasks = [
    "Morning run — 20 minutes easy pace",
    "Upper body strength circuit",
    "Core workout + stretching",
    "HIIT cardio session",
    "Lower body strength training",
    "Active recovery walk",
    "Full body workout",
    "Yoga + mobility work",
    "Interval training",
    "Rest day — light stretching",
  ];

  const lists =
    goalId === 1n ? thesisTasks : goalId === 2n ? spanishTasks : fitnessTasks;
  return lists[day % lists.length] ?? "Complete daily task";
}

export const SAMPLE_DAILY_TASKS: Record<string, DailyTask[]> = {
  "1": buildSampleDailyTasks(SAMPLE_GOALS[0]!, 19),
  "2": buildSampleDailyTasks(SAMPLE_GOALS[1]!, 30),
  "3": buildSampleDailyTasks(SAMPLE_GOALS[2]!, 20),
};

export const SAMPLE_RECURRING_TASKS: RecurringTask[] = [
  {
    id: 1n,
    title: "Morning Meditation",
    description:
      "10 minutes of guided breathing and mindfulness to start the day with clarity.",
    interval: { __kind__: "daily", daily: null },
    scheduledTime: "07:00",
    reminderOffsets: [10n, 5n],
    createdAt: daysAgo(7),
    user: FAKE_PRINCIPAL,
  },
  {
    id: 2n,
    title: "Weekly Review Session",
    description:
      "Review goals, celebrate wins, identify blockers, and plan the upcoming week.",
    interval: { __kind__: "custom", custom: [DayOfWeek.sunday] },
    scheduledTime: "18:00",
    reminderOffsets: [60n, 30n],
    createdAt: daysAgo(14),
    user: FAKE_PRINCIPAL,
  },
  {
    id: 3n,
    title: "Deep Work Block",
    description: "2-hour distraction-free focused work on most important task.",
    interval: { __kind__: "everyNDays", everyNDays: 2n },
    scheduledTime: "09:00",
    reminderOffsets: [15n],
    createdAt: daysAgo(5),
    user: FAKE_PRINCIPAL,
  },
];

export const SAMPLE_HOURLY_LOGS: HourlyLog[] = [
  {
    id: 1n,
    day: todayAtHour(0),
    hour: 8n,
    mood: 3n,
    productivity: 4n,
    comment: "Reviewed thesis notes and outlined today's writing goals",
    createdAt: todayAtHour(8),
    user: FAKE_PRINCIPAL,
  },
  {
    id: 2n,
    day: todayAtHour(0),
    hour: 9n,
    mood: 4n,
    productivity: 5n,
    comment: "Deep work block — wrote 800 words on methodology section",
    createdAt: todayAtHour(9),
    user: FAKE_PRINCIPAL,
  },
  {
    id: 3n,
    day: todayAtHour(0),
    hour: 11n,
    mood: 3n,
    productivity: 3n,
    comment: "Spanish vocabulary practice — learned 25 new words",
    createdAt: todayAtHour(11),
    user: FAKE_PRINCIPAL,
  },
  {
    id: 4n,
    day: todayAtHour(0),
    hour: 14n,
    mood: 4n,
    productivity: 4n,
    comment: "Fitness session completed — felt great!",
    createdAt: todayAtHour(14),
    user: FAKE_PRINCIPAL,
  },
];
