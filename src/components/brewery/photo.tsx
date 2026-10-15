"use client";
/* eslint-disable @next/next/no-img-element -- previews remain on their source-owned host */
import { useState } from "react";
export default function Photo({
  src,
  name,
  className = "",
}: {
  src: string | null;
  name: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={"photo " + className}>
      {src && !failed ? (
        <img
          src={src}
          alt={`${name} — image from official website`}
          loading={className === "hero-photo" ? "eager" : "lazy"}
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
