"use client";

import type { DailyStat } from "@zero/shared";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const RATE = "#22c55e";

export function RateChart({ data }: { data: DailyStat[] }) {
  const points = data.map((d) => ({
    date: d.date,
    rate: Math.round(d.followThroughRate * 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
        <YAxis
          domain={[0, 100]}
          unit="%"
          tick={{ fill: "#a1a1aa", fontSize: 11 }}
        />
        <Tooltip
          formatter={(v) => [`${v}%`, "Follow-through"]}
          contentStyle={{
            background: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: 8,
          }}
          labelStyle={{ color: "#fafafa" }}
        />
        <Line
          type="monotone"
          dataKey="rate"
          stroke={RATE}
          strokeWidth={2}
          dot={{ r: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
