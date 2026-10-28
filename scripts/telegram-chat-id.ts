/**
 * Finds the chat id for TELEGRAM_CHAT_ID. First send any message to your bot
 * (or add it to a group and post there), then:
 *
 *   TELEGRAM_BOT_TOKEN=… npx tsx scripts/telegram-chat-id.ts
 *
 * Prints the chats that have written to the bot recently. Sends nothing.
 */
export {};

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error("Set TELEGRAM_BOT_TOKEN first.");
const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const body = (await res.json()) as { ok: boolean; result: { message?: { chat: { id: number; type: string; title?: string; first_name?: string } } }[] };
if (!body.ok) throw new Error(`Telegram said: ${JSON.stringify(body)}`);
const chats = new Map(body.result.flatMap((u) => (u.message ? [[u.message.chat.id, u.message.chat] as const] : [])));
if (!chats.size) console.log("No messages yet. Send your bot a message, then run this again.");
for (const [id, c] of chats) console.log(`${id}  (${c.type}: ${c.title ?? c.first_name ?? ""})`);
