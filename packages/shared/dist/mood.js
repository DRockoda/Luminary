export const MOOD_SCALE = [
    { value: 1, emoji: "😭", label: "Terrible", color: "#DC2626" },
    { value: 2, emoji: "😞", label: "Very Bad", color: "#EF4444" },
    { value: 3, emoji: "😔", label: "Bad", color: "#F97316" },
    { value: 4, emoji: "😕", label: "Low", color: "#FB923C" },
    { value: 5, emoji: "😐", label: "Okay", color: "#A3A3A3" },
    { value: 6, emoji: "🙂", label: "Decent", color: "#84CC16" },
    { value: 7, emoji: "😊", label: "Good", color: "#22C55E" },
    { value: 8, emoji: "😄", label: "Great", color: "#10B981" },
    { value: 9, emoji: "😁", label: "Excellent", color: "#059669" },
    { value: 10, emoji: "🤩", label: "Amazing", color: "#047857" },
];
export const MOOD_TAGS = ["bad", "low", "okay", "good", "great"];
export const getMood = (v) => MOOD_SCALE.find((m) => m.value === v);
export const getMoodColor = (v) => getMood(v).color;
export const getMoodEmoji = (v) => getMood(v).emoji;
export const getMoodLabel = (v) => getMood(v).label;
export function moodFromScore(score) {
    const clamped = Math.min(10, Math.max(1, Math.round(score)));
    return clamped;
}
export const MOODS = MOOD_SCALE.map((m) => m.value);
export const MOOD_META = Object.fromEntries(MOOD_SCALE.map((m) => [
    m.value,
    {
        label: m.label,
        emoji: m.emoji,
        score: m.value,
        color: m.color,
    },
]));
