"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ListTodo, LogIn } from "lucide-react";

const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await fetch(api + "/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Email or password is incorrect.");
      }
      toast.success("Welcome back!");
      router.push("/dashboard");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <Link className="brand" href="/">
        <ListTodo size={24} color="#6257e8" />
        <span>task</span>flow
      </Link>
      <h1>Welcome back</h1>
      <p className="muted">Log in to continue to your workspace.</p>

      <form onSubmit={submit} style={{ marginTop: 24 }}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="name@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button className="btn primary" style={{ width: "100%", marginTop: 12 }} disabled={busy}>
          <LogIn size={16} />
          <span>{busy ? "Logging in..." : "Log in"}</span>
        </button>
      </form>

      <p className="muted" style={{ marginTop: 24, fontSize: 14 }}>
        New to TaskFlow? <Link href="/register" style={{ color: "var(--accent)", fontWeight: 600 }}>Create an account</Link>
      </p>
    </main>
  );
}
