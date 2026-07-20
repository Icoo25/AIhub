import { createClient, hasSupabaseConfig } from "./supabase/client";
import { demoExperiments, demoKnowledge, demoNews, demoTools } from "./demo-data";
import type { ActivityEntry, AINews, AITool, ContentCategory, ContentSource, EntityLink, EntityRelation, EntityType, Experiment, KnowledgeAttachment, KnowledgeCollection, KnowledgeContentType, KnowledgeHistory, KnowledgeItem, KnowledgeStage, SavedView, TeamInvite, UserProfile } from "./types";
import { detectSourceType, extractSourceHandle } from "./sources";

export const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !hasSupabaseConfig;

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
type CacheEntry = { expires: number; value: unknown };
const dataCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<unknown>>();
async function cached<T>(key: string, loader: () => Promise<T>, ttl = 15_000): Promise<T> {
  const existing = dataCache.get(key);
  if (existing && existing.expires > Date.now()) return existing.value as T;
  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;
  const request = loader().then(value => { dataCache.set(key, { value, expires: Date.now() + ttl }); return value; }).finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}
export function clearDataCache(...prefixes: string[]) {
  if (!prefixes.length) { dataCache.clear(); inFlight.clear(); return; }
  const matches = (key: string) => prefixes.some(prefix => prefix.endsWith("*") ? key.startsWith(prefix.slice(0, -1)) : key === prefix);
  for (const key of dataCache.keys()) if (matches(key)) dataCache.delete(key);
  for (const key of inFlight.keys()) if (matches(key)) inFlight.delete(key);
}

export async function getTools(): Promise<AITool[]> { if (isDemo) return clone(demoTools); return cached("tools", async () => { const db = createClient()!; const [{ data, error }, favorites] = await Promise.all([db.from("ai_tools").select("*").order("created_at", { ascending: false }).limit(500), db.from("tool_favorites").select("tool_id")]); if (error) throw error; if (favorites.error) return data as AITool[]; const favoriteIds = new Set((favorites.data || []).map(item => item.tool_id)); return data.map(item => ({ ...item, is_favorite: favoriteIds.has(item.id) })) as AITool[]; }); }
export async function getTool(id: string): Promise<AITool | null> { const tools = await getTools(); return tools.find(item => item.id === id) || null; }
export async function getNews(): Promise<AINews[]> { if (isDemo) return clone(demoNews); return cached("news", async () => { const { data, error } = await createClient()!.from("ai_news").select("id,title,summary,source_url,category,published_date,created_at,source_id").order("published_date", { ascending: false }).limit(500); if (error) throw error; return data; }); }
export async function getExperiments(): Promise<Experiment[]> { if (isDemo) return clone(demoExperiments); return cached("experiments", async () => { const { data, error } = await createClient()!.from("experiments").select("*").order("updated_at", { ascending: false }).limit(300); if (error) throw error; return data; }); }
export async function getExperiment(id: string): Promise<Experiment | null> { const items = await getExperiments(); return items.find(item => item.id === id) || null; }
export async function getExperimentSummaries(): Promise<Experiment[]> { if (isDemo) return clone(demoExperiments); return cached("experiments-summary", async () => { const { data, error } = await createClient()!.from("experiments").select("id,name,description,model_used,result,status,evaluation,created_at,updated_at").order("updated_at", { ascending: false }).limit(300); if (error) throw error; return data; }); }
export async function saveTool(tool: Partial<AITool>): Promise<AITool | undefined> { if (isDemo) return tool as AITool; const db = createClient()!; const query = tool.id ? db.from("ai_tools").update(tool).eq("id", tool.id) : db.from("ai_tools").insert(tool); const { data, error } = await query.select("*").single(); if (error) throw error; clearDataCache("tools"); return data; }
export async function deleteTool(id: string) { if (isDemo) return; const { error } = await createClient()!.from("ai_tools").delete().eq("id", id); if (error) throw error; clearDataCache("tools", "links-*"); }
export async function bulkUpdateTools(ids: string[], patch: Partial<Pick<AITool, "category" | "status" | "approval_status">>) { if (!ids.length) return; if (isDemo) return; const { error } = await createClient()!.from("ai_tools").update({ ...patch, updated_at: new Date().toISOString() }).in("id", ids); if (error) throw error; clearDataCache("tools"); }
export async function bulkDeleteTools(ids: string[]) { if (!ids.length) return; if (isDemo) return; const { error } = await createClient()!.from("ai_tools").delete().in("id", ids); if (error) throw error; clearDataCache("tools", "links-*"); }
export async function getContentCategories(): Promise<ContentCategory[]> { if (isDemo) return []; return cached("content-categories", async () => { const { data, error } = await createClient()!.from("content_categories").select("*").eq("active", true).order("position").order("name"); if (error) return []; return data as ContentCategory[]; }, 60_000); }
export async function saveContentCategory(item: Partial<ContentCategory>, previousName?: string): Promise<ContentCategory> { const db = createClient()!; if (isDemo) return { id: item.id || crypto.randomUUID(), name: item.name || "Нова категория", description: item.description || "", color: item.color || "#7f9156", applies_to: item.applies_to || ["tool"], active: true, position: item.position || 0, created_at: new Date().toISOString() }; const payload = { ...item, updated_at: new Date().toISOString() }; const query = item.id ? db.from("content_categories").update(payload).eq("id", item.id) : db.from("content_categories").insert(payload); const { data, error } = await query.select("*").single(); if (error) throw error; if (previousName && previousName !== item.name && item.applies_to?.includes("tool")) { const rename = await db.from("ai_tools").update({ category: item.name }).eq("category", previousName); if (rename.error) throw rename.error; } clearDataCache("content-categories", "tools"); return data as ContentCategory; }
export async function mergeContentCategory(source: ContentCategory, target: ContentCategory) { if (isDemo) return; const db = createClient()!; if (source.applies_to.includes("tool")) { const result = await db.from("ai_tools").update({ category: target.name }).eq("category", source.name); if (result.error) throw result.error; } const { error } = await db.from("content_categories").update({ active: false, updated_at: new Date().toISOString() }).eq("id", source.id); if (error) throw error; clearDataCache("content-categories", "tools"); }
export async function getSources(): Promise<ContentSource[]> { if (isDemo) return []; return cached("content-sources", async () => { const db = createClient()!; const [sources, tools, news, knowledge, experiments] = await Promise.all([db.from("content_sources").select("*").order("name"), db.from("ai_tools").select("source_id").not("source_id", "is", null), db.from("ai_news").select("source_id").not("source_id", "is", null), db.from("knowledge_items").select("source_id").not("source_id", "is", null), db.from("experiments").select("source_id").not("source_id", "is", null)]); if (sources.error) throw sources.error; const counts = new Map<string, number>(); for (const result of [tools, news, knowledge, experiments]) for (const item of result.data || []) if (item.source_id) counts.set(item.source_id, (counts.get(item.source_id) || 0) + 1); return (sources.data || []).map(item => ({ ...item, content_count: counts.get(item.id) || 0 })) as ContentSource[]; }, 30_000); }
export async function getSource(id: string): Promise<ContentSource | null> { const items = await getSources(); return items.find(item => item.id === id) || null; }
export async function saveSource(item: Partial<ContentSource>): Promise<ContentSource> { if (isDemo) return { id: item.id || crypto.randomUUID(), name: item.name || "Нов източник", url: item.url || "", handle: item.handle || "", source_type: item.source_type || "Сайт", category: item.category || "Общи", description: item.description || "", reliability: item.reliability || 3, status: item.status || "Активен", last_checked_at: item.last_checked_at || null, created_at: new Date().toISOString() }; const db = createClient()!; const payload = { ...item, updated_at: new Date().toISOString() }; const query = item.id ? db.from("content_sources").update(payload).eq("id", item.id) : db.from("content_sources").insert(payload); const { data, error } = await query.select("*").single(); if (error) throw error; let matcher = data.handle || ""; try { if (!matcher) matcher = new URL(data.url).hostname.replace(/^www\./, ""); } catch {} if (matcher) { const pattern = `%${matcher}%`; await Promise.all([db.from("ai_tools").update({ source_id: data.id }).is("source_id", null).ilike("website_url", pattern), db.from("ai_news").update({ source_id: data.id }).is("source_id", null).ilike("source_url", pattern), db.from("knowledge_items").update({ source_id: data.id }).is("source_id", null).ilike("source_url", pattern)]); } clearDataCache("content-sources", "tools", "news", "knowledge"); return data as ContentSource; }
export async function deleteSource(id: string) { if (isDemo) return; const { error } = await createClient()!.from("content_sources").delete().eq("id", id); if (error) throw error; clearDataCache("content-sources", "tools", "news", "knowledge", "experiments"); }
export async function getSourceContent(sourceId: string) { const [tools, news, knowledge, experiments] = await Promise.all([getTools(), getNews(), getKnowledgeItems(), getExperiments()]); return { tools: tools.filter(item => item.source_id === sourceId), news: news.filter(item => item.source_id === sourceId), knowledge: knowledge.filter(item => item.source_id === sourceId), experiments: experiments.filter(item => item.source_id === sourceId) }; }
export async function saveNews(item: Partial<AINews>): Promise<AINews | undefined> { if (isDemo) return item as AINews; const db = createClient()!; const query = item.id ? db.from("ai_news").update(item).eq("id", item.id) : db.from("ai_news").insert(item); const { data, error } = await query.select("*").single(); if (error) throw error; clearDataCache("news"); return data; }
export async function deleteNews(id: string) { if (isDemo) return; const { error } = await createClient()!.from("ai_news").delete().eq("id", id); if (error) throw error; clearDataCache("news", "links-*"); }
export async function saveExperiment(item: Partial<Experiment>): Promise<Experiment | undefined> { if (isDemo) return item as Experiment; const db = createClient()!; const payload = { ...item, updated_at: new Date().toISOString() }; const query = item.id ? db.from("experiments").update(payload).eq("id", item.id) : db.from("experiments").insert(payload); const { data, error } = await query.select("*").single(); if (error) throw error; clearDataCache("experiments", "experiments-summary"); return data; }
export async function deleteExperiment(id: string) { if (isDemo) return; const { error } = await createClient()!.from("experiments").delete().eq("id", id); if (error) throw error; clearDataCache("experiments", "experiments-summary", "links-*"); }
export async function toggleToolFavorite(toolId: string, favorite: boolean) { if (isDemo) return; const db = createClient()!; const { data: userData } = await db.auth.getUser(); const userId = userData.user?.id; if (!userId) throw new Error("Няма активен потребител"); const result = favorite ? await db.from("tool_favorites").upsert({ user_id: userId, tool_id: toolId }) : await db.from("tool_favorites").delete().eq("user_id", userId).eq("tool_id", toolId); if (result.error) throw result.error; clearDataCache("tools"); }
export async function getKnowledgeItems(): Promise<KnowledgeItem[]> { if (isDemo) return clone(demoKnowledge); return cached("knowledge", async () => { const { data, error } = await createClient()!.from("knowledge_items").select("*").order("created_at", { ascending: false }).limit(1000); if (error) throw error; return data; }); }
export async function getKnowledgeItem(id: string): Promise<KnowledgeItem | null> { const items = await getKnowledgeItems(); return items.find(item => item.id === id) || null; }
export async function getInboxItems(): Promise<KnowledgeItem[]> { if (isDemo) return clone(demoKnowledge).filter(item => item.status === "Входящи"); return cached("knowledge-inbox", async () => { const { data, error } = await createClient()!.from("knowledge_items").select("*").eq("status", "Входящи").order("created_at", { ascending: false }).limit(300); if (error) throw error; return data; }); }
export async function saveKnowledgeItem(item: Partial<KnowledgeItem>): Promise<KnowledgeItem | undefined> { if (isDemo) return item as KnowledgeItem; const db = createClient()!; const query = item.id ? db.from("knowledge_items").update(item).eq("id", item.id) : db.from("knowledge_items").insert(item); const { data, error } = await query.select("*").single(); if (error) throw error; clearDataCache("knowledge", "knowledge-inbox"); return data; }
export async function deleteKnowledgeItem(id: string) { if (isDemo) return; const { error } = await createClient()!.from("knowledge_items").delete().eq("id", id); if (error) throw error; clearDataCache("knowledge", "knowledge-inbox", "links-*"); }
export async function getKnowledgeCollections(): Promise<KnowledgeCollection[]> { if (isDemo) return []; return cached("knowledge-collections", async () => { const { data, error } = await createClient()!.from("knowledge_collections").select("*").order("name"); if (error) return []; return data; }, 60_000); }
export async function saveKnowledgeCollection(item: Partial<KnowledgeCollection>): Promise<KnowledgeCollection> { const db = createClient()!; const query = item.id ? db.from("knowledge_collections").update(item).eq("id", item.id) : db.from("knowledge_collections").insert(item); const { data, error } = await query.select("*").single(); if (error) throw error; clearDataCache("knowledge-collections"); return data; }
export async function deleteKnowledgeCollection(id: string) { const { error } = await createClient()!.from("knowledge_collections").delete().eq("id", id); if (error) throw error; clearDataCache("knowledge-collections", "knowledge"); }
export async function getKnowledgeStages(): Promise<KnowledgeStage[]> { if (isDemo) return []; return cached("knowledge-stages", async () => { const { data, error } = await createClient()!.from("knowledge_stages").select("*").order("position"); if (error) return []; return data; }, 60_000); }
export async function saveKnowledgeStage(item: Partial<KnowledgeStage>): Promise<KnowledgeStage> { const { data, error } = await createClient()!.from("knowledge_stages").insert(item).select("*").single(); if (error) throw error; clearDataCache("knowledge-stages"); return data; }
export async function getKnowledgeAttachments(itemId: string): Promise<KnowledgeAttachment[]> { if (isDemo) return []; const { data, error } = await createClient()!.from("knowledge_attachments").select("*").eq("item_id", itemId).order("created_at", { ascending: false }); if (error) return []; return data; }
export async function uploadKnowledgeAttachment(itemId: string, file: File): Promise<KnowledgeAttachment> { const db = createClient()!; const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-"); const path = `${itemId}/${crypto.randomUUID()}-${safeName}`; const upload = await db.storage.from("knowledge-files").upload(path, file); if (upload.error) throw upload.error; const { data, error } = await db.from("knowledge_attachments").insert({ item_id: itemId, file_name: file.name, file_path: path, mime_type: file.type || "application/octet-stream", file_size: file.size }).select("*").single(); if (error) { await db.storage.from("knowledge-files").remove([path]); throw error; } return data; }
export async function deleteKnowledgeAttachment(item: KnowledgeAttachment) { const db = createClient()!; const storage = await db.storage.from("knowledge-files").remove([item.file_path]); if (storage.error) throw storage.error; const { error } = await db.from("knowledge_attachments").delete().eq("id", item.id); if (error) throw error; }
export async function openKnowledgeAttachment(item: KnowledgeAttachment) { const { data, error } = await createClient()!.storage.from("knowledge-files").createSignedUrl(item.file_path, 60); if (error) throw error; window.open(data.signedUrl, "_blank", "noopener,noreferrer"); }
export async function getKnowledgeHistory(itemId: string): Promise<KnowledgeHistory[]> { if (isDemo) return []; const { data, error } = await createClient()!.from("knowledge_item_history").select("*").eq("item_id", itemId).order("created_at", { ascending: false }).limit(20); if (error) return []; return data; }
export async function getProfiles(): Promise<UserProfile[]> { if (isDemo) return []; const { data, error } = await createClient()!.from("profiles").select("*").order("created_at", { ascending: true }); if (error) throw error; return data; }
export async function updateProfileRole(id: string, role: UserProfile["role"]) { if (isDemo) return; const { error } = await createClient()!.from("profiles").update({ role, updated_at: new Date().toISOString() }).eq("id", id); if (error) throw error; }
export async function updateMyProfile(fullName: string) { const { error } = await createClient()!.rpc("update_my_profile", { new_name: fullName }); if (error) throw error; await createClient()!.auth.updateUser({ data: { full_name: fullName } }); }
export async function getTeamInvites(): Promise<TeamInvite[]> { const { data, error } = await createClient()!.from("team_invites").select("*").order("created_at", { ascending: false }); if (error) return []; return data; }
export async function createTeamInvite(email: string, role: TeamInvite["role"]): Promise<TeamInvite> { const { data, error } = await createClient()!.from("team_invites").insert({ email, role }).select("*").single(); if (error) throw error; return data; }
export async function deleteTeamInvite(id: string) { const { error } = await createClient()!.from("team_invites").delete().eq("id", id); if (error) throw error; }
export async function validateTeamInvite(token: string): Promise<TeamInvite | null> { const { data, error } = await createClient()!.rpc("validate_team_invite", { invite_token: token }); if (error || !data?.length) return null; return data[0] as TeamInvite; }
export async function getActivity(limit = 50): Promise<ActivityEntry[]> { return cached(`activity-${limit}`, async () => { const { data, error } = await createClient()!.from("activity_log").select("id,entity_type,entity_id,action,summary,metadata,user_id,created_at").order("created_at", { ascending: false }).limit(limit); if (error) return []; return data; }, 10_000); }
export async function getSavedViews(): Promise<SavedView[]> { if (isDemo) return []; return cached("saved-views", async () => { const { data, error } = await createClient()!.from("saved_views").select("id,name,scope,filters,created_at").order("created_at"); if (error) return []; return data as SavedView[]; }, 30_000); }
export async function saveSavedView(name: string, filters: SavedView["filters"]): Promise<SavedView> { if (isDemo) return { id: crypto.randomUUID(), name, scope: "personal", filters, created_at: new Date().toISOString() }; const { data, error } = await createClient()!.from("saved_views").insert({ name, scope: "personal", filters }).select("*").single(); if (error) throw error; clearDataCache("saved-views"); return data as SavedView; }
export async function deleteSavedView(id: string) { if (isDemo) return; const { error } = await createClient()!.from("saved_views").delete().eq("id", id); if (error) throw error; clearDataCache("saved-views"); }

export async function getEntityLinks(type: EntityType, id: string): Promise<EntityLink[]> {
  if (isDemo) return [];
  return cached(`links-${type}-${id}`, async () => { const { data, error } = await createClient()!.from("entity_links").select("*").or(`and(source_type.eq.${type},source_id.eq.${id}),and(target_type.eq.${type},target_id.eq.${id})`).order("created_at", { ascending: false }); if (error) return []; return data as EntityLink[]; }, 30_000);
}

export async function saveEntityLink(sourceType: EntityType, sourceId: string, targetType: EntityType, targetId: string, relation: EntityRelation = "related"): Promise<EntityLink | undefined> {
  if (sourceType === targetType && sourceId === targetId) throw new Error("Записът не може да бъде свързан със себе си.");
  if (isDemo) return { id: crypto.randomUUID(), source_type: sourceType, source_id: sourceId, target_type: targetType, target_id: targetId, relation, created_at: new Date().toISOString() };
  const { data, error } = await createClient()!.from("entity_links").insert({ source_type: sourceType, source_id: sourceId, target_type: targetType, target_id: targetId, relation }).select("*").single();
  if (error) throw error;
  clearDataCache("links-*");
  return data as EntityLink;
}

export async function deleteEntityLink(id: string) {
  if (isDemo) return;
  const { error } = await createClient()!.from("entity_links").delete().eq("id", id);
  if (error) throw error;
  clearDataCache("links-*");
}

export type InboxTarget = "library" | "tool" | "news" | "experiment" | "source";
export async function attachInboxToExisting(item: KnowledgeItem, targetType: EntityType, targetId: string) {
  await saveEntityLink("knowledge", item.id, targetType, targetId, "related");
  return saveKnowledgeItem({
    ...item,
    status: "Обработено",
    archived_at: new Date().toISOString(),
    metadata: { ...(item.metadata || {}), processed_to: { type: targetType, id: targetId }, duplicate: true },
  });
}
export async function convertInboxItem(item: KnowledgeItem, target: InboxTarget, options: { category: string; contentType: KnowledgeContentType; reliability?: number }) {
  if (target === "library") return saveKnowledgeItem({ ...item, category: options.category, content_type: options.contentType, status: "За преглед", read_state: "reading" });

  if (target === "source") {
    if (!item.source_url) throw new Error("За източник е необходим уеб адрес.");
    const existing = item.source_id ? await getSource(item.source_id) : null;
    const saved = existing || await saveSource({ name: item.title, url: item.source_url, handle: extractSourceHandle(item.source_url), source_type: detectSourceType(item.source_url), category: options.category || "Общи", description: item.description, reliability: options.reliability || 3, status: "Активен", last_checked_at: new Date().toISOString().slice(0, 10) });
    return saveKnowledgeItem({ ...item, source_id: saved.id, status: "Обработено", archived_at: new Date().toISOString(), metadata: { ...(item.metadata || {}), processed_to: { type: "source", id: saved.id } } });
  }

  let targetId = "";
  let targetType: EntityType;
  if (target === "tool") {
    if (!item.source_url) throw new Error("За инструмент е необходим уеб адрес.");
    const saved = await saveTool({ name: item.title, description: item.description, website_url: item.source_url, category: options.category || "Други", status: "В тестване", rating: item.rating || 0, source_id: item.source_id });
    targetId = saved?.id || ""; targetType = "tool";
  } else if (target === "news") {
    if (!item.source_url) throw new Error("За новина е необходим адрес на източника.");
    const saved = await saveNews({ title: item.title, summary: item.description, source_url: item.source_url, category: options.category || "AI", published_date: new Date().toISOString().slice(0, 10), source_id: item.source_id });
    targetId = saved?.id || ""; targetType = "news";
  } else {
    const saved = await saveExperiment({ name: item.title, description: item.description, model_used: "За уточняване", result: "", status: "Идея", hypothesis: item.notes || item.description, source_id: item.source_id });
    targetId = saved?.id || ""; targetType = "experiment";
  }
  if (!targetId) throw new Error("Новият запис не беше създаден.");
  await saveEntityLink("knowledge", item.id, targetType, targetId, target === "experiment" ? "inspired_by" : "related");
  return saveKnowledgeItem({ ...item, status: "Обработено", archived_at: new Date().toISOString(), metadata: { ...(item.metadata || {}), processed_to: { type: targetType, id: targetId } } });
}
