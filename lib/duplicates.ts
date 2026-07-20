import type { AITool } from "./types";

export function normalizeWebsiteUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return `${url.hostname.replace(/^www\./, "").toLowerCase()}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return value.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
  }
}

export function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase("bg-BG").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

export function findToolDuplicates(candidate: Partial<AITool>, tools: AITool[]) {
  const url = normalizeWebsiteUrl(candidate.website_url || "");
  const name = normalizeName(candidate.name || "");
  return tools.filter(tool => tool.id !== candidate.id && (
    (url.length > 3 && normalizeWebsiteUrl(tool.website_url) === url) ||
    (name.length > 2 && normalizeName(tool.name) === name)
  ));
}
