export declare const MOOD_SCALE: readonly [{
    readonly value: 1;
    readonly emoji: "😭";
    readonly label: "Terrible";
    readonly color: "#DC2626";
}, {
    readonly value: 2;
    readonly emoji: "😞";
    readonly label: "Very Bad";
    readonly color: "#EF4444";
}, {
    readonly value: 3;
    readonly emoji: "😔";
    readonly label: "Bad";
    readonly color: "#F97316";
}, {
    readonly value: 4;
    readonly emoji: "😕";
    readonly label: "Low";
    readonly color: "#FB923C";
}, {
    readonly value: 5;
    readonly emoji: "😐";
    readonly label: "Okay";
    readonly color: "#A3A3A3";
}, {
    readonly value: 6;
    readonly emoji: "🙂";
    readonly label: "Decent";
    readonly color: "#84CC16";
}, {
    readonly value: 7;
    readonly emoji: "😊";
    readonly label: "Good";
    readonly color: "#22C55E";
}, {
    readonly value: 8;
    readonly emoji: "😄";
    readonly label: "Great";
    readonly color: "#10B981";
}, {
    readonly value: 9;
    readonly emoji: "😁";
    readonly label: "Excellent";
    readonly color: "#059669";
}, {
    readonly value: 10;
    readonly emoji: "🤩";
    readonly label: "Amazing";
    readonly color: "#047857";
}];
export type MoodValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type Mood = MoodValue;
export declare const MOOD_TAGS: readonly ["bad", "low", "okay", "good", "great"];
export type MoodTag = (typeof MOOD_TAGS)[number];
export declare const getMood: (v: MoodValue) => {
    readonly value: 1;
    readonly emoji: "😭";
    readonly label: "Terrible";
    readonly color: "#DC2626";
} | {
    readonly value: 2;
    readonly emoji: "😞";
    readonly label: "Very Bad";
    readonly color: "#EF4444";
} | {
    readonly value: 3;
    readonly emoji: "😔";
    readonly label: "Bad";
    readonly color: "#F97316";
} | {
    readonly value: 4;
    readonly emoji: "😕";
    readonly label: "Low";
    readonly color: "#FB923C";
} | {
    readonly value: 5;
    readonly emoji: "😐";
    readonly label: "Okay";
    readonly color: "#A3A3A3";
} | {
    readonly value: 6;
    readonly emoji: "🙂";
    readonly label: "Decent";
    readonly color: "#84CC16";
} | {
    readonly value: 7;
    readonly emoji: "😊";
    readonly label: "Good";
    readonly color: "#22C55E";
} | {
    readonly value: 8;
    readonly emoji: "😄";
    readonly label: "Great";
    readonly color: "#10B981";
} | {
    readonly value: 9;
    readonly emoji: "😁";
    readonly label: "Excellent";
    readonly color: "#059669";
} | {
    readonly value: 10;
    readonly emoji: "🤩";
    readonly label: "Amazing";
    readonly color: "#047857";
};
export declare const getMoodColor: (v: MoodValue) => "#10B981" | "#059669" | "#DC2626" | "#EF4444" | "#F97316" | "#FB923C" | "#A3A3A3" | "#84CC16" | "#22C55E" | "#047857";
export declare const getMoodEmoji: (v: MoodValue) => "😭" | "😞" | "😔" | "😕" | "😐" | "🙂" | "😊" | "😄" | "😁" | "🤩";
export declare const getMoodLabel: (v: MoodValue) => "Terrible" | "Very Bad" | "Bad" | "Low" | "Okay" | "Decent" | "Good" | "Great" | "Excellent" | "Amazing";
export declare function moodFromScore(score: number): MoodValue;
export declare const MOODS: MoodValue[];
export declare const MOOD_META: Record<MoodValue, {
    label: string;
    emoji: string;
    score: number;
    color: string;
}>;
