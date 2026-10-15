"use client";
import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Location } from "../../lib/catalog";
export default function BreweryMap({
  locations,
  selected,
  onSelect,
  route = false,
}: {
  locations: Location[];
  selected?: string;
  onSelect?: (id: string) => void;
  route?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null),
    instance = useRef<maplibregl.Map | null>(null);
  const [error, setError] = useState(false);
  const callback = useRef(onSelect);
  useEffect(() => {
    callback.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    if (!container.current) return;
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: container.current,
        center: [-73.96, 40.715],
        zoom: 10,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              attribution:
                '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
            },
          },
          layers: [{ id: "osm", type: "raster", source: "osm" }],
        },
        attributionControl: { compact: false },
      });
      instance.current = map;
      map.addControl(new maplibregl.NavigationControl(), "top-right");
      map.on("error", () => setError(true));
    } catch {
      setTimeout(() => setError(true), 0);
      return;
    }
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(container.current);
    return () => {
      observer.disconnect();
      map.remove();
      instance.current = null;
    };
  }, []);
  useEffect(() => {
    const map = instance.current;
    if (!map) return;
    const pins: maplibregl.Marker[] = [];
    const coords: [number, number][] = [];
    for (const [b, i] of locations.map((b, i) => [b, i] as const)) {
      if (b.lat === null || b.lng === null) continue;
      coords.push([b.lng, b.lat]);
      const button = document.createElement("button");
      button.className = "map-pin" + (selected === b.id ? " selected" : "");
      button.textContent = route ? String(i + 1) : "•";
      button.setAttribute("aria-label", b.name);
      button.title = b.name;
      button.onclick = () => callback.current?.(b.id);
      pins.push(
        new maplibregl.Marker({ element: button })
          .setLngLat([b.lng, b.lat])
          .addTo(map),
      );
    }
    const update = () => {
      if (map.getLayer("trail-line")) map.removeLayer("trail-line");
      if (map.getSource("trail-line")) map.removeSource("trail-line");
      if (route && coords.length > 1) {
        map.addSource("trail-line", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: coords },
          },
        });
        map.addLayer({
          id: "trail-line",
          type: "line",
          source: "trail-line",
          paint: {
            "line-color": "#a65c31",
            "line-width": 3,
            "line-dasharray": [2, 2],
          },
        });
      }
      if (coords.length) {
        const bounds = new maplibregl.LngLatBounds(coords[0], coords[0]);
        coords.forEach((c) => bounds.extend(c));
        map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 400 });
      }
    };
    if (map.isStyleLoaded()) update();
    else map.once("load", update);
    return () => {
      pins.forEach((p) => p.remove());
      map.off("load", update);
    };
  }, [locations, selected, route]);
  return (
    <div className="map-wrap">
      <div
        className="map-canvas"
        ref={container}
        aria-label="Brewery location map"
      />
      {error && (
        <p className="map-notice">
          Some map tiles may be unavailable. Addresses and directions remain
          available in the list.
        </p>
      )}
      {route && (
        <span className="map-caption">
          Dashed line connects stops directly; it is not a navigable route.
        </span>
      )}
    </div>
  );
}
