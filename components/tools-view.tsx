"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Grid2X2, List, MoreHorizontal, Plus, Search, Star, Trash2 } from "lucide-react";
import { PageHeading } from "./page-heading";
import { Badge, EmptyState, Modal, useConfirmAction } from "./ui";
import { deleteTool, getTools, isDemo, saveTool, toggleToolFavorite } from "@/lib/data";
import type { AITool, ToolStatus } from "@/lib/types";
import { useAuthProfile } from "@/lib/auth-context";
import { canEditContent } from "@/lib/permissions";

const blank: Partial<AITool> = { name: "", category: "Езиков модел", description: "", website_url: "", status: "В тестване", rating: 4, is_favorite: false };

export function ToolsView() {
  const confirmAction = useConfirmAction();
  const { role } = useAuthProfile();
  const canEdit = canEditContent(role);
  const [items, setItems] = useState<AITool[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Всички категории");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Partial<AITool>>(blank);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => { setLoading(true); try { setItems(await getTools()); } catch { setError("Инструментите не успяха да се заредят."); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (canEdit && new URLSearchParams(window.location.search).get("new") === "1") { setEditing(blank); setModal(true); } }, [canEdit]);
  const categories = ["Всички категории", ...Array.from(new Set(items.map(x => x.category)))];
  const filtered = useMemo(() => items.filter(x => (category === "Всички категории" || x.category === category) && (x.name + x.description).toLowerCase().includes(search.toLowerCase())), [items, category, search]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); await saveTool(editing);
    const next = { ...editing, id: editing.id || crypto.randomUUID(), created_at: editing.created_at || new Date().toISOString() } as AITool;
    setItems(editing.id ? items.map(x => x.id === editing.id ? next : x) : [next, ...items]);
    setBusy(false); setModal(false);
  };
  const remove = async (id: string) => { const tool = items.find(item => item.id === id); if (!(await confirmAction({ title: "Изтриване на AI инструмент", description: `Инструментът „${tool?.name || "Без име"}“ ще бъде премахнат окончателно.`, confirmLabel: "Изтрий инструмента" }))) return; await deleteTool(id); setItems(items.filter(x => x.id !== id)); setModal(false); };

  return <>
    <PageHeading eyebrow="Интелигентен каталог" title="AI инструменти" description="Откривайте, оценявайте и управлявайте AI инструментите на вашата организация." action={canEdit ? <button className="btn-primary" onClick={() => { setEditing(blank); setModal(true); }}><Plus size={16}/> Добави инструмент</button> : undefined}/>
    {error && <div className="mb-4 rounded-xl border border-[#ffdad6] bg-[#fff4f2] p-3 text-xs text-[#ba1a1a]">{error}</div>}
    {loading && <div className="panel mb-5 h-40 animate-pulse"/>}
    <div className="panel mb-5 flex flex-col gap-3 p-3 sm:flex-row">
      <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={15}/><input className="field pl-9" placeholder="Търсене на инструменти..." value={search} onChange={e => setSearch(e.target.value)}/></div>
      <select className="field sm:w-52" value={category} onChange={e => setCategory(e.target.value)}>{categories.map(c => <option key={c}>{c}</option>)}</select>
      <div className="flex rounded-xl border border-line bg-white/50 p-1"><button title="Изглед с карти" onClick={() => setView("grid")} className={`rounded-lg p-2 ${view === "grid" ? "bg-acid text-white" : "text-slate-600"}`}><Grid2X2 size={16}/></button><button title="Списъчен изглед" onClick={() => setView("list")} className={`rounded-lg p-2 ${view === "list" ? "bg-acid text-white" : "text-slate-600"}`}><List size={16}/></button></div>
    </div>
    {filtered.length ? <div className={`grid gap-4 ${view === "grid" ? "sm:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"}`}>{filtered.map((tool, i) => <article key={tool.id} className={`panel group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-xl ${view === "grid" ? "min-h-60" : "min-h-0"}`}>
      <div className="flex items-start justify-between"><span className={`grid h-11 w-11 place-items-center rounded-xl text-base font-semibold ${["bg-acid/10 text-acid", "bg-violet-400/10 text-violet-300", "bg-sky-400/10 text-sky-300"][i % 3]}`}>{tool.name[0]}</span><div className="flex items-center gap-1"><button title="Любим" onClick={async () => { const next = { ...tool, is_favorite: !tool.is_favorite }; await toggleToolFavorite(tool.id, Boolean(next.is_favorite)); setItems(items.map(x => x.id === tool.id ? next : x)); }} className="p-2 text-slate-600 hover:text-acid"><Star size={16} fill={tool.is_favorite ? "currentColor" : "none"}/></button>{canEdit && <button title="Редактиране" onClick={() => { setEditing(tool); setModal(true); }} className="p-2 text-slate-600 hover:text-white"><MoreHorizontal size={17}/></button>}</div></div>
      <div className="mt-4 flex items-center gap-2"><h3 className="font-semibold">{tool.name}</h3><Badge tone={tool.status === "Активен" ? "green" : tool.status === "В тестване" ? "purple" : "neutral"}>{tool.status}</Badge></div>
      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-500">{tool.description}</p>
      <div className="mt-auto flex items-end justify-between pt-5"><div><p className="text-[10px] uppercase tracking-wider text-slate-600">{tool.category}</p><div className="mt-1 flex items-center gap-1 text-xs"><Star size={11} className="text-acid" fill="#b8f34a"/> {tool.rating}</div></div><div className="flex gap-1">{canEdit && <button title="Изтриване" onClick={() => remove(tool.id)} className="rounded-lg p-2 text-slate-700 opacity-0 transition hover:bg-rose-400/10 hover:text-rose-300 group-hover:opacity-100"><Trash2 size={14}/></button>}<a title="Отвори сайта" href={tool.website_url} target="_blank" className="rounded-lg border border-line p-2 text-slate-500 hover:text-acid"><ExternalLink size={14}/></a></div></div>
    </article>)}</div> : <div className="panel"><EmptyState title="Няма намерени инструменти" text="Опитайте друго търсене или добавете нов AI инструмент."/></div>}
    <Modal open={modal} onClose={() => setModal(false)} title={editing.id ? "Редактиране на AI инструмент" : "Добавяне на AI инструмент"} subtitle={isDemo ? "Промените се пазят само за текущата демо сесия." : "Данните ще бъдат запазени във вашето Supabase пространство."}>
      <form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-slate-400">Име<input required className="field mt-2" value={editing.name || ""} onChange={e => setEditing({...editing, name: e.target.value})}/></label><label className="text-xs text-slate-400">Категория<input required className="field mt-2" value={editing.category || ""} onChange={e => setEditing({...editing, category: e.target.value})}/></label></div><label className="block text-xs text-slate-400">Описание<textarea required rows={3} className="field mt-2 resize-none" value={editing.description || ""} onChange={e => setEditing({...editing, description: e.target.value})}/></label><label className="block text-xs text-slate-400">Адрес на сайта<input required type="url" className="field mt-2" value={editing.website_url || ""} onChange={e => setEditing({...editing, website_url: e.target.value})}/></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-slate-400">Статус<select className="field mt-2" value={editing.status} onChange={e => setEditing({...editing, status: e.target.value as ToolStatus})}><option>Активен</option><option>В тестване</option><option>Архивиран</option></select></label><label className="text-xs text-slate-400">Оценка<input className="field mt-2" type="number" min="0" max="5" step="0.1" value={editing.rating} onChange={e => setEditing({...editing, rating: Number(e.target.value)})}/></label></div><div className="flex justify-between pt-2">{editing.id ? <button type="button" className="text-xs text-rose-300" onClick={() => remove(editing.id!)}>Изтрий инструмента</button> : <span/>}<div className="flex gap-2"><button type="button" onClick={() => setModal(false)} className="btn-secondary">Отказ</button><button disabled={busy} className="btn-primary">{busy ? "Запазване..." : "Запази"}</button></div></div></form>
    </Modal>
  </>;
}
