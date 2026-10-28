import { getPayload, type Payload } from "payload";
import config from "@payload-config";
import NavOverviewLinks from "./NavOverviewLinks";

/**
 * Top of the admin's side navigation: the directory's mark, then an
 * "Overview" group with the dashboard (badged with what is waiting) and
 * analytics. Payload's own collection groups follow underneath.
 */
export default async function NavOverview(props: { payload?: Payload }) {
  const payload = props.payload ?? (await getPayload({ config }));
  const [subs, reviews] = await Promise.all([
    payload.count({ collection: "businesses", where: { and: [{ status: { equals: "pending" } }, { "submitter.name": { exists: true } }] } }),
    payload.count({ collection: "reviews", where: { status: { equals: "pending" } } }),
  ]).catch(() => [{ totalDocs: 0 }, { totalDocs: 0 }]);
  return <NavOverviewLinks waiting={subs.totalDocs + reviews.totalDocs} />;
}
