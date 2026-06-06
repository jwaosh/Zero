import type { SummaryStats } from "@zero/shared";

export function StatCards({ summary }: { summary: SummaryStats }) {
  const rate = Math.round(summary.followThroughRate * 100);
  const cards = [
    { label: "Total impulses", value: summary.totalImpulses, hint: "thoughts logged" },
    { label: "Acted on", value: summary.totalActions, hint: "followed through" },
    { label: "Follow-through rate", value: `${rate}%`, hint: "actions ÷ impulses" },
    { label: "Resisted", value: summary.resisted, hint: "let the urge pass" },
  ];
  return (
    <div className="stat-cards">
      {cards.map((c) => (
        <div className="stat-card" key={c.label}>
          <div className="stat-value">{c.value}</div>
          <div className="stat-label">{c.label}</div>
          <div className="stat-hint muted">{c.hint}</div>
        </div>
      ))}
    </div>
  );
}
