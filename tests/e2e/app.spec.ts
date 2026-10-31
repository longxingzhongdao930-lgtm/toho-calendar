import { expect, test } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-23T08:00:00+09:00"));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "予定を追加", exact: true }).first(),
  ).toBeEnabled();
});
async function nav(page: import("@playwright/test").Page, label: string) {
  const desktop = await page
    .locator(".sidebar")
    .evaluate((e) => e.getBoundingClientRect().x >= 0);
  await page
    .locator(desktop ? ".sidebar" : ".bottom-nav")
    .getByRole("button", { name: label, exact: true })
    .click();
}
test("seed, CRUD, recurrence, persistence and search", async ({ page }) => {
  await expect(page.locator(".hero-content")).toBeVisible();
  await page
    .getByRole("button", { name: "予定を追加", exact: true })
    .first()
    .click();
  await page.getByLabel("予定名", { exact: true }).fill("テスト練習");
  await page.getByLabel("会場", { exact: true }).fill("練習室A");
  await page.getByLabel("終日予定", { exact: true }).check();
  await page.getByLabel("繰り返し", { exact: true }).selectOption("weekly");
  await page.getByRole("button", { name: "保存する" }).click();
  await nav(page, "個人予定");
  await page.getByRole("textbox", { name: "予定を検索" }).fill("テスト練習");
  await expect(page.locator(".dated-row")).toHaveCount(1);
  await page.locator(".dated-row .event-row").click();
  await expect(page.getByText("練習室A", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "予定を編集" }).click();
  await page.getByLabel("予定名", { exact: true }).fill("編集済み練習");
  await page.getByRole("button", { name: "保存する" }).click();
  await page.reload();
  await nav(page, "個人予定");
  await page.getByRole("textbox", { name: "予定を検索" }).fill("編集済み練習");
  await expect(page.locator(".dated-row")).toHaveCount(1);
  await page.locator(".dated-row .event-row").click();
  await page.getByRole("button", { name: "削除", exact: true }).click();
  await page.getByRole("button", { name: "削除する", exact: true }).click();
  await expect(page.locator(".dated-row")).toHaveCount(0);
});
test("calendar views, theme, backup export and invalid import", async ({
  page,
}) => {
  await nav(page, "カレンダー");
  await expect(page.locator(".date-cell")).toHaveCount(42);
  await page.getByRole("button", { name: "週", exact: true }).click();
  await expect(page.locator(".date-cell")).toHaveCount(7);
  await page.getByRole("button", { name: "日", exact: true }).click();
  await expect(page.locator(".day-agenda")).toContainText("勤労感謝の日");
  await nav(page, "設定");
  await page.getByRole("button", { name: "ダーク", exact: false }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSONを書き出す" }).click();
  expect((await download).suggestedFilename()).toContain("toho-calendar");
  await page.locator("input[type=file]").setInputFiles({
    name: "broken.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":2}'),
  });
  await expect(page.locator(".notice[role=status]")).toContainText(
    "対応していない",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
test("empty backup restoration and broken storage protection", async ({
  page,
}) => {
  await nav(page, "設定");
  await page.locator("input[type=file]").setInputFiles({
    name: "empty.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"version":1,"events":[]}'),
  });
  await page.getByRole("button", { name: "置き換えて復元" }).click();
  await page.reload();
  await nav(page, "個人予定");
  await expect(
    page.getByText("予定はまだありません", { exact: true }),
  ).toBeVisible();
  await page.evaluate(() => localStorage.setItem("toho-calendar-v1", "broken"));
  await page.reload();
  await expect(page.locator(".notice[role=status]")).toContainText(
    "元データ保護",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("toho-calendar-v1")),
  ).toBe("broken");
});
test("source grouping, corrected concert date, and weekday count table", async ({
  page,
}) => {
  await nav(page, "カレンダー");
  await page.getByLabel("表示する年月").fill("2026-12");
  await page.getByRole("button", { name: /12月12日.*の予定/ }).click();
  await expect(page.locator(".selected-agenda")).toContainText(
    "ウインド定期演奏会",
  );
  await expect(page.locator(".selected-agenda .event-row")).toHaveCount(2);
  await page
    .locator(".selected-agenda .event-row")
    .filter({ hasText: "ウインド定期演奏会" })
    .click();
  await expect(page.locator(".modal")).toContainText("公式資料確認済み");
  await page.getByRole("button", { name: "閉じる", exact: true }).click();
  const desktop = await page
    .locator(".sidebar")
    .evaluate((e) => e.getBoundingClientRect().x >= 0);
  if (!desktop)
    await page.getByRole("button", { name: "メニューを開く" }).click();
  await page
    .locator(".sidebar")
    .getByRole("button", { name: "授業・試験", exact: true })
    .click();
  await page.getByLabel("回数表の学期").selectOption("前期");
  await page
    .locator(".weekday-counts summary")
    .filter({ hasText: "月曜日" })
    .click();
  await expect(
    page.locator(".weekday-counts li").filter({ hasText: "2026-07-13" }),
  ).toContainText("第15回");
  await expect(
    page.locator(".weekday-counts li").filter({ hasText: "2026-04-06" }),
  ).toContainText("要確認");
  await page.getByLabel("予定の出典").selectOption("personal");
  await expect(page.locator(".dated-row")).toHaveCount(0);
});
test("string lesson shortcut requires a time and preserves its kind for filtering", async ({
  page,
}) => {
  await nav(page, "個人予定");
  await page
    .getByRole("button", { name: "弦楽器レッスン", exact: true })
    .click();
  await expect(page.getByLabel("予定名", { exact: true })).toHaveValue(
    "弦楽器レッスン",
  );
  await expect(page.getByLabel("開始時刻", { exact: true })).toHaveValue("");
  await page.getByLabel("開始時刻", { exact: true }).fill("13:00");
  await page.getByLabel("繰り返し", { exact: true }).selectOption("weekly");
  await page.getByRole("button", { name: "保存する" }).click();
  await page.getByLabel("予定の種類").selectOption("弦楽器レッスン");
  await expect(page.locator(".dated-row")).toHaveCount(1);
  await page.getByLabel("予定の種類").selectOption("伴奏合わせ");
  await expect(page.locator(".dated-row")).toHaveCount(0);
  await page.reload();
  await nav(page, "個人予定");
  await page.getByLabel("予定の種類").selectOption("弦楽器レッスン");
  await page.locator(".dated-row .event-row").click();
  await expect(page.locator(".modal")).toContainText("弦楽器レッスン");
  await expect(page.locator(".modal")).toContainText("毎週");
  await expect(page.locator(".modal")).toContainText("ユーザー提供の予定");
});
test("adding a JSON file keeps existing events and does not duplicate a second import", async ({
  page,
}) => {
  await nav(page, "設定");
  const file = {
    name: "synthetic-test.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        version: 1,
        academicRevision: "2026-images-v2",
        events: [
          {
            id: "synthetic-import",
            title: "追加取込テスト",
            date: "2027-03-01",
            endDate: "2027-03-01",
            allDay: true,
            time: "",
            endTime: "",
            category: "personal",
            kind: "練習",
            location: "",
            notes: "架空のテストデータ",
            important: false,
            repeat: "none",
            repeatUntil: "",
            verification: "personal",
            origin: "personal",
          },
        ],
      }),
    ),
  };
  for (let i = 0; i < 2; i++) {
    await page.locator("input[type=file]").setInputFiles(file);
    await page.getByRole("button", { name: "既存の予定を残して追加" }).click();
  }
  await nav(page, "個人予定");
  await page
    .getByRole("textbox", { name: "予定を検索" })
    .fill("追加取込テスト");
  await expect(page.locator(".dated-row")).toHaveCount(1);
  await nav(page, "予定一覧");
  await page.getByLabel("予定の出典").selectOption("official");
  expect(await page.locator(".dated-row").count()).toBeGreaterThan(100);
});
