"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Plus, X } from "lucide-react";
import { getTools } from "@/lib/data";
import type { AITool } from "@/lib/types";
import { ToolIcon } from "./tool-icon";
import { ToolRating } from "./tool-rating";

export function ToolComparisonView() {
  const [tools, setTools] = useState<AITool[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const ids = new URLSearchParams(window.location.search).get("ids")?.split(",").filter(Boolean).slice(0, 4) || []; setSelected(ids); getTools().then(setTools).finally(() => setLoading(false)); }, []);
  const compared = useMemo(() => selected.map(id => tools.find(tool => tool.id === id)).filter((tool): tool is AITool => Boolean(tool)), [selected, tools]);
  const add = (id: string) => { if (!id || selected.length >= 4) return; const next = [...selected, id]; setSelected(next); window.history.replaceState(null, "", `/tools/compare?ids=${next.join(",")}`); };
  const remove = (id: string) => { const next = selected.filter(value => value !== id); setSelected(next); window.history.replaceState(null, "", `/tools/compare?ids=${next.join(",")}`); };
  if (loading) return <div className="panel h-64 animate-pulse"/>;

  const rows: { label: string; render: (tool: AITool) => React.ReactNode }[] = [
    { label: "Рейтинг", render: tool => <ToolRating value={tool.rating}/> },
    { label: "Категория", render: tool => tool.category },
    { label: "Фирмено решение", render: tool => tool.approval_status || "За оценка" },
    { label: "Риск за данните", render: tool => tool.data_risk || "Неоценен" },
    { label: "Цена", render: tool => [tool.pricing_model, tool.price_details].filter(Boolean).join(" · ") || "Не е посочена" },
    { label: "Подходящ за", render: tool => tool.use_cases?.join(", ") || "Няма данни" },
    { label: "Силни страни", render: tool => tool.strengths || "Няма данни" },
    { label: "Ограничения", render: tool => tool.limitations || "Няма данни" },
    { label: "Езици", render: tool => tool.supported_languages || "Няма данни" },
  ];

  return <div className="space-y-5"><div className="flex flex-wrap items-end justify-between gap-4"><div><Link href="/tools" className="mb-3 inline-flex items-center gap-2 text-xs font-semibold text-[#687046]"><ArrowLeft size={15}/> AI инструменти</Link><h1 className="text-3xl font-semibold tracking-tight text-[#25271f]">Сравнение на инструменти</h1><p className="mt-1 text-sm text-[#767869]">Сравнете до четири инструмента по важните за екипа критерии.</p></div>{selected.length < 4 && <label className="flex items-center gap-2 text-xs text-[#626459]"><Plus size={15}/><select className="field w-56" value="" onChange={e => add(e.target.value)}><option value="">Добави инструмент...</option>{tools.filter(tool => !selected.includes(tool.id)).map(tool => <option key={tool.id} value={tool.id}>{tool.name}</option>)}</select></label>}</div>
    {compared.length < 2 ? <div className="panel p-10 text-center"><p className="font-semibold text-[#34362d]">Изберете поне два инструмента</p><p className="mt-1 text-sm text-[#767869]">Добавете ги от менюто или се върнете към каталога и използвайте отметките.</p></div> : <div className="panel overflow-x-auto"><table className="min-w-[780px] w-full border-collapse"><thead><tr><th className="w-40 border-b border-r border-line bg-[#f5f3e9] p-4 text-left text-[10px] uppercase tracking-wider text-[#898b7f]">Критерий</th>{compared.map(tool => <th key={tool.id} className="min-w-52 border-b border-r border-line p-4 text-left align-top last:border-r-0"><div className="flex items-start justify-between gap-2"><Link href={`/tools/${tool.id}`} className="flex items-center gap-3"><ToolIcon name={tool.name} websiteUrl={tool.website_url} className="h-10 w-10" imageClassName="h-6 w-6"/><span className="text-sm font-semibold text-[#2f3128] hover:text-[#65763e]">{tool.name}</span></Link><button title="Премахни от сравнението" className="rounded-lg p-1.5 text-[#8b8d82] hover:bg-[#efeee4]" onClick={() => remove(tool.id)}><X size={14}/></button></div><a href={tool.website_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-[11px] text-[#6b7847]">Сайт <ExternalLink size={11}/></a></th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.label}><th className="border-b border-r border-line bg-[#faf9f0] p-4 text-left text-xs font-semibold text-[#5f6154]">{row.label}</th>{compared.map(tool => <td key={tool.id} className="border-b border-r border-line p-4 text-xs leading-relaxed text-[#626459] last:border-r-0">{row.render(tool)}</td>)}</tr>)}</tbody></table></div>}
  </div>;
}
