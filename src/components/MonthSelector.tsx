"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useTranslation } from "@/lib/i18n/client";

export function MonthSelector({ months }: { months: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMonth = searchParams.get("month") || months[0];
  const scrollRef = useRef<HTMLDivElement>(null);

  const { locale } = useTranslation();

  useEffect(() => {
    if (scrollRef.current) {
      const activeEl = scrollRef.current.querySelector("[data-active=\"true\"]");
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [currentMonth]);

  const handleSelect = (month: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", month);
    router.push("/transactions?" + params.toString());
  };

  const formatMonth = (monthStr: string) => {
    const date = new Date(`${monthStr}-01`);
    const formatted = new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "uk-UA", { month: "long", year: "numeric" }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  };

  return (
    <div className="relative w-full overflow-hidden mb-6">
      <div 
        ref={scrollRef}
        className="flex overflow-x-auto hide-scrollbar gap-2 px-4 py-2 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {months.map(month => {
          const isActive = month === currentMonth;
          return (
            <button
              key={month}
              data-active={isActive}
              onClick={() => handleSelect(month)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${isActive ? "bg-primary text-primary-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              {formatMonth(month)}
            </button>
          );
        })}
      </div>
      <style dangerouslySetInnerHTML={{__html: ".hide-scrollbar::-webkit-scrollbar { display: none; }"}} />
    </div>
  );
}
