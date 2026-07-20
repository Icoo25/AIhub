"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { deleteSource, getSources, saveSource } from "@/lib/data";
import { detectSourceType, extractSourceHandle } from "@/lib/sources";
import type { ContentSource, ContentSourceStatus, ContentSourceType } from "@/lib/types";
import { useAuthProfile } from "@/lib/auth-context";
import { canEditContent } from "@/lib/permissions";
import { PageHeading } from "./page-heading";
import { EmptyState, Modal, useConfirmAction } from "./ui";
import { SourceLogo } from "./source-logo";

const blank: Partial<ContentSource> = { name: "", url: "", handle: "", source_type: "Сайт", category: "Общи", description: "", reliability: 3, status: "Активен", last_checked_at: null };
const sourceTypes: ContentSourceType[] = ["Сайт", "Блог", "YouTube", "TikTok", "Бюлетин", "RSS", "Вътрешен"];

export function SourcesView() {
  const { role } = useAuthProfile();
  const canEdit = canEditContent(role);
  const confirmAction = useConfirmAction();
  const [items, setItems] = useState<ContentSource[]>([]);
  const [editing, setEditing] = useState<Partial<ContentSource>>(blank);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("Всички типове");
  const [status, setStatus] = useState("Активни");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const deferredQuery = useDeferredValue(query);
  const load = async () => { try { setItems(await getSources()); } catch { setError("Източниците не успяха да се заредят. Проверете дали SQL миграцията за източници е изпълнена."); } };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter(item => (type === "Всички типове" || item.source_type === type) && (status === "Всички" || (status === "Активни" ? item.status === "Активен" : item.status === status)) && `${item.name} ${item.handle} ${item.category} ${item.description}`.toLocaleLowerCase("bg-BG").includes(deferredQuery.toLocaleLowerCase("bg-BG"))), [items, type, status, deferredQuery]);
  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean))).sort();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try { const saved = await saveSource(editing); setItems(current => editing.id ? current.map(item => item.id === editing.id ? { ...saved, content_count: item.content_count } : item) : [{ ...saved, content_count: 0 }, ...current]); setOpen(false); }
    catch { setError("Източникът не беше запазен. Проверете дали адресът вече не съществува."); }
    finally { setBusy(false); }
  };
  const remove = async (item: ContentSource) => {
    if (!(await confirmAction({ title: "Изтриване на източник", description: `„${item.name}“ ще бъде изтрит. Свързаното съдържание ще остане, но без избран източник.`, confirmLabel: "Изтрий източника" }))) return;
    setBusy(true); try { await deleteSource(item.id); setItems(current => current.filter(source => source.id !== item.id)); } catch { setError("Източникът не беше изтрит."); } finally { setBusy(false); }
  };
  const updateUrl = (url: string) => setEditing(current => ({ ...current, url, source_type: detectSourceType(url), handle: extractSourceHandle(url) || current.handle }));

  return <>
    <PageHeading eyebrow="Качествени входни точки" title="Източници" description="Управлявайте сайтове, TikTok профили, YouTube канали, RSS потоци и вътрешни източници на знание." action={canEdit ? <button className="btn-primary" onClick={() => { setEditing({ ...blank }); setOpen(true); }}><Plus size={15}/> Добави източник</button> : undefined}/>
    {error && <div className="mb-4 rounded-xl border border-[#e9c8c3] bg-[#fff4f2] p-3 text-xs text-[#9e3029]">{error}</div>}
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Stat label="Активни източници" value={items.filter(item => item.status === "Активен").length}/><Stat label="TikTok профили" value={items.filter(item => item.source_type === "TikTok").length}/><Stat label="Свързани записи" value={items.reduce((sum, item) => sum + (item.content_count || 0), 0)}/></div>
    <div className="panel mb-5 flex flex-col gap-3 p-3 lg:flex-row"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8c8e82]"/><input className="field pl-9" placeholder="Име, профил, категория..." value={query} onChange={event => setQuery(event.target.value)}/></div><select className="field lg:w-48" value={type} onChange={event => setType(event.target.value)}><option>Всички типове</option>{sourceTypes.map(item => <option key={item}>{item}</option>)}</select><select className="field lg:w-40" value={status} onChange={event => setStatus(event.target.value)}><option>Активни</option><option>Всички</option><option>Пауза</option><option>Архивиран</option></select></div>
    {filtered.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filtered.map(item => <article key={item.id} className="panel group flex min-h-56 flex-col p-5"><div className="flex items-start justify-between gap-3"><SourceLogo name={item.name} url={item.url} type={item.source_type}/><div className="flex items-center gap-1">{canEdit && <button title="Редактирай" className="rounded-lg p-2 text-[#888a7e] hover:bg-[#efeee4]" onClick={() => { setEditing(item); setOpen(true); }}><Pencil size={14}/></button>}{canEdit && <button title="Изтрий" className="rounded-lg p-2 text-[#99958c] opacity-0 hover:bg-[#fff0ed] hover:text-[#9e3029] group-hover:opacity-100" onClick={() => remove(item)}><Trash2 size={14}/></button>}</div></div><div className="mt-4 flex flex-wrap items-center gap-2"><Link href={`/sources/${item.id}`} className="font-semibold text-[#2e3027] hover:text-[#65763e]">{item.name}</Link><span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${item.status === "Активен" ? "bg-[#e9edda] text-[#52621c]" : "bg-[#efeee4] text-[#77796d]"}`}>{item.status}</span></div>{item.handle && <p className="mt-1 text-[11px] font-medium text-[#735c8b]">{item.handle}</p>}<p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#767869]">{item.description || "Без добавено описание."}</p><div className="mt-auto flex items-end justify-between pt-5"><div><p className="text-[9px] uppercase tracking-wider text-[#909286]">{item.source_type} · {item.category}</p><p className="mt-2 text-[10px] text-[#67695d]">Надеждност <strong>{item.reliability}/5</strong> · {item.content_count || 0} записа</p></div><a href={item.url} target="_blank" rel="noreferrer" title="Отвори източника" className="rounded-lg border border-line p-2 text-[#767869] hover:text-[#65763e]"><ExternalLink size={14}/></a></div></article>)}</div> : <div className="panel"><EmptyState title="Няма намерени източници" text="Добавете първия източник или променете филтрите."/></div>}

    <Modal open={open} onClose={() => setOpen(false)} title={editing.id ? "Редактиране на източник" : "Добавяне на източник"} subtitle="Профилите и каналите се свързват с информацията, която идва от тях." size="lg"><form onSubmit={submit} className="space-y-4"><label className="block text-xs text-[#67695d]">Адрес<input required type="url" autoFocus className="field mt-2" placeholder="https://www.tiktok.com/@profile" value={editing.url || ""} onChange={event => updateUrl(event.target.value)}/></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#67695d]">Име<input required className="field mt-2" value={editing.name || ""} onChange={event => setEditing({ ...editing, name: event.target.value })}/></label><label className="text-xs text-[#67695d]">Тип<select className="field mt-2" value={editing.source_type} onChange={event => setEditing({ ...editing, source_type: event.target.value as ContentSourceType })}>{sourceTypes.map(item => <option key={item}>{item}</option>)}</select></label></div><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#67695d]">Профил / handle<input className="field mt-2" placeholder="@profile" value={editing.handle || ""} onChange={event => setEditing({ ...editing, handle: event.target.value })}/></label><label className="text-xs text-[#67695d]">Категория<input required list="source-categories" className="field mt-2" value={editing.category || ""} onChange={event => setEditing({ ...editing, category: event.target.value })}/><datalist id="source-categories">{categories.map(item => <option key={item}>{item}</option>)}</datalist></label></div><label className="block text-xs text-[#67695d]">Описание<textarea rows={3} className="field mt-2 resize-y" value={editing.description || ""} onChange={event => setEditing({ ...editing, description: event.target.value })}/></label><div className="grid gap-4 sm:grid-cols-3"><label className="text-xs text-[#67695d]">Надеждност<select className="field mt-2" value={editing.reliability || 3} onChange={event => setEditing({ ...editing, reliability: Number(event.target.value) })}>{[1,2,3,4,5].map(value => <option key={value} value={value}>{value}/5</option>)}</select></label><label className="text-xs text-[#67695d]">Статус<select className="field mt-2" value={editing.status} onChange={event => setEditing({ ...editing, status: event.target.value as ContentSourceStatus })}><option>Активен</option><option>Пауза</option><option>Архивиран</option></select></label><label className="text-xs text-[#67695d]">Последна проверка<input type="date" className="field mt-2" value={editing.last_checked_at || ""} onChange={event => setEditing({ ...editing, last_checked_at: event.target.value || null })}/></label></div><div className="flex justify-end gap-2 border-t border-line pt-4"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Отказ</button><button disabled={busy} className="btn-primary">{busy ? "Запазване..." : "Запази източника"}</button></div></form></Modal>
  </>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-line bg-white p-4"><p className="text-2xl font-semibold text-[#303229]">{value}</p><p className="mt-1 text-[9px] uppercase tracking-wider text-[#85877a]">{label}</p></div>; }
