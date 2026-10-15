"use client";
import Link from "next/link";
import { useDraft } from "./draft";
import { Plus, Check } from "lucide-react";
export default function AddToTrail({ id }: { id: string }) {
  const [d, set] = useDraft(),
    added = d.ids.includes(id);
  return added ? (
    <Link className="button secondary small" href="/planner">
      <Check size={15} /> In your trail →
    </Link>
  ) : (
    <button
      className="button secondary small"
      disabled={d.ids.length >= 8}
      onClick={() => set({ ...d, ids: [...d.ids, id] })}
    >
      <Plus size={15} /> Add to Trail
    </button>
  );
}
