import {
  addDays,
  blankEvent,
  parseDate,
  type CalendarEvent,
  type Category,
} from "./calendar";
export const ACADEMIC_REVISION = "2026-images-v2";
export const ACADEMIC_SOURCE =
  "ユーザー提供の2026年度公式学年暦スクリーンショット4枚（前期・後期、2026.4.1表記）";
type Entry = [string, string, string, Category, boolean?];
// Last field marks unclear text. Never infer unreadable labels or lesson counts.
const entries: Entry[] = [
  [
    "04-01",
    "04-01",
    "学生オリエンテーション（対象・詳細は要確認）",
    "campus",
    true,
  ],
  [
    "04-02",
    "04-03",
    "学生オリエンテーション（対象・詳細は要確認）",
    "campus",
    true,
  ],
  ["04-04", "04-04", "リハーサル（詳細は要確認）", "campus", true],
  ["04-05", "04-05", "大学院入学式", "campus"],
  ["04-29", "04-29", "昭和の日", "campus"],
  ["05-03", "05-03", "憲法記念日", "campus"],
  ["05-04", "05-04", "みどりの日", "campus"],
  ["05-05", "05-05", "こどもの日", "campus"],
  ["05-06", "05-06", "振替休日", "campus"],
  ["06-06", "06-06", "演奏ゼミナール（KC）", "campus"],
  ["06-06", "06-06", "入試関連の記載（対象・期間は要確認）", "campus", true],
  ["06-12", "06-12", "演奏会（名称・編成は要確認）", "campus", true],
  ["06-16", "06-17", "演奏会（名称・会場は要確認）", "campus", true],
  ["07-10", "07-11", "学科目まとめ期間", "class"],
  ["07-13", "07-16", "学科目まとめ期間", "class"],
  ["07-11", "07-11", "定期演奏会（ウインド）", "campus"],
  ["07-17", "07-18", "実技補講可能日", "class"],
  ["07-20", "07-20", "海の日", "campus"],
  ["07-20", "07-25", "授業・補講の特別扱い（詳細は要確認）", "class", true],
  ["07-21", "07-26", "実技試験", "class"],
  ["07-27", "07-27", "実技試験予備日", "class"],
  [
    "07-27",
    "07-29",
    "学科目関連日程（試験・補講の区分は要確認）",
    "class",
    true,
  ],
  ["07-30", "07-31", "学科目追再試（予定）", "class"],
  ["08-05", "08-05", "夏期休業開始（開始日の文字は要確認）", "campus", true],
  ["08-11", "08-11", "山の日", "campus"],
  ["08-13", "08-16", "キャンパスクローズ", "campus"],
  ["08-26", "09-06", "特別補講期間（正式名称は要確認）", "class", true],
  ["09-06", "09-06", "前期終了", "class"],
  ["09-07", "09-07", "後期開始", "class"],
  ["09-21", "09-23", "キャンパスクローズ", "campus"],
  ["09-21", "09-21", "敬老の日", "campus"],
  ["09-22", "09-22", "国民の休日", "campus"],
  ["09-23", "09-23", "秋分の日", "campus"],
  ["09-26", "09-26", "演奏会（名称は要確認）", "campus", true],
  ["10-01", "10-01", "大学院関連の記載（内容は要確認）", "campus", true],
  [
    "10-08",
    "10-11",
    "大学祭関連日程（準備日・本祭の区分は要確認）",
    "campus",
    true,
  ],
  ["10-12", "10-12", "スポーツの日", "campus"],
  ["10-12", "10-12", "キャンパスクローズ", "campus"],
  ["11-03", "11-03", "文化の日", "campus"],
  ["11-03", "11-03", "キャンパスクローズ", "campus"],
  [
    "11-14",
    "11-14",
    "平常授業・レッスンなし（適用対象は要確認）",
    "class",
    true,
  ],
  ["11-21", "11-21", "オーケストラ定期演奏会", "orchestra"],
  ["11-22", "11-22", "合唱定期演奏会", "campus"],
  ["11-23", "11-23", "勤労感謝の日", "campus"],
  ["11-23", "11-23", "平常授業・レッスンあり", "class"],
  ["12-06", "12-06", "9音大オーケストラ・フェスティバル", "orchestra"],
  ["12-08", "12-11", "学科目補講可能日", "class"],
  [
    "12-12",
    "12-12",
    "平常授業・レッスンあり（回数・対象は要確認）",
    "class",
    true,
  ],
  ["12-12", "12-12", "ウインド定期演奏会", "campus"],
  ["12-19", "12-20", "院1コンサート", "campus"],
  [
    "12-22",
    "12-22",
    "年内通常授業最終日（画像上の明記は要確認）",
    "class",
    true,
  ],
  ["12-23", "12-23", "学科目補講可能日", "class"],
  ["12-24", "12-28", "集中講義・補講期間", "class"],
  ["12-29", "01-04", "キャンパスクローズ", "campus"],
  ["01-01", "01-01", "元日", "campus"],
  ["01-05", "01-07", "特別補講期間（正式名称・対象は要確認）", "class", true],
  ["01-08", "01-08", "平常授業再開（画像上の明記は要確認）", "class", true],
  ["01-11", "01-11", "成人の日", "campus"],
  ["01-15", "01-16", "学科目まとめ期間", "class"],
  ["01-18", "01-21", "学科目まとめ期間", "class"],
  ["01-22", "01-23", "授業・補講の特別扱い（詳細は要確認）", "class", true],
  ["01-25", "02-05", "実技試験期間", "class"],
  ["02-03", "02-05", "学科目関連日程（内容は要確認）", "class", true],
  ["02-06", "02-06", "卒業演奏会（対象は要確認）", "campus", true],
  ["02-07", "02-07", "演奏会（名称は要確認）", "campus", true],
  ["02-11", "02-11", "建国記念の日", "campus"],
  ["02-11", "02-11", "キャンパスクローズ", "campus"],
  ["02-13", "02-13", "修了演奏会（対象は要確認）", "campus", true],
  ["02-16", "02-16", "学年暦記載事項（本文は要確認）", "class", true],
  ["02-19", "02-19", "演奏会（名称・対象は要確認）", "campus", true],
  ["02-20", "02-20", "PACS卒業制作発表（グランツ）", "campus"],
  ["02-23", "02-23", "天皇誕生日", "campus"],
  ["02-23", "02-23", "キャンパスクローズ", "campus"],
  ["03-06", "03-06", "演奏会（名称は要確認）", "campus", true],
  ["03-18", "03-18", "大学院・大学・短期大学卒業式", "campus"],
  ["03-19", "03-19", "大学院関連の記載（本文は要確認）", "campus", true],
  ["03-21", "03-21", "春分の日", "campus"],
  ["03-22", "03-22", "キャンパスクローズ", "campus"],
  ["03-27", "03-28", "フェスタ（正式名称は要確認）", "campus", true],
  ["03-30", "03-31", "次年度オリエンテーション（未定）", "campus"],
  [
    "04-08",
    "04-08",
    "学年暦の細字記載（内容・対象期間は要確認）",
    "class",
    true,
  ],
  [
    "09-02",
    "09-02",
    "学年暦の細字記載（内容・対象期間は要確認）",
    "class",
    true,
  ],
  [
    "02-01",
    "02-01",
    "学年暦の細字記載（内容・対象期間は要確認）",
    "class",
    true,
  ],
  [
    "02-02",
    "02-02",
    "学年暦の細字記載（内容・対象期間は要確認）",
    "class",
    true,
  ],
  [
    "02-08",
    "02-08",
    "学年暦の細字記載（内容・対象期間は要確認）",
    "class",
    true,
  ],
  [
    "02-09",
    "02-09",
    "学年暦の細字記載（内容・対象期間は要確認）",
    "class",
    true,
  ],
  [
    "02-10",
    "02-10",
    "学年暦の細字記載（内容・対象期間は要確認）",
    "class",
    true,
  ],
  [
    "02-12",
    "02-12",
    "学年暦の細字記載（内容・対象期間は要確認）",
    "class",
    true,
  ],
  [
    "02-15",
    "02-15",
    "学年暦の細字記載（内容・対象期間は要確認）",
    "class",
    true,
  ],
  [
    "02-17",
    "02-17",
    "学年暦の細字記載（内容・対象期間は要確認）",
    "class",
    true,
  ],
  [
    "02-18",
    "02-18",
    "学年暦の細字記載（内容・対象期間は要確認）",
    "class",
    true,
  ],
  [
    "02-22",
    "02-22",
    "学年暦の細字記載（内容・対象期間は要確認）",
    "class",
    true,
  ],
  [
    "02-24",
    "02-24",
    "学年暦の細字記載（内容・対象期間は要確認）",
    "class",
    true,
  ],
  [
    "02-25",
    "02-25",
    "学年暦の細字記載（内容・対象期間は要確認）",
    "class",
    true,
  ],
  [
    "02-26",
    "02-26",
    "学年暦の細字記載（内容・対象期間は要確認）",
    "class",
    true,
  ],
];
function fiscalDate(md: string) {
  return `${Number(md.slice(0, 2)) < 4 ? "2027" : "2026"}-${md}`;
}
export function officialEvents(): CalendarEvent[] {
  const special: CalendarEvent[] = entries.map(
    ([start, end, title, category, unclear], i) => ({
      ...blankEvent(fiscalDate(start)),
      id: `official-2026-${i}`,
      date: fiscalDate(start),
      endDate: fiscalDate(end),
      title,
      category,
      allDay: true,
      time: "",
      endTime: "",
      kind:
        category === "orchestra"
          ? "本番"
          : category === "class"
            ? "学年暦"
            : "大学行事",
      origin: "official",
      verification: unclear ? "unverified" : "official",
      sourcePage: fiscalDate(start) <= "2026-09-06" ? 1 : 2,
      important: /演奏会|試験|卒業式|クローズ/.test(title),
      notes: `${ACADEMIC_SOURCE}。${unclear ? "細字の判読ができないため、名称・適用範囲などは要確認。" : "画像で日付と予定名を照合。"}時刻・会場・対象者・後日の変更は別途確認してください。${title.includes("未定") || title.includes("予定") ? "資料自体が予定・未定としている日程です。" : ""}`,
    }),
  );
  return [
    ...special,
    ...Array.from(countMap, ([date, count]) => ({
      ...blankEvent(date),
      id: `official-teaching-${date}`,
      title: `授業・レッスン（資料上の第${count}回）`,
      allDay: true,
      time: "",
      endTime: "",
      category: "class" as const,
      kind: "授業・レッスン",
      origin: "official" as const,
      verification: "official" as const,
      sourcePage: (date <= "2026-09-06" ? 1 : 2) as 1 | 2,
      notes: `${ACADEMIC_SOURCE}。曜日列の回数欄を読み取り。履修科目・個別レッスンの実施、時間割、試験期間中の扱いは別途確認してください。`,
    })),
  ];
}

export type TeachingDay = {
  date: string;
  term: "前期" | "後期";
  count: number | null;
};
// Explicitly transcribed readable digits only. Do not interpolate missing counts.
const confirmedCounts: [number, string[]][] = [
  [13, ["06-26", "06-27", "06-29", "06-30", "07-01", "07-02"]],
  [14, ["07-03", "07-04", "07-06", "07-07", "07-08", "07-09"]],
  [15, ["07-10", "07-11", "07-13", "07-14", "07-15", "07-16"]],
  [1, ["09-07", "09-08", "09-09", "09-10", "09-11", "09-12"]],
  [2, ["09-14", "09-15", "09-16", "09-17", "09-18", "09-19"]],
  [14, ["12-21", "01-08", "01-09", "01-12", "01-13", "01-14"]],
  [15, ["01-15", "01-16", "01-18", "01-19", "01-20", "01-21"]],
];
const countMap = new Map(
  confirmedCounts.flatMap(([count, dates]) =>
    dates.map((d) => [fiscalDate(d), count] as const),
  ),
);
export const teachingDays: TeachingDay[] = [];
for (const [start, end, term] of [
  ["2026-04-01", "2026-07-18", "前期"],
  ["2026-09-07", "2027-01-23", "後期"],
] as const) {
  for (let date: string = start; date <= end; date = addDays(date, 1))
    if (parseDate(date).getDay() !== 0)
      teachingDays.push({ date, term, count: countMap.get(date) ?? null });
}
export function teachingOn(day: string) {
  return teachingDays.find((d) => d.date === day);
}
export function verificationLabel(e: CalendarEvent) {
  return e.verification === "official"
    ? "公式資料確認済み"
    : e.verification === "unverified"
      ? "要確認"
      : "個人予定";
}
