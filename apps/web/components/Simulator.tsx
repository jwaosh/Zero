"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "react-aria-components";

const TOKEN_KEY = "zero:sim:device-token";

type Status =
  | { kind: "idle" }
  | { kind: "ok"; type: "impulse" | "action"; at: string }
  | { kind: "error"; message: string };

/**
 * Faithful stand-in for the physical two-button device. Presses POST through
 * the `/api/simulate` proxy to the real ingest endpoint with a device token, so
 * they land exactly like hardware: source="button", device_id set, last_seen_at
 * bumped. The token is entered once and kept in localStorage (never on the
 * server). Contrast with QuickLog, which writes source="manual" with no device.
 */
export function Simulator() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false); // avoids SSR/localStorage flicker
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<1 | 2 | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    setToken(saved);
    setReady(true);
  }, []);

  function saveToken() {
    const t = draft.trim();
    if (!t) return;
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setDraft("");
    setEditing(false);
    setStatus({ kind: "idle" });
  }

  function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setEditing(false);
    setStatus({ kind: "idle" });
  }

  async function press(button: 1 | 2) {
    if (!token) return;
    setBusy(button);
    setStatus({ kind: "idle" });
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ button, token }),
      });
      if (res.status === 401) {
        setStatus({
          kind: "error",
          message: "Device token rejected. Enter a valid token.",
        });
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus({ kind: "error", message: data.error ?? "Press failed." });
        return;
      }
      setStatus({
        kind: "ok",
        type: button === 1 ? "impulse" : "action",
        at: new Date().toLocaleTimeString(),
      });
      router.refresh(); // re-fetch the dashboard stats/charts
    } catch {
      setStatus({ kind: "error", message: "Network error reaching the API." });
    } finally {
      setBusy(null);
    }
  }

  if (!ready) return null;

  // No token yet (or editing): show the one-time token entry.
  if (!token || editing) {
    return (
      <div className="simulator">
        <p className="muted">
          Paste a device token to simulate hardware presses. Get one from{" "}
          <strong>Devices → Create device</strong> or <code>pnpm db:seed</code>.
        </p>
        <div className="sim-token-row">
          <input
            type="text"
            placeholder="zd_…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveToken()}
            aria-label="Device token"
          />
          <Button className="btn-primary" onPress={saveToken}>
            Save
          </Button>
          {editing && (
            <Button className="btn-ghost" onPress={() => setEditing(false)}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Token present: the two big buttons.
  return (
    <div className="simulator">
      <div className="sim-buttons">
        <Button
          className="sim-btn sim-impulse"
          isDisabled={busy !== null}
          onPress={() => press(1)}
        >
          Impulse
          <span className="sim-btn-sub">button 1</span>
        </Button>
        <Button
          className="sim-btn sim-action"
          isDisabled={busy !== null}
          onPress={() => press(2)}
        >
          Action
          <span className="sim-btn-sub">button 2</span>
        </Button>
      </div>

      <div className="sim-footer">
        <span aria-live="polite" className="sim-status">
          {status.kind === "ok" && (
            <span className="muted">
              ✓ {status.type} sent at {status.at}
            </span>
          )}
          {status.kind === "error" && (
            <span className="error">{status.message}</span>
          )}
        </span>
        <span className="muted">
          token …{token.slice(-4)}{" "}
          <button className="link-btn" onClick={() => setEditing(true)}>
            change
          </button>
          {" · "}
          <button className="link-btn" onClick={clearToken}>
            clear
          </button>
        </span>
      </div>
    </div>
  );
}
