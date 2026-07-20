"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Beaker, BookOpen, Bot, ExternalLink, Newspaper } from "lucide-react";
import { getSource, getSourceContent } from "@/lib/data";
import type { AINews, AITool, ContentSource, Experiment, KnowledgeItem } from "@/lib/types";
import { EmptyState } from "./ui";
import { SourceLogo } from "./source-logo";

type SourceContent = { tools: AITool[]; news: AINews[]; knowledge: KnowledgeItem[]; experiments: Experiment[] };

export function SourceDetailView({ id }: { id: string }) {
  const [source, setSource] = useState<ContentSource | null | undefined>();
  const [content, setContent] = useState<SourceContent>({ tools: [], news: [], knowledge: [], experiments: [] });
  const [coverImage, setCoverImage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getSource(id), getSourceContent(id)])
      .then(([item, related]) => { setSource(item); setContent(related); })
      .catch(() => setSource(null));
  }, [id]);

  useEffect(() => {
    if (!source?.url) { setCoverImage(null); return; }
    const controller = new AbortController();
    fetch("/api/import/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: source.url, type: "url" }),
      signal: controller.signal,
    })
      .then(response => response.ok ? response.json() : null)
      .then(data => setCoverImage(data?.image || null))
      .catch(() => setCoverImage(null));
    return () => controller.abort();
  }, [source?.url]);

  if (source === undefined) return <div className="panel h-64 animate-pulse"/>;
  if (!source) return <div className="panel"><EmptyState title="Източникът не е намерен" text="Може да е бил премахнат или нямате достъп до него."/></div>;

  const total = content.tools.length + content.news.length + content.knowledge.length + content.experiments.length;

  return <div className="space-y-5">
    <Link href="/sources" className="inline-flex items-center gap-2 text-xs font-semibold text-[#687046]"><ArrowLeft size={15}/> Източници</Link>
    <section className="panel overflow-hidden">
      <div
        className="relative overflow-hidden bg-gradient-to-r from-[#eef0df] via-[#fbfaf0] to-[#f2e9e0] p-6 sm:p-8"
        style={coverImage ? { backgroundImage: `linear-gradient(90deg, rgba(247,247,237,.96), rgba(251,250,240,.88), rgba(242,233,224,.78)), url(${JSON.stringify(coverImage)})`, backgroundPosition: "center", backgroundSize: "cover" } : undefined}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <SourceLogo name={source.name} url={source.url} type={source.source_type} className="h-14 w-14" imageClassName="h-9 w-9"/>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold text-[#657044]">{source.source_type}</span><span className="rounded-full bg-white/80 px-3 py-1 text-[10px] text-[#77796d]">{source.status}</span></div>
              <h1 className="mt-4 text-3xl font-semibold text-[#292b23]">{source.name}</h1>
              {source.handle && <p className="mt-1 text-sm font-semibold text-[#735c8b]">{source.handle}</p>}
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#686a5d]">{source.description || "Няма добавено описание."}</p>
            </div>
          </div>
          <a href={source.url} target="_blank" rel="noreferrer" className="btn-secondary">Отвори източника <ExternalLink size={14}/></a>
        </div>
      </div>
      <div className="grid sm:grid-cols-4"><Fact label="Категория" value={source.category}/><Fact label="Надеждност" value={`${source.reliability}/5`}/><Fact label="Свързани записи" value={String(total)}/><Fact label="Последна проверка" value={source.last_checked_at ? new Date(source.last_checked_at).toLocaleDateString("bg-BG") : "Не е проверяван"}/></div>
    </section>
    {!total
      ? <div className="panel"><EmptyState title="Няма свързано съдържание" text="При обработване на URL от този източник записите ще се появят тук."/></div>
      : <div className="grid gap-5 lg:grid-cols-2"><ContentSection title="AI библиотека" icon={<BookOpen size={16}/>} items={content.knowledge.map(item => ({ id: item.id, title: item.title, subtitle: item.category, href: `/library/${item.id}` }))}/><ContentSection title="AI инструменти" icon={<Bot size={16}/>} items={content.tools.map(item => ({ id: item.id, title: item.name, subtitle: item.category, href: `/tools/${item.id}` }))}/><ContentSection title="Новини" icon={<Newspaper size={16}/>} items={content.news.map(item => ({ id: item.id, title: item.title, subtitle: item.category, href: item.source_url, external: true }))}/><ContentSection title="Експерименти" icon={<Beaker size={16}/>} items={content.experiments.map(item => ({ id: item.id, title: item.name, subtitle: item.status || "Идея", href: `/experiments/${item.id}` }))}/></div>}
  </div>;
}

function Fact({ label, value }: { label: string; value: string }) { return <div className="border-b border-r border-line p-4 last:border-r-0 sm:border-b-0"><p className="text-[9px] uppercase tracking-wider text-[#898b7f]">{label}</p><p className="mt-1 text-sm font-semibold text-[#34362d]">{value}</p></div>; }
function ContentSection({ title, icon, items }: { title: string; icon: React.ReactNode; items: Array<{ id: string; title: string; subtitle: string; href: string; external?: boolean }> }) { if (!items.length) return null; return <section className="panel p-5"><h2 className="flex items-center gap-2 text-sm font-semibold text-[#34362d]"><span className="text-[#65763e]">{icon}</span>{title}<span className="ml-auto text-[10px] text-[#898b7f]">{items.length}</span></h2><div className="mt-4 space-y-2">{items.map(item => <Link key={item.id} href={item.href} target={item.external ? "_blank" : undefined} className="flex items-center justify-between rounded-xl border border-line bg-white/60 p-3 hover:border-[#bdc69d]"><span className="min-w-0"><span className="block truncate text-xs font-semibold text-[#34362d]">{item.title}</span><span className="mt-1 block text-[9px] text-[#85877a]">{item.subtitle}</span></span><ExternalLink size={12} className="shrink-0 text-[#898b7f]"/></Link>)}</div></section>; }
