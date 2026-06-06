// ---------------------------------------------------------------------------
// Zero — shared types & domain logic
//
// "Button 1" = an impulse/distracting thought. "Button 2" = acting on it.
// Every press is an independent timestamped event. We classify them at query
// time (never at write time) so the correlation window stays tunable forever.
// ---------------------------------------------------------------------------

export type EventType = "impulse" | "action";
export type EventSource = "button" | "manual";

/** Button number a device sends. 1 = impulse, 2 = action. */
export type ButtonNumber = 1 | 2;

export const BUTTON_TO_TYPE: Record<ButtonNumber, EventType> = {
  1: "impulse",
  2: "action",
};

/** Default follow-through window: an action within this many minutes of an
 *  impulse counts as following through on that impulse. */
export const DEFAULT_WINDOW_MINUTES = 5;

// --- Wire / DTO shapes ------------------------------------------------------

/** Body the device POSTs to /api/events. */
export interface PressBody {
  button: ButtonNumber;
  /** Optional device-reported ISO timestamp; server time is authoritative. */
  ts?: string;
}

/** An event as returned by the API. Timestamps are ISO-8601 UTC strings. */
export interface ApiEvent {
  id: string;
  type: EventType;
  createdAt: string;
  clientTs: string | null;
  deviceId: string | null;
  source: EventSource;
}

export interface SummaryStats {
  totalImpulses: number;
  totalActions: number;
  followThroughs: number;
  immediateActions: number;
  resisted: number;
  /** totalActions / totalImpulses, 0 when there are no impulses. */
  followThroughRate: number;
}

export interface DailyStat {
  /** YYYY-MM-DD in the account's timezone. */
  date: string;
  impulses: number;
  actions: number;
  followThroughs: number;
  immediateActions: number;
  resisted: number;
  followThroughRate: number;
}

export interface HourlyStat {
  /** 0-23, hour of day in the account's timezone. */
  hour: number;
  impulses: number;
  actions: number;
}

// --- Correlation engine -----------------------------------------------------

export interface CorrelationInput {
  type: EventType;
  /** Epoch milliseconds. */
  time: number;
}

export type ImpulseOutcome = "acted" | "resisted";
export type ActionKind = "follow_through" | "immediate";

export interface AnnotatedEvent extends CorrelationInput {
  /** Set for impulse events. */
  outcome?: ImpulseOutcome;
  /** Set for action events. */
  kind?: ActionKind;
}

export interface CorrelationResult {
  events: AnnotatedEvent[];
  followThroughs: number;
  immediateActions: number;
  resisted: number;
}

/**
 * Classify a chronological-ish list of events given a window in milliseconds.
 *
 * Rules:
 *  - For each action, pair it with the most recent *unmatched* impulse that
 *    occurred within `windowMs` before it -> follow-through (impulse "acted").
 *  - An action with no impulse to pair with -> immediate action (an implicit
 *    impulse: the user acted the instant the urge hit).
 *  - An impulse never consumed by an action -> resisted.
 *
 * The input is sorted internally, so callers need not pre-sort.
 */
export function correlate(
  input: CorrelationInput[],
  windowMs: number = DEFAULT_WINDOW_MINUTES * 60_000,
): CorrelationResult {
  const events: AnnotatedEvent[] = input
    .map((e) => ({ ...e }))
    .sort((a, b) => a.time - b.time);

  // Indices of impulses not yet matched to an action, oldest first.
  const openImpulses: number[] = [];
  let followThroughs = 0;
  let immediateActions = 0;
  let resisted = 0;

  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (ev.type === "impulse") {
      openImpulses.push(i);
      continue;
    }

    // action: any impulse older than the window can never be matched by this
    // or a later (even later) action -> it was resisted.
    while (
      openImpulses.length > 0 &&
      ev.time - events[openImpulses[0]].time > windowMs
    ) {
      const stale = openImpulses.shift()!;
      events[stale].outcome = "resisted";
      resisted++;
    }

    if (openImpulses.length > 0) {
      // Pair with the most recent in-window impulse (the likeliest cause).
      const impulseIdx = openImpulses.pop()!;
      events[impulseIdx].outcome = "acted";
      ev.kind = "follow_through";
      followThroughs++;
    } else {
      ev.kind = "immediate";
      immediateActions++;
    }
  }

  // Impulses still open at the end never saw an action -> resisted.
  for (const idx of openImpulses) {
    events[idx].outcome = "resisted";
    resisted++;
  }

  return { events, followThroughs, immediateActions, resisted };
}

/** Roll a CorrelationResult up into summary totals. */
export function summarize(result: CorrelationResult): SummaryStats {
  const { followThroughs, immediateActions, resisted } = result;
  const totalActions = followThroughs + immediateActions;
  const totalImpulses = totalActions + resisted;
  return {
    totalImpulses,
    totalActions,
    followThroughs,
    immediateActions,
    resisted,
    followThroughRate: totalImpulses === 0 ? 0 : totalActions / totalImpulses,
  };
}
