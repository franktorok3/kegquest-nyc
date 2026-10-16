"use client";
/* eslint-disable @next/next/no-img-element -- previews remain on their source-owned host */
import { useState } from "react";
export default function Photo({
  src,
  name,
  className = "",
  priority = false,
}: {
  src: string | null;
  name: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={"photo " + className}>
      {src && !failed ? (
        <img
          src={src}
          alt={`${name} — image from official website`}
          loading={priority || className === "hero-photo" ? "eager" : "lazy"}
          fetchPriority={priority || className === "hero-photo" ? "high" : "auto"}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="photo-fallback">
          <span>T / B</span>
          <small>{name}</small>
        </div>
      )}
    </div>
  );
}
