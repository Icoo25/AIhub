"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, ExternalLink, Pencil, ShieldCheck, WalletCards } from "lucide-react";
import { getTool } from "@/lib/data";
import type { AITool } from "@/lib/types";
import { useAuthProfile } from "@/lib/auth-context";
import { canEditContent } from "@/lib/permissions";
import { ToolIcon } from "./tool-icon";
import { ToolRating } from "./tool-rating";
import { Badge, EmptyState } from "./ui";
import { SourceAttribution } from "./source-attribution";

export function ToolDetailView({ id }: { id: string }) {
  const { role } = useAuthProfile();
  const [tool, setTool] = useState<AITool | null | undefined>(undefined);
  useEffect(() => { getTool(id).then(setTool).catch(() => setTool(null)); }, [id]);
  if (tool === undefined) return <div className="panel h-64 animate-pulse"/>;
  if (!tool) return <div className="panel"><EmptyState title="Инструментът не е намерен" text="Записът може да е бил изтрит или нямате достъп до него."/><div className="pb-8 text-center"><Link className="btn-secondary" href="/tools"><ArrowLeft size={15}/> Към каталога</Link></div></div>;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><Link href="/tools" className="inline-flex items-center gap-2 text-xs font-semibold text-[#687046] hover:text-[#465126]"><ArrowLeft size={15}/> AI инструменти</Link>{canEditContent(role) && <Link className="btn-secondary" href={`/tools?edit=${tool.id}`}><Pencil size={15}/> Редактирай</Link>}</div>
    <section className="panel overflow-hidden"><div className="border-b border-line bg-gradient-to-r from-[#f1f2e4] via-[#fbfaf0] to-[#f4ede3] p-6 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-start"><ToolIcon name={tool.name} websiteUrl={tool.website_url} className="h-16 w-16" imageClassName="h-10 w-10"/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h1 className="text-3xl font-semibold tracking-tight text-[#25271f]">{tool.name}</h1><Badge tone={tool.status === "Активен" ? "green" : tool.status === "В тестване" ? "purple" : "neutral"}>{tool.status}</Badge></div><p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#686a5d]">{tool.description}</p><div className="mt-4 flex flex-wrap items-center gap-4"><ToolRating value={tool.rating}/><span className="text-xs text-[#767869]">{tool.category}</span><a className="inline-flex items-center gap-1 text-xs font-semibold text-[#65763e] hover:underline" href={tool.website_url} target="_blank" rel="noreferrer">Посети сайта <ExternalLink size={13}/></a></div></div></div></div>
      <div className="grid gap-0 sm:grid-cols-3"><Summary label="Фирмено решение" value={tool.approval_status || "За оценка"} icon={<ShieldCheck size={17}/>}/><Summary label="Ценови модел" value={[tool.pricing_model, tool.price_details].filter(Boolean).join(" · ") || "Не е посочен"} icon={<WalletCards size={17}/>}/><Summary label="Последен преглед" value={tool.last_reviewed_at ? new Date(tool.last_reviewed_at).toLocaleDateString("bg-BG") : "Не е преглеждан"} icon={<CalendarDays size={17}/>}/></div>
    </section>
    <div className="grid gap-5 lg:grid-cols-3"><section className="panel p-5 lg:col-span-2"><h2 className="text-base font-semibold text-[#25271f]">Практическа оценка</h2><div className="mt-5 grid gap-5 sm:grid-cols-2"><TextBlock title="Силни страни" value={tool.strengths}/><TextBlock title="Ограничения" value={tool.limitations}/><TextBlock title="Поддържани езици" value={tool.supported_languages}/><TextBlock title="Риск за фирмени данни" value={tool.data_risk || "Неоценен"}/></div></section><section className="panel p-5"><h2 className="text-base font-semibold text-[#25271f]">Подходящ за</h2>{tool.use_cases?.length ? <div className="mt-4 flex flex-wrap gap-2">{tool.use_cases.map(value => <span key={value} className="rounded-full border border-[#dce1c8] bg-[#f3f5e8] px-3 py-1.5 text-xs text-[#596638]">{value}</span>)}</div> : <p className="mt-4 text-sm text-[#838579]">Няма добавени приложения.</p>}</section></div>
    <SourceAttribution sourceId={tool.source_id}/>
    {tool.notes && <section className="panel p-5"><h2 className="text-base font-semibold text-[#25271f]">Вътрешни бележки</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#686a5d]">{tool.notes}</p></section>}
  </div>;
}

function Summary({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) { return <div className="flex gap-3 border-b border-line p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><span className="text-[#7f9156]">{icon}</span><div><p className="text-[10px] uppercase tracking-wider text-[#898b7f]">{label}</p><p className="mt-1 text-sm font-semibold text-[#34362d]">{value}</p></div></div>; }
function TextBlock({ title, value }: { title: string; value?: string }) { return <div><h3 className="text-[10px] font-semibold uppercase tracking-wider text-[#898b7f]">{title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#626459]">{value || "Няма добавена информация."}</p></div>; }
