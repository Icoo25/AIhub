"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Command, Search, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type CommandPaletteItem = { href: string; label: string; icon: LucideIcon };

export function CommandPalette({ open, items, query, onQueryChange, onClose }: { open: boolean; items: CommandPaletteItem[]; query: string; onQueryChange: (value: string) => void; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setActiveIndex(0);
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => { window.clearTimeout(focusTimer); document.body.style.overflow = previousOverflow; };
  }, [open]);

  useEffect(() => { setActiveIndex(0); }, [query]);

  function choose(item: CommandPaletteItem) {
    onClose(); onQueryChange(""); router.push(item.href);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex(index => Math.min(index + 1, Math.max(0, items.length - 1))); }
    if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex(index => Math.max(0, index - 1)); }
    if (event.key === "Enter" && items[activeIndex]) { event.preventDefault(); choose(items[activeIndex]); }
    if (event.key === "Escape") { event.preventDefault(); onClose(); }
  }

  if (!open) return null;

  return <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#1b1c16]/45 px-3 py-5 backdrop-blur-[3px] sm:px-6 sm:pt-[12vh]" onMouseDown={onClose}>
    <section role="dialog" aria-modal="true" aria-label="Командно меню" className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-[#d7d6ca] bg-[#fffef9] shadow-[0_30px_100px_rgba(27,28,22,.3)]" onMouseDown={event => event.stopPropagation()}>
      <header className="flex min-h-16 items-center gap-3 border-b border-[#e4e3d9] px-4 sm:px-5">
        <Search size={19} className="shrink-0 text-[#52621c]"/>
        <input ref={inputRef} value={query} onChange={event => onQueryChange(event.target.value)} onKeyDown={handleKeyDown} className="min-w-0 flex-1 bg-transparent py-4 text-base text-[#1b1c16] outline-none placeholder:text-[#9a9b8d]" placeholder="Потърсете страница или действие..." autoComplete="off"/>
        <button aria-label="Затвори командното меню" onClick={onClose} className="rounded-lg p-2 text-[#767869] hover:bg-[#efeee4]"><X size={18}/></button>
      </header>

      <div className="max-h-[min(58vh,520px)] overflow-y-auto p-2 sm:p-3">
        <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-[.12em] text-[#9a9b8d]">Страници и действия</p>
        {items.map((item, index) => { const Icon = item.icon; const active = index === activeIndex; return <button key={`${item.href}-${item.label}`} type="button" onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(item)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition sm:px-4 ${active ? "bg-[#e9edda] text-[#52621c]" : "text-[#46483b] hover:bg-[#f5f4ea]"}`}><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${active ? "bg-white text-[#52621c]" : "bg-[#f5f4ea] text-[#767869]"}`}><Icon size={17}/></span><span className="min-w-0 flex-1 truncate text-sm font-medium">{item.label}</span><ArrowRight size={15} className={active ? "text-[#52621c]" : "text-[#b0b1a4]"}/></button>; })}
        {!items.length && <div className="px-6 py-12 text-center"><Command className="mx-auto text-[#b0b1a4]"/><h2 className="mt-3 text-sm font-semibold">Няма намерени резултати</h2><p className="mt-1 text-sm text-[#767869]">Опитайте с друга дума.</p></div>}
      </div>

      <footer className="flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-[#e4e3d9] bg-[#f8f7ee] px-4 py-3 text-xs text-[#767869] sm:px-5"><span><kbd className="rounded border border-[#d7d6ca] bg-white px-1.5 py-0.5">↑↓</kbd> избор</span><span><kbd className="rounded border border-[#d7d6ca] bg-white px-1.5 py-0.5">Enter</kbd> отвори</span><span><kbd className="rounded border border-[#d7d6ca] bg-white px-1.5 py-0.5">Esc</kbd> затвори</span></footer>
    </section>
  </div>;
}
