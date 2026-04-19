import type { MoodTag, MoodValue } from "./mood.js";
import type { ThemeKey } from "./colorThemes.js";
export type EntryType = "audio" | "video" | "text";
/** Per-entry mood captured at save time (1 = worst … 10 = best). */
export type MoodScore = MoodValue;
export interface UserSettings {
    fontSize: "small" | "medium" | "large";
    dailyReminderEnabled: boolean;
    dailyReminderTime: string;
    appLockEnabled: boolean;
    idleTimeoutMinutes: number;
    syncFrequency: "on-save" | "hourly" | "daily";
}
export interface PublicUser {
    id: string;
    email: string;
    displayName: string;
    driveConnected: boolean;
    driveEmail: string | null;
    driveSyncMode: "on-save" | "hourly" | "daily" | "manual";
    driveLastSyncAt: string | null;
    emailVerified: boolean;
    /** Accent color palette key (stored in DB as `User.theme`). */
    theme: ThemeKey;
    avatarUrl?: string | null;
    avatarLibraryId?: string | null;
    settings: UserSettings;
    createdAt: string;
}
export interface UserWarning {
    id: string;
    message: string;
    level: "info" | "warning" | "danger";
    createdAt: string;
}
export interface ActiveAnnouncement {
    id: string;
    message: string;
    link?: string | null;
    linkLabel?: string | null;
    color: "info" | "success" | "warning" | "danger" | "accent";
    createdAt: string;
    expiresAt?: string | null;
}
export interface JournalEntry {
    id: string;
    userId: string;
    date: string;
    type: EntryType;
    title?: string | null;
    content?: string | null;
    mediaUrl?: string | null;
    driveFileId?: string | null;
    durationSeconds?: number | null;
    thumbnailUrl?: string | null;
    mood: MoodScore;
    createdAt: string;
    updatedAt: string;
    /** Present when entry is in trash (API trash list only). */
    deletedAt?: string | null;
}
export interface MoodLog {
    id: string;
    userId: string;
    date: string;
    mood: MoodTag;
    createdAt: string;
}
export interface StreakStats {
    currentStreak: number;
    bestStreak: number;
    daysJournaled: number;
    totalEntries: number;
    activeToday: boolean;
}
export interface EntryBreakdown {
    audio: number;
    video: number;
    text: number;
    total: number;
}
export interface HeatmapCell {
    date: string;
    count: number;
    mood?: MoodValue | null;
}
export interface MoodSummary {
    period: "week" | "month" | "year";
    averageScore: number;
    averageMood: MoodValue | null;
    distribution: Record<MoodValue, number>;
    daysLogged: number;
}
export interface AuthResponse {
    user: PublicUser;
}
