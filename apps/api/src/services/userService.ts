import type { PublicUser, UserSettings } from "@luminary/shared";
import { isThemeKey } from "@luminary/shared";
import type { User } from "@prisma/client";
import { DEFAULT_SETTINGS } from "../lib/defaults.js";

export function toPublicUser(user: User): PublicUser {
  let parsed: Partial<UserSettings> & Record<string, unknown> = {};
  try {
    parsed = user.settings ? (JSON.parse(user.settings) as typeof parsed) : {};
  } catch {
    parsed = {};
  }
  const { theme: _legacy, ...rawRest } = parsed;
  const rest = rawRest as Partial<UserSettings>;
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    driveConnected: user.driveConnected,
    driveEmail: user.driveEmail ?? null,
    driveSyncMode: ((): PublicUser["driveSyncMode"] => {
      const m = user.driveSyncMode as PublicUser["driveSyncMode"];
      return m === "on-save" || m === "hourly" || m === "daily" || m === "manual"
        ? m
        : "on-save";
    })(),
    driveLastSyncAt: user.driveLastSyncAt?.toISOString() ?? null,
    emailVerified: user.emailVerified,
    theme: isThemeKey(user.theme) ? user.theme : "purple",
    avatarUrl: user.avatarUrl,
    avatarLibraryId: user.avatarLibraryId,
    settings: { ...DEFAULT_SETTINGS, ...rest },
    createdAt: user.createdAt.toISOString(),
  };
}

export function parseUserSettings(raw: string | null | undefined): UserSettings {
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<UserSettings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
