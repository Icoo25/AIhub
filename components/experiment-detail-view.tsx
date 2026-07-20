"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { getExperiment } from "@/lib/data";
import type { Experiment } from "@/lib/types";
import { Badge, EmptyState } from "./ui";

export function ExperimentDetailView({ id }: { id: string }) {
  const [item, setItem] = useState<Experiment | null | undefined>();
  useEffect(() => { getExperiment(id).then(setItem).catch(() => setItem(null)); }, [id]);
  if (item === undefined) return <div className="panel h-64 animate-pulse"/>;
  if (!item) return <div className="panel"><EmptyState title="Експериментът не е намерен" text="Записът може да е бил премахнат."/></div>;
  return <div className="space-y-5"><Link href="/experiments" className="inline-flex items-center gap-2 text-xs font-semibold text-[#687046]"><ArrowLeft size={15}/> Експерименти</Link><section className="panel p-6 sm:p-8"><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-semibold text-[#25271f]">{item.name}</h1><Badge tone={item.status === "За внедряване" ? "green" : "neutral"}>{item.status || "Идея"}</Badge></div><p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#686a5d]">{item.description}</p><div className="mt-6 grid gap-4 sm:grid-cols-3"><Fact label="Модел" value={item.model_used}/><Fact label="Оценка" value={`${item.evaluation || 0}/10`}/><Fact label="Последна промяна" value={new Date(item.updated_at || item.created_at).toLocaleDateString("bg-BG")}/></div></section><div className="grid gap-5 lg:grid-cols-2"><Section title="Хипотеза" value={item.hypothesis}/><Section title="Prompt" value={item.prompt} mono/><Section title="Резултат" value={item.result}/><Section title="Решение" value={item.decision}/><Section title="Тестови данни" value={item.test_data}/><Section title="Настройки" value={item.model_settings} mono/></div></div>;
}
function Fact({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[#f4f3e8] p-4"><p className="text-[10px] uppercase tracking-wider text-[#898b7f]">{label}</p><p className="mt-1 text-sm font-semibold text-[#35372e]">{value}</p></div>; }
function Section({ title, value, mono }: { title: string; value?: string; mono?: boolean }) { return <section className="panel p-5"><h2 className="text-sm font-semibold text-[#34362d]">{title}</h2><p className={`mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#686a5d] ${mono ? "font-mono text-xs" : ""}`}>{value || "Няма добавена информация."}</p></section>; }
