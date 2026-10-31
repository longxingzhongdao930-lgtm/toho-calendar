import { test, expect } from "@playwright/test";
test("installed assets support offline restart, local CRUD and export on iPhone-sized screen", async ({
  page,
  context,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (
      r.method() !== "GET" ||
      new URL(r.url()).origin !== "http://127.0.0.1:3100"
    )
      requests.push(r.url());
  });
  await page.goto("/");
  await expect(
    page.getByText("オフライン閲覧の準備完了", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".today-card")).toBeVisible();
  await expect(page.locator(".launch-calendar")).toBeVisible();
  expect(
    await page.locator("link[rel=apple-touch-icon]").getAttribute("href"),
  ).toContain("icon-180");
  expect(
    await page
      .locator("meta[name=apple-mobile-web-app-capable]")
      .getAttribute("content"),
  ).toBe("yes");
  const manifest = await (
    await context.request.get("/manifest.webmanifest")
  ).json();
  expect(manifest.name).toBe("TOHO Calendar");
  expect(manifest.display).toBe("standalone");
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByText("オフライン · 端末内の予定を表示中", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "予定を追加", exact: true })
    .first()
    .click();
  await page.getByLabel("予定名", { exact: true }).fill("オフライン専用テスト");
  await page.getByRole("button", { name: "保存する" }).click();
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "個人予定", exact: true })
    .click();
  await expect(page.locator(".dated-row")).toContainText(
    "オフライン専用テスト",
  );
  await page.reload();
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "個人予定", exact: true })
    .click();
  await expect(page.locator(".dated-row")).toContainText(
    "オフライン専用テスト",
  );
  await page
    .locator(".bottom-nav")
    .getByRole("button", { name: "設定", exact: true })
    .click();
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "JSONを書き出す" }).click();
  expect((await downloading).suggestedFilename()).toContain("toho-calendar");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(requests).toEqual([]);
});
