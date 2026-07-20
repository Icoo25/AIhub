"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Archive, ExternalLink, GitCompareArrows, Grid2X2, Layers3, List, MoreHorizontal, Plus, Search, Star, Trash2, X } from "lucide-react";
import { PageHeading } from "./page-heading";
import { Badge, EmptyState, Modal, useConfirmAction } from "./ui";
import { bulkDeleteTools, bulkUpdateTools, deleteTool, getContentCategories, getTools, isDemo, saveTool, toggleToolFavorite } from "@/lib/data";
import type { AITool, ContentCategory, ToolApprovalStatus, ToolDataRisk, ToolPricingModel, ToolStatus } from "@/lib/types";
import { useAuthProfile } from "@/lib/auth-context";
import { canEditContent } from "@/lib/permissions";
import { findToolDuplicates } from "@/lib/duplicates";
import { ToolIcon } from "./tool-icon";
import { ToolRating } from "./tool-rating";
import { CategoriesManager } from "./categories-manager";

const blank: Partial<AITool> = { name: "", category: "Езикови модели", description: "", website_url: "", status: "В тестване", rating: 0, pricing_model: "Freemium", approval_status: "За оценка", data_risk: "Неоценен", use_cases: [], strengths: "", limitations: "", supported_languages: "", notes: "" };
const allCategories = "Всички категории";

export function ToolsView() {
  const confirmAction = useConfirmAction();
  const { role } = useAuthProfile();
  const canEdit = canEditContent(role);
  const [items, setItems] = useState<AITool[]>([]);
  const [managedCategories, setManagedCategories] = useState<ContentCategory[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(allCategories);
  const [modal, setModal] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<AITool>>(blank);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const deferredSearch = useDeferredValue(search);

  const load = async () => {
    setLoading(true); setError("");
    try { const [tools, categories] = await Promise.all([getTools(), getContentCategories()]); setItems(tools); setManagedCategories(categories); }
    catch { setError("Инструментите не успяха да се заредят. Ако току-що добавяте Етап 1, изпълнете новата Supabase миграция."); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (!canEdit) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("new") === "1") { setEditing({ ...blank }); setModal(true); }
    const editId = params.get("edit");
    if (editId) getTools().then(tools => { const tool = tools.find(item => item.id === editId); if (tool) { setEditing(tool); setModal(true); } });
  }, [canEdit]);

  const categoryNames = useMemo(() => Array.from(new Set([...managedCategories.filter(item => item.applies_to.includes("tool")).map(item => item.name), ...items.map(item => item.category)])).sort(), [items, managedCategories]);
  const filtered = useMemo(() => items.filter(item => (category === allCategories || item.category === category) && `${item.name} ${item.description} ${(item.use_cases || []).join(" ")}`.toLocaleLowerCase("bg-BG").includes(deferredSearch.toLocaleLowerCase("bg-BG"))), [items, category, deferredSearch]);
  const duplicates = useMemo(() => findToolDuplicates(editing, items), [editing, items]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try { const saved = await saveTool(editing); if (!saved) throw new Error("Липсва запис"); setItems(current => editing.id ? current.map(item => item.id === editing.id ? saved : item) : [saved, ...current]); setModal(false); }
    catch { setError("Инструментът не беше запазен. Проверете дали миграцията за Етап 1 е изпълнена."); }
    finally { setBusy(false); }
  };
  const remove = async (ids: string[]) => {
    const names = items.filter(item => ids.includes(item.id)).map(item => item.name);
    if (!(await confirmAction({ title: ids.length > 1 ? `Изтриване на ${ids.length} инструмента` : "Изтриване на AI инструмент", description: ids.length > 1 ? `Ще бъдат премахнати: ${names.join(", ")}.` : `„${names[0] || "Без име"}“ ще бъде премахнат окончателно.`, confirmLabel: ids.length > 1 ? "Изтрий избраните" : "Изтрий инструмента" }))) return;
    setBusy(true); try { if (ids.length === 1) await deleteTool(ids[0]); else await bulkDeleteTools(ids); setItems(current => current.filter(item => !ids.includes(item.id))); setSelected([]); setModal(false); } catch { setError("Изтриването не беше успешно."); } finally { setBusy(false); }
  };
  const bulkChange = async (patch: Partial<Pick<AITool, "category" | "status" | "approval_status">>) => {
    if (!selected.length) return; setBusy(true);
    try { await bulkUpdateTools(selected, patch); setItems(current => current.map(item => selected.includes(item.id) ? { ...item, ...patch } : item)); setSelected([]); setBulkCategory(""); }
    catch { setError("Груповата промяна не беше запазена."); }
    finally { setBusy(false); }
  };
  const toggleSelected = (id: string) => setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);

  return <>
    <PageHeading eyebrow="Интелигентен каталог" title="AI инструменти" description="Оценявайте пригодност, риск, цена и реални приложения на инструментите в организацията." action={canEdit ? <div className="flex flex-wrap gap-2"><button className="btn-secondary" onClick={() => setCategoriesOpen(true)}><Layers3 size={16}/> Категории</button><button className="btn-primary" onClick={() => { setEditing({ ...blank, category: categoryNames[0] || blank.category }); setModal(true); }}><Plus size={16}/> Добави инструмент</button></div> : undefined}/>
    {error && <div className="mb-4 rounded-xl border border-[#e9c8c3] bg-[#fff4f2] p-3 text-xs text-[#9e3029]">{error}</div>}
    {loading && <div className="panel mb-5 h-40 animate-pulse"/>}
    <div className="panel mb-5 flex flex-col gap-3 p-3 sm:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#767869]" size={15}/><input className="field pl-9" placeholder="Име, описание или приложение..." value={search} onChange={e => setSearch(e.target.value)}/></div>
      <select className="field sm:w-56" value={category} onChange={e => setCategory(e.target.value)}><option>{allCategories}</option>{categoryNames.map(name => <option key={name}>{name}</option>)}</select>
      <div className="flex rounded-xl border border-line bg-white/50 p-1"><button title="Карти" onClick={() => setView("grid")} className={`rounded-lg p-2 ${view === "grid" ? "bg-acid text-white" : "text-[#767869]"}`}><Grid2X2 size={16}/></button><button title="Списък" onClick={() => setView("list")} className={`rounded-lg p-2 ${view === "list" ? "bg-acid text-white" : "text-[#767869]"}`}><List size={16}/></button></div>
    </div>

    {selected.length > 0 && <div className="sticky top-3 z-20 mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-[#cbd5ad] bg-[#f7f8ed]/95 p-3 shadow-lg backdrop-blur">
      <span className="mr-1 text-xs font-semibold text-[#4f5e2d]">Избрани: {selected.length}</span>
      <Link href={`/tools/compare?ids=${selected.join(",")}`} className={`btn-secondary ${selected.length < 2 || selected.length > 4 ? "pointer-events-none opacity-45" : ""}`}><GitCompareArrows size={15}/> Сравни</Link>
      {canEdit && <><select className="field w-48" value={bulkCategory} onChange={e => { setBulkCategory(e.target.value); if (e.target.value) bulkChange({ category: e.target.value }); }}><option value="">Смени категория...</option>{categoryNames.map(name => <option key={name}>{name}</option>)}</select><button className="btn-secondary" disabled={busy} onClick={() => bulkChange({ status: "Архивиран" })}><Archive size={15}/> Архивирай</button><button className="rounded-lg px-3 py-2 text-xs font-semibold text-[#9e3029] hover:bg-[#fff0ed]" disabled={busy} onClick={() => remove(selected)}><Trash2 size={15} className="mr-1 inline"/> Изтрий</button></>}
      <button className="ml-auto rounded-lg p-2 text-[#767869] hover:bg-white" title="Изчисти избора" onClick={() => setSelected([])}><X size={16}/></button>
    </div>}

    {filtered.length ? <div className={`grid gap-4 ${view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>{filtered.map(tool => <article key={tool.id} className={`panel group relative flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-[#b8c391] hover:shadow-xl ${view === "grid" ? "min-h-64" : "min-h-0"}`}>
      <label className="absolute left-3 top-3 z-10 grid h-7 w-7 cursor-pointer place-items-center rounded-lg border border-line bg-[#fbfaf0]/95 shadow-sm"><input type="checkbox" className="accent-[#7f9156]" checked={selected.includes(tool.id)} onChange={() => toggleSelected(tool.id)} aria-label={`Избери ${tool.name}`}/></label>
      <div className="flex items-start justify-between pl-7"><ToolIcon name={tool.name} websiteUrl={tool.website_url}/><div className="flex items-center gap-1"><button title="Любим" onClick={async () => { const next = { ...tool, is_favorite: !tool.is_favorite }; await toggleToolFavorite(tool.id, Boolean(next.is_favorite)); setItems(current => current.map(item => item.id === tool.id ? next : item)); }} className="p-2 text-[#767869] hover:text-acid"><Star size={16} fill={tool.is_favorite ? "currentColor" : "none"}/></button>{canEdit && <button title="Редактиране" onClick={() => { setEditing(tool); setModal(true); }} className="p-2 text-[#767869] hover:text-[#1b1c16]"><MoreHorizontal size={17}/></button>}</div></div>
      <div className="mt-4 flex flex-wrap items-center gap-2"><Link href={`/tools/${tool.id}`} className="font-semibold text-[#25271f] hover:text-[#62733b]">{tool.name}</Link><Badge tone={tool.status === "Активен" ? "green" : tool.status === "В тестване" ? "purple" : "neutral"}>{tool.status}</Badge></div>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#767869]">{tool.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">{tool.approval_status && <span className="rounded-full bg-[#eef0df] px-2 py-1 text-[10px] text-[#5b6839]">{tool.approval_status}</span>}{tool.pricing_model && <span className="rounded-full bg-[#f0ece4] px-2 py-1 text-[10px] text-[#6f685d]">{tool.pricing_model}</span>}{tool.data_risk && tool.data_risk !== "Неоценен" && <span className="rounded-full bg-[#f5e9df] px-2 py-1 text-[10px] text-[#8b5e3c]">Риск: {tool.data_risk}</span>}</div>
      <div className="mt-auto flex items-end justify-between pt-5"><div><p className="mb-2 text-[10px] uppercase tracking-wider text-[#767869]">{tool.category}</p><ToolRating value={tool.rating}/></div><div className="flex gap-1">{canEdit && <button title="Изтриване" onClick={() => remove([tool.id])} className="rounded-lg p-2 text-[#8d8980] opacity-0 transition hover:bg-[#fff0ed] hover:text-[#9e3029] group-hover:opacity-100"><Trash2 size={14}/></button>}<a title="Отвори сайта" href={tool.website_url} target="_blank" rel="noreferrer" className="rounded-lg border border-line p-2 text-[#767869] hover:text-acid"><ExternalLink size={14}/></a></div></div>
    </article>)}</div> : !loading && <div className="panel"><EmptyState title="Няма намерени инструменти" text="Опитайте друго търсене или добавете нов AI инструмент."/></div>}

    <ToolFormModal open={modal} onClose={() => setModal(false)} editing={editing} setEditing={setEditing} categories={categoryNames} duplicates={duplicates} busy={busy} onSubmit={submit} onRemove={remove}/>
    <CategoriesManager open={categoriesOpen} onClose={() => setCategoriesOpen(false)} onChanged={next => { setManagedCategories(next); load(); }}/>
  </>;
}

function ToolFormModal({ open, onClose, editing, setEditing, categories, duplicates, busy, onSubmit, onRemove }: { open: boolean; onClose: () => void; editing: Partial<AITool>; setEditing: (item: Partial<AITool>) => void; categories: string[]; duplicates: AITool[]; busy: boolean; onSubmit: (event: React.FormEvent) => void; onRemove: (ids: string[]) => void }) {
  const useCases = (editing.use_cases || []).join(", ");
  return <Modal open={open} onClose={onClose} title={editing.id ? "Редактиране на AI инструмент" : "Добавяне на AI инструмент"} subtitle={isDemo ? "Промените са само за текущата демо сесия." : "Профилът събира практическата и фирмената оценка на инструмента."}>
    <form onSubmit={onSubmit} className="space-y-4">
      {duplicates.length > 0 && <div className="rounded-xl border border-[#dfc690] bg-[#fff8e8] p-3 text-xs text-[#735d29]"><strong>Възможен дубликат:</strong> {duplicates.map(item => <Link className="ml-1 underline" key={item.id} href={`/tools/${item.id}`}>{item.name}</Link>)}</div>}
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#5f6154]">Име<input required className="field mt-2" value={editing.name || ""} onChange={e => setEditing({ ...editing, name: e.target.value })}/></label><label className="text-xs text-[#5f6154]">Категория<select required className="field mt-2" value={editing.category || ""} onChange={e => setEditing({ ...editing, category: e.target.value })}><option value="">Изберете</option>{categories.map(name => <option key={name}>{name}</option>)}</select></label></div>
      <label className="block text-xs text-[#5f6154]">Описание<textarea required rows={3} className="field mt-2 resize-none" value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })}/></label>
      <label className="block text-xs text-[#5f6154]">Адрес на сайта<div className="mt-2 flex items-center gap-3"><ToolIcon name={editing.name || "AI"} websiteUrl={editing.website_url} className="h-11 w-11" imageClassName="h-7 w-7"/><input required type="url" className="field" placeholder="https://..." value={editing.website_url || ""} onChange={e => setEditing({ ...editing, website_url: e.target.value })}/></div></label>
      <div className="grid gap-4 sm:grid-cols-3"><SelectField label="Статус" value={editing.status} options={["Активен", "В тестване", "Архивиран"]} onChange={value => setEditing({ ...editing, status: value as ToolStatus })}/><SelectField label="Фирмено решение" value={editing.approval_status} options={["За оценка", "Одобрен", "Ограничен", "Забранен"]} onChange={value => setEditing({ ...editing, approval_status: value as ToolApprovalStatus })}/><SelectField label="Риск за данните" value={editing.data_risk} options={["Неоценен", "Нисък", "Среден", "Висок"]} onChange={value => setEditing({ ...editing, data_risk: value as ToolDataRisk })}/></div>
      <div className="grid gap-4 sm:grid-cols-2"><SelectField label="Ценови модел" value={editing.pricing_model} options={["Безплатен", "Freemium", "Платен", "По запитване"]} onChange={value => setEditing({ ...editing, pricing_model: value as ToolPricingModel })}/><label className="text-xs text-[#5f6154]">Детайли за цената<input className="field mt-2" placeholder="напр. 20 € / месец" value={editing.price_details || ""} onChange={e => setEditing({ ...editing, price_details: e.target.value })}/></label></div>
      <label className="block text-xs text-[#5f6154]">Подходящ за <span className="text-[#98998e]">(разделете със запетая)</span><input className="field mt-2" value={useCases} onChange={e => setEditing({ ...editing, use_cases: e.target.value.split(",").map(value => value.trim()).filter(Boolean) })}/></label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#5f6154]">Силни страни<textarea rows={2} className="field mt-2 resize-none" value={editing.strengths || ""} onChange={e => setEditing({ ...editing, strengths: e.target.value })}/></label><label className="text-xs text-[#5f6154]">Ограничения<textarea rows={2} className="field mt-2 resize-none" value={editing.limitations || ""} onChange={e => setEditing({ ...editing, limitations: e.target.value })}/></label></div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#5f6154]">Поддържани езици<input className="field mt-2" value={editing.supported_languages || ""} onChange={e => setEditing({ ...editing, supported_languages: e.target.value })}/></label><label className="text-xs text-[#5f6154]">Последен преглед<input type="date" className="field mt-2" value={editing.last_reviewed_at || ""} onChange={e => setEditing({ ...editing, last_reviewed_at: e.target.value || null })}/></label></div>
      <label className="block text-xs text-[#5f6154]">Вътрешни бележки<textarea rows={2} className="field mt-2 resize-none" value={editing.notes || ""} onChange={e => setEditing({ ...editing, notes: e.target.value })}/></label>
      <div className="text-xs text-[#5f6154]"><span>Рейтинг</span><div className="mt-2 flex h-[42px] items-center rounded-xl border border-line bg-white/50 px-3"><ToolRating value={editing.rating} onChange={rating => setEditing({ ...editing, rating })}/></div></div>
      <div className="flex justify-between pt-2">{editing.id ? <button type="button" className="text-xs text-[#9e3029]" onClick={() => onRemove([editing.id!])}>Изтрий инструмента</button> : <span/>}<div className="flex gap-2"><button type="button" onClick={onClose} className="btn-secondary">Отказ</button><button disabled={busy} className="btn-primary">{busy ? "Запазване..." : "Запази"}</button></div></div>
    </form>
  </Modal>;
}

function SelectField({ label, value, options, onChange }: { label: string; value?: string; options: string[]; onChange: (value: string) => void }) { return <label className="text-xs text-[#5f6154]">{label}<select className="field mt-2" value={value || options[0]} onChange={event => onChange(event.target.value)}>{options.map(option => <option key={option}>{option}</option>)}</select></label>; }
