import { NextResponse } from "next/server";
import { signGateToken } from "@/lib/gate-crypto";

export async function POST(req: Request) {
  const { password } = await req.json();

  const secret = process.env.BETA_GATE_SECRET;
  if (!secret || password !== secret) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await signGateToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set("site_access", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
