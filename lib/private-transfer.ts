import { readStoredEvents } from "./seed";
import type { CalendarEvent } from "./calendar";
export const TRANSFER_PREFIX = "#toho-import=";
/** URL fragments never enter HTTP requests. Decode locally, validate, then ask before merging. */
export async function decodePrivateTransfer(
  encoded: string,
): Promise<CalendarEvent[]> {
  if (!/^[A-Za-z0-9_-]+$/.test(encoded) || encoded.length > 50_000)
    throw new Error("取込リンクが壊れているか、長すぎます。");
  if (typeof DecompressionStream === "undefined")
    throw new Error(
      "このブラウザは取込リンクに対応していません。最新版のSafariで開いてください。",
    );
  const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(
    atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4)),
    (c) => c.charCodeAt(0),
  );
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    reader = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"))
      .getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let length = 0,
      text = "";
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > 5_000_000) {
        await reader.cancel();
        throw new Error("取込データは5MB以内にしてください。");
      }
      text += decoder.decode(part.value, { stream: true });
    }
    text += decoder.decode();
    return readStoredEvents(text);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "取込データは5MB以内にしてください。"
    )
      throw error;
    throw new Error(
      "取込リンクを読み込めませんでした。リンク全体をSafariで開き直してください。",
    );
  } finally {
    reader?.releaseLock();
  }
}
