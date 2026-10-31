# TOHO Calendar

東邦音楽大学の学生向け非公式予定管理アプリ。音楽と、毎日のリズム。

Next.js 16 / React 19 / TypeScript / Tailwind CSS 4。バックエンド・APIキー・有料サービス不要の静的サイトです。大学が提供・運営するサービスではありません。

## 開発

Node.js 24、npm を使用します。

```sh
npm ci
npm run dev
```

開発サーバーはポート3000で起動します。

```sh
npm run typecheck
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

既存の Chromium を使う場合は `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e`。E2EはPCとiPhone 13相当の画面サイズで実行します（モバイルはChromiumによるエミュレーションで、実機Safariではありません）。本番成果物は `out/` です。静的exportのため `next start` ではなく `python3 -m http.server 3000 --directory out` 等で配信してください。

## 機能

- ホーム：今日、次の予定、今週、公式学年暦のお知らせ
- カレンダー：月・週・日、種類別色分け、日付選択と予定詳細
- 一覧：日付順、予定名・会場・メモ検索、カテゴリ絞り込み
- オケ：通常練習・臨時練習・分奏・本番、会場の登録と絞り込み
- 授業・試験：平常授業・休講・補講・試験期間など種類を自由入力
- 個人予定：新規追加・編集・削除、終日、期間、時刻、重要マーク
- 毎週・毎月の繰り返し（終了日設定可）、ライト／ダーク
- JSON書き出し・検証付き読み込み（置換前に確認）

PCでは左ナビ、スマホでは下部ナビを使います。スマホのオケ・授業画面は左上メニューから開けます。キーボード操作・フォーカス表示・モーダルのフォーカス制御・動きを抑えるOS設定に対応します。

## 初期データと出典

[2026年度公式学年暦PDF](https://www.toho-music.ac.jp/wp-content/uploads/2026/04/2026_college_calendar.pdf) を参照先とし、依頼時に提供された2026年11月〜2027年2月の大学行事18件、伴奏合わせ2件を `lib/seed.ts` に登録しています。1〜2月は2027年として扱います。

**制作環境の通信制限（HTTPSプロキシの403）によりPDF本文を取得できず、大学行事は全件「要確認」です。** 予定詳細のリンクから必ず公式情報を確認してください。確定していない会場・授業時刻・練習日程は補っていません。伴奏合わせはユーザー提供の確定予定で、終了時刻・会場は未設定です。個人を特定する氏名、学内パスワード、非公開資料は含みません。

初回のみデモデータを登録します。空のバックアップを復元した場合も、再読込で初期データを再登録しません。

## 保存・バックアップ仕様

予定は `localStorage` の `toho-calendar-v1` に保存します。同じ端末・ブラウザ・オリジン内で利用でき、クラウド同期はしません。端末やブラウザの削除・プライベートブラウズ終了等で消える場合があるため、設定から定期的にJSONを書き出してください。サーバーに予定を送る処理はありません。複数タブでの同時編集は避けてください（最後の保存が優先）。

- JSON形式：`{ "version": 1, "events": [...] }`。最大5MB・5,000予定。読み込みは全置換で、破損・不正日付・重複IDを拒否します。
- 読み込みに失敗した既存データは自動上書きしません。正常なJSONの復元で保存を再開できます。
- 繰り返しの編集・削除はシリーズ全体に適用。複数日の繰り返し、単発の例外変更は未対応です。毎月31日は31日のある月のみ表示。
- 一覧はシリーズごとの開始日順。カレンダーは各発生日で表示。次の予定は今後365日、ホームのカテゴリ別の次回は180日から探します。
- データは暗号化しません。共有端末に機密情報を登録しないでください。バックアップにも予定が含まれるため公開リポジトリに追加しないでください。

## 無料公開

### GitHub Pages

1. リポジトリの **Settings → Pages → Build and deployment → Source: GitHub Actions** を選択します。
2. `main` へpushするか、Actionsの **Deploy GitHub Pages → Run workflow** を実行します。
3. Actionsに表示される公開URLを開きます。

ワークフローは `NEXT_PUBLIC_BASE_PATH=/toho-calendar` を指定して `out/` を公開します。リポジトリ名を変更した場合は `.github/workflows/pages.yml` のパスも変更してください。Pages用のローカルビルドも `NEXT_PUBLIC_BASE_PATH=/toho-calendar npm run build` で確認できます。設定した `basePath` はビルド時に固定されます。

### Vercel

リポジトリをImportし、FrameworkをNext.js、Install Commandを `npm ci`、Build Commandを `npm run build` とします。Node.jsは24系、`NEXT_PUBLIC_BASE_PATH` は設定しないでください。サーバー機能・データベース・環境変数・APIキーは不要です。無料プランの利用条件内で運用できます。

## 構成

`app/` は画面とスタイル、`components/calendar-app.tsx` はクライアントUI、`lib/calendar.ts` は日付・繰り返し・検証、`lib/seed.ts` は初期データ、`tests/` はユニットとブラウザテストです。GitHub Actionsで型チェック・ユニット・ビルド・E2Eを実行します。
