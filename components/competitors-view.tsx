"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { deleteCompetitor, getCompetitors, saveCompetitor } from "@/lib/data";
import type { Competitor, CompetitorPriority, CompetitorStatus } from "@/lib/types";
import { useAuthProfile } from "@/lib/auth-context";
import { canEditContent } from "@/lib/permissions";
import { CompetitorLogo } from "./competitor-logo";
import { PageHeading } from "./page-heading";
import { EmptyState, Modal, useConfirmAction } from "./ui";

const blank: Partial<Competitor> = { name: "", website_url: "", logo_url: "", industry: "Общи", description: "", priority: "Среден", status: "Активен", notes: "" };
const defaultIndustries = ["AI и автоматизация", "Софтуер", "Маркетинг", "Агенции", "Електронна търговия", "Образование", "Финанси", "Медии", "Общи"];

export function CompetitorsView() {
  const { role } = useAuthProfile();
  const canEdit = canEditContent(role);
  const confirmAction = useConfirmAction();
  const [items, setItems] = useState<Competitor[]>([]);
  const [editing, setEditing] = useState<Partial<Competitor>>(blank);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Активни");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => { getCompetitors().then(setItems).catch(() => setError("Конкурентите не успяха да се заредят. Проверете дали Content Spy SQL миграцията е изпълнена.")); }, []);
  const filtered = useMemo(() => items.filter(item => (status === "Всички" || (status === "Активни" ? item.status === "Активен" : item.status === status)) && `${item.name} ${item.industry} ${item.description}`.toLocaleLowerCase("bg-BG").includes(deferredQuery.toLocaleLowerCase("bg-BG"))), [items, status, deferredQuery]);
  const industries = Array.from(new Set([...defaultIndustries, ...items.map(item => item.industry).filter(Boolean)])).sort((a, b) => a.localeCompare(b, "bg"));

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try { const saved = await saveCompetitor(editing); setItems(current => editing.id ? current.map(item => item.id === editing.id ? { ...saved, source_count: item.source_count } : item) : [{ ...saved, source_count: 0 }, ...current]); setOpen(false); }
    catch { setError("Конкурентът не беше запазен. Проверете въведените адреси и опитайте отново."); }
    finally { setBusy(false); }
  }

  async function remove(item: Competitor) {
    if (!(await confirmAction({ title: "Изтриване на конкурент", description: `„${item.name}“ ще бъде премахнат от Content Spy. Самите източници и съдържанието им ще останат.`, confirmLabel: "Изтрий конкурента" }))) return;
    setBusy(true); try { await deleteCompetitor(item.id); setItems(current => current.filter(value => value.id !== item.id)); } catch { setError("Конкурентът не беше изтрит."); } finally { setBusy(false); }
  }

  return <>
    <PageHeading eyebrow="Конкурентно наблюдение" title="Content Spy" description="Следете конкурентите, техните публични канали и важната активност на едно място." action={canEdit ? <button className="btn-primary" onClick={() => { setEditing({ ...blank }); setOpen(true); }}><Plus size={15}/> Добави конкурент</button> : undefined}/>
    {error && <div className="mb-4 rounded-xl border border-[#e9c8c3] bg-[#fff4f2] p-3 text-xs text-[#9e3029]">{error}</div>}
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Stat label="Активни конкуренти" value={items.filter(item => item.status === "Активен").length}/><Stat label="Критичен приоритет" value={items.filter(item => item.priority === "Критичен").length}/><Stat label="Свързани канали" value={items.reduce((sum, item) => sum + (item.source_count || 0), 0)}/></div>
    <div className="panel mb-5 flex flex-col gap-3 p-3 sm:flex-row"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8e82]"/><input className="field pl-9" placeholder="Име, индустрия или описание..." value={query} onChange={event => setQuery(event.target.value)}/></div><select className="field sm:w-44" value={status} onChange={event => setStatus(event.target.value)}><option>Активни</option><option>Всички</option><option>Пауза</option><option>Архивиран</option></select></div>
    {filtered.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(item => <article key={item.id} className="panel group flex min-h-60 flex-col p-5"><div className="flex items-start justify-between gap-3"><CompetitorLogo name={item.name} websiteUrl={item.website_url} logoUrl={item.logo_url}/><div className="flex items-center gap-1">{canEdit && <button title="Редактирай" className="rounded-lg p-2 text-[#888a7e] hover:bg-[#efeee4]" onClick={() => { setEditing(item); setOpen(true); }}><Pencil size={14}/></button>}{canEdit && <button title="Изтрий" className="rounded-lg p-2 text-[#99958c] opacity-0 hover:bg-[#fff0ed] hover:text-[#9e3029] group-hover:opacity-100" onClick={() => remove(item)}><Trash2 size={14}/></button>}</div></div><div className="mt-4 flex flex-wrap items-center gap-2"><Link href={`/competitors/${item.id}`} className="font-semibold text-[#2e3027] hover:text-[#65763e]">{item.name}</Link><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${priorityTone(item.priority)}`}>{item.priority}</span></div><p className="mt-1 text-[10px] uppercase tracking-wider text-[#85877a]">{item.industry} · {item.status}</p><p className="mt-3 line-clamp-3 text-xs leading-relaxed text-[#767869]">{item.description || "Без добавено описание."}</p><div className="mt-auto flex items-center justify-between pt-5"><p className="text-[10px] text-[#67695d]"><strong>{item.source_count || 0}</strong> свързани канала</p>{item.website_url && <a href={item.website_url} target="_blank" rel="noreferrer" title="Отвори сайта" className="rounded-lg border border-line p-2 text-[#767869] hover:text-[#65763e]"><ExternalLink size={14}/></a>}</div></article>)}</div> : <div className="panel"><EmptyState title="Няма намерени конкуренти" text="Добавете първия конкурент или променете филтрите."/></div>}
    <Modal open={open} onClose={() => setOpen(false)} title={editing.id ? "Редактиране на конкурент" : "Добавяне на конкурент"} subtitle="Основният профил обединява всички публични канали на конкурента." size="lg"><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#67695d]">Име<input required autoFocus className="field mt-2" value={editing.name || ""} onChange={event => setEditing({ ...editing, name: event.target.value })}/></label><label className="text-xs text-[#67695d]">Индустрия<input required list="competitor-industries" className="field mt-2" value={editing.industry || ""} onChange={event => setEditing({ ...editing, industry: event.target.value })}/><datalist id="competitor-industries">{industries.map(item => <option key={item}>{item}</option>)}</datalist></label></div><label className="block text-xs text-[#67695d]">Основен сайт<input type="url" className="field mt-2" placeholder="https://example.com" value={editing.website_url || ""} onChange={event => setEditing({ ...editing, website_url: event.target.value })}/></label><label className="block text-xs text-[#67695d]">Адрес на лого <span className="text-[#9a9b8d]">(незадължително)</span><input type="url" className="field mt-2" placeholder="https://example.com/logo.png" value={editing.logo_url || ""} onChange={event => setEditing({ ...editing, logo_url: event.target.value })}/></label><label className="block text-xs text-[#67695d]">Описание<textarea rows={3} className="field mt-2 resize-y" value={editing.description || ""} onChange={event => setEditing({ ...editing, description: event.target.value })}/></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#67695d]">Приоритет<select className="field mt-2" value={editing.priority} onChange={event => setEditing({ ...editing, priority: event.target.value as CompetitorPriority })}><option>Нисък</option><option>Среден</option><option>Висок</option><option>Критичен</option></select></label><label className="text-xs text-[#67695d]">Статус<select className="field mt-2" value={editing.status} onChange={event => setEditing({ ...editing, status: event.target.value as CompetitorStatus })}><option>Активен</option><option>Пауза</option><option>Архивиран</option></select></label></div><label className="block text-xs text-[#67695d]">Вътрешни бележки<textarea rows={3} className="field mt-2 resize-y" value={editing.notes || ""} onChange={event => setEditing({ ...editing, notes: event.target.value })}/></label><div className="flex justify-end gap-2 border-t border-line pt-4"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Отказ</button><button disabled={busy} className="btn-primary">{busy ? "Запазване..." : "Запази конкурента"}</button></div></form></Modal>
  </>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-line bg-white p-4"><p className="text-2xl font-semibold text-[#303229]">{value}</p><p className="mt-1 text-[9px] uppercase tracking-wider text-[#85877a]">{label}</p></div>; }
function priorityTone(priority: CompetitorPriority) { return priority === "Критичен" ? "bg-[#ffdad6] text-[#9e3029]" : priority === "Висок" ? "bg-[#fff1d7] text-[#865d1e]" : priority === "Среден" ? "bg-[#e9edda] text-[#52621c]" : "bg-[#efeee4] text-[#77796d]"; }
