import type { UserSettings } from "@luminary/shared";

export const DEFAULT_SETTINGS: UserSettings = {
  fontSize: "medium",
  dailyReminderEnabled: false,
  dailyReminderTime: "21:00",
  appLockEnabled: false,
  idleTimeoutMinutes: 10,
  syncFrequency: "on-save",
};
