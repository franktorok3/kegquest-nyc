export type Coordinates = { lat: number; lng: number };
export function distanceKm(a: Coordinates, b: Coordinates) {
  const rad = (x: number) => (x * Math.PI) / 180,
    dlat = rad(b.lat - a.lat),
    dlng = rad(b.lng - a.lng);
  return (
    6371 *
    2 *
    Math.atan2(
      Math.sqrt(
        Math.sin(dlat / 2) ** 2 +
          Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dlng / 2) ** 2,
      ),
      Math.sqrt(
        1 -
          (Math.sin(dlat / 2) ** 2 +
            Math.cos(rad(a.lat)) *
              Math.cos(rad(b.lat)) *
              Math.sin(dlng / 2) ** 2),
      ),
    )
  );
}
export function localDateTime(date: string, time: string, tz: string) {
  let guess = Date.parse(date + "T" + time + ":00Z");
  for (let i = 0; i < 3; i++) {
    const p = parts(new Date(guess), tz);
    const wall = Date.parse(
      `${p.date}T${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}:00Z`,
    );
    guess += Date.parse(date + "T" + time + ":00Z") - wall;
  }
  return new Date(guess);
}
export function parts(date: Date, tz: string) {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => p.find((p) => p.type === type)?.value || "";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
      get("weekday"),
    ),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
  };
}
