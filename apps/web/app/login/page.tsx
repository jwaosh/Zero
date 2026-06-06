import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { getAccount } from "@/lib/auth";

export default async function LoginPage() {
  if (await getAccount()) redirect("/");
  return (
    <main className="login-page">
      <LoginForm />
    </main>
  );
}
