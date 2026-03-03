# FocusFlow - Anti-Procrastination Task Manager

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add

**Backend Data Models:**
- `Goal`: id, title, description (detailed steps/purpose), why (motivation), category (importance/urgency/both), dueDate, createdAt, isCompleted, streakCount, totalCompletions
- `DailyTask`: id, goalId, scheduledDate, title, description, isCompleted, completedAt, estimatedMinutes, weight (percentage of goal)
- `RecurringTask`: id, goalId, title, description, intervalType (daily/everyNDays/custom), intervalDays, scheduledTime (HH:MM), reminderOffsets (minutes before), isActive
- `HourlyLog`: id, date, hour (0-23), activity, mood, productivityScore (1-5)
- `ProcrastinationPattern`: id, userId, taskCategory, peakProcrastinationHours, averageDelayMinutes, suggestedReminderOffset
- `Streak`: id, goalId, currentStreak, longestStreak, lastCompletedDate

**Backend Functions:**
- createGoal, updateGoal, deleteGoal, listGoals, getGoal
- generateDailyTasks(goalId, dueDate): distribute goal work across days with progressive loading (start small, build up)
- getDailyTasks(date): get today's tasks
- completeTask(taskId): mark complete, update streaks
- createRecurringTask, updateRecurringTask, deleteRecurringTask, listRecurringTasks
- getRemindersDue(currentTime): tasks with reminders due now
- logHour(date, hour, activity, mood, productivityScore)
- getHourlyLogs(date)
- getDailyRetrospective(date)
- updateProcrastinationPattern(taskId, completedAt)
- getStreaks(goalId)
- getProductivityStats(startDate, endDate): completion rates, best/worst hours, category performance
- getDailyPrompt(): morning onboarding prompt flag

**Incremental Task Distribution Algorithm:**
- Given N days until due, generate N daily sub-tasks
- Weights follow a gentle ramp: early days get lighter tasks (10-20%), later days heavier (up to 30%)
- Each generated sub-task has a title, estimated work amount, and day index

### Modify
- None (new project)

### Remove
- None (new project)

## Implementation Plan

1. **Backend (Motoko)**
   - Define stable data types for Goal, DailyTask, RecurringTask, HourlyLog, ProcrastinationPattern, Streak
   - Implement CRUD for Goals with motivation ("why") field
   - Implement task distribution algorithm for breaking goals into daily increments
   - Implement RecurringTask management with interval/time/reminder configuration
   - Implement HourlyLog for daily retrospective
   - Implement streak tracking on task completion
   - Implement procrastination pattern analysis (completion time vs scheduled time)
   - Implement productivity stats aggregation
   - Implement reminder query by current time window

2. **Frontend (React + TypeScript)**
   - **Morning Prompt Screen**: Daily onboarding card prompting user to review/add today's tasks
   - **Dashboard**: Today's tasks with priority badges (importance/urgency), completion progress ring, streak indicators
   - **Goal Manager**: Create/edit goals with title, description, why, category, due date; auto-generate daily breakdown
   - **Daily Task View**: Checklist of incremental actions for today, time-based ordering, completion tracking
   - **Recurring Tasks**: Setup screen for repeating tasks with interval, time, and multi-reminder config
   - **Retrospective Journal**: Hourly log grid (24 slots) for end-of-day reflection with mood/productivity scores
   - **Insights/Analytics**: Visual streak tracker, procrastination pattern heatmap, completion rate charts, category performance
   - **Goal Tracker**: Visual progress bar per goal, streak flame icons, milestone markers
   - **Reminders Panel**: Upcoming reminders list with snooze/dismiss
   - Consistent category tagging UI (importance, urgency, both) with color coding
   - Streak-based motivational UI elements (flames, badges, counts)
