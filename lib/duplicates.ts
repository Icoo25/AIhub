import type { AINews, AITool, EntityType, Experiment, KnowledgeItem } from "./types";

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

export interface DuplicateCandidate {
  entityType: EntityType;
  id: string;
  title: string;
  url: string;
  reason: "Същият адрес" | "Сходно заглавие";
  score: number;
  href: string;
}

type DuplicateInput = { id?: string; title?: string; name?: string; source_url?: string; website_url?: string };

function titleSimilarity(left: string, right: string) {
  const a = new Set(normalizeName(left).split(" ").filter(word => word.length > 2));
  const b = new Set(normalizeName(right).split(" ").filter(word => word.length > 2));
  if (!a.size || !b.size) return 0;
  const common = [...a].filter(word => b.has(word)).length;
  return common / Math.max(a.size, b.size);
}

export function findContentDuplicates(
  candidate: DuplicateInput,
  data: { tools: AITool[]; news: AINews[]; knowledge: KnowledgeItem[]; experiments: Experiment[] },
) {
  const candidateTitle = candidate.title || candidate.name || "";
  const candidateUrl = normalizeWebsiteUrl(candidate.source_url || candidate.website_url || "");
  const records: Array<DuplicateInput & { entityType: EntityType; href: string }> = [
    ...data.tools.map(item => ({ ...item, title: item.name, source_url: item.website_url, entityType: "tool" as const, href: `/tools/${item.id}` })),
    ...data.news.map(item => ({ ...item, entityType: "news" as const, href: item.source_url })),
    ...data.knowledge.map(item => ({ ...item, entityType: "knowledge" as const, href: `/library/${item.id}` })),
    ...data.experiments.map(item => ({ ...item, title: item.name, entityType: "experiment" as const, href: `/experiments/${item.id}` })),
  ];

  return records.flatMap(record => {
    if (record.id === candidate.id) return [];
    const recordUrl = normalizeWebsiteUrl(record.source_url || record.website_url || "");
    const exactUrl = candidateUrl.length > 3 && recordUrl === candidateUrl;
    const score = titleSimilarity(candidateTitle, record.title || record.name || "");
    if (!exactUrl && score < 0.72) return [];
    return [{ entityType: record.entityType, id: record.id || "", title: record.title || record.name || "Без заглавие", url: record.source_url || record.website_url || "", reason: exactUrl ? "Същият адрес" as const : "Сходно заглавие" as const, score: exactUrl ? 1 : score, href: record.href }];
  }).sort((a, b) => b.score - a.score).slice(0, 8) satisfies DuplicateCandidate[];
}
