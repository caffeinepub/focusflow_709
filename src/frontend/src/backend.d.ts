import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export type TaskInterval = {
    __kind__: "custom";
    custom: Array<DayOfWeek>;
} | {
    __kind__: "everyNDays";
    everyNDays: bigint;
} | {
    __kind__: "daily";
    daily: null;
};
export interface RecurringTask {
    id: bigint;
    title: string;
    interval: TaskInterval;
    scheduledTime: string;
    createdAt: Time;
    user: Principal;
    description: string;
    reminderOffsets: Array<bigint>;
}
export interface HourlyLog {
    id: bigint;
    day: Time;
    hour: bigint;
    mood: bigint;
    createdAt: Time;
    productivity: bigint;
    user: Principal;
    comment: string;
}
export interface DailyTask {
    id: bigint;
    day: Time;
    title: string;
    createdAt: Time;
    user: Principal;
    completed: boolean;
    goalId: bigint;
    intensity: bigint;
}
export interface UserProfile {
    name: string;
}
export interface Goal {
    id: bigint;
    why: string;
    title: string;
    createdAt: Time;
    user: Principal;
    dueDate: Time;
    description: string;
    category: TaskCategory;
}
export enum DayOfWeek {
    tuesday = "tuesday",
    wednesday = "wednesday",
    saturday = "saturday",
    thursday = "thursday",
    sunday = "sunday",
    friday = "friday",
    monday = "monday"
}
export enum TaskCategory {
    urgency = "urgency",
    both = "both",
    importance = "importance"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addHourlyLog(day: Time, hour: bigint, mood: bigint, productivity: bigint, comment: string): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    completeDailyTask(taskId: bigint): Promise<void>;
    createGoal(title: string, description: string, why: string, category: TaskCategory, dueDate: Time): Promise<bigint>;
    createRecurringTask(title: string, description: string, interval: TaskInterval, scheduledTime: string, reminderOffsets: Array<bigint>): Promise<bigint>;
    getAllGoals(): Promise<Array<Goal>>;
    getAllRecurringTasks(): Promise<Array<RecurringTask>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyTasksForGoal(goalId: bigint): Promise<Array<DailyTask>>;
    getGoal(id: bigint): Promise<Goal>;
    getHourlyLogs(day: Time): Promise<Array<HourlyLog>>;
    getProcrastinationStats(): Promise<[bigint, bigint]>;
    getRecurringTask(id: bigint): Promise<RecurringTask>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    hasSeenMorningPrompt(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    markPromptSeen(): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
}
