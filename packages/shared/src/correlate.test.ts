import { describe, expect, it } from "vitest";
import {
  correlate,
  summarize,
  type CorrelationInput,
  DEFAULT_WINDOW_MINUTES,
} from "./index";

const MIN = 60_000;
const WINDOW = DEFAULT_WINDOW_MINUTES * MIN;

/** Build events from (type, minutesFromStart) tuples. */
function evs(
  ...pairs: [CorrelationInput["type"], number][]
): CorrelationInput[] {
  return pairs.map(([type, m]) => ({ type, time: m * MIN }));
}

describe("correlate", () => {
  it("pairs an action shortly after an impulse as a follow-through", () => {
    const r = correlate(evs(["impulse", 0], ["action", 2]), WINDOW);
    expect(r.followThroughs).toBe(1);
    expect(r.immediateActions).toBe(0);
    expect(r.resisted).toBe(0);
  });

  it("treats a lone action as an immediate (implicit) impulse", () => {
    const r = correlate(evs(["action", 0]), WINDOW);
    expect(r.followThroughs).toBe(0);
    expect(r.immediateActions).toBe(1);
    expect(r.resisted).toBe(0);
  });

  it("treats a lone impulse as resisted", () => {
    const r = correlate(evs(["impulse", 0]), WINDOW);
    expect(r.resisted).toBe(1);
    expect(r.followThroughs).toBe(0);
    expect(r.immediateActions).toBe(0);
  });

  it("does not pair an action beyond the window", () => {
    const r = correlate(
      evs(["impulse", 0], ["action", DEFAULT_WINDOW_MINUTES + 1]),
      WINDOW,
    );
    expect(r.followThroughs).toBe(0);
    expect(r.resisted).toBe(1);
    expect(r.immediateActions).toBe(1);
  });

  it("pairs an action exactly on the window boundary", () => {
    const r = correlate(
      evs(["impulse", 0], ["action", DEFAULT_WINDOW_MINUTES]),
      WINDOW,
    );
    expect(r.followThroughs).toBe(1);
    expect(r.resisted).toBe(0);
  });

  it("pairs each action with the most recent unmatched impulse (LIFO)", () => {
    // two impulses, then two quick actions -> both follow-throughs
    const r = correlate(
      evs(["impulse", 0], ["impulse", 1], ["action", 2], ["action", 3]),
      WINDOW,
    );
    expect(r.followThroughs).toBe(2);
    expect(r.resisted).toBe(0);
    expect(r.immediateActions).toBe(0);
  });

  it("one impulse + two actions = one follow-through + one immediate", () => {
    const r = correlate(
      evs(["impulse", 0], ["action", 1], ["action", 2]),
      WINDOW,
    );
    expect(r.followThroughs).toBe(1);
    expect(r.immediateActions).toBe(1);
    expect(r.resisted).toBe(0);
  });

  it("sorts unordered input before correlating", () => {
    const r = correlate(evs(["action", 2], ["impulse", 0]), WINDOW);
    expect(r.followThroughs).toBe(1);
  });

  it("annotates impulse outcomes and action kinds", () => {
    const r = correlate(
      evs(["impulse", 0], ["action", 1], ["impulse", 10]),
      WINDOW,
    );
    const impulses = r.events.filter((e) => e.type === "impulse");
    expect(impulses[0].outcome).toBe("acted");
    expect(impulses[1].outcome).toBe("resisted");
    expect(r.events.find((e) => e.type === "action")?.kind).toBe(
      "follow_through",
    );
  });
});

describe("summarize", () => {
  it("computes totals and follow-through rate", () => {
    // 2 impulses acted, 1 resisted, 1 immediate action
    const r = correlate(
      evs(
        ["impulse", 0],
        ["action", 1],
        ["impulse", 10],
        ["action", 11],
        ["impulse", 30], // resisted
        ["action", 60], // immediate (no impulse within window)
      ),
      WINDOW,
    );
    const s = summarize(r);
    expect(s.followThroughs).toBe(2);
    expect(s.immediateActions).toBe(1);
    expect(s.resisted).toBe(1);
    expect(s.totalActions).toBe(3);
    expect(s.totalImpulses).toBe(4); // 2 acted + 1 resisted + 1 immediate
    expect(s.followThroughRate).toBeCloseTo(3 / 4);
  });

  it("returns rate 0 when there are no impulses", () => {
    expect(summarize(correlate([])).followThroughRate).toBe(0);
  });
});
