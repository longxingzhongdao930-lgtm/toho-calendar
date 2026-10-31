"use client";
import { useState, useRef } from "react";
import { Copy, ArrowRight } from "lucide-react";
import type { CalendarEvent } from "@/lib/calendar";
import {
  encodePrivateTransfer,
  decodePrivateTransfer,
  extractPrivateTransfer,
  TRANSFER_PREFIX,
} from "@/lib/private-transfer";
export default function BrowserTransfer({
  events,
  onImport,
}: {
  events: CalendarEvent[];
  onImport: (events: CalendarEvent[]) => void;
}) {
  const [link, setLink] = useState(""),
    [input, setInput] = useState(""),
    [status, setStatus] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const copyRef = useRef<HTMLTextAreaElement>(null);
  const personal = events.filter((e) => e.origin !== "official");
  async function prepare() {
    setBusy(true);
    setError("");
    try {
      if (!personal.length)
        throw new Error(
          "個人予定が表示される元のブラウザでリンクを作成してください。",
        );
      const encoded = await encodePrivateTransfer(personal);
      const url = new URL(
        `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/`,
        window.location.origin,
      );
      url.searchParams.set("handoff", "1");
      url.hash = TRANSFER_PREFIX.slice(1) + encoded;
      setLink(url.href);
      window.history.replaceState(window.history.state, "", url.href);
      setStatus(
        "準備できました。この画面のメニューから「Safariで開く」、またはリンクをコピーしてSafariのアドレス欄に貼り付けてください。Safari側で追加ボタンを押すと引き継ぎ完了です。",
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "リンクを作成できませんでした。",
      );
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error();
      await navigator.clipboard.writeText(link);
      setStatus(
        "コピーしました。Safariのアドレス欄に貼り付けて開き、「既存の予定を残して追加」を押してください。",
      );
    } catch {
      copyRef.current?.focus();
      copyRef.current?.select();
      setStatus(
        "自動コピーが使えません。下の欄を長押ししてリンク全体をコピーし、Safariのアドレス欄に貼り付けてください。",
      );
    }
  }
  async function receive(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = await decodePrivateTransfer(extractPrivateTransfer(input));
      setInput("");
      onImport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "読み込めませんでした。");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card settings-card browser-transfer">
      <h2>Safari・ホーム画面へ予定を引き継ぐ</h2>
      <p>
        ChatGPT内のブラウザ・Safari・ホーム画面のアプリでは、保存場所が別になる場合があります。予定は消えたのではなく、元のブラウザに残っている可能性があります。
      </p>
      <p>
        <strong>このブラウザの個人予定：{personal.length}件</strong>
        。予定が見える元のブラウザでリンクを作成してください。画像・予定はサーバーへ送信しません。
      </p>
      <div className="transfer-actions">
        <button
          className="primary-button"
          onClick={prepare}
          disabled={busy || !personal.length}
        >
          Safariへ引き継ぐ準備 <ArrowRight size={16} />
        </button>
        {link && (
          <button className="secondary-button" onClick={copy}>
            <Copy size={16} />
            引き継ぎリンクをコピー
          </button>
        )}
      </div>
      {link && (
        <label className="transfer-copy-label">
          個人用リンク（ほかの人と共有しないでください）
          <textarea
            ref={copyRef}
            aria-label="引き継ぎ用リンク（コピー用）"
            readOnly
            rows={3}
            value={link}
          />
        </label>
      )}
      {status && (
        <p role="status" className="transfer-feedback">
          {status}
        </p>
      )}
      {error && (
        <p role="alert" className="transfer-error">
          {error}
        </p>
      )}
      <details className="transfer-receive">
        <summary>Safari・ホーム画面側でリンクを貼り付けて取り込む</summary>
        <p>
          引き継ぎ先のアプリでこの欄にリンクを貼り付ける方法も使えます。追加前に確認画面が出ます。
        </p>
        <form onSubmit={receive}>
          <label>
            引き継ぎリンクを貼り付け
            <textarea
              aria-label="引き継ぎリンクを貼り付け"
              rows={3}
              required
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </label>
          <button className="secondary-button" disabled={busy}>
            リンクの予定を確認
          </button>
        </form>
      </details>
    </section>
  );
}
