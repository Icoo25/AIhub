"use client";
import { AlertTriangle, X } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "green" | "purple" | "blue" | "neutral" }) {
  const styles = { green: "border-acid/20 bg-acid/10 text-acid", purple: "border-violet-400/20 bg-violet-400/10 text-violet-300", blue: "border-sky-400/20 bg-sky-400/10 text-sky-300", neutral: "border-slate-700 bg-slate-800/60 text-slate-400" };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${styles[tone]}`}>{children}</span>;
}

export function Modal({ open, title, subtitle, onClose, children }: { open: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={onClose}>
    <div className="panel max-h-[92vh] w-full max-w-xl overflow-y-auto p-6 shadow-2xl" onMouseDown={e => e.stopPropagation()}>
      <div className="mb-6 flex items-start justify-between"><div><h2 className="text-xl font-semibold">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div><button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white"><X size={18}/></button></div>
      {children}
    </div>
  </div>;
}

export function Drawer({ open, title, subtitle, onClose, children }: { open: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 bg-[#1b1c16]/35 backdrop-blur-sm" onMouseDown={onClose}>
    <aside role="dialog" aria-modal="true" className="ml-auto flex h-full w-full max-w-2xl flex-col border-l border-[#e4e3d9] bg-[#fbfaf0] shadow-[-24px_0_70px_rgba(27,28,22,.16)]" onMouseDown={event => event.stopPropagation()}>
      <header className="flex items-start justify-between border-b border-[#e4e3d9] px-5 py-4 sm:px-7"><div><h2 className="text-xl font-semibold text-[#1b1c16]">{title}</h2>{subtitle && <p className="mt-1 text-sm text-[#767869]">{subtitle}</p>}</div><button aria-label="Затвори" onClick={onClose} className="rounded-lg p-2 text-[#767869] hover:bg-[#efeee4]"><X size={19}/></button></header>
      <div className="flex-1 overflow-y-auto p-5 sm:p-7">{children}</div>
    </aside>
  </div>;
}

export function EmptyState({ title, text }: { title: string; text: string }) { return <div className="py-16 text-center"><div className="mx-auto mb-3 h-2 w-2 rounded-full bg-acid shadow-[0_0_18px_#b8f34a]"/><h3 className="font-medium">{title}</h3><p className="mt-1 text-sm text-slate-500">{text}</p></div>; }

type ConfirmOptions = { title: string; description: string; confirmLabel?: string; cancelLabel?: string };
type ConfirmRequest = ConfirmOptions & { resolve: (value: boolean) => void };
const ConfirmationContext = createContext<(options: ConfirmOptions) => Promise<boolean>>(async () => false);

export function ConfirmationProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>(resolve => setRequest({ ...options, resolve })), []);
  const finish = (value: boolean) => { request?.resolve(value); setRequest(null); };
  return <ConfirmationContext.Provider value={confirm}>{children}{request && <div className="fixed inset-0 z-[80] grid place-items-center bg-[#1b1c16]/40 p-4 backdrop-blur-sm" onMouseDown={() => finish(false)}><section role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-2xl border border-[#e4e3d9] bg-[#fbfaf0] p-6 shadow-[0_24px_80px_rgba(27,28,22,.24)]" onMouseDown={event => event.stopPropagation()}><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#ffdad6] text-[#ba1a1a]"><AlertTriangle size={20}/></span><h2 id="confirm-title" className="mt-4 text-xl font-semibold text-[#1b1c16]">{request.title}</h2><p className="mt-2 text-sm leading-relaxed text-[#767869]">{request.description}</p><div className="mt-6 flex justify-end gap-2"><button autoFocus className="btn-secondary" onClick={() => finish(false)}>{request.cancelLabel || "Отказ"}</button><button className="inline-flex items-center justify-center rounded-lg bg-[#ba1a1a] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#981515]" onClick={() => finish(true)}>{request.confirmLabel || "Потвърди"}</button></div></section></div>}</ConfirmationContext.Provider>;
}

export function useConfirmAction() { return useContext(ConfirmationContext); }
