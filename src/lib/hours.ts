import { parts } from "./geography";
export type Schedule = (number[] | null)[];
export type HoursInfo = {
  schedule: Schedule | null;
  timeZone: string;
  visitStatus: string;
  hoursCheckedAt: string | null;
  exceptions?: { date: string; interval: number[] | null }[];
};
export function openingStatus(
  location: HoursInfo,
  at: Date,
  now = Date.now(),
): "Open" | "Closed" | "Unknown" {
  if (
    [
      "temporarily_closed",
      "permanently_closed",
      "events_only",
      "retail_shop",
    ].includes(location.visitStatus)
  )
    return "Closed";
  if (
    !location.schedule ||
    !location.hoursCheckedAt ||
    now - Date.parse(location.hoursCheckedAt) > 7 * 86400000
  )
    return "Unknown";
  const p = parts(at, location.timeZone),
    minutes = p.hour * 60 + p.minute;
  const exception = location.exceptions?.find((x) => x.date === p.date);
  const interval = exception ? exception.interval : location.schedule[p.day];
  if (interval?.length === 2 && minutes >= interval[0] && minutes < interval[1])
    return "Open";
  const previous = parts(new Date(at.getTime() - 86400000), location.timeZone);
  const prevEx = location.exceptions?.find((x) => x.date === previous.date);
  const prev = prevEx ? prevEx.interval : location.schedule[previous.day];
  if (
    !exception &&
    prev?.length === 2 &&
    prev[1] > 1440 &&
    minutes < prev[1] - 1440
  )
    return "Open";
  return interval === null ? "Unknown" : "Closed";
}
