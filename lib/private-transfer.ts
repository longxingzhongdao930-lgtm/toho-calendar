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

/** Build a private browser-to-browser handoff without any upload. */
export async function encodePrivateTransfer(
  events: CalendarEvent[],
): Promise<string> {
  const { validateEvents } = await import("./calendar");
  const { ACADEMIC_REVISION } = await import("./academic");
  validateEvents(events);
  if (typeof CompressionStream === "undefined")
    throw new Error("最新版のSafariで開いてください。");
  const bytes = new TextEncoder().encode(
    JSON.stringify({ version: 1, academicRevision: ACADEMIC_REVISION, events }),
  );
  if (bytes.byteLength > 5_000_000)
    throw new Error(
      "データが大きいため、JSONバックアップで引き継いでください。",
    );
  const compressed = new Uint8Array(
    await new Response(
      new Blob([bytes]).stream().pipeThrough(new CompressionStream("gzip")),
    ).arrayBuffer(),
  );
  let binary = "";
  for (const byte of compressed) binary += String.fromCharCode(byte);
  const encoded = btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  if (encoded.length > 50_000)
    throw new Error(
      "リンクが長すぎるため、JSONバックアップで引き継いでください。",
    );
  return encoded;
}
export function extractPrivateTransfer(link: string): string {
  const trimmed = link.trim();
  if (trimmed.startsWith(TRANSFER_PREFIX))
    return trimmed.slice(TRANSFER_PREFIX.length);
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error("引き継ぎリンク全体を貼り付けてください。");
  }
  if (
    !["https:", "http:"].includes(url.protocol) ||
    !url.hash.startsWith(TRANSFER_PREFIX)
  )
    throw new Error("TOHO Calendarの引き継ぎリンクを貼り付けてください。");
  return url.hash.slice(TRANSFER_PREFIX.length);
}
