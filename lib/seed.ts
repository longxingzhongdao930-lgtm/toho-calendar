import { blankEvent, type CalendarEvent, type Category } from "./calendar";
const items: [string, string, string, Category, boolean?][] = [
  ["2026-11-03", "2026-11-03", "キャンパスクローズ", "campus"],
  ["2026-11-14", "2026-11-14", "平常授業・レッスンなし", "class"],
  ["2026-11-21", "2026-11-21", "オーケストラ定期演奏会", "orchestra", true],
  ["2026-11-22", "2026-11-22", "合唱定期演奏会", "campus", true],
  ["2026-11-23", "2026-11-23", "平常授業・レッスンあり", "class"],
  [
    "2026-12-06",
    "2026-12-06",
    "9音大オーケストラ・フェスティバル",
    "orchestra",
    true,
  ],
  ["2026-12-08", "2026-12-11", "平常授業なし・補講可能", "class"],
  ["2026-12-12", "2026-12-12", "平常授業・レッスンあり", "class"],
  ["2026-12-13", "2026-12-13", "ウインド定期演奏会", "campus", true],
  ["2026-12-19", "2026-12-20", "院1コンサート", "campus"],
  ["2026-12-22", "2026-12-22", "年内通常授業最終日", "class", true],
  ["2026-12-23", "2026-12-23", "平常授業なし・補講可能", "class"],
  ["2026-12-24", "2026-12-28", "集中講義・補講期間", "class"],
  ["2026-12-29", "2027-01-04", "キャンパスクローズ", "campus", true],
  ["2027-01-05", "2027-01-07", "特別補講期間", "class"],
  ["2027-01-08", "2027-01-08", "平常授業再開", "class", true],
  ["2027-01-15", "2027-01-23", "学科目まとめ期間", "class"],
  ["2027-01-25", "2027-02-05", "実技試験期間", "class", true],
];
export function seedEvents(): CalendarEvent[] {
  return [
    ...items.map(([date, endDate, title, category, important], i) => ({
      ...blankEvent(date),
      id: `academic-${i}`,
      endDate,
      title,
      category,
      important: !!important,
      allDay: true,
      time: "",
      endTime: "",
      kind:
        category === "orchestra"
          ? "本番"
          : category === "class"
            ? "学年暦"
            : "大学行事",
      verification: "unverified" as const,
      notes:
        "ユーザー提供の2026年度学年暦情報。公式PDFとの照合は未完了です。日時・会場は公式発表を確認してください。",
    })),
    ...[
      ["2026-11-05", "18:40"],
      ["2026-11-10", "16:00"],
    ].map(([date, time], i) => ({
      ...blankEvent(date),
      id: `personal-${i}`,
      title: "伴奏合わせ",
      time,
      endTime: "",
      kind: "伴奏合わせ",
      notes: "確定（ユーザー提供）。終了時刻・会場は未設定。",
    })),
  ];
}
