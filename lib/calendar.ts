export const categories = {
  orchestra: { label: "オーケストラ", short: "オケ", color: "#7c72c8" },
  class: { label: "授業・試験", short: "授業", color: "#429bd1" },
  campus: { label: "大学行事", short: "大学", color: "#d59740" },
  personal: { label: "個人予定", short: "個人", color: "#43a68b" },
} as const;
export type Category = keyof typeof categories;
export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  endDate: string;
  allDay: boolean;
  time: string;
  endTime: string;
  category: Category;
  kind: string;
  location: string;
  notes: string;
  important: boolean;
  repeat: "none" | "weekly" | "monthly";
  repeatUntil: string;
  verification: "unverified" | "personal" | "official";
  origin?: "official" | "personal";
  sourcePage?: 1 | 2;
};
export const SOURCE =
  "https://www.toho-music.ac.jp/wp-content/uploads/2026/04/2026_college_calendar.pdf";
export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}
export function addDays(value: string, days: number): string {
  const d = parseDate(value);
  d.setDate(d.getDate() + days);
  return dateKey(d);
}
export function validDate(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !isNaN(parseDate(value).getTime()) &&
    dateKey(parseDate(value)) === value
  );
}
export function blankEvent(date: string): CalendarEvent {
  return {
    id: "",
    title: "",
    date,
    endDate: date,
    allDay: false,
    time: "09:00",
    endTime: "10:00",
    category: "personal",
    kind: "練習",
    location: "",
    notes: "",
    important: false,
    repeat: "none",
    repeatUntil: "",
    verification: "personal",
    origin: "personal",
  };
}
export function occursOn(event: CalendarEvent, day: string): boolean {
  if (day < event.date) return false;
  if (event.repeat === "none") return day <= event.endDate;
  if (event.repeatUntil && day > event.repeatUntil) return false;
  const start = parseDate(event.date),
    target = parseDate(day);
  if (event.repeat === "weekly") return start.getDay() === target.getDay();
  return start.getDate() === target.getDate();
}
export function eventsOn(
  events: CalendarEvent[],
  day: string,
): CalendarEvent[] {
  return events
    .filter((e) => occursOn(e, day))
    .sort(
      (a, b) =>
        Number(b.allDay) - Number(a.allDay) ||
        a.time.localeCompare(b.time) ||
        a.title.localeCompare(b.title, "ja"),
    );
}
export function occurrences(
  events: CalendarEvent[],
  start: string,
  end: string,
) {
  const result: { event: CalendarEvent; day: string }[] = [];
  for (let day = start; day <= end; day = addDays(day, 1))
    for (const event of eventsOn(events, day)) result.push({ event, day });
  return result;
}
export function validateEvents(input: unknown): CalendarEvent[] {
  if (!Array.isArray(input) || input.length > 5000)
    throw new Error("予定は5,000件以内の配列で指定してください。");
  const ids = new Set<string>();
  const timeValid = (v: unknown) =>
    typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
  for (const e of input) {
    const fail = () => {
      throw new Error("予定データの形式・日付・時刻が正しくありません。");
    };
    if (!e || typeof e !== "object") fail();
    if (typeof e.id !== "string" || !e.id || ids.has(e.id)) fail();
    if (typeof e.title !== "string" || !e.title.trim() || e.title.length > 150)
      fail();
    if (!validDate(e.date) || !validDate(e.endDate) || e.endDate < e.date)
      fail();
    if (
      typeof e.category !== "string" ||
      !Object.hasOwn(categories, e.category)
    )
      fail();
    if (
      !["none", "weekly", "monthly"].includes(e.repeat) ||
      typeof e.allDay !== "boolean" ||
      typeof e.important !== "boolean"
    )
      fail();
    if (!["unverified", "personal", "official"].includes(e.verification))
      fail();
    if (e.origin !== undefined && !["official", "personal"].includes(e.origin))
      fail();
    if (e.sourcePage !== undefined && ![1, 2].includes(e.sourcePage)) fail();
    if (
      !["kind", "location", "notes", "time", "endTime", "repeatUntil"].every(
        (k) => typeof e[k] === "string",
      )
    )
      fail();
    if (
      e.notes.length > 10000 ||
      e.location.length > 200 ||
      e.kind.length > 100
    )
      fail();
    if (e.repeatUntil && (!validDate(e.repeatUntil) || e.repeatUntil < e.date))
      fail();
    if (
      !e.allDay &&
      (!timeValid(e.time) || (e.endTime && !timeValid(e.endTime)))
    )
      fail();
    if (!e.allDay && e.endTime && e.date === e.endDate && e.endTime <= e.time)
      fail();
    if (e.repeat !== "none" && e.endDate !== e.date) fail();
    ids.add(e.id);
  }
  return input as CalendarEvent[];
}
export const STORAGE_KEY = "toho-calendar-v1";
export function decodeBackup(text: string): CalendarEvent[] {
  const data = JSON.parse(text);
  if (data?.version !== 1)
    throw new Error("対応していないバックアップ形式です。");
  return validateEvents(data.events);
}
