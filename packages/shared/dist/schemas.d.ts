import { z } from "zod";
export declare const emailSchema: z.ZodString;
export declare const passwordSchema: z.ZodString;
export declare const dateStringSchema: z.ZodString;
export declare const moodSchema: z.ZodEnum<["bad", "low", "okay", "good", "great"]>;
export declare const signupSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    displayName?: string | undefined;
}, {
    email: string;
    password: string;
    displayName?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    rememberMe: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    rememberMe?: boolean | undefined;
}, {
    email: string;
    password: string;
    rememberMe?: boolean | undefined;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export declare const entryTypeSchema: z.ZodEnum<["audio", "video", "text"]>;
/** Coerces multipart / missing mood to default 5. */
export declare const moodScoreSchema: z.ZodEffects<z.ZodNumber, number, unknown>;
export declare const createTextEntrySchema: z.ZodObject<{
    date: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    content: z.ZodString;
    mood: z.ZodEffects<z.ZodNumber, number, unknown>;
}, "strip", z.ZodTypeAny, {
    mood: number;
    date: string;
    content: string;
    title?: string | undefined;
}, {
    date: string;
    content: string;
    mood?: unknown;
    title?: string | undefined;
}>;
export declare const updateEntrySchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    content: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    mood: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    mood?: number | undefined;
    title?: string | null | undefined;
    content?: string | null | undefined;
}, {
    mood?: number | undefined;
    title?: string | null | undefined;
    content?: string | null | undefined;
}>;
export declare const createMediaEntrySchema: z.ZodObject<{
    date: z.ZodString;
    type: z.ZodEnum<["audio", "video"]>;
    title: z.ZodOptional<z.ZodString>;
    durationSeconds: z.ZodOptional<z.ZodNumber>;
    mood: z.ZodEffects<z.ZodNumber, number, unknown>;
}, "strip", z.ZodTypeAny, {
    mood: number;
    date: string;
    type: "audio" | "video";
    title?: string | undefined;
    durationSeconds?: number | undefined;
}, {
    date: string;
    type: "audio" | "video";
    mood?: unknown;
    title?: string | undefined;
    durationSeconds?: number | undefined;
}>;
export declare const moodLogSchema: z.ZodObject<{
    date: z.ZodString;
    mood: z.ZodEnum<["bad", "low", "okay", "good", "great"]>;
}, "strip", z.ZodTypeAny, {
    mood: "bad" | "low" | "okay" | "good" | "great";
    date: string;
}, {
    mood: "bad" | "low" | "okay" | "good" | "great";
    date: string;
}>;
export declare const settingsPatchSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    fontSize: z.ZodOptional<z.ZodEnum<["small", "medium", "large"]>>;
    dailyReminderEnabled: z.ZodOptional<z.ZodBoolean>;
    dailyReminderTime: z.ZodOptional<z.ZodString>;
    appLockEnabled: z.ZodOptional<z.ZodBoolean>;
    idleTimeoutMinutes: z.ZodOptional<z.ZodNumber>;
    syncFrequency: z.ZodOptional<z.ZodEnum<["on-save", "hourly", "daily"]>>;
}, "strip", z.ZodTypeAny, {
    displayName?: string | undefined;
    fontSize?: "small" | "medium" | "large" | undefined;
    dailyReminderEnabled?: boolean | undefined;
    dailyReminderTime?: string | undefined;
    appLockEnabled?: boolean | undefined;
    idleTimeoutMinutes?: number | undefined;
    syncFrequency?: "on-save" | "hourly" | "daily" | undefined;
}, {
    displayName?: string | undefined;
    fontSize?: "small" | "medium" | "large" | undefined;
    dailyReminderEnabled?: boolean | undefined;
    dailyReminderTime?: string | undefined;
    appLockEnabled?: boolean | undefined;
    idleTimeoutMinutes?: number | undefined;
    syncFrequency?: "on-save" | "hourly" | "daily" | undefined;
}>;
export declare const settingsColorThemeSchema: z.ZodObject<{
    theme: z.ZodEnum<["purple", "cyan", "emerald", "rose", "amber", "slate", "indigo"]>;
}, "strip", z.ZodTypeAny, {
    theme: "purple" | "cyan" | "emerald" | "rose" | "amber" | "slate" | "indigo";
}, {
    theme: "purple" | "cyan" | "emerald" | "rose" | "amber" | "slate" | "indigo";
}>;
export declare const avatarLibrarySchema: z.ZodObject<{
    avatarLibraryId: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    avatarLibraryId: string;
}, {
    avatarLibraryId: string;
}>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateTextEntryInput = z.infer<typeof createTextEntrySchema>;
export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;
export type CreateMediaEntryInput = z.infer<typeof createMediaEntrySchema>;
export type MoodLogInput = z.infer<typeof moodLogSchema>;
export type SettingsPatchInput = z.infer<typeof settingsPatchSchema>;
