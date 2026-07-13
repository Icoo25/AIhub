"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive, CalendarDays, Columns3, Download, ExternalLink, FileText,
  FolderPlus, Grid2X2, History, Link2, List, LockKeyhole, MoreHorizontal, Paperclip,
  BookmarkPlus, CheckSquare, Network, Plus, Search, Settings2, Star, Trash2, Users, X,
} from "lucide-react";
import {
  deleteEntityLink, deleteKnowledgeAttachment, deleteKnowledgeCollection, deleteSavedView, getEntityLinks,
  getExperiments, getKnowledgeAttachments, getKnowledgeCollections, getKnowledgeHistory,
  getKnowledgeItems, getKnowledgeStages, getNews, getSavedViews, getTools, openKnowledgeAttachment,
  saveEntityLink, saveKnowledgeCollection, saveKnowledgeItem, saveKnowledgeStage, saveSavedView, uploadKnowledgeAttachment,
} from "@/lib/data";
import type {
  AINews, AITool, EntityLink, EntityRelation, EntityType, Experiment, KnowledgeAttachment,
  KnowledgeCollection, KnowledgeContentType, KnowledgeHistory as HistoryEntry, KnowledgeItem, KnowledgeStage, SavedView,
} from "@/lib/types";
import { useAuthProfile } from "@/lib/auth-context";
import { canContributeKnowledge, canEditContent } from "@/lib/permissions";
import { Drawer, EmptyState, Modal, useConfirmAction } from "./ui";

const fallbackStages: KnowledgeStage[] = [
  { id: "new", name: "Ново", color: "#67558d", position: 10, created_at: "" },
  { id: "review", name: "За преглед", color: "#a16b24", position: 20, created_at: "" },
  { id: "testing", name: "За тестване", color: "#2563a6", position: 30, created_at: "" },
  { id: "useful", name: "Полезно", color: "#52621c", position: 40, created_at: "" },
  { id: "archive", name: "Архив", color: "#767869", position: 50, created_at: "" },
];

const categorySuggestions = ["Източници", "Инструменти", "Съвети и трикове", "За тестване", "Идеи", "Полезни prompts", "Обучения"];
const contentTypeOptions: Array<{ value: KnowledgeContentType; label: string }> = [
  { value: "source", label: "Източник" }, { value: "tool", label: "Инструмент" },
  { value: "tip", label: "Съвет или трик" }, { value: "prompt", label: "Prompt" },
  { value: "idea", label: "Идея" }, { value: "course", label: "Обучение" },
  { value: "video", label: "Видео" }, { value: "note", label: "Бележка" },
  { value: "news", label: "Новина" }, { value: "experiment", label: "Експеримент" },
  { value: "resource", label: "Друг ресурс" },
];
const relationLabels: Record<EntityRelation, string> = { related: "Свързано с", uses: "Използва", result_of: "Резултат от", inspired_by: "Вдъхновено от", supports: "Подкрепя", compares: "Сравнява" };
const emptyItem: Partial<KnowledgeItem> = {
  title: "", description: "", category: "Източници", source_url: "", status: "Ново",
  priority: "Среден", rating: 0, tags: [], notes: "", visibility: "shared", collection_id: null, content_type: "source",
};

export function LibraryView() {
  const confirmAction = useConfirmAction();
  const auth = useAuthProfile();
  const canEdit = canContributeKnowledge(auth.role);
  const canConfigure = canEditContent(auth.role);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [collections, setCollections] = useState<KnowledgeCollection[]>([]);
  const [stages, setStages] = useState<KnowledgeStage[]>(fallbackStages);
  const [tools, setTools] = useState<AITool[]>([]);
  const [news, setNews] = useState<AINews[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [attachments, setAttachments] = useState<KnowledgeAttachment[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [links, setLinks] = useState<EntityLink[]>([]);
  const [editing, setEditing] = useState<Partial<KnowledgeItem>>(emptyItem);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Всички");
  const [collection, setCollection] = useState("all");
  const [visibility, setVisibility] = useState("all");
  const [contentType, setContentType] = useState("all");
  const [view, setView] = useState<"board" | "grid" | "list">("board");
  const [showArchived, setShowArchived] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [notice, setNotice] = useState("");
  const [newCollection, setNewCollection] = useState({ name: "", description: "", color: "#52621c" });
  const [newStage, setNewStage] = useState({ name: "", color: "#67558d" });
  const [newLink, setNewLink] = useState<{ target: string; relation: EntityRelation }>({ target: "", relation: "related" });
  const [selected, setSelected] = useState<string[]>([]);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [undoArchive, setUndoArchive] = useState<KnowledgeItem[]>([]);

  const refresh = async () => {
    const [nextItems, nextCollections, nextStages, nextTools, nextNews, nextExperiments, nextSavedViews] = await Promise.all([
      getKnowledgeItems(), getKnowledgeCollections(), getKnowledgeStages(), getTools(), getNews(), getExperiments(), getSavedViews(),
    ]);
    setItems(nextItems);
    setCollections(nextCollections);
    if (nextStages.length) setStages(nextStages);
    setTools(nextTools); setNews(nextNews); setExperiments(nextExperiments);
    setSavedViews(nextSavedViews);
  };

  useEffect(() => { refresh().catch(() => setNotice("Библиотеката не успя да зареди данните от Supabase.")).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    if (canEdit && new URLSearchParams(window.location.search).get("new") === "1") openNew();
  }, [canEdit]);

  const categories = useMemo(() => ["Всички", ...Array.from(new Set(items.map(item => item.category).filter(Boolean)))], [items]);
  const shown = useMemo(() => items.filter(item => {
    const text = `${item.title} ${item.description} ${item.tags.join(" ")} ${item.notes}`.toLowerCase();
    return item.status !== "Входящи"
      && (showArchived ? Boolean(item.archived_at) : !item.archived_at)
      && (category === "Всички" || item.category === category)
      && (collection === "all" || (collection === "none" ? !item.collection_id : item.collection_id === collection))
      && (visibility === "all" || item.visibility === visibility)
      && (contentType === "all" || item.content_type === contentType)
      && text.includes(query.toLowerCase());
  }), [items, category, collection, visibility, contentType, query, showArchived]);

  function openNew() {
    setEditing({ ...emptyItem, status: stages[0]?.name || "Ново" });
    setAttachments([]); setHistory([]); setLinks([]); setFiles([]); setNotice(""); setEditorOpen(true);
  }

  async function openEdit(item: KnowledgeItem) {
    if (!canEdit) return;
    setEditing(item); setFiles([]); setNotice(""); setEditorOpen(true);
    const [nextAttachments, nextHistory, nextLinks] = await Promise.all([getKnowledgeAttachments(item.id), getKnowledgeHistory(item.id), getEntityLinks("knowledge", item.id)]);
    setAttachments(nextAttachments); setHistory(nextHistory); setLinks(nextLinks);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!canEdit) return;
    setBusy(true); setNotice("");
    try {
      const saved = await saveKnowledgeItem(editing.id ? editing : { ...editing, id: undefined });
      if (!saved) throw new Error("Липсва запис");
      for (const file of files) await uploadKnowledgeAttachment(saved.id, file);
      await refresh();
      setEditorOpen(false); setFiles([]);
    } catch {
      setNotice("Промяната не е запазена. Изпълнете library-enhancements.sql и опитайте отново.");
    } finally { setBusy(false); }
  }

  async function move(id: string, status: string) {
    if (!canEdit) return;
    const item = items.find(entry => entry.id === id);
    if (!item || item.status === status) return;
    const next = { ...item, status };
    setItems(current => current.map(entry => entry.id === id ? next : entry));
    try { await saveKnowledgeItem(next); } catch { await refresh(); setNotice("Етапът не беше променен."); }
  }

  async function toggleArchive(item: Partial<KnowledgeItem>) {
    if (!item.id) return;
    try {
      await saveKnowledgeItem({ ...item, archived_at: item.archived_at ? null : new Date().toISOString() });
      await refresh(); setEditorOpen(false);
    } catch { setNotice("Архивирането не беше успешно."); }
  }

  async function addCollection(e: React.FormEvent) {
    e.preventDefault();
    try {
      const saved = await saveKnowledgeCollection(newCollection);
      setCollections(current => [...current, saved].sort((a, b) => a.name.localeCompare(b.name, "bg")));
      setNewCollection({ name: "", description: "", color: "#52621c" });
    } catch { setNotice("Колекцията не беше създадена."); }
  }

  async function removeCollection(id: string) {
    const target = collections.find(item => item.id === id);
    if (!(await confirmAction({ title: "Изтриване на колекция", description: `Колекцията „${target?.name || "Без име"}“ ще бъде изтрита. Картите ще останат запазени без колекция.`, confirmLabel: "Изтрий колекцията" }))) return;
    try { await deleteKnowledgeCollection(id); setCollections(current => current.filter(item => item.id !== id)); }
    catch { setNotice("Колекцията не беше изтрита."); }
  }

  async function addStage(e: React.FormEvent) {
    e.preventDefault();
    try {
      const saved = await saveKnowledgeStage({ ...newStage, position: (Math.max(0, ...stages.map(stage => stage.position)) + 10) });
      setStages(current => [...current, saved].sort((a, b) => a.position - b.position));
      setNewStage({ name: "", color: "#67558d" });
    } catch { setNotice("Етапът не беше създаден или вече съществува."); }
  }

  async function removeAttachment(item: KnowledgeAttachment) {
    if (!(await confirmAction({ title: "Изтриване на файл", description: `Файлът „${item.file_name}“ ще бъде премахнат окончателно от Storage.`, confirmLabel: "Изтрий файла" }))) return;
    try { await deleteKnowledgeAttachment(item); setAttachments(current => current.filter(file => file.id !== item.id)); }
    catch { setNotice("Файлът не беше изтрит."); }
  }

  async function saveCurrentView() {
    const name = category !== "Всички" ? category : collection !== "all" ? collections.find(item => item.id === collection)?.name || "Колекция" : `Изглед ${savedViews.length + 1}`;
    try { const saved = await saveSavedView(name, { category, collection, visibility, contentType, view, showArchived }); setSavedViews(current => [...current, saved]); setNotice("Изгледът е запазен в профила ви."); }
    catch { setNotice("Изгледът не беше запазен."); }
  }

  function applyView(item: SavedView) { setCategory(item.filters.category || "Всички"); setCollection(item.filters.collection || "all"); setVisibility(item.filters.visibility || "all"); setContentType(item.filters.contentType || "all"); setView(item.filters.view || "board"); setShowArchived(Boolean(item.filters.showArchived)); }
  async function removeView(id: string) { try { await deleteSavedView(id); setSavedViews(current => current.filter(item => item.id !== id)); } catch { setNotice("Изгледът не беше премахнат."); } }

  async function bulkMove(status: string) {
    if (!status) return;
    setBusy(true); try { await Promise.all(selected.map(id => { const item = items.find(entry => entry.id === id); return item ? saveKnowledgeItem({...item,status}) : Promise.resolve(); })); await refresh(); setSelected([]); setNotice("Избраните карти са преместени."); } catch { setNotice("Масовата промяна не беше записана."); } finally { setBusy(false); }
  }

  async function bulkArchive() {
    const targets = items.filter(item => selected.includes(item.id));
    setBusy(true); try { await Promise.all(targets.map(item => saveKnowledgeItem({...item,archived_at:new Date().toISOString()}))); setUndoArchive(targets); await refresh(); setSelected([]); setNotice("Избраните карти са архивирани."); } catch { setNotice("Картите не бяха архивирани."); } finally { setBusy(false); }
  }

  async function restoreLastArchive() {
    setBusy(true); try { await Promise.all(undoArchive.map(item => saveKnowledgeItem({...item,archived_at:null}))); setUndoArchive([]); await refresh(); setNotice("Архивирането е отменено."); } catch { setNotice("Картите не бяха възстановени."); } finally { setBusy(false); }
  }

  const entityOptions = useMemo(() => [
    ...items.filter(item => item.id !== editing.id && item.status !== "Входящи").map(item => ({ type: "knowledge" as EntityType, id: item.id, label: item.title, group: "Библиотека" })),
    ...tools.map(item => ({ type: "tool" as EntityType, id: item.id, label: item.name, group: "AI инструменти" })),
    ...news.map(item => ({ type: "news" as EntityType, id: item.id, label: item.title, group: "AI новини" })),
    ...experiments.map(item => ({ type: "experiment" as EntityType, id: item.id, label: item.name, group: "Експерименти" })),
  ], [items, tools, news, experiments, editing.id]);

  function linkedEntity(link: EntityLink) {
    const currentIsSource = link.source_type === "knowledge" && link.source_id === editing.id;
    const type = currentIsSource ? link.target_type : link.source_type;
    const id = currentIsSource ? link.target_id : link.source_id;
    const option = entityOptions.find(item => item.type === type && item.id === id);
    return { type, id, label: option?.label || "Недостъпен запис", group: option?.group || type };
  }

  async function addLink() {
    if (!editing.id || !newLink.target) return;
    const [targetType, targetId] = newLink.target.split(":") as [EntityType, string];
    setBusy(true);
    try {
      await saveEntityLink("knowledge", editing.id, targetType, targetId, newLink.relation);
      setLinks(await getEntityLinks("knowledge", editing.id));
      setNewLink({ target: "", relation: "related" });
    } catch { setNotice("Връзката вече съществува или не може да бъде създадена."); }
    finally { setBusy(false); }
  }

  async function removeLink(link: EntityLink) {
    try { await deleteEntityLink(link.id); setLinks(current => current.filter(item => item.id !== link.id)); }
    catch { setNotice("Връзката не беше премахната."); }
  }

  return <div>
    <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div><p className="mb-1 text-[9px] font-semibold uppercase tracking-[.14em] text-[#767869]">Център за знания</p><h1 className="text-3xl font-semibold tracking-[-.035em] text-[#1b1c16]">AI Библиотека</h1><p className="mt-1.5 max-w-2xl text-[11px] leading-relaxed text-[#767869]">Организирайте източници, идеи, инструменти и материали в колекции с гъвкав работен процес.</p></div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-[#d7d6ca] bg-white p-1"><button onClick={() => setView("board")} className={`rounded-md px-3 py-2 text-[10px] ${view === "board" ? "bg-[#efeee4]" : "text-[#767869]"}`}><Columns3 size={13} className="mr-1 inline"/>Канбан</button><button onClick={() => setView("grid")} className={`rounded-md px-3 py-2 text-[10px] ${view === "grid" ? "bg-[#efeee4]" : "text-[#767869]"}`}><Grid2X2 size={13} className="mr-1 inline"/>Карти</button><button onClick={() => setView("list")} className={`rounded-md px-3 py-2 text-[10px] ${view === "list" ? "bg-[#efeee4]" : "text-[#767869]"}`}><List size={13} className="mr-1 inline"/>Списък</button></div>
        <button className="btn-secondary" onClick={saveCurrentView}><BookmarkPlus size={14}/> Запази изглед</button>
        {canConfigure && <button className="btn-secondary" onClick={() => setSettingsOpen(true)}><Settings2 size={14}/> Настрой</button>}
        {canEdit && <button className="btn-primary" onClick={openNew}><Plus size={14}/> Нова карта</button>}
      </div>
    </div>

    {notice && <div className="mb-4 rounded-xl border border-[#f0c9a8] bg-[#fff6ec] px-4 py-3 text-[10px] text-[#8a4d20]">{notice}</div>}
    {!!undoArchive.length && <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#c6c8b6] bg-[#f4f8e7] px-4 py-3 text-sm text-[#52621c]"><span>Архивирани карти: {undoArchive.length}</span><button disabled={busy} onClick={restoreLastArchive} className="font-semibold underline">Отмени</button></div>}

    {!!savedViews.length && <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1"><span className="whitespace-nowrap text-xs font-semibold text-[#767869]">Моите изгледи:</span>{savedViews.map(item => <span key={item.id} className="flex shrink-0 items-center rounded-full bg-[#e9edda] text-[#52621c]"><button onClick={() => applyView(item)} className="px-3 py-2 text-xs font-medium">{item.name}</button><button title="Премахни изгледа" onClick={() => removeView(item.id)} className="pr-2 text-[#767869]"><X size={12}/></button></span>)}</div>}

    <div className="panel mb-5 space-y-3 p-3">
      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9b8d]" size={14}/><input className="field pl-9" value={query} onChange={e => setQuery(e.target.value)} placeholder="Търсене по заглавие, описание, тагове и бележки..."/></div>
        <select className="field lg:w-48" value={collection} onChange={e => setCollection(e.target.value)}><option value="all">Всички колекции</option><option value="none">Без колекция</option>{collections.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select className="field lg:w-44" value={visibility} onChange={e => setVisibility(e.target.value)}><option value="all">Всички записи</option><option value="shared">Споделени</option><option value="personal">Лични</option></select>
        <select className="field lg:w-44" value={contentType} onChange={e => setContentType(e.target.value)}><option value="all">Всички типове</option>{contentTypeOptions.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <button onClick={() => setShowArchived(value => !value)} className={`btn-secondary ${showArchived ? "border-[#52621c] text-[#52621c]" : ""}`}><Archive size={14}/>{showArchived ? "Към активните" : "Архив"}</button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">{categories.map(item => <button key={item} onClick={() => setCategory(item)} className={`whitespace-nowrap rounded-full px-3 py-2 text-[9px] font-medium ${category === item ? "bg-[#52621c] text-white" : "bg-[#efeee4] text-[#46483b]"}`}>{item}</button>)}</div>
    </div>

    {selected.length > 0 && <div className="sticky top-16 z-10 mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-[#c6c8b6] bg-white p-3 shadow-lg"><CheckSquare size={16} className="text-[#52621c]"/><strong className="mr-auto text-sm">Избрани: {selected.length}</strong><select defaultValue="" onChange={event => { bulkMove(event.target.value); event.target.value = ""; }} className="field w-auto"><option value="" disabled>Премести в етап...</option>{stages.map(stage => <option key={stage.id}>{stage.name}</option>)}</select><button disabled={busy} onClick={bulkArchive} className="btn-secondary"><Archive size={14}/>Архивирай</button><button onClick={() => setSelected([])} className="rounded-lg p-2 text-[#767869]"><X size={16}/></button></div>}

    {loading ? <div className="panel h-72 animate-pulse"/> : !shown.length ? <div className="panel"><EmptyState title="Няма записи" text="Променете филтрите или добавете нова карта в библиотеката."/></div> : view === "board" ?
      <div className="flex gap-4 overflow-x-auto pb-5">{stages.map(stage => <section key={stage.id} className="w-[290px] shrink-0" onDragOver={e => { if (canEdit) e.preventDefault(); }} onDrop={e => move(e.dataTransfer.getData("text/plain"), stage.name)}><div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 text-[12px] font-semibold"><span className="h-2 w-2 rounded-full" style={{backgroundColor: stage.color}}/>{stage.name}<span className="rounded-full bg-[#efeee4] px-2 py-0.5 text-[8px] text-[#767869]">{shown.filter(item => item.status === stage.name).length}</span></h2><MoreHorizontal size={14} className="text-[#9a9b8d]"/></div><div className="min-h-32 space-y-3">{shown.filter(item => item.status === stage.name).map(item => <KnowledgeCard key={item.id} item={item} collection={collections.find(entry => entry.id === item.collection_id)} canEdit={canEdit} selected={selected.includes(item.id)} onSelect={() => setSelected(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current,item.id])} onEdit={() => openEdit(item)}/>)}</div></section>)}</div>
      : view === "grid" ? <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{shown.map(item => <KnowledgeCard key={item.id} item={item} collection={collections.find(entry => entry.id === item.collection_id)} canEdit={canEdit} selected={selected.includes(item.id)} onSelect={() => setSelected(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current,item.id])} onEdit={() => openEdit(item)}/>)}</div>
      : <div className="panel overflow-hidden"><div className="hidden grid-cols-[32px_1.5fr_.65fr_.7fr_.6fr_90px] gap-3 border-b border-[#e4e3d9] px-4 py-3 text-[9px] font-semibold uppercase tracking-wider text-[#767869] md:grid"><span/><span>Запис</span><span>Тип</span><span>Етап</span><span>Приоритет</span><span>Оценка</span></div>{shown.map(item => <KnowledgeListRow key={item.id} item={item} canEdit={canEdit} selected={selected.includes(item.id)} onSelect={() => setSelected(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current,item.id])} onEdit={() => openEdit(item)}/>)}</div>}

    <Drawer open={editorOpen && canEdit} onClose={() => setEditorOpen(false)} title={editing.id ? "Редактиране на карта" : "Нова карта"} subtitle="Всички полета могат да се променят по-късно.">
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-xs text-[#767869]">Заглавие<input required className="field mt-2" value={editing.title || ""} onChange={e => setEditing({...editing, title:e.target.value})}/></label>
        <label className="block text-xs text-[#767869]">Описание<textarea required rows={3} className="field mt-2 resize-none" value={editing.description || ""} onChange={e => setEditing({...editing, description:e.target.value})}/></label>
        <div className="grid gap-4 sm:grid-cols-3"><label className="text-xs text-[#767869]">Категория<input required list="library-category-options" className="field mt-2" value={editing.category || ""} onChange={e => setEditing({...editing, category:e.target.value})}/><datalist id="library-category-options">{categorySuggestions.map(item => <option key={item} value={item}/>)}</datalist></label><label className="text-xs text-[#767869]">Тип съдържание<select className="field mt-2" value={editing.content_type || "resource"} onChange={e => setEditing({...editing, content_type:e.target.value as KnowledgeContentType})}>{contentTypeOptions.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label className="text-xs text-[#767869]">Колекция<select className="field mt-2" value={editing.collection_id || ""} onChange={e => setEditing({...editing, collection_id:e.target.value || null})}><option value="">Без колекция</option>{collections.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div>
        <div className="grid gap-4 sm:grid-cols-3"><label className="text-xs text-[#767869]">Етап<select className="field mt-2" value={editing.status} onChange={e => setEditing({...editing, status:e.target.value})}>{stages.map(item => <option key={item.id}>{item.name}</option>)}</select></label><label className="text-xs text-[#767869]">Приоритет<select className="field mt-2" value={editing.priority} onChange={e => setEditing({...editing, priority:e.target.value as KnowledgeItem["priority"]})}><option>Нисък</option><option>Среден</option><option>Висок</option></select></label><label className="text-xs text-[#767869]">Видимост<select className="field mt-2" value={editing.visibility || "shared"} onChange={e => setEditing({...editing, visibility:e.target.value as KnowledgeItem["visibility"]})}><option value="shared">Споделена</option><option value="personal">Лична</option></select></label></div>
        <label className="block text-xs text-[#767869]">Линк към източник<input type="url" className="field mt-2" value={editing.source_url || ""} onChange={e => setEditing({...editing, source_url:e.target.value})}/></label>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#767869]">Тагове<input className="field mt-2" value={editing.tags?.join(", ") || ""} onChange={e => setEditing({...editing, tags:e.target.value.split(",").map(tag => tag.trim()).filter(Boolean)})}/></label><label className="text-xs text-[#767869]">Оценка<input className="field mt-2" type="number" min="0" max="5" step="0.1" value={editing.rating ?? 0} onChange={e => setEditing({...editing, rating:Number(e.target.value)})}/></label></div>
        <label className="block text-xs text-[#767869]">Бележки<textarea rows={3} className="field mt-2 resize-none" value={editing.notes || ""} onChange={e => setEditing({...editing, notes:e.target.value})}/></label>
        <label className="block rounded-xl border border-dashed border-[#d7d6ca] p-4 text-xs text-[#767869]"><Paperclip size={14} className="mr-2 inline"/>Прикачи файлове (до 20 MB)<input type="file" multiple className="mt-3 block w-full text-[10px]" onChange={e => setFiles(Array.from(e.target.files || []))}/></label>
        {!!attachments.length && <div className="space-y-2"><p className="text-[9px] font-semibold uppercase tracking-wider text-[#767869]">Прикачени файлове</p>{attachments.map(file => <div key={file.id} className="flex items-center gap-2 rounded-lg bg-[#f5f4ea] p-3 text-[10px]"><FileText size={13}/><span className="min-w-0 flex-1 truncate">{file.file_name}</span><button type="button" onClick={() => openKnowledgeAttachment(file)} title="Отвори"><Download size={13}/></button><button type="button" onClick={() => removeAttachment(file)} title="Изтрий" className="text-[#ba1a1a]"><Trash2 size={13}/></button></div>)}</div>}
        {!!history.length && <details className="rounded-xl bg-[#f5f4ea] p-4"><summary className="cursor-pointer text-[10px] font-semibold"><History size={13} className="mr-2 inline"/>История на промените ({history.length})</summary><div className="mt-3 space-y-2">{history.map(entry => <div key={entry.id} className="flex justify-between text-[9px] text-[#767869]"><span>{historyLabel(entry.action)}</span><span>{new Date(entry.created_at).toLocaleString("bg-BG")}</span></div>)}</div></details>}
        {editing.id && <section className="rounded-xl border border-[#e4e3d9] p-4"><div className="mb-3 flex items-center gap-2"><Network size={15} className="text-[#52621c]"/><div><h3 className="text-xs font-semibold">Свързани записи</h3><p className="text-[10px] text-[#767869]">Свържете картата с инструмент, новина, експеримент или друг ресурс.</p></div></div><div className="grid gap-2 sm:grid-cols-[150px_1fr_auto]"><select className="field" value={newLink.relation} onChange={e => setNewLink({...newLink, relation:e.target.value as EntityRelation})}>{(Object.entries(relationLabels) as Array<[EntityRelation,string]>).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><select className="field" value={newLink.target} onChange={e => setNewLink({...newLink,target:e.target.value})}><option value="">Изберете запис...</option>{["Библиотека","AI инструменти","AI новини","Експерименти"].map(group => <optgroup key={group} label={group}>{entityOptions.filter(item => item.group === group).map(item => <option key={`${item.type}:${item.id}`} value={`${item.type}:${item.id}`}>{item.label}</option>)}</optgroup>)}</select><button disabled={busy || !newLink.target} type="button" onClick={addLink} className="btn-secondary"><Link2 size={14}/>Свържи</button></div>{links.length > 0 ? <div className="mt-3 space-y-2">{links.map(link => { const entity = linkedEntity(link); return <div key={link.id} className="flex items-center gap-2 rounded-lg bg-[#f5f4ea] p-3"><span className="rounded bg-white px-2 py-1 text-[9px] font-semibold text-[#67558d]">{relationLabels[link.relation]}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{entity.label}</p><p className="text-[9px] text-[#767869]">{entity.group}</p></div><button type="button" aria-label="Премахни връзката" onClick={() => removeLink(link)} className="rounded p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6]"><X size={13}/></button></div>; })}</div> : <p className="mt-3 text-[10px] text-[#9a9b8d]">Все още няма свързани записи.</p>}</section>}
        <div className="flex flex-wrap justify-between gap-2 pt-2">{editing.id ? <button type="button" className="btn-secondary" onClick={() => toggleArchive(editing)}><Archive size={13}/>{editing.archived_at ? "Възстанови" : "Архивирай"}</button> : <span/>}<div className="ml-auto flex gap-2"><button type="button" className="btn-secondary" onClick={() => setEditorOpen(false)}>Отказ</button><button disabled={busy} className="btn-primary">{busy ? "Запазване..." : "Запази"}</button></div></div>
      </form>
    </Drawer>

    <Modal open={settingsOpen && canConfigure} onClose={() => setSettingsOpen(false)} title="Настройки на библиотеката" subtitle="Създавайте колекции и собствени етапи на работа.">
      <div className="space-y-6">
        <section><h3 className="mb-3 text-sm font-semibold">Колекции</h3><form onSubmit={addCollection} className="grid gap-2 sm:grid-cols-[1fr_1fr_44px_auto]"><input required className="field" placeholder="Име" value={newCollection.name} onChange={e => setNewCollection({...newCollection,name:e.target.value})}/><input className="field" placeholder="Описание" value={newCollection.description} onChange={e => setNewCollection({...newCollection,description:e.target.value})}/><input type="color" className="h-10 w-11 rounded-lg" value={newCollection.color} onChange={e => setNewCollection({...newCollection,color:e.target.value})}/><button className="btn-primary"><FolderPlus size={14}/> Добави</button></form><div className="mt-3 space-y-2">{collections.map(item => <div key={item.id} className="flex items-center gap-2 rounded-lg bg-[#f5f4ea] p-3"><span className="h-3 w-3 rounded-full" style={{backgroundColor:item.color}}/><div className="min-w-0 flex-1"><p className="text-xs font-semibold">{item.name}</p><p className="truncate text-[9px] text-[#767869]">{item.description || "Без описание"}</p></div><button onClick={() => removeCollection(item.id)} className="text-[#ba1a1a]" title="Изтрий"><Trash2 size={13}/></button></div>)}</div></section>
        <section className="border-t border-[#e4e3d9] pt-5"><h3 className="mb-3 text-sm font-semibold">Етапи на работа</h3><form onSubmit={addStage} className="grid gap-2 sm:grid-cols-[1fr_44px_auto]"><input required className="field" placeholder="Нов етап" value={newStage.name} onChange={e => setNewStage({...newStage,name:e.target.value})}/><input type="color" className="h-10 w-11 rounded-lg" value={newStage.color} onChange={e => setNewStage({...newStage,color:e.target.value})}/><button className="btn-primary"><Plus size={14}/> Добави</button></form><div className="mt-3 flex flex-wrap gap-2">{stages.map(item => <span key={item.id} className="rounded-full px-3 py-2 text-[9px] text-white" style={{backgroundColor:item.color}}>{item.name}</span>)}</div></section>
      </div>
    </Modal>
  </div>;
}

function KnowledgeCard({ item, collection, canEdit, selected, onSelect, onEdit }: { item: KnowledgeItem; collection?: KnowledgeCollection; canEdit: boolean; selected: boolean; onSelect: () => void; onEdit: () => void }) {
  return <article draggable={canEdit} onDragStart={e => e.dataTransfer.setData("text/plain", item.id)} onClick={onEdit} className={`rounded-xl border bg-white p-4 shadow-[0_3px_12px_rgba(55,56,42,.035)] transition hover:-translate-y-0.5 ${selected ? "border-[#52621c] ring-2 ring-[#52621c]/10" : "border-[#e4e3d9] hover:border-[#c6c8b6]"} ${canEdit ? "cursor-grab active:cursor-grabbing" : ""}`}>
    <div className="flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2">{canEdit && <input aria-label={`Избери ${item.title}`} type="checkbox" checked={selected} onClick={event => event.stopPropagation()} onChange={onSelect} className="h-4 w-4 accent-[#52621c]"/>}<span className="truncate rounded bg-[#efeee4] px-2 py-1 text-[7px] font-bold uppercase text-[#46483b]">{item.category}</span><span className="shrink-0 rounded bg-[#f2ecfa] px-2 py-1 text-[7px] font-semibold text-[#67558d]">{contentTypeLabel(item.content_type)}</span></div><span className={`rounded-full px-2 py-1 text-[7px] font-semibold ${item.priority === "Висок" ? "bg-[#ffdad6] text-[#ba1a1a]" : item.priority === "Нисък" ? "bg-[#e9edda] text-[#52621c]" : "bg-[#fff0c7] text-[#765b20]"}`}>{item.priority}</span></div>
    <h3 className="mt-3 text-[11px] font-semibold leading-relaxed text-[#1b1c16]">{item.title}</h3><p className="mt-1.5 line-clamp-2 text-[9px] leading-relaxed text-[#767869]">{item.description}</p>
    {collection && <p className="mt-3 flex items-center gap-1.5 text-[8px] font-medium" style={{color:collection.color}}><span className="h-2 w-2 rounded-full" style={{backgroundColor:collection.color}}/>{collection.name}</p>}
    <div className="mt-3 flex flex-wrap gap-1">{item.tags.slice(0,3).map(tag => <span key={tag} className="rounded bg-[#f5f4ea] px-1.5 py-1 text-[7px] text-[#767869]">{tag}</span>)}</div>
    <div className="mt-3 flex items-center justify-between border-t border-[#efeee4] pt-3 text-[8px] text-[#9a9b8d]"><span>{item.visibility === "personal" ? <LockKeyhole size={10} className="mr-1 inline"/> : <Users size={10} className="mr-1 inline"/>}{item.visibility === "personal" ? "Лична" : "Споделена"}</span><span><Star size={9} className="mr-1 inline text-[#a16b24]" fill="currentColor"/>{item.rating}</span><span><CalendarDays size={10} className="mr-1 inline"/>{new Date(item.created_at).toLocaleDateString("bg-BG",{day:"2-digit",month:"short"})}</span>{item.source_url && <a href={item.source_url} target="_blank" onClick={e => e.stopPropagation()} className="text-[#52621c]" title="Източник"><ExternalLink size={11}/></a>}</div>
  </article>;
}

function KnowledgeListRow({ item, canEdit, selected, onSelect, onEdit }: { item: KnowledgeItem; canEdit: boolean; selected: boolean; onSelect: () => void; onEdit: () => void }) {
  return <div onClick={onEdit} className={`grid gap-2 border-b border-[#efeee4] px-4 py-3 last:border-0 md:grid-cols-[32px_1.5fr_.65fr_.7fr_.6fr_90px] md:items-center ${canEdit ? "cursor-pointer hover:bg-[#faf9f3]" : ""}`}><span>{canEdit && <input aria-label={`Избери ${item.title}`} type="checkbox" checked={selected} onClick={event => event.stopPropagation()} onChange={onSelect} className="h-4 w-4 accent-[#52621c]"/>}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.title}</p><p className="mt-0.5 truncate text-[10px] text-[#767869]">{item.category} · {item.description}</p></div><span className="w-fit rounded bg-[#f2ecfa] px-2 py-1 text-[9px] font-semibold text-[#67558d]">{contentTypeLabel(item.content_type)}</span><span className="text-xs text-[#67685e]">{item.status}</span><span className="text-xs text-[#67685e]">{item.priority}</span><span className="text-xs font-semibold text-[#52621c]">{item.rating}/5</span></div>;
}

function contentTypeLabel(type?: KnowledgeContentType) { return contentTypeOptions.find(item => item.value === (type || "resource"))?.label || "Ресурс"; }

function historyLabel(action: HistoryEntry["action"]) {
  return { created: "Създадена карта", updated: "Редактирана карта", archived: "Архивирана карта", restored: "Възстановена карта" }[action];
}
