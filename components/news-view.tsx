"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { PageHeading } from "./page-heading";
import { Badge, EmptyState, Modal, useConfirmAction } from "./ui";
import { deleteNews, getNews, isDemo, saveNews } from "@/lib/data";
import { useAuthProfile } from "@/lib/auth-context";
import type { AINews } from "@/lib/types";

const blank = (): Partial<AINews> => ({ title: "", summary: "", source_url: "", category: "Индустрия", published_date: new Date().toISOString().slice(0, 10) });

export function NewsView() {
  const confirmAction = useConfirmAction();
  const { role } = useAuthProfile();
  const canEdit = role === "admin";
  const [items, setItems] = useState<AINews[]>([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Partial<AINews>>(blank());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => { setLoading(true); try { setItems(await getNews()); } catch { setError("Новините не успяха да се заредят."); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (canEdit && new URLSearchParams(window.location.search).get("new") === "1") { setEditing(blank()); setModal(true); } }, [canEdit]);
  const filtered = useMemo(() => items.filter(item => `${item.title} ${item.summary} ${item.category}`.toLowerCase().includes(search.toLowerCase())), [items, search]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try { await saveNews(editing); await load(); setModal(false); }
    catch { setError("Новината не беше запазена."); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!editing.id || !(await confirmAction({ title: "Изтриване на новина", description: `Новината „${editing.title}“ ще бъде премахната окончателно от инфо потока.`, confirmLabel: "Изтрий новината" }))) return;
    setBusy(true); try { await deleteNews(editing.id); await load(); setModal(false); }
    catch { setError("Новината не беше изтрита."); } finally { setBusy(false); }
  }

  return <>
    <PageHeading eyebrow="Радар за сигнали" title="AI новини" description="Новините тук захранват и инфо потока в началното табло." action={canEdit ? <button className="btn-primary" onClick={() => { setEditing(blank()); setModal(true); }}><Plus size={16}/> Добави новина</button> : undefined}/>
    {error && <div className="mb-4 rounded-xl border border-[#ffdad6] bg-[#fff4f2] p-3 text-xs text-[#ba1a1a]">{error}</div>}
    <div className="panel mb-5 p-3"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9b8d]" size={15}/><input className="field pl-9" placeholder="Търсене по заглавие, резюме или категория..." value={search} onChange={e => setSearch(e.target.value)}/></div></div>
    {loading ? <LoadingCards/> : filtered.length ? <div className="grid gap-4 lg:grid-cols-2">{filtered.map((item, index) => <article key={item.id} className="panel group p-5 transition hover:-translate-y-0.5 sm:p-6"><div className="mb-5 flex items-center justify-between"><Badge tone={index % 2 ? "purple" : "blue"}>{item.category}</Badge><span className="flex items-center gap-1.5 text-[10px] text-[#767869]"><CalendarDays size={12}/>{new Date(item.published_date).toLocaleDateString("bg-BG")}</span></div><h2 className="text-base font-semibold leading-snug sm:text-lg">{item.title}</h2><p className="mt-3 line-clamp-3 text-xs leading-relaxed text-[#767869]">{item.summary}</p><div className="mt-5 flex items-center justify-between border-t border-[#efeee4] pt-4"><a href={item.source_url} target="_blank" className="flex items-center gap-1 text-xs text-[#52621c]">Прочети източника <ArrowUpRight size={13}/></a>{canEdit && <button onClick={() => { setEditing(item); setModal(true); }} className="flex items-center gap-1 text-[10px] text-[#67558d]"><Pencil size={12}/> Редактирай</button>}</div></article>)}</div> : <div className="panel"><EmptyState title="Няма намерени новини" text="Променете търсенето или добавете нов запис."/></div>}
    <Modal open={modal && canEdit} onClose={() => setModal(false)} title={editing.id ? "Редактиране на новина" : "Добавяне в инфо потока"} subtitle={isDemo ? "Демо режим" : "Записът се пази в Supabase и се показва в началното табло."}>
      <form onSubmit={submit} className="space-y-4"><label className="block text-xs text-[#767869]">Заглавие<input required className="field mt-2" value={editing.title || ""} onChange={e => setEditing({...editing,title:e.target.value})}/></label><label className="block text-xs text-[#767869]">Резюме<textarea required rows={4} className="field mt-2 resize-none" value={editing.summary || ""} onChange={e => setEditing({...editing,summary:e.target.value})}/></label><label className="block text-xs text-[#767869]">URL на източника<input required type="url" className="field mt-2" value={editing.source_url || ""} onChange={e => setEditing({...editing,source_url:e.target.value})}/></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#767869]">Категория<input required className="field mt-2" value={editing.category || ""} onChange={e => setEditing({...editing,category:e.target.value})}/></label><label className="text-xs text-[#767869]">Дата<input required type="date" className="field mt-2" value={editing.published_date || ""} onChange={e => setEditing({...editing,published_date:e.target.value})}/></label></div><div className="flex justify-between pt-2">{editing.id ? <button type="button" onClick={remove} className="flex items-center gap-1 text-xs text-[#ba1a1a]"><Trash2 size={13}/> Изтрий</button> : <span/>}<div className="flex gap-2"><button type="button" className="btn-secondary" onClick={() => setModal(false)}>Отказ</button><button disabled={busy} className="btn-primary">{busy ? "Запазване..." : "Запази"}</button></div></div></form>
    </Modal>
  </>;
}

function LoadingCards() { return <div className="grid gap-4 lg:grid-cols-2">{[1,2,3,4].map(item => <div key={item} className="panel h-52 animate-pulse bg-white/60"/>)}</div>; }
