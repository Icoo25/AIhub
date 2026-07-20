"use client";

import { useEffect, useState } from "react";
import { GitMerge, Pencil, Plus } from "lucide-react";
import { getContentCategories, mergeContentCategory, saveContentCategory } from "@/lib/data";
import type { ContentCategory } from "@/lib/types";
import { Modal, useConfirmAction } from "./ui";

const emptyCategory: Partial<ContentCategory> = { name: "", description: "", color: "#7f9156", applies_to: ["tool"], active: true, position: 0 };

export function CategoriesManager({ open, onClose, onChanged }: { open: boolean; onClose: () => void; onChanged: (items: ContentCategory[]) => void }) {
  const confirmAction = useConfirmAction();
  const [items, setItems] = useState<ContentCategory[]>([]);
  const [editing, setEditing] = useState<Partial<ContentCategory> | null>(null);
  const [originalName, setOriginalName] = useState("");
  const [mergeSource, setMergeSource] = useState<ContentCategory | null>(null);
  const [mergeTarget, setMergeTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (open) getContentCategories().then(setItems).catch(() => setError("Категориите не успяха да се заредят.")); }, [open]);

  const persist = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing?.name?.trim()) return;
    setBusy(true); setError("");
    try {
      const saved = await saveContentCategory({ ...editing, name: editing.name.trim(), applies_to: ["tool"] }, originalName || undefined);
      const next = editing.id ? items.map(item => item.id === editing.id ? saved : item) : [...items, saved];
      setItems(next); onChanged(next); setEditing(null);
    } catch { setError("Категорията не беше запазена. Проверете дали името вече съществува."); }
    finally { setBusy(false); }
  };

  const merge = async () => {
    const target = items.find(item => item.id === mergeTarget);
    if (!mergeSource || !target) return;
    if (!(await confirmAction({ title: "Обединяване на категории", description: `Всички инструменти от „${mergeSource.name}“ ще преминат в „${target.name}“. Изходната категория ще бъде скрита.`, confirmLabel: "Обедини" }))) return;
    setBusy(true);
    try { await mergeContentCategory(mergeSource, target); const next = items.filter(item => item.id !== mergeSource.id); setItems(next); onChanged(next); setMergeSource(null); setMergeTarget(""); }
    catch { setError("Категориите не бяха обединени."); }
    finally { setBusy(false); }
  };

  return <Modal open={open} onClose={onClose} title="Управление на категории" subtitle="Промяната на име обновява и съществуващите инструменти. Можете и да обедините две категории.">
    {error && <div className="mb-4 rounded-xl border border-[#e9c8c3] bg-[#fff4f2] p-3 text-xs text-[#9e3029]">{error}</div>}
    {!editing && !mergeSource && <>
      <button className="btn-primary mb-4" onClick={() => { setEditing({ ...emptyCategory }); setOriginalName(""); }}><Plus size={15}/> Нова категория</button>
      <div className="space-y-2">{items.filter(item => item.applies_to.includes("tool")).map(item => <div key={item.id} className="flex items-center gap-3 rounded-xl border border-line bg-white/60 p-3">
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}/><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-[#2b2d24]">{item.name}</p><p className="truncate text-[11px] text-[#767869]">{item.description || "Без описание"}</p></div>
        <button className="rounded-lg p-2 text-[#767869] hover:bg-[#efeee4]" title="Редактирай" onClick={() => { setEditing(item); setOriginalName(item.name); }}><Pencil size={15}/></button>
        {items.length > 1 && <button className="rounded-lg p-2 text-[#767869] hover:bg-[#efeee4]" title="Обедини" onClick={() => setMergeSource(item)}><GitMerge size={15}/></button>}
      </div>)}</div>
    </>}
    {editing && <form onSubmit={persist} className="space-y-4">
      <label className="block text-xs text-[#5f6154]">Име<input autoFocus required className="field mt-2" value={editing.name || ""} onChange={e => setEditing({ ...editing, name: e.target.value })}/></label>
      <label className="block text-xs text-[#5f6154]">Описание<textarea className="field mt-2 resize-none" rows={3} value={editing.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })}/></label>
      <label className="flex items-center gap-3 text-xs text-[#5f6154]">Цвят<input type="color" value={editing.color || "#7f9156"} onChange={e => setEditing({ ...editing, color: e.target.value })} className="h-10 w-14 rounded-lg border border-line bg-white p-1"/></label>
      <div className="flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Назад</button><button disabled={busy} className="btn-primary">{busy ? "Запазване..." : "Запази"}</button></div>
    </form>}
    {mergeSource && <div className="space-y-4"><p className="text-sm text-[#5f6154]">Изберете категория, в която да преместим всички инструменти от <strong>„{mergeSource.name}“</strong>.</p><select className="field" value={mergeTarget} onChange={e => setMergeTarget(e.target.value)}><option value="">Изберете целева категория</option>{items.filter(item => item.id !== mergeSource.id).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><div className="flex justify-end gap-2"><button className="btn-secondary" onClick={() => setMergeSource(null)}>Назад</button><button disabled={!mergeTarget || busy} className="btn-primary" onClick={merge}>Обедини</button></div></div>}
  </Modal>;
}
