import type { JournalEntry } from "@luminary/shared";
import { getMoodEmoji, moodFromScore } from "@luminary/shared";
import { formatDuration } from "@/lib/utils";

function truncate(s: string, n: number) {
  const t = s.trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1)}…`;
}

export function EntryMiniCard({
  entry,
  onOpenDay,
}: {
  entry: JournalEntry;
  onOpenDay?: () => void;
}) {
  const mood = moodFromScore(entry.mood);

  const preview =
    entry.type === "text"
      ? truncate((entry.content ?? "").replace(/\s+/g, " "), 32)
      : entry.type === "audio"
        ? entry.durationSeconds
          ? formatDuration(entry.durationSeconds)
          : "Audio"
        : entry.durationSeconds
          ? formatDuration(entry.durationSeconds)
          : "Video";

  const wordCount =
    entry.type === "text"
      ? (entry.content ?? "").trim().split(/\s+/).filter(Boolean).length
      : 0;

  return (
    <div
      className="entry-mini-card"
      data-type={entry.type}
      onClick={(e) => {
        e.stopPropagation();
        onOpenDay?.();
      }}
    >
      <div className="entry-mini-header">
        <span className="entry-mini-title">
          {entry.title ||
            (entry.type === "text" ? "Note" : entry.type === "audio" ? "Audio" : "Video")}
        </span>
      </div>
      <p className="entry-mini-body">{preview}</p>
      <div className="entry-mini-footer">
        <span aria-hidden>{getMoodEmoji(mood)}</span>
        {entry.type === "audio" || entry.type === "video" ? (
          <span className="entry-mini-duration">
            {entry.durationSeconds != null
              ? formatDuration(entry.durationSeconds)
              : "—"}
          </span>
        ) : (
          <span className="entry-mini-wordcount">{wordCount} words</span>
        )}
      </div>
    </div>
  );
}
