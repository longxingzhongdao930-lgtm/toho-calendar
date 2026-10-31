import { decodeBackup, type CalendarEvent } from "./calendar";
import { ACADEMIC_REVISION, officialEvents } from "./academic";
export function seedEvents(): CalendarEvent[] {
  return officialEvents();
}
const legacyTitles = [
  "キャンパスクローズ",
  "平常授業・レッスンなし",
  "オーケストラ定期演奏会",
  "合唱定期演奏会",
  "平常授業・レッスンあり",
  "9音大オーケストラ・フェスティバル",
  "平常授業なし・補講可能",
  "平常授業・レッスンあり",
  "ウインド定期演奏会",
  "院1コンサート",
  "年内通常授業最終日",
  "平常授業なし・補講可能",
  "集中講義・補講期間",
  "キャンパスクローズ",
  "特別補講期間",
  "平常授業再開",
  "学科目まとめ期間",
  "実技試験期間",
];
const legacyStarts = [
  "2026-11-03",
  "2026-11-14",
  "2026-11-21",
  "2026-11-22",
  "2026-11-23",
  "2026-12-06",
  "2026-12-08",
  "2026-12-12",
  "2026-12-13",
  "2026-12-19",
  "2026-12-22",
  "2026-12-23",
  "2026-12-24",
  "2026-12-29",
  "2027-01-05",
  "2027-01-08",
  "2027-01-15",
  "2027-01-25",
];
const legacyEnds = [
  "2026-11-03",
  "2026-11-14",
  "2026-11-21",
  "2026-11-22",
  "2026-11-23",
  "2026-12-06",
  "2026-12-11",
  "2026-12-12",
  "2026-12-13",
  "2026-12-20",
  "2026-12-22",
  "2026-12-23",
  "2026-12-28",
  "2027-01-04",
  "2027-01-07",
  "2027-01-08",
  "2027-01-23",
  "2027-02-05",
];
const legacyNote =
  "ユーザー提供の2026年度学年暦情報。公式PDFとの照合は未完了です。日時・会場は公式発表を確認してください。";
/** Replace only built-in source data; retain personal/user-created entries. Stable IDs make this idempotent. */
export function reconcileOfficialEvents(
  events: CalendarEvent[],
  revision?: string,
): CalendarEvent[] {
  if (revision === ACADEMIC_REVISION || events.length === 0) return events;
  const retained = events
    .filter(
      (e) => e.origin !== "official" && !e.id.startsWith("official-2026-"),
    )
    .flatMap((e) => {
      if (/^academic-\d+$/.test(e.id)) {
        const index = Number(e.id.slice(9));
        const originalCategory = [2, 5].includes(index)
          ? "orchestra"
          : [1, 4, 6, 7, 10, 11, 12, 14, 15, 16, 17].includes(index)
            ? "class"
            : "campus";
        const originalKind =
          originalCategory === "orchestra"
            ? "本番"
            : originalCategory === "class"
              ? "学年暦"
              : "大学行事";
        if (
          e.title === legacyTitles[Number(e.id.slice(9))] &&
          e.date === legacyStarts[Number(e.id.slice(9))] &&
          e.endDate === legacyEnds[Number(e.id.slice(9))] &&
          e.notes === legacyNote &&
          e.category === originalCategory &&
          e.kind === originalKind &&
          e.important === [2, 3, 5, 8, 10, 13, 15, 17].includes(index) &&
          e.verification === "unverified" &&
          !e.endTime &&
          !e.repeatUntil &&
          !e.location &&
          e.allDay &&
          !e.time &&
          e.repeat === "none"
        )
          return [];
        return [
          {
            ...e,
            id: `retained-${e.id}`,
            origin: "personal" as const,
            verification: "personal" as const,
            notes: `旧初期データの編集内容を個人予定として保持。大学公式日程は別項目を参照。\n${e.notes}`,
          },
        ];
      }
      return [e];
    });
  return [
    ...retained,
    ...officialEvents().filter(
      (e) => !retained.some((personal) => personal.replacesOfficialId === e.id),
    ),
  ];
}
export function readStoredEvents(text: string): CalendarEvent[] {
  const events = decodeBackup(text);
  return reconcileOfficialEvents(events, JSON.parse(text).academicRevision);
}
