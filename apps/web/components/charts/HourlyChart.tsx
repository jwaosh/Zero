"use client";

import type { HourlyStat } from "@zero/shared";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const IMPULSE = "#f59e0b";
const ACTION = "#ef4444";

export function HourlyChart({ data }: { data: HourlyStat[] }) {
  const points = data.map((d) => ({
    ...d,
    label: `${String(d.hour).padStart(2, "0")}:00`,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis
          dataKey="label"
          interval={1}
          tick={{ fill: "#a1a1aa", fontSize: 10 }}
        />
        <YAxis allowDecimals={false} tick={{ fill: "#a1a1aa", fontSize: 11 }} />
        <Tooltip
          contentStyle={{
            background: "#18181b",
            border: "1px solid #3f3f46",
            borderRadius: 8,
          }}
          labelStyle={{ color: "#fafafa" }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="impulses" name="Impulses" fill={IMPULSE} radius={[3, 3, 0, 0]} />
        <Bar dataKey="actions" name="Actions" fill={ACTION} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
