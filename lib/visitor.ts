import { createHash } from "crypto";

/**
 * A visitor id that changes every day: hash of the day, a server secret, the
 * IP and the browser. Counts a person once per day without cookies, and can't
 * be used to follow anyone across days. Shared by the analytics beacon and reviews.
 */
export function dailyVisitor(h: Headers) {
  const ua = h.get("user-agent") ?? "";
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "0";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256")
    .update(`${day}|${process.env.PAYLOAD_SECRET ?? ""}|${ip}|${ua}`)
    .digest("hex")
    .slice(0, 16);
}
