"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Globe2, Mail, Music2, Radio, Rss, Youtube } from "lucide-react";
import type { ContentSourceType } from "@/lib/types";

type SourceLogoProps = {
  name: string;
  url?: string | null;
  type: ContentSourceType;
  className?: string;
  imageClassName?: string;
};

function faviconSources(value?: string | null) {
  if (!value) return [];
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return [];
    return [
      `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url.origin)}&sz=128`,
      `${url.origin}/favicon.ico`,
    ];
  } catch {
    return [];
  }
}

function fallbackIcon(type: ContentSourceType) {
  return type === "TikTok" ? Music2
    : type === "YouTube" ? Youtube
    : type === "RSS" ? Rss
    : type === "Бюлетин" ? Mail
    : type === "Вътрешен" ? FileText
    : type === "Блог" ? Radio
    : Globe2;
}

export function SourceLogo({ name, url, type, className = "h-11 w-11", imageClassName = "h-7 w-7" }: SourceLogoProps) {
  const sources = useMemo(() => faviconSources(url), [url]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSourceIndex(0);
    setFailed(false);
  }, [url]);

  const FallbackIcon = fallbackIcon(type);
  const showImage = sources.length > 0 && !failed;

  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border border-[#e4e3d9] bg-white shadow-[0_3px_10px_rgba(55,56,42,.07)] ${className}`} title={`${name} · ${type}`}>
      {showImage ? (
        <img
          src={sources[sourceIndex]}
          alt={`Лого на ${name}`}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          className={`object-contain ${imageClassName}`}
          onError={() => {
            if (sourceIndex + 1 < sources.length) setSourceIndex(index => index + 1);
            else setFailed(true);
          }}
        />
      ) : (
        <FallbackIcon size={20} className="text-[#62703f]" aria-hidden="true"/>
      )}
    </span>
  );
}
