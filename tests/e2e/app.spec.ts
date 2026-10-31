import { expect, test } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date("2026-11-05T08:00:00+09:00"));
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
  await expect(page.locator(".hero-content")).toContainText("伴奏合わせ");
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
  await expect(page.locator(".day-agenda")).toContainText("伴奏合わせ");
  await nav(page, "設定");
  await page.getByRole("button", { name: "ダーク", exact: false }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSONを書き出す" }).click();
  expect((await download).suggestedFilename()).toContain("toho-calendar");
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "broken.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"version":2}'),
    });
  await expect(page.getByRole("status")).toContainText("対応していない");
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
  await page
    .locator("input[type=file]")
    .setInputFiles({
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
  await expect(page.getByRole("status")).toContainText("元データ保護");
  expect(
    await page.evaluate(() => localStorage.getItem("toho-calendar-v1")),
  ).toBe("broken");
});
