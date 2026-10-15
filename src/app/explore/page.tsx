import { Suspense } from "react";
import Explore from "./view";
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <Suspense fallback={<main className="page">Loading places…</main>}>
      <Explore />
    </Suspense>
  );
}
