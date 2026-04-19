import { getAvatarLibraryPublicUrl } from "@luminary/shared";
import { User as UserIcon } from "lucide-react";
import { mediaFullUrl } from "@/lib/mediaUrl";

export interface UserAvatarUser {
  displayName: string;
  avatarUrl?: string | null;
  avatarLibraryId?: string | null;
}

export function UserAvatar({ user, size = 36 }: { user: UserAvatarUser; size?: number }) {
  if (user.avatarUrl) {
    return (
      <img
        src={mediaFullUrl(user.avatarUrl)}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  const libUrl = user.avatarLibraryId
    ? getAvatarLibraryPublicUrl(user.avatarLibraryId)
    : undefined;
  if (libUrl) {
    return (
      <img
        src={libUrl}
        alt=""
        className="shrink-0 rounded-full"
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = user.displayName
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-accent-subtle font-semibold text-accent"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials || <UserIcon className="text-accent" style={{ width: size * 0.42, height: size * 0.42 }} />}
    </div>
  );
}
