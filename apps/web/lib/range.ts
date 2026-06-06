import { DEFAULT_WINDOW_MINUTES } from "@zero/shared";

export interface Range {
  /** YYYY-MM-DD */
  from: string;
  /** YYYY-MM-DD */
  to: string;
  /** correlation window in minutes */
  window: number;
}

export const WINDOW_OPTIONS = [1, 2, 3, 5, 10, 15, 30, 60];

export function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

type SP = Record<string, string | string[] | undefined>;

export function resolveRange(sp: SP): Range {
  const today = new Date();
  const to = typeof sp.to === "string" ? sp.to : ymd(today);
  const from =
    typeof sp.from === "string"
      ? sp.from
      : ymd(new Date(today.getTime() - 30 * 86_400_000));
  const w = typeof sp.window === "string" ? Number(sp.window) : NaN;
  return {
    from,
    to,
    window: Number.isFinite(w) ? w : DEFAULT_WINDOW_MINUTES,
  };
}

/** Build the API stats query string for a range (day-inclusive, UTC bounds). */
export function toApiQuery(r: Range): string {
  return new URLSearchParams({
    from: `${r.from}T00:00:00.000Z`,
    to: `${r.to}T23:59:59.999Z`,
    window: String(r.window),
  }).toString();
}
