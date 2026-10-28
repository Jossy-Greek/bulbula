import { Bell } from "lucide-react";
import { getPayload, type Payload } from "payload";
import config from "@payload-config";

/**
 * Bell in the admin header on every page: how many owner submissions and
 * visitor reviews are waiting. Links to the first queue on the dashboard.
 */
export default async function WaitingBell(props: { payload?: Payload }) {
  const payload = props.payload ?? (await getPayload({ config }));
  const [subs, reviews] = await Promise.all([
    payload.count({ collection: "businesses", where: { and: [{ status: { equals: "pending" } }, { "submitter.name": { exists: true } }] } }),
    payload.count({ collection: "reviews", where: { status: { equals: "pending" } } }),
  ]).catch(() => [{ totalDocs: 0 }, { totalDocs: 0 }]);
  const n = subs.totalDocs + reviews.totalDocs;
  const label = n ? `${n} waiting for review` : "Nothing waiting for review";
  return (
    <a href={`/admin${n ? (subs.totalDocs ? "#submissions" : "#reviews") : ""}`} className="bb-bell" aria-label={label} title={label}>
      <Bell size={18} strokeWidth={1.75} aria-hidden="true" />
      {n ? <span className="bb-bell__count">{n > 99 ? "99+" : n}</span> : null}
    </a>
  );
}
