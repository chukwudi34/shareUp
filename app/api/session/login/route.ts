import { NextRequest, NextResponse } from "next/server";
import { API_URL, TOKEN_COOKIE } from "@/lib/api";

export async function POST(request: NextRequest) {
  const body = await request.text();

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(payload, { status: response.status });
    }

    const next = NextResponse.json({ user: payload.user });
    next.cookies.set(TOKEN_COOKIE, payload.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return next;
  } catch {
    return NextResponse.json(
      { message: "The ShareUp API is unreachable. Start it with `npm run dev:api`." },
      { status: 502 }
    );
  }
}
