"use client";
import { useState } from "react";
import { teachingDays, teachingOn } from "@/lib/academic";
import { parseDate } from "@/lib/calendar";
export function TeachingDaySummary({ date }: { date: string }) {
  const day = teachingOn(date);
  if (!day) return null;
  return (
    <div className="teaching-summary">
      <strong>
        {day.term} ·{" "}
        {parseDate(date).toLocaleDateString("ja-JP", { weekday: "long" })}
        の授業・レッスン欄
      </strong>
      <span>
        {day.count === null
          ? "回数・通常授業の有無は要確認"
          : `資料上の第${day.count}回 · 公式資料確認済み`}
      </span>
      <small>
        授業・補講・試験の個別条件は、下の同日予定と公式案内もご確認ください。
      </small>
    </div>
  );
}
export default function TeachingPanel() {
  const [term, setTerm] = useState("後期");
  const days = teachingDays.filter((d) => d.term === term);
  return (
    <section className="teaching-panel" aria-label="曜日別の授業・レッスン回数">
      <div className="section-heading">
        <h2>曜日別の授業・レッスン回数</h2>
        <select
          aria-label="回数表の学期"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        >
          <option>前期</option>
          <option>後期</option>
        </select>
      </div>
      <p>
        画像の回数欄を判読できた日だけ数字を表示します。未読の数字・休講条件は補完していません。共通欄の回数であり、履修科目ごとの実施回数ではありません。
      </p>
      <div className="weekday-counts">
        {[1, 2, 3, 4, 5, 6].map((weekday) => {
          const rows = days.filter(
            (d) => parseDate(d.date).getDay() === weekday,
          );
          return (
            <details key={weekday}>
              <summary>
                {["日", "月", "火", "水", "木", "金", "土"][weekday]}曜日{" "}
                <span>
                  {rows.filter((d) => d.count !== null).length}日を判読
                </span>
              </summary>
              <ul>
                {rows.map((d) => (
                  <li key={d.date}>
                    <time>{d.date}</time>
                    <span className={d.count === null ? "pending-text" : ""}>
                      {d.count === null
                        ? "要確認"
                        : `第${d.count}回（確認済み）`}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
      <p>
        回数不明の欄は「授業がある」とは断定しません。前期4/1〜7/18、後期9/7〜1/23の月〜土の欄を収録。枠内に祝日・補講日を含みます。
      </p>
    </section>
  );
}
