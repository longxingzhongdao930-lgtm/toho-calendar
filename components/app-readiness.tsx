"use client";
import { useEffect, useState } from "react";
export default function AppReadiness() {
  const [online, setOnline] = useState(true),
    [offlineReady, setOfflineReady] = useState(false),
    [error, setError] = useState(false);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/sw.js`, {
          scope: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/`,
        })
        .then(() => navigator.serviceWorker.ready)
        .then(() => setOfflineReady(true))
        .catch(() => setError(true));
    }
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return (
    <div className="app-readiness">
      <span className="unofficial-label">非公式の学生向けカレンダー</span>
      <span role="status">
        {!online
          ? "オフライン · 端末内の予定を表示中"
          : error
            ? "オフライン準備に失敗しました。通信中に再度開いてください。"
            : offlineReady
              ? "オフライン閲覧の準備完了"
              : "予定はこの端末に保存されます"}
      </span>
      <details>
        <summary>iPhoneのホーム画面に追加</summary>
        <p>
          Safariで公開URLを開き、共有ボタン
          →「ホーム画面に追加」→「追加」。初回は通信できる状態で「オフライン閲覧の準備完了」までお待ちください。
        </p>
        <p>
          ホーム画面のアプリとSafariで保存領域が異なる場合があります。設定の「Safari・ホーム画面へ予定を引き継ぐ」でリンクを作成し、引き継ぎ先で読み込んでください。大学公式アプリではありません。
        </p>
      </details>
    </div>
  );
}
