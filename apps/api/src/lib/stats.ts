import {
  correlate,
  summarize,
  type AnnotatedEvent,
  type DailyStat,
  type HourlyStat,
  type SummaryStats,
} from "@zero/shared";
import type { EventRow } from "../db/schema";

/** Convert a UTC instant into {date: YYYY-MM-DD, hour: 0-23} in `tz`. */
function zonedParts(date: Date, tz: string): { date: string; hour: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const p of fmt.formatToParts(date)) parts[p.type] = p.value;
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    // "24" can appear at midnight in some environments; normalize to 0.
    hour: Number(parts.hour) % 24,
  };
}

function toInput(rows: EventRow[]) {
  return rows.map((r) => ({
    type: r.type,
    time: r.createdAt.getTime(),
  }));
}

export function buildSummary(rows: EventRow[], windowMs: number): SummaryStats {
  return summarize(correlate(toInput(rows), windowMs));
}

export function buildDaily(
  rows: EventRow[],
  windowMs: number,
  tz: string,
): DailyStat[] {
  const { events } = correlate(toInput(rows), windowMs);
  const byDate = new Map<string, DailyStat>();

  const ensure = (date: string): DailyStat => {
    let d = byDate.get(date);
    if (!d) {
      d = {
        date,
        impulses: 0,
        actions: 0,
        followThroughs: 0,
        immediateActions: 0,
        resisted: 0,
        followThroughRate: 0,
      };
      byDate.set(date, d);
    }
    return d;
  };

  for (const ev of events as AnnotatedEvent[]) {
    const { date } = zonedParts(new Date(ev.time), tz);
    const d = ensure(date);
    if (ev.type === "impulse") {
      d.impulses++;
      if (ev.outcome === "resisted") d.resisted++;
    } else {
      d.actions++;
      if (ev.kind === "follow_through") d.followThroughs++;
      else d.immediateActions++;
    }
  }

  for (const d of byDate.values()) {
    // Impulses represented by this day = actions taken + impulses resisted.
    const denom = d.actions + d.resisted;
    d.followThroughRate = denom === 0 ? 0 : d.actions / denom;
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function buildHourly(rows: EventRow[], tz: string): HourlyStat[] {
  const hours: HourlyStat[] = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    impulses: 0,
    actions: 0,
  }));
  for (const r of rows) {
    const { hour } = zonedParts(r.createdAt, tz);
    if (r.type === "impulse") hours[hour].impulses++;
    else hours[hour].actions++;
  }
  return hours;
}
