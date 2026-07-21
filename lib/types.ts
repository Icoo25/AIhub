export type ToolStatus = "Активен" | "В тестване" | "Архивиран";
export type ToolApprovalStatus = "За оценка" | "Одобрен" | "Ограничен" | "Забранен";
export type ToolDataRisk = "Неоценен" | "Нисък" | "Среден" | "Висок";
export type ToolPricingModel = "Безплатен" | "Freemium" | "Платен" | "По запитване";
export interface AITool {
  id: string;
  name: string;
  category: string;
  description: string;
  website_url: string;
  status: ToolStatus;
  rating: number;
  created_at: string;
  is_favorite?: boolean;
  pricing_model?: ToolPricingModel;
  price_details?: string;
  approval_status?: ToolApprovalStatus;
  data_risk?: ToolDataRisk;
  use_cases?: string[];
  strengths?: string;
  limitations?: string;
  supported_languages?: string;
  owner_id?: string | null;
  last_reviewed_at?: string | null;
  notes?: string;
  updated_at?: string;
  source_id?: string | null;
}
export type CategoryEntityType = "tool" | "news" | "knowledge" | "experiment";
export interface ContentCategory { id: string; name: string; description: string; color: string; applies_to: CategoryEntityType[]; active: boolean; position: number; created_at: string; updated_at?: string; }
export interface AINews { id: string; title: string; summary: string; source_url: string; category: string; published_date: string; created_at: string; source_id?: string | null; }
export type ExperimentStatus = "Идея" | "Планиран" | "В процес" | "Завършен" | "За внедряване" | "Отхвърлен";
export interface Experiment {
  id: string;
  name: string;
  description: string;
  model_used: string;
  result: string;
  created_at: string;
  status?: ExperimentStatus;
  hypothesis?: string;
  prompt?: string;
  test_data?: string;
  model_settings?: string;
  evaluation?: number;
  decision?: string;
  comparison_model?: string;
  comparison_prompt?: string;
  comparison_result?: string;
  updated_at?: string;
  source_id?: string | null;
}
export type KnowledgeStatus = "Ново" | "За преглед" | "За тестване" | "Полезно" | "Архив";
export type KnowledgeContentType = "resource" | "source" | "note" | "tool" | "news" | "experiment" | "tip" | "idea" | "prompt" | "course" | "video";
export interface KnowledgeItem { id: string; title: string; description: string; category: string; source_url: string; status: KnowledgeStatus | string; priority: "Нисък" | "Среден" | "Висок"; rating: number; tags: string[]; notes: string; created_at: string; collection_id?: string | null; visibility?: "shared" | "personal"; owner_id?: string | null; archived_at?: string | null; content_type?: KnowledgeContentType; assigned_to?: string | null; due_date?: string | null; pinned?: boolean; read_state?: "unread" | "reading" | "done"; metadata?: Record<string, unknown>; source_id?: string | null; }
export type ContentSourceType = "Сайт" | "Блог" | "YouTube" | "TikTok" | "Бюлетин" | "RSS" | "Вътрешен";
export type ContentSourceStatus = "Активен" | "Пауза" | "Архивиран";
export interface ContentSource { id: string; name: string; url: string; handle: string; source_type: ContentSourceType; category: string; description: string; reliability: number; status: ContentSourceStatus; last_checked_at?: string | null; created_at: string; updated_at?: string; content_count?: number; }
export type CompetitorPriority = "Нисък" | "Среден" | "Висок" | "Критичен";
export type CompetitorStatus = "Активен" | "Пауза" | "Архивиран";
export interface Competitor { id: string; name: string; website_url: string; logo_url: string; industry: string; description: string; priority: CompetitorPriority; status: CompetitorStatus; notes: string; created_at: string; updated_at?: string; source_count?: number; }
export interface CompetitorSource { id: string; competitor_id: string; source_id: string; channel_label: string; is_primary: boolean; created_at: string; source?: ContentSource; }
export interface KnowledgeCollection { id: string; name: string; description: string; color: string; created_by?: string | null; created_at: string; }
export interface KnowledgeStage { id: string; name: string; color: string; position: number; created_at: string; }
export interface KnowledgeAttachment { id: string; item_id: string; file_name: string; file_path: string; mime_type: string; file_size: number; created_at: string; }
export interface KnowledgeHistory { id: string; item_id: string; action: "created" | "updated" | "archived" | "restored"; changes: Record<string, unknown>; changed_by?: string | null; created_at: string; }
export type UserRole = "admin" | "editor" | "researcher" | "viewer" | "member";
export interface UserProfile { id: string; full_name: string; email: string; role: UserRole; created_at: string; updated_at: string; }
export interface TeamInvite { id: string; token: string; email: string; role: UserRole; expires_at: string; used_at?: string | null; created_at: string; }
export interface ActivityEntry { id: string; entity_type: string; entity_id?: string | null; action: string; summary: string; metadata: Record<string, unknown>; user_id?: string | null; created_at: string; }
export type EntityType = "knowledge" | "tool" | "news" | "experiment";
export type EntityRelation = "related" | "uses" | "result_of" | "inspired_by" | "supports" | "compares";
export interface EntityLink { id: string; source_type: EntityType; source_id: string; target_type: EntityType; target_id: string; relation: EntityRelation; created_at: string; }
export interface SavedView { id: string; name: string; scope: "personal" | "shared"; filters: { category?: string; collection?: string; visibility?: string; contentType?: string; view?: "board" | "grid" | "list"; showArchived?: boolean }; created_at: string; }
