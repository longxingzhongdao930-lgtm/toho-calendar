import { describe, expect, it } from "vitest";
import {
  addDays,
  blankEvent,
  decodeBackup,
  eventsOn,
  occursOn,
  validateEvents,
} from "../lib/calendar";
import { seedEvents } from "../lib/seed";
describe("calendar data", () => {
  it("validates the annual official dataset without private seed events", () => {
    const events = seedEvents();
    expect(validateEvents(events)).toEqual(events);
    expect(events.length).toBeGreaterThan(100);
    expect(events.every((e) => e.origin === "official")).toBe(true);
    expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
    expect(events.some((e) => e.verification === "unverified")).toBe(true);
    expect(events.some((e) => e.date === "2026-04-05")).toBe(true);
    expect(
      events.some((e) => e.date === "2027-03-31" || e.endDate === "2027-03-31"),
    ).toBe(true);
  });
  it("includes every day of cross-year campus closure", () => {
    const e = seedEvents().find((e) => e.date === "2026-12-29")!;
    expect(occursOn(e, "2027-01-04")).toBe(true);
    expect(occursOn(e, "2027-01-05")).toBe(false);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("handles weekly recurrence and inclusive end", () => {
    const e = {
      ...blankEvent("2026-11-05"),
      repeat: "weekly" as const,
      repeatUntil: "2026-11-19",
    };
    expect(occursOn(e, "2026-11-12")).toBe(true);
    expect(occursOn(e, "2026-11-19")).toBe(true);
    expect(occursOn(e, "2026-11-26")).toBe(false);
    expect(occursOn(e, "2026-11-06")).toBe(false);
  });
  it("does not shift monthly recurrence into a different day", () => {
    const e = { ...blankEvent("2027-01-31"), repeat: "monthly" as const };
    expect(occursOn(e, "2027-02-28")).toBe(false);
    expect(occursOn(e, "2027-03-31")).toBe(true);
  });
  it("sorts all-day items first", () => {
    const e = { ...blankEvent("2026-11-01"), id: "a", title: "test" };
    expect(eventsOn([e, { ...e, id: "b", allDay: true }], e.date)[0].id).toBe(
      "b",
    );
  });
  it("roundtrips backups", () => {
    expect(
      decodeBackup(JSON.stringify({ version: 1, events: seedEvents() })),
    ).toEqual(seedEvents());
  });
  it("rejects invalid backups without partial import", () => {
    const e = { ...blankEvent("2026-11-01"), id: "a", title: "test" };
    for (const input of [
      [{ ...e, date: "2026-02-30" }],
      [e, e],
      [{ ...e, category: "__proto__" }],
      [{ ...e, endTime: "08:00" }],
      [{ ...e, repeatUntil: "2026-01-01" }],
    ])
      expect(() => validateEvents(input)).toThrow();
    expect(() => decodeBackup('{"version":2,"events":[]}')).toThrow();
    expect(() => decodeBackup("broken")).toThrow();
  });
});
