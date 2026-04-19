import { getMoodEmoji } from "@luminary/shared";
import { format } from "date-fns";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MoodChartPoint } from "@/lib/statsPeriod";

export function MoodChart({
  data,
  title = "Mood over time",
  showTitle = true,
  embedded = false,
}: {
  data: MoodChartPoint[];
  title?: string;
  showTitle?: boolean;
  /** When true, omit outer card chrome (use inside another card). */
  embedded?: boolean;
}) {
  return (
    <div
      className={
        embedded
          ? ""
          : "heatmap-card rounded-lg border border-border-subtle bg-surface p-6"
      }
    >
      {showTitle ? (
        <div className="mb-4 flex items-center justify-between">
          <div className="label-uppercase text-tertiary">{title}</div>
        </div>
      ) : null}
      <div className="h-48">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-[13px] text-tertiary">
            No moods logged for this period yet.
          </div>
        ) : (
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 6 }}>
              <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
              <XAxis
                dataKey="x"
                tickFormatter={(d) => {
                  try {
                    return format(new Date(`${d}T12:00:00Z`), "MMM d");
                  } catch {
                    return d;
                  }
                }}
                stroke="var(--text-tertiary)"
                tick={{ fontSize: 10, fontFamily: "var(--font-mono)" }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[1, 10]}
                ticks={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                tickFormatter={(v) => getMoodEmoji(v as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10)}
                stroke="var(--text-tertiary)"
                tick={{ fontSize: 14 }}
                tickMargin={6}
                width={42}
              />
              <ReferenceLine
                y={5}
                stroke="var(--text-tertiary)"
                strokeDasharray="4 4"
                label={{ value: "Neutral", fontSize: 11, fill: "var(--text-tertiary)" }}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-strong)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "var(--text-primary)",
                }}
                formatter={(_v, _n, p) => [(p.payload as MoodChartPoint).label, "Mood"]}
                labelFormatter={(l) => {
                  try {
                    return format(new Date(`${l}T12:00:00Z`), "EEE, MMM d");
                  } catch {
                    return String(l);
                  }
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--accent)"
                strokeWidth={2}
                dot={{
                  r: 3,
                  stroke: "var(--accent)",
                  strokeWidth: 1,
                  fill: "var(--bg-surface)",
                }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
