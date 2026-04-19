import type { UserSettings } from "@luminary/shared";
import { THEMES, type ThemeKey } from "@luminary/shared";
import { format } from "date-fns";
import {
  Bell,
  Camera,
  Cloud,
  Download,
  Palette,
  Shield,
  Smile,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DriveConnectBanner } from "@/components/settings/DriveConnectBanner";
import { ExportPanel } from "@/components/settings/ExportPanel";
import { StorageSyncPanel } from "@/components/settings/StorageSyncPanel";
import { AvatarCropDialog } from "@/components/settings/AvatarCropDialog";
import { AvatarLibraryModal } from "@/components/settings/AvatarLibraryModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/lib/toast";
import { api, apiErrorMessage } from "@/lib/api";
import {
  applyColorTheme,
  applyFontSize,
  getStoredColorTheme,
  getStoredFontSize,
} from "@/lib/theme";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { InstallButton } from "@/components/pwa/InstallButton";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

type NavSection =
  | "profile"
  | "notifications"
  | "security"
  | "appearance"
  | "storage"
  | "export";

const SETTINGS_NAV = [
  {
    group: "My Account",
    items: [
      { id: "profile" as const, label: "Profile", icon: User },
      { id: "notifications" as const, label: "Notifications", icon: Bell },
      { id: "security" as const, label: "Security", icon: Shield },
      { id: "appearance" as const, label: "Appearance", icon: Palette },
    ],
  },
  {
    group: "Data",
    items: [
      { id: "storage" as const, label: "Storage & Sync", icon: Cloud },
      { id: "export" as const, label: "Export", icon: Download },
    ],
  },
];

function sectionFromTab(tab: string | null): NavSection {
  const ids = new Set(SETTINGS_NAV.flatMap((n) => n.items.map((i) => i.id)));
  if (tab && ids.has(tab as NavSection)) return tab as NavSection;
  return "profile";
}

export default function SettingsPage() {
  const { user, setUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [settings, setSettings] = useState<UserSettings | null>(
    user?.settings ?? null,
  );
  const [fontSize, setFontSize] = useState(getStoredFontSize());
  const [saving, setSaving] = useState(false);
  const [passwordModal, setPasswordModal] = useState<"change" | "delete" | null>(
    null,
  );
  const [section, setSection] = useState<NavSection>(() =>
    typeof window !== "undefined"
      ? sectionFromTab(new URLSearchParams(window.location.search).get("tab"))
      : "profile",
  );
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [isAvatarPanelOpen, setIsAvatarPanelOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSection(sectionFromTab(searchParams.get("tab")));
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName);
      setSettings(user.settings);
    }
  }, [user]);

  useEffect(() => {
    if (!isAvatarPanelOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (!avatarPanelRef.current?.contains(e.target as Node)) {
        setIsAvatarPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAvatarPanelOpen]);

  const activeTheme = (user?.theme ?? getStoredColorTheme()) as ThemeKey;
  const THEME_ORDER: ThemeKey[] = ["purple", "cyan", "emerald", "rose", "amber", "slate", "indigo"];

  async function patchColorTheme(themeKey: ThemeKey) {
    const prev = user?.theme ?? getStoredColorTheme();
    applyColorTheme(themeKey);
    try {
      const { data } = await api.patch<{ user: typeof user }>("/api/settings/theme", {
        theme: themeKey,
      });
      setUser(data.user);
      toast.success("Theme updated");
    } catch (err) {
      applyColorTheme(prev);
      toast.error("Couldn't save theme", apiErrorMessage(err));
    }
  }

  function onAvatarFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast.error("Invalid file", "Use JPG, PNG, or WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large", "Maximum size is 5MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCropOpen(true);
    setIsAvatarPanelOpen(false);
  }

  async function uploadCroppedAvatar(blob: Blob) {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    try {
      const form = new FormData();
      form.append("file", blob, "avatar.jpg");
      const { data } = await api.post<{ user: NonNullable<typeof user> }>(
        "/api/user/avatar/upload",
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      setUser(data.user);
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error("Upload failed", apiErrorMessage(err));
    }
  }

  async function pickLibraryAvatar(avatarLibraryId: string) {
    try {
      const { data } = await api.post<{ user: NonNullable<typeof user> }>(
        "/api/user/avatar/library",
        { avatarLibraryId },
      );
      setUser(data.user);
      toast.success("Profile photo updated");
      setIsAvatarPanelOpen(false);
    } catch (err) {
      toast.error("Couldn't update avatar", apiErrorMessage(err));
    }
  }

  async function removeAvatar() {
    try {
      const { data } = await api.delete<{ user: NonNullable<typeof user> }>(
        "/api/user/avatar",
      );
      setUser(data.user);
      toast.success("Profile photo removed");
      setIsAvatarPanelOpen(false);
    } catch (err) {
      toast.error("Couldn't remove photo", apiErrorMessage(err));
    }
  }

  const dirty = useMemo(() => {
    if (!user || !settings) return false;
    if (displayName !== user.displayName) return true;
    return JSON.stringify(settings) !== JSON.stringify(user.settings);
  }, [displayName, settings, user]);

  if (!settings || !user) return null;

  function update<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  }

  async function saveAll() {
    setSaving(true);
    try {
      const { data } = await api.patch<{ user: typeof user }>("/api/settings", {
        displayName,
        ...settings,
      });
      setUser(data.user);
      toast.success("Settings saved");
    } catch (err) {
      toast.error("Couldn't save", apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="main-content pb-24">
      <PageContainer>
      <PageHeader title="Settings" description="Manage your account, appearance, and preferences." />

      <DriveConnectBanner />

      <div className="settings-layout">
        <nav className="settings-sidenav">
          {SETTINGS_NAV.map((group) => (
            <div className="settings-nav-group" key={group.group}>
              <span className="settings-nav-group-label">{group.group}</span>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSection(item.id)}
                  className={cn("settings-nav-item", section === item.id && "is-active")}
                >
                  <item.icon size={14} />
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="settings-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
          {section === "profile" && (
            <>
              <div ref={avatarPanelRef}>
                <div className="profile-hero">
                  <div className="profile-avatar-wrapper">
                    <UserAvatar user={user} size={80} />
                    <button
                      type="button"
                      className="profile-avatar-edit-btn"
                      onClick={() => setIsAvatarPanelOpen((prev) => !prev)}
                    >
                      <Camera size={13} />
                    </button>
                  </div>
                  <div>
                    <h2 className="profile-hero-name">{user.displayName}</h2>
                    <p className="profile-hero-email">{user.email}</p>
                  </div>
                </div>

                {isAvatarPanelOpen && (
                  <div className="avatar-options-panel">
                    <button
                      className="avatar-option-row"
                      onClick={() => fileRef.current?.click()}
                      type="button"
                    >
                      <div className="avatar-option-icon">
                        <Upload size={14} />
                      </div>
                      <div>
                        <span className="avatar-option-label">Upload a photo</span>
                        <span className="avatar-option-hint">JPG, PNG or WebP · Max 5MB</span>
                      </div>
                    </button>

                    <div className="avatar-options-divider" />

                    <button
                      className="avatar-option-row"
                      onClick={() => {
                        setLibraryOpen(true);
                        setIsAvatarPanelOpen(false);
                      }}
                      type="button"
                    >
                      <div className="avatar-option-icon">
                        <Smile size={14} />
                      </div>
                      <div>
                        <span className="avatar-option-label">Choose from library</span>
                        <span className="avatar-option-hint">24 illustrated avatars</span>
                      </div>
                    </button>

                    {user.avatarUrl || user.avatarLibraryId ? (
                      <>
                        <div className="avatar-options-divider" />
                        <button
                          className="avatar-option-row avatar-option-danger"
                          onClick={() => void removeAvatar()}
                          type="button"
                        >
                          <div className="avatar-option-icon">
                            <Trash2 size={14} />
                          </div>
                          <div>
                            <span className="avatar-option-label">Remove photo</span>
                            <span className="avatar-option-hint">Revert to initials</span>
                          </div>
                        </button>
                      </>
                    ) : null}
                  </div>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={onAvatarFilePick}
              />

              <Section title="Personal Details">
                <Row label="Full name">
                  <div className="flex items-center gap-3">
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                </Row>
                <Row label="Email address">
                  <div className="settings-row-value">{user.email}</div>
                </Row>
                <Row label="Member since">
                  <div className="settings-row-value">
                    {format(new Date(user.createdAt), "MMMM d, yyyy")}
                  </div>
                </Row>
              </Section>

              <Section title="Security">
                <Row label="Password">
                  <button
                    className="btn-ghost-sm settings-row-action"
                    onClick={() => setPasswordModal("change")}
                    type="button"
                  >
                    Change password
                  </button>
                </Row>
              </Section>

              <Section title="Danger Zone" className="danger-zone-section">
                <div className="settings-row">
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-primary)", margin: "0 0 2px" }}>
                      Delete account
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                      Permanently deletes your account and all entries. Cannot be undone.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-destructive settings-row-action"
                    onClick={() => setPasswordModal("delete")}
                  >
                    <Trash2 size={13} />
                    Delete Account
                  </button>
                </div>
              </Section>
            </>
          )}

          {section === "appearance" && (
            <>
              <Section title="Appearance">
                <div className="border-b border-border-subtle px-4 py-4 last:border-b-0">
                  <label
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: "var(--text-tertiary)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      display: "block",
                      marginBottom: "12px",
                    }}
                  >
                    Color Theme
                  </label>
                  <div className="theme-color-picker">
                    {THEME_ORDER.map((key) => {
                      const theme = THEMES[key];
                      const active = activeTheme === key;
                      return (
                        <button
                          key={key}
                          className={cn("theme-color-swatch", active && "is-active")}
                          onClick={() => void patchColorTheme(key)}
                          title={theme.name}
                          aria-label={`${theme.name} theme${active ? " (active)" : ""}`}
                          style={
                            {
                              background: theme.accent,
                              "--swatch-color": theme.accent,
                            } as React.CSSProperties
                          }
                          type="button"
                        />
                      );
                    })}
                  </div>
                  <p style={{ fontSize: "12px", color: "var(--text-tertiary)", marginTop: "10px" }}>
                    {THEMES[activeTheme].name} — {THEMES[activeTheme].label}
                  </p>
                </div>
                <Row label="Font size">
                  <ChipGroup>
                    {(["small", "medium", "large"] as const).map((f) => (
                      <Chip
                        key={f}
                        active={fontSize === f}
                        onClick={() => {
                          setFontSize(f);
                          applyFontSize(f);
                        }}
                      >
                        <span className="capitalize">{f}</span>
                      </Chip>
                    ))}
                  </ChipGroup>
                </Row>
              </Section>
              <Section title="Install app">
                <div className="settings-row">
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "13px", fontWeight: 500, margin: "0 0 2px" }}>
                      Add to Home Screen
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
                      Install Luminary as an app for faster access and offline use.
                    </p>
                  </div>
                  <InstallButton />
                </div>
              </Section>
            </>
          )}

          {section === "notifications" && (
            <Section title="Reminders">
              <Row label="Daily reminder">
                <div className="settings-row-inline">
                  <div className="settings-row-value">Get a nudge to journal each day</div>
                  <Switch
                    checked={settings.dailyReminderEnabled}
                    onCheckedChange={(v) => update("dailyReminderEnabled", v)}
                  />
                </div>
              </Row>
              {settings.dailyReminderEnabled && (
                <div className="settings-row">
                  <span className="settings-row-label">Reminder time</span>
                  <input
                    type="time"
                    value={settings.dailyReminderTime}
                    onChange={(e) => update("dailyReminderTime", e.target.value)}
                    className="settings-time-input"
                  />
                </div>
              )}
            </Section>
          )}

          {section === "security" && (
            <Section title="App Lock">
              <Row label="Lock app">
                <div className="settings-row-inline">
                  <div className="settings-row-value">Require authentication to open</div>
                  <Switch
                    checked={settings.appLockEnabled}
                    onCheckedChange={(v) => update("appLockEnabled", v)}
                  />
                </div>
              </Row>
              <div className="settings-row">
                <span className="settings-row-label">Idle timeout</span>
                <select
                  className="settings-select"
                  value={settings.idleTimeoutMinutes}
                  onChange={(e) => update("idleTimeoutMinutes", Number(e.target.value))}
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={0}>Never</option>
                </select>
              </div>
            </Section>
          )}

          {section === "storage" && <StorageSyncPanel />}

          {section === "export" && <ExportPanel />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      </PageContainer>

      {dirty && (
        <div className="settings-unsaved-bar fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-border-strong bg-elevated px-3 py-2 shadow-md md:bottom-6">
          <span className="text-sm text-secondary">Unsaved changes</span>
          <Button variant="ghost" size="sm" onClick={logout.bind(null)}>
            Sign out
          </Button>
          <Button size="sm" onClick={saveAll} disabled={saving}>
            {saving ? <Spinner /> : "Save"}
          </Button>
        </div>
      )}

      <ChangePasswordDialog
        open={passwordModal === "change"}
        onClose={() => setPasswordModal(null)}
      />
      <DeleteAccountDialog
        open={passwordModal === "delete"}
        onClose={() => setPasswordModal(null)}
        onDeleted={() => {
          setUser(null);
          navigate("/auth", { replace: true });
        }}
      />

      <AvatarCropDialog
        open={cropOpen}
        imageSrc={cropSrc}
        onOpenChange={(open) => {
          setCropOpen(open);
          if (!open && cropSrc) {
            URL.revokeObjectURL(cropSrc);
            setCropSrc(null);
          }
        }}
        onCropped={(blob) => void uploadCroppedAvatar(blob)}
      />

      <AvatarLibraryModal
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        currentId={user.avatarLibraryId}
        onConfirm={(id) => void pickLibraryAvatar(id)}
      />
    </div>
  );
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("settings-section", className)}>
      <div className="settings-section-header">
        <h2 className="settings-section-title">{title}</h2>
      </div>
      <div className="settings-section-body">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="settings-row">
      <span className="settings-row-label">{label}</span>
      <div className="settings-row-value">{children}</div>
    </div>
  );
}

function ChipGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-1.5 flex-wrap">{children}</div>;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-active border border-border-strong text-primary"
          : "bg-transparent border border-border-subtle text-secondary hover:bg-hover hover:text-primary",
      )}
    >
      {children}
    </button>
  );
}

function ChangePasswordDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: current,
        newPassword: next,
      });
      toast.success(
        "Password changed",
        "Sign in again when your session expires.",
      );
      onClose();
    } catch (err) {
      toast.error("Couldn't change password", apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Current password</Label>
            <Input
              type="password"
              required
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>New password</Label>
            <Input
              type="password"
              required
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Confirm new password</Label>
            <Input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner /> : "Update"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteAccountDialog({
  open,
  onClose,
  onDeleted,
}: {
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.delete("/api/settings/account", { data: { password } });
      toast.success("Account deleted");
      onDeleted();
    } catch (err) {
      toast.error("Couldn't delete account", apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete account</DialogTitle>
          <DialogDescription>
            This permanently removes your account, entries, and mood history.
            This cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Confirm with your password</Label>
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={loading}>
              {loading ? <Spinner /> : "Delete permanently"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
