"use client";

import { useEffect, useState } from "react";
import { Activity, Beaker, BookOpen, Bot, Newspaper } from "lucide-react";
import { PageHeading } from "./page-heading";
import { getActivity } from "@/lib/data";
import type { ActivityEntry } from "@/lib/types";

const entity:{[key:string]:{label:string;icon:typeof Bot}}={ai_tools:{label:"AI инструмент",icon:Bot},ai_news:{label:"Новина",icon:Newspaper},experiments:{label:"Експеримент",icon:Beaker},knowledge_items:{label:"Библиотека",icon:BookOpen}};
const action:{[key:string]:string}={insert:"Създаден",update:"Променен",delete:"Изтрит"};
export function ActivityView(){const [items,setItems]=useState<ActivityEntry[]>([]),[loading,setLoading]=useState(true);useEffect(()=>{getActivity(100).then(setItems).finally(()=>setLoading(false))},[]);return <><PageHeading eyebrow="История на платформата" title="Активност" description="Последните промени в инструментите, новините, експериментите и библиотеката."/>{loading?<div className="panel h-72 animate-pulse"/>:<div className="panel overflow-hidden">{items.length?items.map(item=>{const config=entity[item.entity_type]||{label:item.entity_type,icon:Activity};const Icon=config.icon;return <div key={item.id} className="flex items-center gap-4 border-b border-[#efeee4] p-4 last:border-0"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#e9edda] text-[#52621c]"><Icon size={15}/></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{action[item.action]||item.action}: {item.summary||config.label}</p><p className="mt-1 text-[9px] text-[#767869]">{config.label}</p></div><time className="text-[9px] text-[#9a9b8d]">{new Date(item.created_at).toLocaleString("bg-BG")}</time></div>}):<div className="p-12 text-center text-sm text-[#767869]">Все още няма записана активност.</div>}</div>}</>}

