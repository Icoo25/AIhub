"use client";

import { useEffect, useMemo, useState } from "react";
import { Building2 } from "lucide-react";

function logoSources(logoUrl?: string | null, websiteUrl?: string | null) {
  const values: string[] = [];
  if (logoUrl) values.push(logoUrl);
  if (websiteUrl) {
    try {
      const url = new URL(websiteUrl);
      if (url.protocol === "http:" || url.protocol === "https:") values.push(`https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url.origin)}&sz=128`, `${url.origin}/favicon.ico`);
    } catch {}
  }
  return values;
}

export function CompetitorLogo({ name, websiteUrl, logoUrl, className = "h-12 w-12", imageClassName = "h-8 w-8" }: { name: string; websiteUrl?: string | null; logoUrl?: string | null; className?: string; imageClassName?: string }) {
  const sources = useMemo(() => logoSources(logoUrl, websiteUrl), [logoUrl, websiteUrl]);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setIndex(0); setFailed(false); }, [logoUrl, websiteUrl]);
  return <span className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border border-[#e4e3d9] bg-white shadow-[0_3px_10px_rgba(55,56,42,.07)] ${className}`} title={name}>{sources.length && !failed ? <img src={sources[index]} alt={`Лого на ${name}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" className={`object-contain ${imageClassName}`} onError={() => index + 1 < sources.length ? setIndex(value => value + 1) : setFailed(true)}/> : <Building2 size={21} className="text-[#62703f]"/>}</span>;
}
