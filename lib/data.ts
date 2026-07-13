import { createClient, hasSupabaseConfig } from "./supabase/client";
import { demoExperiments, demoKnowledge, demoNews, demoTools } from "./demo-data";
import type { ActivityEntry, AINews, AITool, EntityLink, EntityRelation, EntityType, Experiment, KnowledgeAttachment, KnowledgeCollection, KnowledgeContentType, KnowledgeHistory, KnowledgeItem, KnowledgeStage, SavedView, TeamInvite, UserProfile } from "./types";

export const isDemo = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !hasSupabaseConfig;

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
export async function getTools(): Promise<AITool[]> { if (isDemo) return clone(demoTools); const db = createClient()!; const [{ data, error }, favorites] = await Promise.all([db.from("ai_tools").select("*").order("created_at", { ascending: false }), db.from("tool_favorites").select("tool_id")]); if (error) throw error; if (favorites.error) return data; const favoriteIds = new Set((favorites.data || []).map(item => item.tool_id)); return data.map(item => ({ ...item, is_favorite: favoriteIds.has(item.id) })); }
export async function getNews(): Promise<AINews[]> { if (isDemo) return clone(demoNews); const { data, error } = await createClient()!.from("ai_news").select("*").order("published_date", { ascending: false }); if (error) throw error; return data; }
export async function getExperiments(): Promise<Experiment[]> { if (isDemo) return clone(demoExperiments); const { data, error } = await createClient()!.from("experiments").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; }
export async function saveTool(tool: Partial<AITool>): Promise<AITool | undefined> { if (isDemo) return tool as AITool; const db = createClient()!; const query = tool.id ? db.from("ai_tools").update(tool).eq("id", tool.id) : db.from("ai_tools").insert(tool); const { data, error } = await query.select("*").single(); if (error) throw error; return data; }
export async function deleteTool(id: string) { if (isDemo) return; const { error } = await createClient()!.from("ai_tools").delete().eq("id", id); if (error) throw error; }
export async function saveNews(item: Partial<AINews>): Promise<AINews | undefined> { if (isDemo) return item as AINews; const db = createClient()!; const query = item.id ? db.from("ai_news").update(item).eq("id", item.id) : db.from("ai_news").insert(item); const { data, error } = await query.select("*").single(); if (error) throw error; return data; }
export async function deleteNews(id: string) { if (isDemo) return; const { error } = await createClient()!.from("ai_news").delete().eq("id", id); if (error) throw error; }
export async function saveExperiment(item: Partial<Experiment>): Promise<Experiment | undefined> { if (isDemo) return item as Experiment; const db = createClient()!; const payload = { ...item, updated_at: new Date().toISOString() }; const query = item.id ? db.from("experiments").update(payload).eq("id", item.id) : db.from("experiments").insert(payload); const { data, error } = await query.select("*").single(); if (error) throw error; return data; }
export async function deleteExperiment(id: string) { if (isDemo) return; const { error } = await createClient()!.from("experiments").delete().eq("id", id); if (error) throw error; }
export async function toggleToolFavorite(toolId: string, favorite: boolean) { if (isDemo) return; const db = createClient()!; const { data: userData } = await db.auth.getUser(); const userId = userData.user?.id; if (!userId) throw new Error("Няма активен потребител"); const result = favorite ? await db.from("tool_favorites").upsert({ user_id: userId, tool_id: toolId }) : await db.from("tool_favorites").delete().eq("user_id", userId).eq("tool_id", toolId); if (result.error) throw result.error; }
export async function getKnowledgeItems(): Promise<KnowledgeItem[]> { if (isDemo) return clone(demoKnowledge); const { data, error } = await createClient()!.from("knowledge_items").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; }
export async function saveKnowledgeItem(item: Partial<KnowledgeItem>): Promise<KnowledgeItem | undefined> { if (isDemo) return item as KnowledgeItem; const db = createClient()!; const query = item.id ? db.from("knowledge_items").update(item).eq("id", item.id) : db.from("knowledge_items").insert(item); const { data, error } = await query.select("*").single(); if (error) throw error; return data; }
export async function deleteKnowledgeItem(id: string) { if (isDemo) return; const { error } = await createClient()!.from("knowledge_items").delete().eq("id", id); if (error) throw error; }
export async function getKnowledgeCollections(): Promise<KnowledgeCollection[]> { if (isDemo) return []; const { data, error } = await createClient()!.from("knowledge_collections").select("*").order("name"); if (error) return []; return data; }
export async function saveKnowledgeCollection(item: Partial<KnowledgeCollection>): Promise<KnowledgeCollection> { const db = createClient()!; const query = item.id ? db.from("knowledge_collections").update(item).eq("id", item.id) : db.from("knowledge_collections").insert(item); const { data, error } = await query.select("*").single(); if (error) throw error; return data; }
export async function deleteKnowledgeCollection(id: string) { const { error } = await createClient()!.from("knowledge_collections").delete().eq("id", id); if (error) throw error; }
export async function getKnowledgeStages(): Promise<KnowledgeStage[]> { if (isDemo) return []; const { data, error } = await createClient()!.from("knowledge_stages").select("*").order("position"); if (error) return []; return data; }
export async function saveKnowledgeStage(item: Partial<KnowledgeStage>): Promise<KnowledgeStage> { const { data, error } = await createClient()!.from("knowledge_stages").insert(item).select("*").single(); if (error) throw error; return data; }
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
export async function getActivity(limit = 50): Promise<ActivityEntry[]> { const { data, error } = await createClient()!.from("activity_log").select("*").order("created_at", { ascending: false }).limit(limit); if (error) return []; return data; }
export async function getSavedViews(): Promise<SavedView[]> { if (isDemo) return []; const { data, error } = await createClient()!.from("saved_views").select("*").order("created_at"); if (error) return []; return data as SavedView[]; }
export async function saveSavedView(name: string, filters: SavedView["filters"]): Promise<SavedView> { if (isDemo) return { id: crypto.randomUUID(), name, scope: "personal", filters, created_at: new Date().toISOString() }; const { data, error } = await createClient()!.from("saved_views").insert({ name, scope: "personal", filters }).select("*").single(); if (error) throw error; return data as SavedView; }
export async function deleteSavedView(id: string) { if (isDemo) return; const { error } = await createClient()!.from("saved_views").delete().eq("id", id); if (error) throw error; }

export async function getEntityLinks(type: EntityType, id: string): Promise<EntityLink[]> {
  if (isDemo) return [];
  const { data, error } = await createClient()!.from("entity_links").select("*").or(`and(source_type.eq.${type},source_id.eq.${id}),and(target_type.eq.${type},target_id.eq.${id})`).order("created_at", { ascending: false });
  if (error) return [];
  return data as EntityLink[];
}

export async function saveEntityLink(sourceType: EntityType, sourceId: string, targetType: EntityType, targetId: string, relation: EntityRelation = "related"): Promise<EntityLink | undefined> {
  if (sourceType === targetType && sourceId === targetId) throw new Error("Записът не може да бъде свързан със себе си.");
  if (isDemo) return { id: crypto.randomUUID(), source_type: sourceType, source_id: sourceId, target_type: targetType, target_id: targetId, relation, created_at: new Date().toISOString() };
  const { data, error } = await createClient()!.from("entity_links").insert({ source_type: sourceType, source_id: sourceId, target_type: targetType, target_id: targetId, relation }).select("*").single();
  if (error) throw error;
  return data as EntityLink;
}

export async function deleteEntityLink(id: string) {
  if (isDemo) return;
  const { error } = await createClient()!.from("entity_links").delete().eq("id", id);
  if (error) throw error;
}

export type InboxTarget = "library" | "tool" | "news" | "experiment";
export async function convertInboxItem(item: KnowledgeItem, target: InboxTarget, options: { category: string; contentType: KnowledgeContentType }) {
  if (target === "library") return saveKnowledgeItem({ ...item, category: options.category, content_type: options.contentType, status: "За преглед", read_state: "reading" });

  let targetId = "";
  let targetType: EntityType;
  if (target === "tool") {
    if (!item.source_url) throw new Error("За инструмент е необходим уеб адрес.");
    const saved = await saveTool({ name: item.title, description: item.description, website_url: item.source_url, category: options.category || "Други", status: "В тестване", rating: item.rating || 0 });
    targetId = saved?.id || ""; targetType = "tool";
  } else if (target === "news") {
    if (!item.source_url) throw new Error("За новина е необходим адрес на източника.");
    const saved = await saveNews({ title: item.title, summary: item.description, source_url: item.source_url, category: options.category || "AI", published_date: new Date().toISOString().slice(0, 10) });
    targetId = saved?.id || ""; targetType = "news";
  } else {
    const saved = await saveExperiment({ name: item.title, description: item.description, model_used: "За уточняване", result: "", status: "Идея", hypothesis: item.notes || item.description });
    targetId = saved?.id || ""; targetType = "experiment";
  }
  if (!targetId) throw new Error("Новият запис не беше създаден.");
  await saveEntityLink("knowledge", item.id, targetType, targetId, target === "experiment" ? "inspired_by" : "related");
  return saveKnowledgeItem({ ...item, status: "Обработено", archived_at: new Date().toISOString(), metadata: { ...(item.metadata || {}), processed_to: { type: targetType, id: targetId } } });
}
