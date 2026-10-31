import { describe, expect, it } from "vitest";
import {
  ACADEMIC_REVISION,
  officialEvents,
  teachingDays,
  teachingOn,
} from "../lib/academic";
import { reconcileOfficialEvents, readStoredEvents } from "../lib/seed";
import { blankEvent, eventsOn, validateEvents } from "../lib/calendar";
describe("primary-source academic data and migrations", () => {
  it("corrects the wind concert and summary dates from screenshots", () => {
    const events = officialEvents();
    expect(events.find((e) => e.title === "ウインド定期演奏会")?.date).toBe(
      "2026-12-12",
    );
    expect(
      eventsOn(events, "2026-12-13").some(
        (e) => e.title === "ウインド定期演奏会",
      ),
    ).toBe(false);
    expect(
      eventsOn(events, "2027-01-21").some(
        (e) => e.title === "学科目まとめ期間",
      ),
    ).toBe(true);
    expect(
      eventsOn(events, "2027-01-22").some(
        (e) => e.title === "学科目まとめ期間",
      ),
    ).toBe(false);
  });
  it("preserves multiple independent entries on one date", () => {
    expect(
      eventsOn(officialEvents(), "2026-12-12").map((e) => e.title),
    ).toEqual(
      expect.arrayContaining([
        "ウインド定期演奏会",
        "平常授業・レッスンあり（回数・対象は要確認）",
      ]),
    );
    expect(
      eventsOn(officialEvents(), "2026-11-23").map((e) => e.title),
    ).toEqual(
      expect.arrayContaining(["勤労感謝の日", "平常授業・レッスンあり"]),
    );
  });
  it("never interpolates an unreadable count and records readable weekday columns", () => {
    expect(teachingOn("2026-04-06")?.count).toBeNull();
    expect(teachingOn("2026-07-13")?.count).toBe(15);
    expect(teachingOn("2027-01-15")?.count).toBe(15);
    expect(teachingOn("2026-09-07")?.term).toBe("後期");
    expect(teachingDays.filter((d) => d.count !== null)).toHaveLength(42);
  });
  it("upgrades old source entries once while preserving private entries and user edits", () => {
    const personal = {
      ...blankEvent("2027-03-01"),
      id: "user-test",
      title: "プライベート練習",
    };
    const old = {
      ...blankEvent("2026-12-13"),
      id: "academic-8",
      category: "campus" as const,
      kind: "大学行事",
      important: true,
      title: "ウインド定期演奏会",
      allDay: true,
      time: "",
      endTime: "",
      verification: "unverified" as const,
      notes:
        "ユーザー提供の2026年度学年暦情報。公式PDFとの照合は未完了です。日時・会場は公式発表を確認してください。",
    };
    const result = reconcileOfficialEvents([old, personal]);
    expect(result.find((e) => e.id === "academic-8")).toBeUndefined();
    expect(result.some((e) => e.id === "retained-academic-8")).toBe(false);
    expect(result.find((e) => e.id === personal.id)).toEqual(personal);
    expect(reconcileOfficialEvents(result)).toEqual(result);
    expect(reconcileOfficialEvents(result, ACADEMIC_REVISION)).toEqual(result);
    expect(validateEvents(result)).toEqual(result);
    const custom = reconcileOfficialEvents([{ ...old, notes: "自分用のメモ" }]);
    expect(custom.find((e) => e.id === "retained-academic-8")?.notes).toContain(
      "自分用のメモ",
    );
  });
  it("preserves a user's changed importance flag on an old academic entry", () => {
    const old = {
      ...blankEvent("2026-11-03"),
      id: "academic-0",
      title: "キャンパスクローズ",
      endDate: "2026-11-03",
      allDay: true,
      time: "",
      endTime: "",
      category: "campus" as const,
      kind: "大学行事",
      important: true,
      verification: "unverified" as const,
      notes:
        "ユーザー提供の2026年度学年暦情報。公式PDFとの照合は未完了です。日時・会場は公式発表を確認してください。",
    };
    expect(
      reconcileOfficialEvents([old]).find((e) => e.id === "retained-academic-0")
        ?.important,
    ).toBe(true);
  });
  it("respects empty backups and explicit deletions in current-revision backups", () => {
    expect(readStoredEvents('{"version":1,"events":[]}')).toEqual([]);
    expect(
      readStoredEvents(
        JSON.stringify({
          version: 1,
          academicRevision: ACADEMIC_REVISION,
          events: officialEvents().slice(1),
        }),
      ),
    ).toHaveLength(officialEvents().length - 1);
  });
});
