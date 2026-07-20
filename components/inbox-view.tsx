"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Beaker, BookOpen, CheckCircle2, CheckSquare, ExternalLink, FileText, Inbox, Lightbulb, Link2, Newspaper, Plus, Search, Sparkles, Trash2, Video, WandSparkles, Wrench } from "lucide-react";
import { attachInboxToExisting, convertInboxItem, deleteKnowledgeItem, getContentCategories, getExperimentSummaries, getInboxItems, getKnowledgeItems, getNews, getSources, getTools, saveKnowledgeItem, type InboxTarget } from "@/lib/data";
import type { AINews, AITool, ContentCategory, ContentSource, EntityType, Experiment, KnowledgeContentType, KnowledgeItem } from "@/lib/types";
import { findContentDuplicates, type DuplicateCandidate } from "@/lib/duplicates";
import { findMatchingSource } from "@/lib/sources";
import { useAuthProfile } from "@/lib/auth-context";
import { canContributeKnowledge } from "@/lib/permissions";
import { Modal, useConfirmAction } from "./ui";

type CaptureMode = "text" | "url";
type Preview = { title: string; summary: string; url: string; image?: string };
type Draft = { title: string; description: string; source_url: string; category: string; content_type: KnowledgeContentType; priority: KnowledgeItem["priority"]; preview_image?: string; source_id?: string | null };
const blank: Draft = { title: "", description: "", source_url: "", category: "Бележки", content_type: "note", priority: "Среден" };
const contentTypes: Array<{ value: KnowledgeContentType; label: string }> = [
  { value: "note", label: "Бележка" }, { value: "idea", label: "Идея" }, { value: "source", label: "Източник" },
  { value: "tool", label: "Инструмент" }, { value: "news", label: "Новина" }, { value: "tip", label: "Съвет или трик" },
  { value: "prompt", label: "Prompt" }, { value: "video", label: "Видео" }, { value: "course", label: "Обучение" },
];

export function InboxView() {
  const profile = useAuthProfile();
  const canEdit = canContributeKnowledge(profile.role);
  const confirmAction = useConfirmAction();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [tools, setTools] = useState<AITool[]>([]);
  const [news, setNews] = useState<AINews[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [managedCategories, setManagedCategories] = useState<ContentCategory[]>([]);
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [draft, setDraft] = useState<Draft>(blank);
  const [mode, setMode] = useState<CaptureMode>("text");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [notice, setNotice] = useState("");
  const [processing, setProcessing] = useState<KnowledgeItem | null>(null);
  const [target, setTarget] = useState<InboxTarget>("library");
  const [processOptions, setProcessOptions] = useState<{ category: string; contentType: KnowledgeContentType }>({ category: "Източници", contentType: "source" });
  const deferredQuery = useDeferredValue(query);

  const load = async () => {
    const [inbox, allKnowledge, allTools, allNews, allExperiments, categories, allSources] = await Promise.all([getInboxItems(), getKnowledgeItems(), getTools(), getNews(), getExperimentSummaries(), getContentCategories(), getSources()]);
    setItems(inbox); setKnowledge(allKnowledge); setTools(allTools); setNews(allNews); setExperiments(allExperiments); setManagedCategories(categories); setSources(allSources);
  };
  useEffect(() => { load().catch(() => setNotice("Входящите записи не успяха да се заредят.")); }, []);

  const duplicateData = useMemo(() => ({ tools, news, knowledge, experiments }), [tools, news, knowledge, experiments]);
  const captureDuplicates = useMemo(() => findContentDuplicates({ title: draft.title, source_url: draft.source_url }, duplicateData), [draft.title, draft.source_url, duplicateData]);
  const processingDuplicates = useMemo(() => processing ? findContentDuplicates(processing, duplicateData) : [], [processing, duplicateData]);
  const targetCategories = useMemo(() => categoriesForTarget(target, knowledge, tools, news, managedCategories), [target, knowledge, tools, news, managedCategories]);
  const shown = useMemo(() => items.filter(item => `${item.title} ${item.description} ${item.category} ${item.tags.join(" ")}`.toLocaleLowerCase("bg-BG").includes(deferredQuery.toLocaleLowerCase("bg-BG"))), [items, deferredQuery]);

  async function inspectUrl() {
    if (!draft.source_url) return;
    setInspecting(true); setNotice("");
    try {
      const response = await fetch("/api/import/preview", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: draft.source_url, type: "url" }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      const next: Preview = { title: data.title || draft.source_url, summary: data.summary || "Страницата няма описание.", url: data.url || draft.source_url, image: data.image };
      const matchedSource = findMatchingSource(next.url, sources);
      setPreview(next); setDraft(current => ({ ...current, title: next.title, description: next.summary, source_url: next.url, preview_image: next.image, source_id: matchedSource?.id || null, content_type: current.content_type === "note" ? "source" : current.content_type, category: current.category === "Бележки" ? "Източници" : current.category }));
    } catch (error) { setNotice(error instanceof Error ? error.message : "Адресът не можа да бъде прегледан."); }
    finally { setInspecting(false); }
  }

  async function add(event: React.FormEvent) {
    event.preventDefault(); if (!canEdit) return;
    setBusy(true); setNotice("");
    try {
      const saved = await saveKnowledgeItem({ title: draft.title || "Нов входящ запис", description: draft.description, source_url: draft.source_url, category: draft.category, status: "Входящи", priority: draft.priority, rating: 0, tags: [contentTypes.find(item => item.value === draft.content_type)?.label || "Входящи"], notes: "", visibility: "shared", content_type: draft.content_type, read_state: "unread", source_id: draft.source_id || null, metadata: { captured_at: new Date().toISOString(), capture_mode: mode, preview_image: draft.preview_image || null } });
      if (saved) { setItems(current => [saved, ...current]); setKnowledge(current => [saved, ...current]); }
      setDraft(blank); setPreview(null); setNotice("Записът е добавен във Входящи и чака твоя преглед.");
    } catch { setNotice("Записът не беше добавен. Проверете данните и опитайте отново."); }
    finally { setBusy(false); }
  }

  async function sendToReview(ids: string[]) {
    setBusy(true);
    try { await Promise.all(ids.map(id => { const item = items.find(entry => entry.id === id); return item ? saveKnowledgeItem({ ...item, status: "За преглед" }) : Promise.resolve(); })); setItems(current => current.filter(item => !ids.includes(item.id))); setSelected([]); setNotice(`${ids.length} записа са преместени за преглед.`); }
    catch { setNotice("Записите не бяха преместени."); }
    finally { setBusy(false); }
  }

  function startProcess(item: KnowledgeItem) {
    setProcessing({ ...item }); setTarget("library");
    setProcessOptions({ category: item.category === "Бележки" ? "Идеи" : item.category || "Източници", contentType: item.content_type || (item.source_url ? "source" : "note") });
  }

  function chooseTarget(nextTarget: InboxTarget) {
    const options = categoriesForTarget(nextTarget, knowledge, tools, news, managedCategories);
    setTarget(nextTarget);
    if (nextTarget === "experiment") return;
    setProcessOptions(current => ({ ...current, category: options.includes(processing?.category || "") ? processing?.category || options[0] : options[0] || processing?.category || current.category }));
  }

  async function completeProcess(event: React.FormEvent) {
    event.preventDefault(); if (!processing) return;
    setBusy(true); setNotice("");
    try {
      await convertInboxItem(processing, target, processOptions);
      setItems(current => current.filter(item => item.id !== processing.id)); setSelected(current => current.filter(id => id !== processing.id));
      setNotice(target === "library" ? "Записът е подреден в AI Библиотеката." : `Създаден е нов ${target === "tool" ? "инструмент" : target === "news" ? "новинарски запис" : "експеримент"}.`); setProcessing(null); await load();
    } catch (error) { setNotice(error instanceof Error ? error.message : "Записът не беше обработен."); }
    finally { setBusy(false); }
  }

  async function useExisting(duplicate: DuplicateCandidate) {
    if (!processing) return;
    if (!(await confirmAction({ title: "Свързване със съществуващ запис", description: `Входящият запис ще бъде маркиран като обработен и свързан с „${duplicate.title}“. Няма да бъде създавано ново копие.`, confirmLabel: "Свържи" }))) return;
    setBusy(true);
    try { await attachInboxToExisting(processing, duplicate.entityType, duplicate.id); setItems(current => current.filter(item => item.id !== processing.id)); setProcessing(null); setNotice("Записът е свързан със съществуващото съдържание."); await load(); }
    catch { setNotice("Записите не бяха свързани."); }
    finally { setBusy(false); }
  }

  async function remove(ids: string[]) {
    if (!(await confirmAction({ title: "Изтриване на входящи записи", description: `${ids.length} избрани записа ще бъдат изтрити окончателно.`, confirmLabel: "Изтрий" }))) return;
    setBusy(true); try { await Promise.all(ids.map(deleteKnowledgeItem)); setItems(current => current.filter(item => !ids.includes(item.id))); setKnowledge(current => current.filter(item => !ids.includes(item.id))); setSelected([]); setNotice("Избраните записи са изтрити."); }
    catch { setNotice("Записите не бяха изтрити."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="eyebrow">Интелигентно събиране</p><h1 className="mt-1 text-3xl font-semibold tracking-[-.035em]">Входящи</h1><p className="mt-2 max-w-2xl text-sm text-[#767869]">Събирайте линкове и идеи на едно място. AI Компас предлага контекст и дубликати, а ти решаваш какво да остане.</p></div><Link href="/library" className="btn-secondary self-start">Към библиотеката <ArrowRight size={14}/></Link></div>

    {canEdit && <section className="panel overflow-hidden"><div className="border-b border-line bg-[#f7f6ec] px-5 py-4 sm:px-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-[#34362d]">Бърз запис</h2><p className="mt-1 text-[11px] text-[#7b7d70]">Постави адрес или запиши нещо, преди да си го забравил.</p></div><div className="flex rounded-xl border border-line bg-white p-1"><button type="button" onClick={() => { setMode("text"); setPreview(null); }} className={`rounded-lg px-3 py-2 text-xs ${mode === "text" ? "bg-[#e9edda] text-[#52621c]" : "text-[#767869]"}`}><FileText size={14} className="mr-2 inline"/>Текст</button><button type="button" onClick={() => { setMode("url"); setDraft(current => ({ ...current, content_type: "source", category: "Източници" })); }} className={`rounded-lg px-3 py-2 text-xs ${mode === "url" ? "bg-[#e9edda] text-[#52621c]" : "text-[#767869]"}`}><Link2 size={14} className="mr-2 inline"/>URL</button></div></div></div>
      <form onSubmit={add} className="space-y-4 p-5 sm:p-6">
        {mode === "url" && <div className="flex flex-col gap-2 sm:flex-row"><input required type="url" autoFocus className="field flex-1" placeholder="https://..." value={draft.source_url} onChange={e => { setDraft({ ...draft, source_url: e.target.value }); setPreview(null); }}/><button type="button" disabled={inspecting || !draft.source_url} onClick={inspectUrl} className="btn-secondary"><WandSparkles size={14}/>{inspecting ? "Извличане..." : "Прегледай адреса"}</button></div>}
        {preview && <div className="flex gap-4 rounded-xl border border-[#dce1c8] bg-[#f5f7eb] p-4">{preview.image ? <img src={preview.image} alt="" className="h-16 w-20 rounded-lg object-cover"/> : <span className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-white text-[#748248]"><Link2 size={20}/></span>}<div className="min-w-0 flex-1"><p className="text-xs font-semibold text-[#34362d]">{preview.title}</p><p className="mt-1 line-clamp-2 text-[11px] text-[#767869]">{preview.summary}</p><p className="mt-1 truncate text-[9px] text-[#989a8d]">{preview.url}</p><p className={`mt-2 text-[10px] font-semibold ${draft.source_id ? "text-[#596638]" : "text-[#8a6a34]"}`}>{draft.source_id ? `Разпознат източник: ${sources.find(item => item.id === draft.source_id)?.name || "Източник"}` : "Няма регистриран източник за този адрес."}</p></div></div>}
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-[#67695d]">Заглавие<input required className="field mt-2" placeholder="Какво запазваме?" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })}/></label><label className="text-xs text-[#67695d]">Тип<select className="field mt-2" value={draft.content_type} onChange={e => setDraft({ ...draft, content_type: e.target.value as KnowledgeContentType })}>{contentTypes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label></div>
        <textarea className="field min-h-20 resize-y" placeholder="Кратко описание или твоя бележка..." value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })}/>
        <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]"><input required className="field" placeholder="Категория" value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })}/><select className="field" value={draft.priority} onChange={e => setDraft({ ...draft, priority: e.target.value as KnowledgeItem["priority"] })}><option>Нисък</option><option>Среден</option><option>Висок</option></select><button disabled={busy} className="btn-primary"><Plus size={14}/>{busy ? "Добавяне..." : "Добави"}</button></div>
        {captureDuplicates.length > 0 && <DuplicateNotice items={captureDuplicates}/>} 
      </form>
    </section>}

    {notice && <div className="rounded-xl border border-[#d7d6ca] bg-[#f5f4ea] px-4 py-3 text-sm text-[#52621c]">{notice}</div>}

    <section><div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9b8d]"/><input className="field pl-9" placeholder="Търсене във входящи..." value={query} onChange={e => setQuery(e.target.value)}/></div>{selected.length > 0 && <div className="flex gap-2"><button disabled={busy} onClick={() => sendToReview(selected)} className="btn-primary"><CheckSquare size={14}/>Към преглед ({selected.length})</button><button aria-label="Изтрий избраните" onClick={() => remove(selected)} className="btn-secondary text-[#ba1a1a]"><Trash2 size={14}/></button></div>}</div>
      <div className="space-y-2">{shown.map(item => <article key={item.id} className="panel flex flex-col gap-4 p-4 sm:flex-row sm:items-start"><div className="flex min-w-0 flex-1 items-start gap-4"><input aria-label={`Избери ${item.title}`} type="checkbox" className="mt-1 h-4 w-4 accent-[#52621c]" checked={selected.includes(item.id)} onChange={e => setSelected(current => e.target.checked ? [...current, item.id] : current.filter(id => id !== item.id))}/><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#e9edda] text-[#52621c]">{item.source_url ? <Link2 size={15}/> : item.content_type === "idea" ? <Lightbulb size={15}/> : <FileText size={15}/>}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">{item.title}</h2><span className="rounded-full bg-[#f5f4ea] px-2 py-1 text-[10px] text-[#767869]">{item.category}</span><span className="rounded-full bg-[#f1edf4] px-2 py-1 text-[10px] text-[#67558d]">{contentTypes.find(type => type.value === item.content_type)?.label || "Ресурс"}</span></div><p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#767869]">{item.description || "Без допълнително описание"}</p>{item.source_url && <p className="mt-1 truncate text-[10px] text-[#9a9b8d]">{safeHost(item.source_url)}</p>}</div></div>{canEdit && <button onClick={() => startProcess(item)} className="btn-secondary shrink-0 self-end sm:self-center"><Sparkles size={14}/>Обработи</button>}</article>)}{!shown.length && <div className="panel py-16 text-center"><Inbox className="mx-auto text-[#9a9b8d]"/><h2 className="mt-3 text-base font-semibold">Входящите са празни</h2><p className="mt-1 text-sm text-[#767869]">Добавете линк или бележка, за да започнете.</p></div>}</div>
    </section>

    <Modal open={Boolean(processing) && canEdit} onClose={() => setProcessing(null)} title="Обработване на запис" subtitle="Прегледай, допълни и избери правилното място." size="xl">
      {processing && <form onSubmit={completeProcess} className="space-y-5">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <section className="rounded-2xl border border-line bg-[#f7f6ec] p-4 sm:p-5"><div className="mb-4 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#e9edda] text-[#52621c]">{processing.source_url ? <Link2 size={16}/> : <FileText size={16}/>}</span><div><p className="text-xs font-semibold text-[#34362d]">Съдържание</p><p className="text-[10px] text-[#85877a]">Можеш да редактираш преди запазване.</p></div></div><label className="text-xs text-[#67695d]">Заглавие<input required className="field mt-2" value={processing.title} onChange={e => setProcessing({ ...processing, title: e.target.value })}/></label><label className="mt-4 block text-xs text-[#67695d]">Описание<textarea rows={6} className="field mt-2 resize-y" value={processing.description} onChange={e => setProcessing({ ...processing, description: e.target.value })}/></label>{processing.source_url && <a href={processing.source_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#65763e]">Отвори източника <ExternalLink size={12}/></a>}</section>
          <section className="rounded-2xl border border-line bg-white p-4 sm:p-5"><div className="mb-4"><p className="text-xs font-semibold text-[#34362d]">Подреждане</p><p className="mt-1 text-[10px] text-[#85877a]">Избери цел и точните данни за нея.</p></div><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#85877a]">Къде да отиде?</p><div className="grid grid-cols-2 gap-2">{([{ id: "library", label: "AI Библиотека", icon: BookOpen }, { id: "tool", label: "AI инструмент", icon: Wrench }, { id: "news", label: "Новина", icon: Newspaper }, { id: "experiment", label: "Експеримент", icon: Beaker }] as const).map(option => { const Icon = option.icon; return <button type="button" key={option.id} onClick={() => chooseTarget(option.id)} className={`flex min-h-12 items-center gap-2 rounded-xl border p-3 text-left text-[11px] font-semibold transition ${target === option.id ? "border-[#75843b] bg-[#f0f4df] text-[#52621c]" : "border-[#e4e3d9] bg-white text-[#67685e] hover:border-[#c6c8b6]"}`}><Icon size={15}/>{option.label}</button>; })}</div><div className="mt-5 space-y-4">{(target === "tool" || target === "news") && !processing.source_url && <p className="rounded-xl border border-[#f0c9a8] bg-[#fff6ec] p-3 text-xs text-[#8a4d20]">За инструмент или новина е необходим уеб адрес.</p>}{target !== "experiment" && <CategoryPicker options={targetCategories} value={processOptions.category} onChange={category => setProcessOptions({ ...processOptions, category })}/>} {target === "experiment" && <div className="rounded-xl border border-[#dce1c8] bg-[#f5f7eb] p-3 text-xs leading-relaxed text-[#657044]">Експериментът ще бъде създаден в етап „Идея“. Категория не е необходима.</div>}{target === "library" && <label className="block text-xs text-[#767869]">Тип съдържание<select className="field mt-2" value={processOptions.contentType} onChange={e => setProcessOptions({ ...processOptions, contentType: e.target.value as KnowledgeContentType })}>{contentTypes.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>}</div></section>
        </div>
        {processingDuplicates.length > 0 && <DuplicateNotice items={processingDuplicates} action={useExisting}/>} 
        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-[10px] text-[#85877a]">Оригиналният входящ запис ще бъде отбелязан като обработен.</p><div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setProcessing(null)}>Отказ</button><button disabled={busy || ((target === "tool" || target === "news") && !processing.source_url)} className="btn-primary">{busy ? "Обработване..." : "Създай и подреди"}<ArrowRight size={14}/></button></div></div>
      </form>}
    </Modal>
  </div>;
}

function DuplicateNotice({ items, action }: { items: DuplicateCandidate[]; action?: (item: DuplicateCandidate) => void }) {
  return <div className="rounded-xl border border-[#dfc690] bg-[#fff8e8] p-3"><div className="flex items-center gap-2 text-xs font-semibold text-[#735d29]"><AlertTriangle size={14}/>Възможно съществуващо съдържание</div><div className="mt-2 space-y-2">{items.slice(0, 3).map(item => <div key={`${item.entityType}-${item.id}`} className="flex items-center gap-2 rounded-lg bg-white/70 p-2"><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-[#51482f]">{item.title}</span><span className="text-[9px] text-[#8a7848]">{entityLabel(item.entityType)} · {item.reason}</span></span><Link href={item.href} target={item.entityType === "news" ? "_blank" : undefined} className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-[#6d783e] hover:bg-white">Отвори</Link>{action && <button type="button" onClick={() => action(item)} className="rounded-lg bg-[#e9edda] px-2 py-1.5 text-[10px] font-semibold text-[#52621c]">Използвай този</button>}</div>)}</div></div>;
}

function entityLabel(type: EntityType) { return ({ knowledge: "Библиотека", tool: "Инструмент", news: "Новина", experiment: "Експеримент" } as const)[type]; }
function safeHost(value: string) { try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return value; } }

function categoriesForTarget(target: InboxTarget, knowledge: KnowledgeItem[], tools: AITool[], news: AINews[], managed: ContentCategory[]) {
  const values = target === "tool"
    ? [...managed.filter(item => item.applies_to.includes("tool")).map(item => item.name), ...tools.map(item => item.category), "Други"]
    : target === "news"
      ? [...news.map(item => item.category), "AI индустрия", "Модели", "Регулации", "Проучвания", "Продукти"]
      : target === "library"
        ? [...knowledge.filter(item => item.status !== "Входящи").map(item => item.category), "Източници", "Идеи", "Съвети и трикове", "За тестване", "Обучения"]
        : [];
  return Array.from(new Set(values.map(value => value?.trim()).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, "bg-BG"));
}

function CategoryPicker({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  const isKnown = options.includes(value);
  return <div className="space-y-2"><label className="block text-xs text-[#767869]">Категория<select className="field mt-2" value={isKnown ? value : "__custom"} onChange={event => onChange(event.target.value === "__custom" ? "" : event.target.value)}>{options.map(option => <option key={option}>{option}</option>)}<option value="__custom">+ Нова категория</option></select></label>{!isKnown && <input autoFocus required className="field" placeholder="Име на новата категория" value={value} onChange={event => onChange(event.target.value)}/>}</div>;
}
