"use client";

import { useState } from "react";
import { Button } from "react-aria-components";

interface DeviceRow {
  id: string;
  name: string;
  lastSeenAt: string | null;
  createdAt: string;
}

export function DeviceManager({ initial }: { initial: DeviceRow[] }) {
  const [devices, setDevices] = useState<DeviceRow[]>(initial);
  const [name, setName] = useState("");
  const [newToken, setNewToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setBusy(false);
    if (res.ok) {
      const data = await res.json();
      setNewToken(data.token);
      setDevices((d) => [{ ...data.device, lastSeenAt: null }, ...d]);
      setName("");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this device? Its token will stop working.")) return;
    const res = await fetch(`/api/devices/${id}`, { method: "DELETE" });
    if (res.ok) setDevices((d) => d.filter((x) => x.id !== id));
  }

  return (
    <div className="devices">
      <form onSubmit={create} className="device-create">
        <input
          placeholder="New device name (e.g. desk buttons)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button type="submit" isDisabled={busy} className="btn-primary">
          Create device
        </Button>
      </form>

      {newToken && (
        <div className="token-reveal">
          <strong>Device token — copy it now, it won&apos;t be shown again:</strong>
          <code>{newToken}</code>
          <Button className="btn-ghost" onPress={() => setNewToken(null)}>
            Done
          </Button>
        </div>
      )}

      <ul className="device-list">
        {devices.length === 0 && <li className="muted">No devices yet.</li>}
        {devices.map((d) => (
          <li key={d.id}>
            <div>
              <span className="device-name">{d.name}</span>
              <span className="muted">
                {d.lastSeenAt
                  ? `last seen ${new Date(d.lastSeenAt).toLocaleString()}`
                  : "never used"}
              </span>
            </div>
            <Button className="btn-danger" onPress={() => remove(d.id)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
