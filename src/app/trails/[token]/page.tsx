import { notFound } from "next/navigation";
import { dataRequest } from "../../../lib/db/server";
import TrailView from "../../../components/planner/trail-view";
import { Trail } from "../../../lib/planner";
export const dynamic = "force-dynamic";
export default async function Shared({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[a-f0-9]{48}$/.test(token)) notFound();
  let rows;
  try {
    rows = await dataRequest({ action: "read", token });
  } catch {
    return (
      <main className="page">
        <h1>Temporarily unavailable</h1>
        <p>We couldn’t retrieve this trail. Please try again shortly.</p>
      </main>
    );
  }
  if (!rows?.trail) notFound();
  return (
    <main className="page">
      <span className="eyebrow">A SHARED TAPBOUND TRAIL · READ ONLY</span>
      <TrailView trail={rows.trail as Trail} />
    </main>
  );
}
