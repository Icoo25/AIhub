"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSource } from "@/lib/data";
import type { ContentSource } from "@/lib/types";
import { SourceLogo } from "./source-logo";

export function SourceAttribution({ sourceId }: { sourceId?: string | null }) {
  const [source, setSource] = useState<ContentSource | null>(null);
  useEffect(() => { if (sourceId) getSource(sourceId).then(setSource).catch(() => setSource(null)); }, [sourceId]);
  if (!source) return null;
  return <Link href={`/sources/${source.id}`} className="flex items-center gap-3 rounded-xl border border-[#dce1c8] bg-[#f5f7eb] p-3 transition hover:border-[#b7c18f]"><SourceLogo name={source.name} url={source.url} type={source.source_type} className="h-9 w-9" imageClassName="h-5 w-5"/><span><span className="block text-[9px] uppercase tracking-wider text-[#898b7f]">Източник</span><span className="mt-0.5 block text-xs font-semibold text-[#414436]">{source.name}{source.handle ? ` · ${source.handle}` : ""}</span></span></Link>;
}
