"use client";

import { useEffect, useMemo, useState } from "react";

type ToolIconProps = {
  name: string;
  websiteUrl?: string | null;
  className?: string;
  imageClassName?: string;
};

function faviconSources(websiteUrl?: string | null) {
  if (!websiteUrl) return [];

  try {
    const url = new URL(websiteUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return [];

    return [
      `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(url.origin)}&sz=128`,
      `${url.origin}/favicon.ico`,
    ];
  } catch {
    return [];
  }
}

export function ToolIcon({ name, websiteUrl, className = "h-11 w-11", imageClassName = "h-7 w-7" }: ToolIconProps) {
  const sources = useMemo(() => faviconSources(websiteUrl), [websiteUrl]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSourceIndex(0);
    setFailed(false);
  }, [websiteUrl]);

  const showImage = sources.length > 0 && !failed;
  const initial = name.trim().charAt(0).toLocaleUpperCase("bg-BG") || "AI";

  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-xl border border-[#e4e3d9] bg-white shadow-[0_3px_10px_rgba(55,56,42,.07)] ${className}`}>
      {showImage ? (
        <img
          src={sources[sourceIndex]}
          alt=""
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
        <span className="text-sm font-semibold text-[#52621c]" aria-hidden="true">{initial}</span>
      )}
    </span>
  );
}
