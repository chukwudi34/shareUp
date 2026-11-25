"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";

export function RegisterForm({ next }: { next: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (form.password.length < 8) {
      setError("Use at least 8 characters for your password.");
      return;
    }

    if (form.password !== confirm) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/session/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = await response.json();

      if (!response.ok) {
        const firstError = payload?.errors ? Object.values(payload.errors)[0] : null;
        setError(Array.isArray(firstError) ? String(firstError[0]) : payload?.message ?? "Could not create your account.");
        setBusy(false);
        return;
      }

      // Hard navigation so the server layout is rendered with the new session.
      window.location.assign(next || "/discover");
    } catch {
      setError("The ShareUp API is unreachable. Start it with `npm run dev:api`.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="name" className="field-label">Full name</label>
        <input
          id="name"
          value={form.name}
          onChange={(event) => update("name", event.target.value)}
          className="input"
          placeholder="Adaeze Okafor"
          autoComplete="name"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="field-label">Email</label>
          <input
            id="email"
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            className="input"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>
        <div>
          <label htmlFor="phone" className="field-label">Phone (optional)</label>
          <input
            id="phone"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            className="input"
            placeholder="+234 800 000 0000"
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="password" className="field-label">Password</label>
          <input
            id="password"
            type="password"
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            className="input"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label htmlFor="confirm" className="field-label">Confirm password</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="input"
            placeholder="Repeat password"
            autoComplete="new-password"
            required
          />
        </div>
      </div>

      {error && <div className="notice-danger text-[12px]">{error}</div>}

      <button type="submit" disabled={busy} className="btn-primary btn-lg w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? "Creating your account…" : "Create account"}
        {!busy && <ArrowRight className="h-4 w-4" />}
      </button>

      <p className="text-center text-[11px] leading-relaxed text-muted">
        By creating an account you agree to ShareUp&apos;s participation terms and acknowledge
        that asset values can rise or fall.
      </p>

      <p className="text-center text-[12px] text-muted">
        Already a member?{" "}
        <Link href={`/login${next && next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
