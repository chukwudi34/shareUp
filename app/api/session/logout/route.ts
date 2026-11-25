import { NextRequest, NextResponse } from "next/server";
import { API_URL, TOKEN_COOKIE } from "@/lib/api";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  if (token) {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    }).catch(() => null);
  }

  const next = NextResponse.json({ message: "Signed out." });
  next.cookies.delete(TOKEN_COOKIE);

  return next;
}
