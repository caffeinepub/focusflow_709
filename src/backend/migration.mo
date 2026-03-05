import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";

module {
  // Type definitions for tasks and reminders
  type TaskCategory = { #importance; #urgency; #both };

  type TaskInterval = {
    #daily;
    #everyNDays : Nat;
    #custom : [DayOfWeek];
  };

  type DayOfWeek = {
    #monday;
    #tuesday;
    #wednesday;
    #thursday;
    #friday;
    #saturday;
    #sunday;
  };

  type Goal = {
    id : Nat;
    user : Principal;
    title : Text;
    description : Text;
    why : Text;
    category : TaskCategory;
    dueDate : Time.Time;
    createdAt : Time.Time;
  };

  type DailyTask = {
    id : Nat;
    user : Principal;
    goalId : Nat;
    title : Text;
    day : Time.Time;
    intensity : Nat;
    completed : Bool;
    createdAt : Time.Time;
  };

  type RecurringTask = {
    id : Nat;
    user : Principal;
    title : Text;
    description : Text;
    interval : TaskInterval;
    scheduledTime : Text;
    reminderOffsets : [Int];
    createdAt : Time.Time;
  };

  type HourlyLog = {
    id : Nat;
    user : Principal;
    day : Time.Time;
    hour : Int;
    mood : Nat;
    productivity : Nat;
    comment : Text;
    createdAt : Time.Time;
  };

  type Streak = {
    id : Nat;
    user : Principal;
    goalId : Nat;
    currentStreak : Nat;
    longestStreak : Nat;
    lastCompleted : Nat;
  };

  type MorningPrompt = {
    user : Principal;
    date : Time.Time;
    shown : Bool;
  };

  type OldActor = {
    goalsMap : Map.Map<Nat, Goal>;
    dailyTasksMap : Map.Map<Nat, DailyTask>;
    recurringTasksMap : Map.Map<Nat, RecurringTask>;
    hourlyLogsMap : Map.Map<Nat, HourlyLog>;
    streaksMap : Map.Map<Nat, Streak>;
    morningPrompts : Map.Map<Principal, MorningPrompt>;
  };

  type NewActor = {
    goalsMap : Map.Map<Nat, Goal>;
    dailyTasksMap : Map.Map<Nat, DailyTask>;
    recurringTasksMap : Map.Map<Nat, RecurringTask>;
    hourlyLogsMap : Map.Map<Nat, HourlyLog>;
    streaksMap : Map.Map<Nat, Streak>;
    morningPrompts : Map.Map<Principal, MorningPrompt>;
  };

  public func run(old : OldActor) : NewActor {
    {
      goalsMap = old.goalsMap;
      dailyTasksMap = old.dailyTasksMap;
      recurringTasksMap = old.recurringTasksMap;
      hourlyLogsMap = old.hourlyLogsMap;
      streaksMap = old.streaksMap;
      morningPrompts = old.morningPrompts;
    };
  };
};
