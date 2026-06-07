import type { DailyStat, HourlyStat, SummaryStats } from "@zero/shared";
import Link from "next/link";
import { Controls } from "@/components/Controls";
import { DailyChart } from "@/components/charts/DailyChart";
import { HourlyChart } from "@/components/charts/HourlyChart";
import { RateChart } from "@/components/charts/RateChart";
import { LogoutButton } from "@/components/LogoutButton";
import { QuickLog } from "@/components/QuickLog";
import { Simulator } from "@/components/Simulator";
import { StatCards } from "@/components/StatCards";
import { apiFetch } from "@/lib/api";
import { requireAccount } from "@/lib/auth";
import { resolveRange, toApiQuery } from "@/lib/range";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const account = await requireAccount();
  const range = resolveRange(searchParams);
  const q = toApiQuery(range);

  const [summary, daily, hourly] = await Promise.all([
    apiFetch(`/api/stats/summary?${q}`).then((r) => r.json() as Promise<SummaryStats>),
    apiFetch(`/api/stats/daily?${q}`).then((r) => r.json() as Promise<DailyStat[]>),
    apiFetch(`/api/stats/hourly?${q}`).then((r) => r.json() as Promise<HourlyStat[]>),
  ]);

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1>Zero</h1>
          <p className="muted">{account.email}</p>
        </div>
        <nav className="topnav">
          <Link href="/devices" className="btn-ghost">
            Devices
          </Link>
          <LogoutButton />
        </nav>
      </header>

      <section className="toolbar">
        <Controls range={range} />
        <QuickLog />
      </section>

      <StatCards summary={summary} />

      <section className="card">
        <h2>Device simulator</h2>
        <Simulator />
      </section>

      <section className="card">
        <h2>Impulses vs. actions by day</h2>
        <DailyChart data={daily} />
      </section>

      <div className="grid-2">
        <section className="card">
          <h2>Follow-through rate over time</h2>
          <RateChart data={daily} />
        </section>
        <section className="card">
          <h2>When distractions strike</h2>
          <HourlyChart data={hourly} />
        </section>
      </div>
    </main>
  );
}
