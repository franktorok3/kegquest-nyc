import {Suspense} from "react";
import Explore from "../explore/view";
export const dynamic="force-dynamic";
export default function Nearby(){return <Suspense fallback={<main className="page">Loading nearby discovery…</main>}><Explore nearby/></Suspense>;}
