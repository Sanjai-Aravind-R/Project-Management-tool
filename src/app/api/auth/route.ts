import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { members } from "@/db/schema";
import { eq } from "drizzle-orm";
import { clearSession, setSession } from "@/lib/auth";
import { seedWorkspace } from "@/lib/workspace";
import { createHash, timingSafeEqual } from "node:crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === "logout") {
      await clearSession();
      return NextResponse.json({ ok: true });
    }
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const expected = process.env.DEMO_PASSWORD ?? "demo1234";
    const a = createHash("sha256").update(password).digest();
    const b = createHash("sha256").update(expected).digest();
    if (!email || !timingSafeEqual(a, b)) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    await seedWorkspace();
    const [user] = await db.select().from(members).where(eq(members.email, email)).limit(1);
    if (!user) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    await setSession(user.id);
    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json({ error: "Unable to sign in right now." }, { status: 500 });
  }
}
