/**
 * Analytics events wait here and reach the database in batches, so the database (Neon, billed by
 * the time it's awake, asleep after 5 idle minutes) isn't woken by every page view. A batch is
 * written when 50 events wait or the oldest has waited 30 minutes, on the next event after that.
 * Events still waiting when a server instance shuts down are lost: they're counts, not records.
 */
export type QueuedEvent = Record<string, unknown> & { createdAt: string };

const MAX_EVENTS = 50;
const MAX_AGE_MS = 30 * 60_000;

let queue: QueuedEvent[] = [];

export function enqueue(event: QueuedEvent) {
  queue.push(event);
}

/** True when a batch should be written now. */
export function due(now = Date.now()) {
  return queue.length >= MAX_EVENTS || (queue.length > 0 && now - Date.parse(queue[0].createdAt) >= MAX_AGE_MS);
}

/** Takes the waiting events (the queue starts empty again). */
export function drain() {
  const batch = queue;
  queue = [];
  return batch;
}
