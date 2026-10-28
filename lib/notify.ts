/**
 * Tells the admin about new work on Telegram, through a bot.
 * Off unless TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set (see README →
 * Notifications). Never throws and never holds a visitor's request up for
 * more than 4 seconds; a lost notification is fine, the dashboard still shows it.
 */
export async function notifyAdmin(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) console.warn("Telegram notify failed", res.status, await res.text().catch(() => ""));
  } catch (e) {
    console.warn("Telegram notify failed", e);
  }
}

/** The admin dashboard, absolute, for links in notifications. */
export const adminUrl = (hash = "") => `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://bulbula-directory.vercel.app"}/admin${hash}`;
