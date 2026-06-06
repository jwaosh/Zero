"use client";

import { useRouter } from "next/navigation";
import { Button } from "react-aria-components";

export function LogoutButton() {
  const router = useRouter();
  return (
    <Button
      className="btn-ghost"
      onPress={async () => {
        await fetch("/api/session", { method: "DELETE" });
        router.push("/login");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
