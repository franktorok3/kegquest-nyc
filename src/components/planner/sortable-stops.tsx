"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, ArrowUpRight, GripVertical, X } from "lucide-react";
import { directions, type Location } from "../../lib/catalog";
import Photo from "../brewery/photo";

type Props = {
  locations: Location[];
  onReorder: (ids: string[]) => void;
  onRemove: (id: string) => void;
};

function SortableStop({
  location,
  index,
  count,
  onMove,
  onRemove,
}: {
  location: Location;
  index: number;
  count: number;
  onMove: (index: number, offset: number) => void;
  onRemove: Props["onRemove"];
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: location.id });

  return (
    <article
      ref={setNodeRef}
      role="listitem"
      className={`stop simple-stop${isDragging ? " is-dragging" : ""}`}
      data-location-id={location.id}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.35 : 1,
      }}
    >
      <button
        ref={setActivatorNodeRef}
        className="stop-handle"
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag ${location.name}`}
        style={{ touchAction: "none" }}
      >
        <GripVertical size={20} aria-hidden="true" />
      </button>
      <div className="stop-image">
        <Photo src={location.image} name={location.name} className="stop-photo" />
        <span className="stop-number" aria-hidden="true">{index + 1}</span>
      </div>
      <div className="stop-main">
        <h3><Link href={`/breweries/${location.id}`}>{location.name}</Link></h3>
        <p>{location.neighborhood} · {location.borough}</p>
        <div className="stop-actions">
          <a href={directions(location)} target="_blank" rel="noreferrer" className="text-link">
            Directions <ArrowUpRight size={13} aria-hidden="true" />
          </a>
        </div>
      </div>
      <div className="reorder">
        <button type="button" aria-label={`Move ${location.name} up`} disabled={index === 0} onClick={() => onMove(index, -1)}>
          <ArrowUp size={15} aria-hidden="true" />
        </button>
        <button type="button" aria-label={`Move ${location.name} down`} disabled={index === count - 1} onClick={() => onMove(index, 1)}>
          <ArrowDown size={15} aria-hidden="true" />
        </button>
        <button type="button" aria-label={`Remove ${location.name}`} onClick={() => onRemove(location.id)}>
          <X size={15} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

export default function SortableStops({ locations, onReorder, onRemove }: Props) {
  const contextId = useId();
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [moveAnnouncement, setMoveAnnouncement] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const ids = locations.map((location) => location.id);
  const activeLocation = locations.find((location) => location.id === activeId);
  const nameOf = (id: UniqueIdentifier) => locations.find((location) => location.id === id)?.name || "Taproom";
  const positionOf = (id: UniqueIdentifier) => ids.indexOf(String(id)) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}, stop ${positionOf(active.id)} of ${ids.length}.`,
    onDragOver: ({ active, over }) => over
      ? `${nameOf(active.id)} is over stop ${positionOf(over.id)} of ${ids.length}.`
      : `${nameOf(active.id)} is outside the plan.`,
    onDragEnd: ({ active, over }) => over
      ? `${nameOf(active.id)} dropped at stop ${positionOf(over.id)} of ${ids.length}.`
      : `${nameOf(active.id)} was not moved.`,
    onDragCancel: ({ active }) => `Reordering canceled. ${nameOf(active.id)} was not moved.`,
  };

  function move(index: number, offset: number) {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= ids.length) return;
    onReorder(arrayMove(ids, index, nextIndex));
    setMoveAnnouncement(`${locations[index].name} moved to stop ${nextIndex + 1} of ${ids.length}.`);
  }

  function drop({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from >= 0 && to >= 0) onReorder(arrayMove(ids, from, to));
  }

  return (
    <DndContext
      id={contextId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={({ active }) => setActiveId(active.id)}
      onDragCancel={() => setActiveId(null)}
      onDragEnd={drop}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable: "Press Space to pick up a taproom. Use the arrow keys to move it, then Space to drop. Press Escape to cancel. The move up and down buttons also change the order.",
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="simple-stops" role="list" aria-label="Your plan stops">
          {locations.map((location, index) => (
            <SortableStop key={location.id} location={location} index={index} count={locations.length} onMove={move} onRemove={onRemove} />
          ))}
        </div>
      </SortableContext>
      <span className="sr-only" role="status">{moveAnnouncement}</span>
      <DragOverlay dropAnimation={null}>
        {activeLocation ? (
          <div className="stop-drag-preview" aria-hidden="true">
            <GripVertical size={20} />
            <Photo src={activeLocation.image} name={activeLocation.name} className="stop-photo" />
            <div className="stop-main">
              <h3>{activeLocation.name}</h3>
              <p>{activeLocation.neighborhood}</p>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
