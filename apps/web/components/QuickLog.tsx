"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "react-aria-components";

/** Manual logging for testing without hardware (writes source="manual"). */
export function QuickLog() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function log(type: "impulse" | "action") {
    setBusy(type);
    await fetch("/api/events/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="quicklog">
      <span className="muted">Log manually:</span>
      <Button
        className="btn-impulse"
        isDisabled={busy !== null}
        onPress={() => log("impulse")}
      >
        + Impulse
      </Button>
      <Button
        className="btn-action"
        isDisabled={busy !== null}
        onPress={() => log("action")}
      >
        + Action
      </Button>
    </div>
  );
}
