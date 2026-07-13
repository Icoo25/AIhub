export type ToolStatus = "Активен" | "В тестване" | "Архивиран";
export interface AITool { id: string; name: string; category: string; description: string; website_url: string; status: ToolStatus; rating: number; created_at: string; is_favorite?: boolean; }
export interface AINews { id: string; title: string; summary: string; source_url: string; category: string; published_date: string; created_at: string; }
export interface Experiment { id: string; name: string; description: string; model_used: string; result: string; created_at: string; }
export type KnowledgeStatus = "Ново" | "За преглед" | "За тестване" | "Полезно" | "Архив";
export interface KnowledgeItem { id: string; title: string; description: string; category: string; source_url: string; status: KnowledgeStatus | string; priority: "Нисък" | "Среден" | "Висок"; rating: number; tags: string[]; notes: string; created_at: string; collection_id?: string | null; visibility?: "shared" | "personal"; owner_id?: string | null; archived_at?: string | null; }
export interface KnowledgeCollection { id: string; name: string; description: string; color: string; created_by?: string | null; created_at: string; }
export interface KnowledgeStage { id: string; name: string; color: string; position: number; created_at: string; }
export interface KnowledgeAttachment { id: string; item_id: string; file_name: string; file_path: string; mime_type: string; file_size: number; created_at: string; }
export interface KnowledgeHistory { id: string; item_id: string; action: "created" | "updated" | "archived" | "restored"; changes: Record<string, unknown>; changed_by?: string | null; created_at: string; }
export interface UserProfile { id: string; full_name: string; email: string; role: "admin" | "member"; created_at: string; updated_at: string; }
export interface TeamInvite { id: string; token: string; email: string; role: "admin" | "member"; expires_at: string; used_at?: string | null; created_at: string; }
export interface ActivityEntry { id: string; entity_type: string; entity_id?: string | null; action: string; summary: string; metadata: Record<string, unknown>; user_id?: string | null; created_at: string; }
