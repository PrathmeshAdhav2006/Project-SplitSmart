"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ListTodo, UserPlus } from "lucide-react";

const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  function change(k: string, v: string) {
    setForm({ ...form, [k]: v });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch(api + "/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data?.error?.message || "Unable to create account.");
      }
      toast.success("Account created successfully!");
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
      <h1>Create your account</h1>
      <p className="muted">Start with a clear, focused workspace.</p>

      <form onSubmit={submit} style={{ marginTop: 24 }}>
        <div className="field">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            type="text"
            placeholder="Alex Johnson"
            required
            value={form.name}
            onChange={(e) => change("name", e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="alex@example.com"
            required
            value={form.email}
            onChange={(e) => change("email", e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password (min 8 chars)</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => change("password", e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="confirm">Confirm Password</label>
          <input
            id="confirm"
            type="password"
            placeholder="••••••••"
            required
            minLength={8}
            value={form.confirm}
            onChange={(e) => change("confirm", e.target.value)}
          />
        </div>

        <button className="btn primary" style={{ width: "100%", marginTop: 12 }} disabled={busy}>
          <UserPlus size={16} />
          <span>{busy ? "Creating account..." : "Create account"}</span>
        </button>
      </form>

      <p className="muted" style={{ marginTop: 24, fontSize: 14 }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>
          Log in
        </Link>
      </p>
    </main>
  );
}
