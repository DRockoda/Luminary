import { z } from "zod";
import { AVATAR_LIBRARY_IDS } from "./avatarLibrary.js";
import { MOOD_TAGS } from "./mood.js";
export const emailSchema = z.string().trim().toLowerCase().email();
export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long");
export const dateStringSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
export const moodSchema = z.enum(MOOD_TAGS);
export const signupSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    displayName: z.string().trim().min(1).max(80).optional(),
});
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1),
    rememberMe: z.boolean().optional(),
});
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
});
export const entryTypeSchema = z.enum(["audio", "video", "text"]);
/** Coerces multipart / missing mood to default 5. */
export const moodScoreSchema = z.preprocess((val) => (val === undefined || val === null || val === "" ? 5 : val), z.coerce.number().int().min(1).max(10));
export const createTextEntrySchema = z.object({
    date: dateStringSchema,
    title: z.string().trim().max(200).optional(),
    content: z.string().min(1),
    mood: moodScoreSchema,
});
export const updateEntrySchema = z.object({
    title: z.string().trim().max(200).nullable().optional(),
    content: z.string().nullable().optional(),
    mood: z.coerce.number().int().min(1).max(10).optional(),
});
export const createMediaEntrySchema = z.object({
    date: dateStringSchema,
    type: z.enum(["audio", "video"]),
    title: z.string().trim().max(200).optional(),
    durationSeconds: z.number().int().min(0).max(60 * 60 * 6).optional(),
    mood: moodScoreSchema,
});
export const moodLogSchema = z.object({
    date: dateStringSchema,
    mood: moodSchema,
});
export const settingsPatchSchema = z.object({
    displayName: z.string().trim().min(1).max(80).optional(),
    fontSize: z.enum(["small", "medium", "large"]).optional(),
    dailyReminderEnabled: z.boolean().optional(),
    dailyReminderTime: z
        .string()
        .regex(/^\d{2}:\d{2}$/)
        .optional(),
    appLockEnabled: z.boolean().optional(),
    idleTimeoutMinutes: z.number().int().min(0).max(60 * 24).optional(),
    syncFrequency: z.enum(["on-save", "hourly", "daily"]).optional(),
});
const COLOR_THEME_KEYS = [
    "purple",
    "cyan",
    "emerald",
    "rose",
    "amber",
    "slate",
    "indigo",
];
export const settingsColorThemeSchema = z.object({
    theme: z.enum(COLOR_THEME_KEYS),
});
export const avatarLibrarySchema = z.object({
    avatarLibraryId: z.string().refine((id) => AVATAR_LIBRARY_IDS.includes(id), "Invalid avatar"),
});
