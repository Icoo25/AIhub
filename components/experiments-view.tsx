"use client";

import { useEffect, useMemo, useState } from "react";
import { Beaker, CheckCircle2, Columns3, GitCompareArrows, List, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { PageHeading } from "./page-heading";
import { Badge, EmptyState, Modal, useConfirmAction } from "./ui";
import { deleteExperiment, getExperiments, isDemo, saveExperiment } from "@/lib/data";
import { useAuthProfile } from "@/lib/auth-context";
import { canEditContent } from "@/lib/permissions";
import type { Experiment, ExperimentStatus } from "@/lib/types";

const statuses: Array<{ name: ExperimentStatus; color: string }> = [
  { name: "Идея", color: "#67558d" }, { name: "Планиран", color: "#a16b24" },
  { name: "В процес", color: "#2563a6" }, { name: "Завършен", color: "#52621c" },
  { name: "За внедряване", color: "#39734d" }, { name: "Отхвърлен", color: "#8a5550" },
];

const blank = (): Partial<Experiment> => ({
  name: "", description: "", model_used: "", result: "", status: "Идея", hypothesis: "",
  prompt: "", test_data: "", model_settings: "", evaluation: 0, decision: "",
  comparison_model: "", comparison_prompt: "", comparison_result: "",
});

export function ExperimentsView() {
  const confirmAction = useConfirmAction();
  const { role } = useAuthProfile();
  const canEdit = canEditContent(role);
  const [items, setItems] = useState<Experiment[]>([]);
  const [editing, setEditing] = useState<Partial<Experiment>>(blank());
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Всички");
  const [view, setView] = useState<"board" | "list">("board");

  const load = async () => { setLoading(true); try { setItems(await getExperiments()); setError(""); } catch { setError("Експериментите не успяха да се заредят. Изпълнете workflow-and-links.sql."); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (canEdit && new URLSearchParams(window.location.search).get("new") === "1") openNew(); }, [canEdit]);

  const shown = useMemo(() => items.filter(item => {
    const text = `${item.name} ${item.description} ${item.hypothesis || ""} ${item.model_used} ${item.result} ${item.decision || ""}`.toLowerCase();
    return (statusFilter === "Всички" || (item.status || "Идея") === statusFilter) && text.includes(query.toLowerCase());
  }), [items, query, statusFilter]);

  const active = items.filter(item => item.status === "В процес" || item.status === "Планиран").length;
  const completed = items.filter(item => ["Завършен", "За внедряване", "Отхвърлен"].includes(item.status || "")).length;
  const approved = items.filter(item => item.status === "За внедряване").length;

  function openNew() { setEditing(blank()); setError(""); setModal(true); }
  function openEdit(item: Experiment) { if (!canEdit) return; setEditing(item); setError(""); setModal(true); }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try { await saveExperiment(editing); await load(); setModal(false); setNotice("Експериментът е запазен."); }
    catch { setError("Експериментът не беше запазен. Проверете дали workflow-and-links.sql е изпълнен."); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!editing.id || !(await confirmAction({ title: "Изтриване на експеримент", description: `Експериментът „${editing.name}“ и цялата му документация ще бъдат премахнати окончателно.`, confirmLabel: "Изтрий експеримента" }))) return;
    setBusy(true); try { await deleteExperiment(editing.id); await load(); setModal(false); setNotice("Експериментът е изтрит."); } catch { setError("Експериментът не беше изтрит."); } finally { setBusy(false); }
  }

  async function move(item: Experiment, status: ExperimentStatus) {
    if (!canEdit || item.status === status) return;
    setItems(current => current.map(entry => entry.id === item.id ? { ...entry, status } : entry));
    try { await saveExperiment({ ...item, status }); }
    catch { await load(); setError("Етапът не беше променен."); }
  }

  return <>
    <PageHeading eyebrow="Приложни изследвания" title="Експерименти" description="Проследявайте целия процес — от хипотезата и prompt-а до сравнението, резултата и решението." action={canEdit ? <button className="btn-primary" onClick={openNew}><Plus size={16}/> Нов експеримент</button> : undefined}/>
    {error && <div className="mb-4 rounded-xl border border-[#ffdad6] bg-[#fff4f2] p-3 text-xs text-[#ba1a1a]" role="alert">{error}</div>}
    {notice && <div className="mb-4 rounded-xl border border-[#c6c8b6] bg-[#f4f8e7] p-3 text-xs text-[#52621c]" role="status">{notice}</div>}

    <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Всички" value={items.length} note="документирани теста"/><Stat label="Активни" value={active} note="планирани или в процес" tone="blue"/><Stat label="Приключени" value={completed} note="с финално решение" tone="violet"/><Stat label="За внедряване" value={approved} note="одобрени резултата" tone="green"/></div>

    <div className="panel mb-5 flex flex-col gap-3 p-3 lg:flex-row">
      <div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a9b8d]"/><input className="field pl-9" value={query} onChange={e => setQuery(e.target.value)} placeholder="Търсене по име, модел, хипотеза или резултат..."/></div>
      <select className="field lg:w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option>Всички</option>{statuses.map(item => <option key={item.name}>{item.name}</option>)}</select>
      <div className="flex rounded-lg border border-[#d7d6ca] bg-white p-1"><button onClick={() => setView("board")} className={`flex-1 rounded-md px-3 py-2 text-xs ${view === "board" ? "bg-[#efeee4]" : "text-[#767869]"}`}><Columns3 size={14} className="mr-1 inline"/>Процес</button><button onClick={() => setView("list")} className={`flex-1 rounded-md px-3 py-2 text-xs ${view === "list" ? "bg-[#efeee4]" : "text-[#767869]"}`}><List size={14} className="mr-1 inline"/>Списък</button></div>
    </div>

    {loading ? <div className="panel h-72 animate-pulse"/> : !shown.length ? <div className="panel"><EmptyState title="Няма експерименти" text="Променете филтрите или добавете първия AI тест."/></div> : view === "board" ?
      <div className="flex gap-4 overflow-x-auto pb-5">{statuses.map(stage => <section key={stage.name} className="w-[300px] shrink-0" onDragOver={e => { if (canEdit) e.preventDefault(); }} onDrop={e => { const item = items.find(entry => entry.id === e.dataTransfer.getData("text/plain")); if (item) move(item, stage.name); }}><div className="mb-3 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{backgroundColor:stage.color}}/><h2 className="text-xs font-semibold">{stage.name}</h2><span className="ml-auto rounded-full bg-[#efeee4] px-2 py-0.5 text-[9px] text-[#767869]">{shown.filter(item => (item.status || "Идея") === stage.name).length}</span></div><div className="min-h-36 space-y-3">{shown.filter(item => (item.status || "Идея") === stage.name).map(item => <ExperimentCard key={item.id} item={item} canEdit={canEdit} onEdit={() => openEdit(item)}/>)}</div></section>)}</div>
      : <div className="panel overflow-hidden"><div className="hidden grid-cols-[1.3fr_.7fr_.65fr_.45fr_100px] gap-4 border-b border-[#efeee4] px-5 py-3 text-[9px] uppercase tracking-wider text-[#767869] md:grid"><span>Експеримент</span><span>Модел</span><span>Етап</span><span>Оценка</span><span>Действие</span></div>{shown.map(item => <div key={item.id} className="grid gap-3 border-b border-[#efeee4] p-5 last:border-0 md:grid-cols-[1.3fr_.7fr_.65fr_.45fr_100px] md:items-center"><div><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 line-clamp-2 text-xs text-[#767869]">{item.hypothesis || item.description}</p></div><span className="text-xs text-[#67558d]">{item.model_used}</span><Badge tone={item.status === "За внедряване" ? "green" : "neutral"}>{item.status || "Идея"}</Badge><span className="text-xs font-semibold text-[#52621c]">{item.evaluation || 0}/10</span>{canEdit ? <button onClick={() => openEdit(item)} className="flex items-center gap-1 text-xs text-[#52621c]"><Pencil size={12}/> Редактирай</button> : <span/>}</div>)}</div>}

    <Modal open={modal && canEdit} onClose={() => setModal(false)} title={editing.id ? "Документация на експеримент" : "Нов експеримент"} subtitle={isDemo ? "Демо режим" : "Пълният процес се записва в Supabase."}>
      <form onSubmit={submit} className="space-y-5">
        <FormSection number="1" title="Цел и хипотеза"><label className="block text-xs text-[#767869]">Име<input required className="field mt-2" value={editing.name || ""} onChange={e => setEditing({...editing,name:e.target.value})}/></label><label className="block text-xs text-[#767869]">Описание<textarea required rows={2} className="field mt-2 resize-y" value={editing.description || ""} onChange={e => setEditing({...editing,description:e.target.value})}/></label><label className="block text-xs text-[#767869]">Хипотеза<textarea rows={2} className="field mt-2 resize-y" placeholder="Какво очакваме да докажем?" value={editing.hypothesis || ""} onChange={e => setEditing({...editing,hypothesis:e.target.value})}/></label></FormSection>
        <FormSection number="2" title="Модел и тест"><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#767869]">Използван модел<input required className="field mt-2" value={editing.model_used || ""} onChange={e => setEditing({...editing,model_used:e.target.value})}/></label><label className="text-xs text-[#767869]">Етап<select className="field mt-2" value={editing.status || "Идея"} onChange={e => setEditing({...editing,status:e.target.value as ExperimentStatus})}>{statuses.map(item => <option key={item.name}>{item.name}</option>)}</select></label></div><label className="block text-xs text-[#767869]">Prompt<textarea rows={4} className="field mt-2 resize-y font-mono text-xs" value={editing.prompt || ""} onChange={e => setEditing({...editing,prompt:e.target.value})}/></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#767869]">Тестови данни<textarea rows={2} className="field mt-2 resize-y" value={editing.test_data || ""} onChange={e => setEditing({...editing,test_data:e.target.value})}/></label><label className="text-xs text-[#767869]">Настройки<textarea rows={2} className="field mt-2 resize-y" placeholder="temperature, версия..." value={editing.model_settings || ""} onChange={e => setEditing({...editing,model_settings:e.target.value})}/></label></div></FormSection>
        <FormSection number="3" title="Сравнение (по желание)" icon={<GitCompareArrows size={14}/>}><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#767869]">Втори модел<input className="field mt-2" value={editing.comparison_model || ""} onChange={e => setEditing({...editing,comparison_model:e.target.value})}/></label><label className="text-xs text-[#767869]">Втори prompt<textarea rows={2} className="field mt-2 resize-y" value={editing.comparison_prompt || ""} onChange={e => setEditing({...editing,comparison_prompt:e.target.value})}/></label></div><label className="block text-xs text-[#767869]">Резултат от сравнението<textarea rows={2} className="field mt-2 resize-y" value={editing.comparison_result || ""} onChange={e => setEditing({...editing,comparison_result:e.target.value})}/></label></FormSection>
        <FormSection number="4" title="Резултат и решение"><label className="block text-xs text-[#767869]">Резултат<textarea rows={3} className="field mt-2 resize-y" value={editing.result || ""} onChange={e => setEditing({...editing,result:e.target.value})}/></label><div className="grid gap-4 sm:grid-cols-[140px_1fr]"><label className="text-xs text-[#767869]">Оценка (0–10)<input type="number" min="0" max="10" step="0.5" className="field mt-2" value={editing.evaluation ?? 0} onChange={e => setEditing({...editing,evaluation:Number(e.target.value)})}/></label><label className="text-xs text-[#767869]">Финално решение<textarea rows={2} className="field mt-2 resize-y" placeholder="Внедряване, нов тест или отказ..." value={editing.decision || ""} onChange={e => setEditing({...editing,decision:e.target.value})}/></label></div></FormSection>
        <div className="flex flex-wrap justify-between gap-2 pt-1">{editing.id ? <button type="button" onClick={remove} className="flex items-center gap-1 text-xs text-[#ba1a1a]"><Trash2 size={13}/> Изтрий</button> : <span/>}<div className="ml-auto flex gap-2"><button type="button" className="btn-secondary" onClick={() => setModal(false)}>Отказ</button><button disabled={busy} className="btn-primary">{busy ? "Запазване..." : "Запази експеримента"}</button></div></div>
      </form>
    </Modal>
  </>;
}

function ExperimentCard({ item, canEdit, onEdit }: { item: Experiment; canEdit: boolean; onEdit: () => void }) {
  return <article draggable={canEdit} onDragStart={e => e.dataTransfer.setData("text/plain", item.id)} onClick={onEdit} className={`rounded-xl border border-[#e4e3d9] bg-white p-4 shadow-[0_3px_12px_rgba(55,56,42,.04)] transition hover:border-[#c6c8b6] ${canEdit ? "cursor-grab active:cursor-grabbing" : ""}`}><div className="flex items-start justify-between gap-2"><span className="rounded bg-[#f2ecfa] px-2 py-1 text-[9px] font-semibold text-[#67558d]">{item.model_used}</span>{Boolean(item.comparison_model) && <GitCompareArrows size={14} className="text-[#7a4a7f]"/>}</div><h3 className="mt-3 text-sm font-semibold leading-snug">{item.name}</h3><p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[#767869]">{item.hypothesis || item.description}</p><div className="mt-4 flex items-center justify-between border-t border-[#efeee4] pt-3"><span className="text-[10px] text-[#767869]">Оценка <strong className="text-[#52621c]">{item.evaluation || 0}/10</strong></span>{item.result ? <CheckCircle2 size={15} className="text-[#52621c]"/> : <Beaker size={15} className="text-[#9a9b8d]"/>}</div></article>;
}

function FormSection({ number, title, icon, children }: { number: string; title: string; icon?: React.ReactNode; children: React.ReactNode }) { return <section className="rounded-xl border border-[#e4e3d9] p-4"><div className="mb-4 flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-full bg-[#e9edda] text-[10px] font-bold text-[#52621c]">{number}</span><h3 className="text-sm font-semibold">{title}</h3>{icon && <span className="ml-auto text-[#67558d]">{icon}</span>}</div><div className="space-y-4">{children}</div></section>; }

function Stat({ label, value, note, tone = "olive" }: { label:string; value:number; note:string; tone?:"olive"|"blue"|"violet"|"green" }) { const colors = { olive:"text-[#52621c]", blue:"text-[#2563a6]", violet:"text-[#67558d]", green:"text-[#39734d]" }; return <div className="panel p-5"><p className="text-[9px] font-semibold uppercase tracking-wider text-[#767869]">{label}</p><p className={`mt-3 text-2xl font-semibold ${colors[tone]}`}>{value}</p><p className="mt-1 text-[10px] text-[#9a9b8d]">{note}</p></div>; }
