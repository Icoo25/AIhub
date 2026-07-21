"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Link2, Plus, Star, Trash2 } from "lucide-react";
import { getCompetitor, getCompetitorSources, getSources, linkCompetitorSource, unlinkCompetitorSource } from "@/lib/data";
import type { Competitor, CompetitorSource, ContentSource } from "@/lib/types";
import { useAuthProfile } from "@/lib/auth-context";
import { canEditContent } from "@/lib/permissions";
import { CompetitorLogo } from "./competitor-logo";
import { SourceLogo } from "./source-logo";
import { EmptyState, Modal, useConfirmAction } from "./ui";

export function CompetitorDetailView({ id }: { id: string }) {
  const { role } = useAuthProfile();
  const canEdit = canEditContent(role);
  const confirmAction = useConfirmAction();
  const [competitor, setCompetitor] = useState<Competitor | null | undefined>();
  const [links, setLinks] = useState<CompetitorSource[]>([]);
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [label, setLabel] = useState("");
  const [primary, setPrimary] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function load() {
    const [item, connected, allSources] = await Promise.all([getCompetitor(id), getCompetitorSources(id), getSources()]);
    setCompetitor(item); setLinks(connected); setSources(allSources);
  }
  useEffect(() => { load().catch(() => setCompetitor(null)); }, [id]);
  const availableSources = useMemo(() => sources.filter(source => !links.some(link => link.source_id === source.id)), [sources, links]);
  const linkedContent = links.reduce((sum, link) => sum + (link.source?.content_count || 0), 0);

  async function connect(event: React.FormEvent) {
    event.preventDefault(); if (!sourceId) return;
    setBusy(true); setNotice("");
    try { await linkCompetitorSource(id, sourceId, label, primary); setOpen(false); setSourceId(""); setLabel(""); setPrimary(false); await load(); setNotice("Каналът е свързан с конкурента."); }
    catch { setNotice("Каналът не беше свързан."); }
    finally { setBusy(false); }
  }

  async function disconnect(link: CompetitorSource) {
    if (!(await confirmAction({ title: "Премахване на канал", description: `„${link.source?.name || "Източникът"}“ ще бъде премахнат само от този конкурент. Самият източник и съдържанието му ще останат.`, confirmLabel: "Премахни връзката" }))) return;
    setBusy(true); try { await unlinkCompetitorSource(id, link.source_id); setLinks(current => current.filter(item => item.id !== link.id)); setNotice("Връзката с канала е премахната."); } catch { setNotice("Връзката не беше премахната."); } finally { setBusy(false); }
  }

  if (competitor === undefined) return <div className="panel h-64 animate-pulse"/>;
  if (!competitor) return <div className="panel"><EmptyState title="Конкурентът не е намерен" text="Може да е бил премахнат или нямате достъп до него."/></div>;

  return <div className="space-y-5">
    <Link href="/competitors" className="inline-flex items-center gap-2 text-xs font-semibold text-[#687046]"><ArrowLeft size={15}/> Content Spy</Link>
    {notice && <div className="rounded-xl border border-[#d7d6ca] bg-[#f5f4ea] px-4 py-3 text-sm text-[#52621c]">{notice}</div>}
    <section className="panel overflow-hidden">
      <div className="bg-gradient-to-r from-[#eef0df] via-[#fbfaf0] to-[#f2e9e0] p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div className="flex min-w-0 items-start gap-4"><CompetitorLogo name={competitor.name} websiteUrl={competitor.website_url} logoUrl={competitor.logo_url} className="h-14 w-14" imageClassName="h-9 w-9"/><div className="min-w-0"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-white/80 px-3 py-1 text-[10px] font-semibold text-[#657044]">{competitor.industry}</span><span className="rounded-full bg-white/80 px-3 py-1 text-[10px] text-[#77796d]">{competitor.status}</span><span className="rounded-full bg-[#fff1d7] px-3 py-1 text-[10px] font-semibold text-[#865d1e]">{competitor.priority} приоритет</span></div><h1 className="mt-4 text-3xl font-semibold text-[#292b23]">{competitor.name}</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#686a5d]">{competitor.description || "Няма добавено описание."}</p></div></div>
          {competitor.website_url && <a href={competitor.website_url} target="_blank" rel="noreferrer" className="btn-secondary self-start">Отвори сайта <ExternalLink size={14}/></a>}
        </div>
      </div>
      <div className="grid sm:grid-cols-3"><Fact label="Свързани канали" value={String(links.length)}/><Fact label="Намерено съдържание" value={String(linkedContent)}/><Fact label="Последна промяна" value={new Date(competitor.updated_at || competitor.created_at).toLocaleDateString("bg-BG")}/></div>
    </section>

    <div className="grid gap-5 lg:grid-cols-[1.5fr_.7fr]">
      <section className="panel p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-[#34362d]">Публични канали</h2><p className="mt-1 text-[11px] text-[#7b7d70]">Сайт, TikTok, YouTube, RSS и други регистрирани източници.</p></div>{canEdit && <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={14}/> Свържи източник</button>}</div>
        {links.length ? <div className="mt-5 grid gap-3 sm:grid-cols-2">{links.map(link => link.source && <article key={link.id} className="group rounded-xl border border-line bg-white/60 p-4"><div className="flex items-start justify-between gap-3"><SourceLogo name={link.source.name} url={link.source.url} type={link.source.source_type}/>{canEdit && <button type="button" title="Премахни връзката" onClick={() => disconnect(link)} className="rounded-lg p-2 text-[#99958c] opacity-0 hover:bg-[#fff0ed] hover:text-[#9e3029] group-hover:opacity-100"><Trash2 size={14}/></button>}</div><div className="mt-3 flex flex-wrap items-center gap-2"><Link href={`/sources/${link.source.id}`} className="text-sm font-semibold text-[#34362d] hover:text-[#65763e]">{link.source.name}</Link>{link.is_primary && <span title="Основен канал" className="text-[#8a6a34]"><Star size={13} fill="currentColor"/></span>}</div><p className="mt-1 text-[10px] text-[#85877a]">{link.channel_label || link.source.source_type}{link.source.handle ? ` · ${link.source.handle}` : ""}</p><p className="mt-3 text-[10px] text-[#67695d]">{link.source.content_count || 0} свързани записа</p></article>)}</div> : <div className="mt-5 rounded-xl border border-dashed border-[#d7d6ca] bg-[#faf9f1] p-8 text-center"><Link2 className="mx-auto text-[#9a9b8d]"/><p className="mt-3 text-sm font-semibold">Няма свързани канали</p><p className="mt-1 text-xs text-[#85877a]">Свържете вече добавен източник с този конкурент.</p></div>}
      </section>
      <section className="panel p-5 sm:p-6"><h2 className="text-base font-semibold text-[#34362d]">Вътрешни бележки</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#686a5d]">{competitor.notes || "Няма добавени бележки."}</p></section>
    </div>

    <Modal open={open} onClose={() => setOpen(false)} title="Свързване на източник" subtitle="Изберете съществуващ публичен канал на конкурента." size="md"><form onSubmit={connect} className="space-y-4">{availableSources.length ? <><label className="block text-xs text-[#67695d]">Източник<select required autoFocus className="field mt-2" value={sourceId} onChange={event => setSourceId(event.target.value)}><option value="">Изберете източник</option>{availableSources.map(source => <option key={source.id} value={source.id}>{source.name} · {source.source_type}{source.handle ? ` · ${source.handle}` : ""}</option>)}</select></label><label className="block text-xs text-[#67695d]">Име на канала <span className="text-[#9a9b8d]">(незадължително)</span><input className="field mt-2" placeholder="Например: Основен TikTok профил" value={label} onChange={event => setLabel(event.target.value)}/></label><label className="flex items-center gap-3 rounded-xl border border-line bg-[#f7f6ec] p-3 text-xs text-[#67695d]"><input type="checkbox" checked={primary} onChange={event => setPrimary(event.target.checked)} className="h-4 w-4 accent-[#52621c]"/> Основен канал на конкурента</label><div className="flex justify-end gap-2 border-t border-line pt-4"><button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Отказ</button><button disabled={busy || !sourceId} className="btn-primary">{busy ? "Свързване..." : "Свържи канала"}</button></div></> : <div><EmptyState title="Всички източници са свързани" text="Добавете нов източник, ако конкурентът има друг публичен канал."/><div className="mt-4 flex justify-end"><Link href="/sources" className="btn-secondary">Към източниците</Link></div></div>}</form></Modal>
  </div>;
}

function Fact({ label, value }: { label: string; value: string }) { return <div className="border-b border-r border-line p-4 last:border-r-0 sm:border-b-0"><p className="text-[9px] uppercase tracking-wider text-[#898b7f]">{label}</p><p className="mt-1 text-sm font-semibold text-[#34362d]">{value}</p></div>; }
