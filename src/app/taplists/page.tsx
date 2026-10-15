import { Suspense } from "react";
import OnTap from "./view";
export const dynamic = "force-dynamic";
export default function Page() {
  return (
    <Suspense fallback={<main className="page">Loading beers…</main>}>
      <OnTap />
    </Suspense>
  );
}
