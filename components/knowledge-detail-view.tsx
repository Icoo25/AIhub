"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { getKnowledgeItem } from "@/lib/data";
import type { KnowledgeItem } from "@/lib/types";
import { EmptyState } from "./ui";

export function KnowledgeDetailView({ id }: { id: string }) {
  const [item, setItem] = useState<KnowledgeItem | null | undefined>();
  useEffect(() => { getKnowledgeItem(id).then(setItem).catch(() => setItem(null)); }, [id]);
  if (item === undefined) return <div className="panel h-64 animate-pulse"/>;
  if (!item) return <div className="panel"><EmptyState title="Записът не е намерен" text="Може да е бил премахнат или архивиран."/></div>;
  return <div className="space-y-5"><Link href="/library" className="inline-flex items-center gap-2 text-xs font-semibold text-[#687046]"><ArrowLeft size={15}/> AI библиотека</Link><section className="panel p-6 sm:p-8"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-[#eef0df] px-3 py-1 text-xs text-[#596638]">{item.category}</span><span className="rounded-full bg-[#f0e9f5] px-3 py-1 text-xs text-[#67558d]">{item.status}</span><span className="rounded-full bg-[#f4ede3] px-3 py-1 text-xs text-[#75624d]">{item.priority} приоритет</span></div><h1 className="mt-4 text-3xl font-semibold text-[#25271f]">{item.title}</h1><p className="mt-3 max-w-3xl whitespace-pre-wrap text-sm leading-relaxed text-[#686a5d]">{item.description}</p>{item.source_url && <a href={item.source_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#65763e]">Отвори източника <ExternalLink size={13}/></a>}</section><div className="grid gap-5 lg:grid-cols-2"><section className="panel p-5"><h2 className="text-sm font-semibold text-[#34362d]">Бележки</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#686a5d]">{item.notes || "Няма добавени бележки."}</p></section><section className="panel p-5"><h2 className="text-sm font-semibold text-[#34362d]">Етикети</h2><div className="mt-3 flex flex-wrap gap-2">{item.tags.length ? item.tags.map(tag => <span key={tag} className="rounded-full border border-line px-3 py-1 text-xs text-[#686a5d]">#{tag}</span>) : <span className="text-sm text-[#85877b]">Няма етикети.</span>}</div></section></div></div>;
}
