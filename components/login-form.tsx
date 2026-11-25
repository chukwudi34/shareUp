"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";

export function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/session/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.errors?.email?.[0] ?? payload?.message ?? "Could not sign you in.");
        setBusy(false);
        return;
      }

      // A hard navigation re-renders the server layout with the new session
      // cookie; the client router would otherwise reuse the guest layout.
      window.location.assign(next || "/");
    } catch {
      setError("The ShareUp API is unreachable. Start it with `npm run dev:api`.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className="field-label">Email address</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="input"
          placeholder="you@example.com"
          required
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="field-label">Password</label>
          <span className="text-[11px] text-muted">At least 8 characters</span>
        </div>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="input pr-11"
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && <div className="notice-danger text-[12px]">{error}</div>}

      <button type="submit" disabled={busy} className="btn-primary btn-lg w-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {busy ? "Signing in…" : "Sign in"}
        {!busy && <ArrowRight className="h-4 w-4" />}
      </button>

      <p className="text-center text-[12px] text-muted">
        New to ShareUp?{" "}
        <Link href={`/register${next && next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
