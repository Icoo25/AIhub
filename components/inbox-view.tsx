"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckSquare, FileText, Inbox, Link2, Plus, Search, Sparkles, Trash2 } from "lucide-react";
import { deleteKnowledgeItem, getKnowledgeItems, saveKnowledgeItem } from "@/lib/data";
import type { KnowledgeItem } from "@/lib/types";
import { useAuthProfile } from "@/lib/auth-context";
import { canContributeKnowledge } from "@/lib/permissions";
import { useConfirmAction } from "./ui";

const blank = { title: "", description: "", source_url: "", category: "Бележка" };

export function InboxView() {
  const profile = useAuthProfile();
  const canEdit = canContributeKnowledge(profile.role);
  const confirmAction = useConfirmAction();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [draft, setDraft] = useState(blank);
  const [mode, setMode] = useState<"note" | "url">("note");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const load = async () => setItems((await getKnowledgeItems()).filter(item => item.status === "Входящи"));
  useEffect(() => { load().catch(() => setNotice("Входящите записи не успяха да се заредят.")); }, []);

  const shown = useMemo(() => items.filter(item => `${item.title} ${item.description} ${item.category} ${item.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [items, query]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    setBusy(true); setNotice("");
    try {
      let next = { ...draft };
      if (mode === "url") {
        const response = await fetch("/api/import/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: draft.source_url, type: "url" }) });
        const preview = await response.json();
        if (response.ok) next = { ...next, title: preview.title || draft.source_url, description: preview.summary || "Добавен уеб източник" };
      }
      const saved = await saveKnowledgeItem({ title: next.title || "Нова бележка", description: next.description, source_url: next.source_url, category: mode === "url" ? "Източник" : next.category, status: "Входящи", priority: "Среден", rating: 0, tags: [mode === "url" ? "URL" : "Бележка"], notes: "", visibility: "shared" });
      if (saved) setItems(current => [saved, ...current]);
      setDraft(blank); setNotice("Записът е добавен във Входящи.");
    } catch { setNotice("Записът не беше добавен. Проверете адреса и опитайте отново."); }
    finally { setBusy(false); }
  }

  async function process(ids: string[]) {
    setBusy(true);
    try {
      await Promise.all(ids.map(id => { const item = items.find(entry => entry.id === id); return item ? saveKnowledgeItem({ ...item, status: "За преглед" }) : Promise.resolve(); }));
      setItems(current => current.filter(item => !ids.includes(item.id))); setSelected([]); setNotice(`${ids.length} записа са преместени за преглед.`);
    } catch { setNotice("Записите не бяха преместени."); }
    finally { setBusy(false); }
  }

  async function remove(ids: string[]) {
    if (!(await confirmAction({ title: "Изтриване на входящи записи", description: `${ids.length} избрани записа ще бъдат изтрити окончателно.`, confirmLabel: "Изтрий" }))) return;
    await Promise.all(ids.map(deleteKnowledgeItem)); setItems(current => current.filter(item => !ids.includes(item.id))); setSelected([]);
  }

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="eyebrow">Бързо събиране</p><h1 className="mt-1 text-3xl font-semibold tracking-[-.035em]">Входящи</h1><p className="mt-2 max-w-2xl text-sm text-[#767869]">Събирайте линкове и идеи без предварително подреждане. Обработете ги, когато имате време.</p></div><Link href="/library" className="btn-secondary self-start">Към библиотеката <ArrowRight size={14}/></Link></div>

    {canEdit && <section className="panel p-5 sm:p-6"><div className="mb-5 flex gap-2"><button onClick={() => setMode("note")} className={`rounded-lg px-3 py-2 text-xs ${mode === "note" ? "bg-[#e9edda] text-[#52621c]" : "text-[#767869] hover:bg-[#f5f4ea]"}`}><FileText size={14} className="mr-2 inline"/>Бележка</button><button onClick={() => setMode("url")} className={`rounded-lg px-3 py-2 text-xs ${mode === "url" ? "bg-[#e9edda] text-[#52621c]" : "text-[#767869] hover:bg-[#f5f4ea]"}`}><Link2 size={14} className="mr-2 inline"/>Уеб адрес</button></div><form onSubmit={add} className="space-y-3">{mode === "url" ? <input required type="url" autoFocus className="field" placeholder="Поставете URL адрес..." value={draft.source_url} onChange={e => setDraft({...draft, source_url:e.target.value})}/> : <><input required autoFocus className="field" placeholder="Кратко заглавие..." value={draft.title} onChange={e => setDraft({...draft, title:e.target.value})}/><textarea className="field min-h-24 resize-y" placeholder="Бележка, идея или нещо за проучване..." value={draft.description} onChange={e => setDraft({...draft, description:e.target.value})}/></>}<div className="flex justify-end"><button disabled={busy} className="btn-primary"><Plus size={14}/>{busy ? "Добавяне..." : "Добави във Входящи"}</button></div></form></section>}

    {notice && <div className="rounded-xl border border-[#d7d6ca] bg-[#f5f4ea] px-4 py-3 text-sm text-[#52621c]">{notice}</div>}

    <section><div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9b8d]"/><input className="field pl-9" placeholder="Търсене във входящи..." value={query} onChange={e => setQuery(e.target.value)}/></div>{selected.length > 0 && <div className="flex gap-2"><button disabled={busy} onClick={() => process(selected)} className="btn-primary"><CheckSquare size={14}/>Обработи ({selected.length})</button><button onClick={() => remove(selected)} className="btn-secondary text-[#ba1a1a]"><Trash2 size={14}/></button></div>}</div>
      <div className="space-y-2">{shown.map(item => <article key={item.id} className="panel flex items-start gap-4 p-4"><input aria-label={`Избери ${item.title}`} type="checkbox" className="mt-1 h-4 w-4 accent-[#52621c]" checked={selected.includes(item.id)} onChange={e => setSelected(current => e.target.checked ? [...current,item.id] : current.filter(id => id !== item.id))}/><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#e9edda] text-[#52621c]">{item.source_url ? <Link2 size={15}/> : <FileText size={15}/>}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">{item.title}</h2><span className="rounded-full bg-[#f5f4ea] px-2 py-1 text-[10px] text-[#767869]">{item.category}</span></div><p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#767869]">{item.description || "Без допълнително описание"}</p></div>{canEdit && <button title="Премести за преглед" onClick={() => process([item.id])} className="rounded-lg p-2 text-[#52621c] hover:bg-[#e9edda]"><Sparkles size={16}/></button>}</article>)}{!shown.length && <div className="panel py-16 text-center"><Inbox className="mx-auto text-[#9a9b8d]"/><h2 className="mt-3 text-base font-semibold">Входящите са празни</h2><p className="mt-1 text-sm text-[#767869]">Добавете линк или бележка, за да започнете.</p></div>}</div>
    </section>
  </div>;
}
