import { redirect } from "next/navigation";
import { apiFetch, getToken } from "./api";

export interface Account {
  id: string;
  email: string;
  name: string | null;
  tz: string;
}

export async function getAccount(): Promise<Account | null> {
  if (!getToken()) return null;
  const res = await apiFetch("/api/auth/me");
  if (!res.ok) return null;
  return (await res.json()) as Account;
}

export async function requireAccount(): Promise<Account> {
  const account = await getAccount();
  if (!account) redirect("/login");
  return account;
}
