import type { ContentSource, ContentSourceType } from "./types";

export const defaultSourceCategories = ["Общи", "AI новини", "AI инструменти", "Изследвания", "Обучение", "Съвети и трикове", "Неща за тестване", "Автоматизация", "Разработка", "Дизайн", "Маркетинг", "Видео и съдържание", "Бизнес"];

export function normalizedHost(value: string) {
  try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return ""; }
}

export function detectSourceType(value: string): ContentSourceType {
  const host = normalizedHost(value);
  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) return "TikTok";
  if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") return "YouTube";
  if (/rss|feed|atom/i.test(value)) return "RSS";
  return "Сайт";
}

export function extractSourceHandle(value: string) {
  try {
    const url = new URL(value);
    const segment = url.pathname.split("/").filter(Boolean).find(item => item.startsWith("@"));
    return segment || "";
  } catch { return ""; }
}

export function findMatchingSource(value: string, sources: ContentSource[]) {
  const host = normalizedHost(value);
  if (!host) return null;
  const handle = extractSourceHandle(value).toLowerCase();
  return sources.find(source => {
    if (normalizedHost(source.url) !== host) return false;
    if ((source.source_type === "TikTok" || source.source_type === "YouTube") && source.handle && handle) return source.handle.toLowerCase() === handle;
    return true;
  }) || null;
}
