import Link from "next/link";
import { DeviceManager } from "@/components/DeviceManager";
import { apiFetch } from "@/lib/api";
import { requireAccount } from "@/lib/auth";

export default async function DevicesPage() {
  await requireAccount();
  const devices = await apiFetch("/api/devices").then((r) => r.json());

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1>Devices</h1>
          <p className="muted">
            Each device gets a token to send button presses to the API.
          </p>
        </div>
        <nav className="topnav">
          <Link href="/" className="btn-ghost">
            ← Dashboard
          </Link>
        </nav>
      </header>

      <section className="card">
        <DeviceManager initial={devices} />
      </section>
    </main>
  );
}
