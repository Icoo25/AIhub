"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Beaker, Bot, Heart, Newspaper, Plus, Radio, SlidersHorizontal, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui";
import { getExperiments, getKnowledgeItems, getNews, getTools } from "@/lib/data";
import type { AINews, AITool, Experiment, KnowledgeItem } from "@/lib/types";
import { useAuthProfile } from "@/lib/auth-context";
import { canContributeKnowledge } from "@/lib/permissions";

export default function Dashboard() {
  const { role, name } = useAuthProfile();
  const [addMenu, setAddMenu] = useState(false);
  const [tools, setTools] = useState<AITool[]>([]), [news, setNews] = useState<AINews[]>([]), [experiments, setExperiments] = useState<Experiment[]>([]);
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState("");
  useEffect(() => { Promise.all([getTools(), getNews(), getExperiments(), getKnowledgeItems()]).then(([t, n, e, k]) => { setTools(t); setNews(n); setExperiments(e); setKnowledge(k); }).catch(() => setError("Таблото не успя да зареди всички данни.")).finally(() => setLoading(false)); }, []);
  const stats = [
    { label: "ВХОДЯЩИ", value: knowledge.filter(item => item.status === "Входящи").length, icon: Radio, href: "/inbox" },
    { label: "ЗА ПРЕГЛЕД", value: knowledge.filter(item => item.status === "За преглед").length, icon: Sparkles, href: "/library" },
    { label: "ИНСТРУМЕНТИ", value: tools.length, icon: Bot, href: "/tools" },
    { label: "ЕКСПЕРИМЕНТИ", value: experiments.length, icon: Beaker, href: "/experiments" },
  ];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Добро утро" : hour < 18 ? "Добър ден" : "Добър вечер";
  const relativeDate = (value: string) => {
    const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
    if (days === 0) return "Днес";
    if (days === 1) return "Вчера";
    return `Преди ${days} дни`;
  };

  return <div className="space-y-6">
    {error && <div className="rounded-xl border border-[#ffdad6] bg-[#fff4f2] p-3 text-xs text-[#ba1a1a]">{error}</div>}
    {loading && <div className="panel h-2 animate-pulse"/>}
    <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><h1 className="text-3xl font-semibold tracking-[-.035em] text-[#1b1c16] sm:text-[38px]">{greeting}, {name}</h1><p className="mt-1.5 text-[12px] text-[#767869]">Актуален преглед на съдържанието във вашата AI лаборатория.</p></div>
      {canContributeKnowledge(role) && <div className="relative self-start sm:self-auto"><button onClick={() => setAddMenu(value => !value)} aria-expanded={addMenu} className="btn-primary"><Plus size={15}/> Добави съдържание</button>{addMenu && <div className="absolute right-0 top-12 z-20 w-60 rounded-xl border border-[#e4e3d9] bg-white p-2 shadow-xl">{[{href:"/inbox?new=1",label:"Бърз запис във Входящи"},{href:"/tools?new=1",label:"Нов AI инструмент"},{href:"/news?new=1",label:"Запис в инфо потока"},{href:"/experiments?new=1",label:"Нов експеримент"},{href:"/library?new=1",label:"Карта в AI библиотеката"}].map(item => <Link key={item.href} href={item.href} onClick={() => setAddMenu(false)} className="block rounded-lg px-3 py-2.5 text-sm text-[#46483b] hover:bg-[#f5f4ea]">{item.label}</Link>)}</div>}</div>}
    </section>

    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(s => <Link href={s.href} key={s.label} className="group rounded-xl border border-[#e4e3d9] bg-white px-5 py-4 shadow-[0_3px_12px_rgba(55,56,42,.035)] transition hover:-translate-y-0.5 hover:border-[#c6c8b6] hover:shadow-lg"><div className="flex items-center gap-4"><span className="grid h-10 w-10 place-items-center rounded-lg bg-[#f1f3e7] text-[#52621c]"><s.icon size={17}/></span><div className="flex-1"><p className="text-2xl font-semibold leading-none text-[#1b1c16]">{s.value}</p><p className="mt-2 text-[8px] font-semibold tracking-[.11em] text-[#767869]">{s.label}</p></div><ArrowRight size={15} className="text-[#9a9b8d] transition group-hover:translate-x-1 group-hover:text-[#52621c]"/></div></Link>)}</section>

    <section className="grid gap-5 xl:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <div><div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-semibold text-[#1b1c16]"><Beaker size={15} className="text-[#52621c]"/> Последни експерименти</h2><Link href="/experiments" className="text-[10px] font-medium text-[#52621c] hover:underline">Виж всички</Link></div><div className="space-y-2">{experiments.slice(0, 3).map(e => <div key={e.id} className="flex items-center gap-3 rounded-xl border border-[#e4e3d9] bg-white p-3.5 transition hover:border-[#c6c8b6]"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#efeee4] text-[#52621c]"><Sparkles size={15}/></span><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold text-[#1b1c16]">{e.name}</p><p className="mt-1 line-clamp-1 text-[9px] text-[#767869]">{e.description}</p></div><div className="text-right"><Badge tone={e.result ? "green" : "neutral"}>{e.result ? "С резултат" : "Без резултат"}</Badge><p className="mt-1 text-[8px] text-[#9a9b8d]">{relativeDate(e.created_at)}</p></div></div>)}</div></div>

        <div><h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#1b1c16]"><Heart size={15} className="text-[#52621c]"/> Любими инструменти</h2><div className="grid gap-3 sm:grid-cols-2">{tools.filter(t => t.is_favorite).slice(0, 2).map((t, i) => <a href={t.website_url} target="_blank" key={t.id} className="group flex items-center gap-3 rounded-xl bg-[#efeee4] p-4"><span className={`grid h-9 w-9 place-items-center rounded-lg ${i ? "bg-[#ebddff] text-[#67558d]" : "bg-white text-[#52621c]"}`}><Bot size={15}/></span><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold text-[#1b1c16]">{t.name}</p><p className="mt-1 truncate text-[8px] text-[#767869]">{t.category}</p></div><ArrowRight size={14} className="text-[#767869] transition group-hover:translate-x-0.5"/></a>)}</div></div>
      </div>

      <aside className="rounded-2xl bg-[#f5f4ea] p-5"><div className="mb-5 flex items-center justify-between"><h2 className="text-sm font-semibold text-[#1b1c16]">Инфо поток</h2>{role === "admin" ? <Link href="/news?new=1" className="text-[9px] font-semibold text-[#52621c] hover:underline">+ Добави</Link> : <SlidersHorizontal size={14} className="text-[#767869]"/>}</div><div className="relative space-y-5 before:absolute before:bottom-2 before:left-[4px] before:top-2 before:w-px before:bg-[#d7d6ca]">{news.slice(0, 4).map((n, i) => <a key={n.id} href={n.source_url} target="_blank" className="relative block pl-5"><span className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#f5f4ea] ${i % 2 ? "bg-[#67558d]" : "bg-[#52621c]"}`}/><p className="text-[8px] font-semibold uppercase tracking-wider text-[#9a9b8d]">{relativeDate(n.published_date)}</p><h3 className="mt-1.5 line-clamp-2 text-[10px] font-semibold leading-relaxed text-[#1b1c16]">{n.title}</h3><p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-[#767869]">{n.summary}</p></a>)}</div><Link href="/news" className="mt-6 block rounded-lg border border-[#d7d6ca] bg-white/50 py-2.5 text-center text-[10px] font-medium text-[#46483b] hover:bg-white">Виж пълния поток</Link></aside>
    </section>
  </div>;
}
