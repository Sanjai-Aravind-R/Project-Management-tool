import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getMemberById } from "@/lib/workspace";

const COOKIE_NAME = "vertex_session";
const secret = process.env.SESSION_SECRET ?? process.env.DATABASE_URL ?? "local-preview-only";

function signature(value: string) {
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function createSessionValue(id: number) {
  const payload = String(id);
  return `${payload}.${signature(payload)}`;
}

export async function getSessionUser() {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  if (!value) return null;
  const [payload, suppliedSignature] = value.split(".");
  if (!payload || !suppliedSignature || !/^\d+$/.test(payload)) return null;
  const expected = Buffer.from(signature(payload), "hex");
  const supplied = Buffer.from(suppliedSignature, "hex");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  return getMemberById(Number(payload));
}

export async function setSession(id: number) {
  (await cookies()).set(COOKIE_NAME, createSessionValue(id), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE_NAME);
}
