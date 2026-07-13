"use client";

import { Star } from "lucide-react";

type ToolRatingProps = {
  value?: number | null;
  onChange?: (value: number) => void;
  compact?: boolean;
};

export function ToolRating({ value = 0, onChange, compact = false }: ToolRatingProps) {
  const rating = Math.min(5, Math.max(0, Number(value) || 0));
  const rounded = Math.round(rating);
  const iconSize = compact ? 11 : 16;

  return (
    <div className="flex items-center gap-1.5" aria-label={`Рейтинг ${rating.toFixed(1)} от 5`}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => {
          const icon = <Star size={iconSize} fill={star <= rounded ? "currentColor" : "none"}/>;
          return onChange ? (
            <button
              key={star}
              type="button"
              title={`${star} от 5`}
              aria-label={`Оценка ${star} от 5`}
              onClick={() => onChange(star)}
              className={`rounded-sm p-0.5 transition hover:scale-110 hover:text-[#697a25] ${star <= rounded ? "text-[#7b8f2a]" : "text-[#c7c7ba]"}`}
            >
              {icon}
            </button>
          ) : (
            <span key={star} className={star <= rounded ? "text-[#7b8f2a]" : "text-[#c7c7ba]"} aria-hidden="true">{icon}</span>
          );
        })}
      </div>
      <span className={`${compact ? "text-[9px]" : "text-xs"} font-semibold tabular-nums text-[#606254]`}>{rating.toFixed(1)}</span>
    </div>
  );
}
