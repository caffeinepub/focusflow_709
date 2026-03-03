import Time "mo:core/Time";
import Text "mo:core/Text";
import Int "mo:core/Int";
import Map "mo:core/Map";
import List "mo:core/List";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import Error "mo:core/Error";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  public type TaskCategory = { #importance; #urgency; #both };

  public type TaskInterval = {
    #daily;
    #everyNDays : Nat;
    #custom : [DayOfWeek];
  };

  public type DayOfWeek = {
    #monday;
    #tuesday;
    #wednesday;
    #thursday;
    #friday;
    #saturday;
    #sunday;
  };

  public type UserProfile = {
    name : Text;
  };

  public type Goal = {
    id : Nat;
    user : Principal;
    title : Text;
    description : Text;
    why : Text;
    category : TaskCategory;
    dueDate : Time.Time;
    createdAt : Time.Time;
  };

  module Goal {
    public func compare(goal1 : Goal, goal2 : Goal) : Order.Order {
      Nat.compare(goal1.id, goal2.id);
    };
  };

  public type DailyTask = {
    id : Nat;
    user : Principal;
    goalId : Nat;
    title : Text;
    day : Time.Time;
    intensity : Nat;
    completed : Bool;
    createdAt : Time.Time;
  };

  module DailyTask {
    public func compare(task1 : DailyTask, task2 : DailyTask) : Order.Order {
      switch (Nat.compare(task1.goalId, task2.goalId)) {
        case (#equal) { Nat.compare(task1.id, task2.id) };
        case (order) { order };
      };
    };
  };

  public type RecurringTask = {
    id : Nat;
    user : Principal;
    title : Text;
    description : Text;
    interval : TaskInterval;
    scheduledTime : Text;
    reminderOffsets : [Int];
    createdAt : Time.Time;
  };

  module RecurringTask {
    public func getNextOccurrences(task : RecurringTask, fromTime : Time.Time, count : Nat) : [Time.Time] {
      let times = List.empty<Time.Time>();
      var date = fromTime;

      switch (task.interval) {
        case (#daily) {
          var i = 0;
          while (i < count) {
            times.add(date);
            date += 1;
            i += 1;
          };
        };
        case (#everyNDays(days)) {
          var i = 0;
          while (i < count) {
            times.add(date);
            date += days;
            i += 1;
          };
        };
        case (#custom(_)) {};
      };

      times.toArray();
    };
  };

  public type HourlyLog = {
    id : Nat;
    user : Principal;
    day : Time.Time;
    hour : Int;
    mood : Nat;
    productivity : Nat;
    comment : Text;
    createdAt : Time.Time;
  };

  module HourlyLog {
    public func compare(log1 : HourlyLog, log2 : HourlyLog) : Order.Order {
      switch (Int.compare(log1.hour, log2.hour)) {
        case (#equal) { Int.compare(log1.day, log2.day) };
        case (order) { order };
      };
    };
  };

  public type Streak = {
    id : Nat;
    user : Principal;
    goalId : Nat;
    currentStreak : Nat;
    longestStreak : Nat;
    lastCompleted : Nat;
  };

  module Streak {
    public func compare(streak1 : Streak, streak2 : Streak) : Order.Order {
      switch (Principal.compare(streak1.user, streak2.user)) {
        case (#equal) {
          switch (Nat.compare(streak1.goalId, streak2.goalId)) {
            case (#equal) { Nat.compare(streak1.id, streak2.id) };
            case (order) { order };
          };
        };
        case (order) { order };
      };
    };
  };

  public type MorningPrompt = {
    user : Principal;
    date : Time.Time;
    shown : Bool;
  };

  module MorningPrompt {
    public func compare(prompt1 : MorningPrompt, prompt2 : MorningPrompt) : Order.Order {
      Principal.compare(prompt1.user, prompt2.user);
    };
  };

  let goalsMap = Map.empty<Nat, Goal>();
  let dailyTasksMap = Map.empty<Nat, DailyTask>();
  let recurringTasksMap = Map.empty<Nat, RecurringTask>();
  let hourlyLogsMap = Map.empty<Nat, HourlyLog>();
  let streaksMap = Map.empty<Nat, Streak>();
  let morningPrompts = Map.empty<Principal, MorningPrompt>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  var nextGoalId = 1;
  var nextDailyTaskId = 1;
  var nextRecurringTaskId = 1;
  var nextHourlyLogId = 1;
  var nextStreakId = 1;

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func createGoal(
    title : Text,
    description : Text,
    why : Text,
    category : TaskCategory,
    dueDate : Time.Time,
  ) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create goals");
    };

    let now = Time.now();
    let goalId = nextGoalId;

    let goal : Goal = {
      id = goalId;
      user = caller;
      title;
      description;
      why;
      category;
      dueDate;
      createdAt = now;
    };

    goalsMap.add(goalId, goal);
    nextGoalId += 1;

    await createDailyTasksForGoal(caller, goalId, now, dueDate);

    goalId;
  };

  public query ({ caller }) func getGoal(id : Nat) : async Goal {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view goals");
    };

    switch (goalsMap.get(id)) {
      case (null) { Runtime.trap("Goal not found") };
      case (?goal) {
        if (goal.user != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own goals");
        };
        goal;
      };
    };
  };

  public query ({ caller }) func getAllGoals() : async [Goal] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view goals");
    };

    goalsMap.values().toArray().filter(func(goal) { goal.user == caller or AccessControl.isAdmin(accessControlState, caller) }).sort();
  };

  private func createDailyTasksForGoal(user : Principal, goalId : Nat, startDate : Time.Time, endDate : Time.Time) : async () {
    let totalDays = Int.abs((endDate - startDate));
    if (totalDays == 0) { Runtime.trap("Invalid date range") };

    for (day in Nat.range(0, Int.abs(totalDays) + 1)) {
      let intensity = if (day < totalDays / 2) {
        (day + 1) * 2;
      } else {
        (totalDays - day) * 2;
      };

      let dailyTaskId = nextDailyTaskId;
      let dailyTask : DailyTask = {
        id = dailyTaskId;
        user;
        goalId;
        title = "Task for day " # day.toText();
        day = startDate + day;
        intensity;
        completed = false;
        createdAt = Time.now();
      };

      dailyTasksMap.add(dailyTaskId, dailyTask);
      nextDailyTaskId += 1;
    };
  };

  public shared ({ caller }) func completeDailyTask(taskId : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can complete tasks");
    };

    switch (dailyTasksMap.get(taskId)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (task.user != caller) {
          Runtime.trap("Unauthorized: Can only complete your own tasks");
        };

        let updatedTask = { task with completed = true };
        dailyTasksMap.add(taskId, updatedTask);
        await updateStreak(caller, task.goalId);
        ();
      };
    };
  };

  public query ({ caller }) func getDailyTasksForGoal(goalId : Nat) : async [DailyTask] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };

    switch (goalsMap.get(goalId)) {
      case (null) { Runtime.trap("Goal not found") };
      case (?goal) {
        if (goal.user != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view tasks for your own goals");
        };
      };
    };

    dailyTasksMap.values().toArray().filter(func(task) {
      task.goalId == goalId and (task.user == caller or AccessControl.isAdmin(accessControlState, caller));
    }).sort();
  };

  public shared ({ caller }) func createRecurringTask(
    title : Text,
    description : Text,
    interval : TaskInterval,
    scheduledTime : Text,
    reminderOffsets : [Int],
  ) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create tasks");
    };

    let now = Time.now();
    let taskId = nextRecurringTaskId;

    let task : RecurringTask = {
      id = taskId;
      user = caller;
      title;
      description;
      interval;
      scheduledTime;
      reminderOffsets;
      createdAt = now;
    };

    recurringTasksMap.add(taskId, task);
    nextRecurringTaskId += 1;

    taskId;
  };

  public query ({ caller }) func getRecurringTask(id : Nat) : async RecurringTask {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };

    switch (recurringTasksMap.get(id)) {
      case (null) { Runtime.trap("Task not found") };
      case (?task) {
        if (task.user != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own tasks");
        };
        task;
      };
    };
  };

  public query ({ caller }) func getAllRecurringTasks() : async [RecurringTask] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view tasks");
    };

    recurringTasksMap.values().toArray().filter(func(task) { task.user == caller or AccessControl.isAdmin(accessControlState, caller) });
  };

  public shared ({ caller }) func addHourlyLog(
    day : Time.Time,
    hour : Int,
    mood : Nat,
    productivity : Nat,
    comment : Text,
  ) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can add logs");
    };

    let now = Time.now();
    let logId = nextHourlyLogId;

    let log : HourlyLog = {
      id = logId;
      user = caller;
      day;
      hour;
      mood;
      productivity;
      comment;
      createdAt = now;
    };

    hourlyLogsMap.add(logId, log);
    nextHourlyLogId += 1;

    logId;
  };

  public query ({ caller }) func getHourlyLogs(day : Time.Time) : async [HourlyLog] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view logs");
    };

    hourlyLogsMap.values().toArray().filter(func(log) { log.user == caller and log.day == day }).sort();
  };

  public query ({ caller }) func hasSeenMorningPrompt() : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can check prompts");
    };

    morningPrompts.containsKey(caller);
  };

  public shared ({ caller }) func markPromptSeen() : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can mark prompts");
    };

    let today = Time.now();
    let prompt = {
      user = caller;
      date = today;
      shown = true;
    };
    morningPrompts.add(caller, prompt);
  };

  private func updateStreak(user : Principal, goalId : Nat) : async () {
    let nowNat = Int.abs(Time.now());

    let existingStreak = findStreak(user, goalId);

    switch (existingStreak) {
      case (null) {
        let streakId = nextStreakId;
        let newStreak : Streak = {
          id = streakId;
          user;
          goalId;
          currentStreak = 1;
          longestStreak = 1;
          lastCompleted = nowNat;
        };
        streaksMap.add(streakId, newStreak);
        nextStreakId += 1;
      };
      case (?streak) {
        let daysSinceLast = Int.abs(nowNat - streak.lastCompleted);
        let currentStreak = if (daysSinceLast <= 1) { streak.currentStreak + 1 } else {
          1;
        };

        let updatedStreak = {
          streak with
          currentStreak;
          longestStreak = Nat.max(streak.longestStreak, currentStreak);
          lastCompleted = nowNat;
        };

        streaksMap.add(streak.id, updatedStreak);
      };
    };
  };

  func findStreak(user : Principal, goalId : Nat) : ?Streak {
    let iter = streaksMap.values();
    for (streak in iter) {
      if (streak.user == user and streak.goalId == goalId) {
        return ?streak;
      };
    };
    null;
  };

  public query ({ caller }) func getProcrastinationStats() : async (Nat, Nat) {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view stats");
    };

    let userTasks = dailyTasksMap.values().toArray().filter(func(task) { task.user == caller });

    let totalTasks = userTasks.size();
    let completedTasks = userTasks.filter(func(task) { task.completed }).size();

    (completedTasks, totalTasks);
  };
};
