"use client";

import { useEffect, useState } from "react";
import { Beaker, CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import { PageHeading } from "./page-heading";
import { Badge, EmptyState, Modal, useConfirmAction } from "./ui";
import { deleteExperiment, getExperiments, isDemo, saveExperiment } from "@/lib/data";
import { useAuthProfile } from "@/lib/auth-context";
import type { Experiment } from "@/lib/types";

const blank = (): Partial<Experiment> => ({ name: "", description: "", model_used: "", result: "" });

export function ExperimentsView() {
  const confirmAction = useConfirmAction();
  const { role } = useAuthProfile();
  const canEdit = role === "admin";
  const [items, setItems] = useState<Experiment[]>([]);
  const [editing, setEditing] = useState<Partial<Experiment>>(blank());
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const load = async () => { setLoading(true); try { setItems(await getExperiments()); } catch { setError("Експериментите не успяха да се заредят."); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  useEffect(() => { if (canEdit && new URLSearchParams(window.location.search).get("new") === "1") { setEditing(blank()); setModal(true); } }, [canEdit]);
  const weekAgo = Date.now() - 7 * 86400000;
  const addedThisWeek = items.filter(item => new Date(item.created_at).getTime() >= weekAgo).length;
  const documented = items.filter(item => item.result.trim()).length;

  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setError(""); try { await saveExperiment(editing); await load(); setModal(false); } catch { setError("Експериментът не беше запазен."); } finally { setBusy(false); } }
  async function remove() { if (!editing.id || !(await confirmAction({ title: "Изтриване на експеримент", description: `Експериментът „${editing.name}“ и неговият резултат ще бъдат премахнати окончателно.`, confirmLabel: "Изтрий експеримента" }))) return; setBusy(true); try { await deleteExperiment(editing.id); await load(); setModal(false); } catch { setError("Експериментът не беше изтрит."); } finally { setBusy(false); } }

  return <>
    <PageHeading eyebrow="Приложни изследвания" title="Експерименти" description="Документирайте моделите, тестовете и реалните резултати." action={canEdit ? <button className="btn-primary" onClick={() => { setEditing(blank()); setModal(true); }}><Plus size={16}/> Нов експеримент</button> : undefined}/>
    {error && <div className="mb-4 rounded-xl border border-[#ffdad6] bg-[#fff4f2] p-3 text-xs text-[#ba1a1a]">{error}</div>}
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><Stat label="Всички експерименти" value={items.length} note={`${addedThisWeek} през последните 7 дни`}/><Stat label="С резултат" value={documented} note={`от ${items.length} записа`} violet/><Stat label="Уникални модели" value={new Set(items.map(item => item.model_used)).size} note="използвани AI модели" purple/></div>
    {loading ? <div className="panel h-72 animate-pulse"/> : items.length ? <div className="panel overflow-hidden"><div className="hidden grid-cols-[1.2fr_.8fr_1fr_120px] gap-4 border-b border-[#efeee4] px-5 py-3 text-[9px] uppercase tracking-wider text-[#767869] md:grid"><span>Експеримент</span><span>Модел</span><span>Резултат</span><span>Действие</span></div>{items.map(item => <div key={item.id} className="grid gap-3 border-b border-[#efeee4] p-5 last:border-0 md:grid-cols-[1.2fr_.8fr_1fr_120px] md:items-center"><div><p className="text-sm font-semibold">{item.name}</p><p className="mt-1 line-clamp-2 text-xs text-[#767869]">{item.description}</p></div><span className="text-xs text-[#67558d]">{item.model_used}</span><div><Badge tone={item.result ? "green" : "neutral"}><CheckCircle2 size={10} className="mr-1"/>{item.result || "Без резултат"}</Badge></div>{canEdit ? <button onClick={() => { setEditing(item); setModal(true); }} className="flex items-center gap-1 text-[10px] text-[#52621c]"><Pencil size={12}/> Редактирай</button> : <span/>}</div>)}</div> : <div className="panel"><EmptyState title="Няма експерименти" text="Добавете първия документиран AI тест."/></div>}
    <div className="mt-5 rounded-2xl border border-dashed border-[#d7d6ca] p-6 text-center"><Beaker className="mx-auto text-[#9a9b8d]" size={24}/><p className="mt-2 text-xs text-[#767869]">Всеки полезен резултат започва с добре документиран експеримент.</p></div>
    <Modal open={modal && canEdit} onClose={() => setModal(false)} title={editing.id ? "Редактиране на експеримент" : "Нов експеримент"} subtitle={isDemo ? "Демо режим" : "Данните се записват в Supabase."}><form onSubmit={submit} className="space-y-4"><label className="block text-xs text-[#767869]">Име<input required className="field mt-2" value={editing.name || ""} onChange={e => setEditing({...editing,name:e.target.value})}/></label><label className="block text-xs text-[#767869]">Описание<textarea required rows={3} className="field mt-2 resize-none" value={editing.description || ""} onChange={e => setEditing({...editing,description:e.target.value})}/></label><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#767869]">Използван модел<input required className="field mt-2" value={editing.model_used || ""} onChange={e => setEditing({...editing,model_used:e.target.value})}/></label><label className="text-xs text-[#767869]">Резултат<input required className="field mt-2" value={editing.result || ""} onChange={e => setEditing({...editing,result:e.target.value})}/></label></div><div className="flex justify-between pt-2">{editing.id ? <button type="button" onClick={remove} className="flex items-center gap-1 text-xs text-[#ba1a1a]"><Trash2 size={13}/> Изтрий</button> : <span/>}<div className="flex gap-2"><button type="button" className="btn-secondary" onClick={() => setModal(false)}>Отказ</button><button disabled={busy} className="btn-primary">{busy ? "Запазване..." : "Запази"}</button></div></div></form></Modal>
  </>;
}

function Stat({ label, value, note, violet, purple }: { label:string; value:number; note:string; violet?:boolean; purple?:boolean }) { return <div className="panel p-5"><p className="text-[8px] font-semibold uppercase tracking-wider text-[#767869]">{label}</p><p className={`mt-3 text-2xl font-semibold ${violet ? "text-[#7a4a7f]" : purple ? "text-[#67558d]" : "text-[#52621c]"}`}>{value}</p><p className="mt-1 text-[8px] text-[#9a9b8d]">{note}</p></div>; }
