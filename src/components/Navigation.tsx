"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Users, Wallet, FileText } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useEffect, useState } from "react";
import { getNotesCount } from "@/app/actions";
import { useTranslation } from "@/lib/i18n/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { href: "/", labelKey: "nav.personal" as const, icon: User },
  { href: "/shared", labelKey: "nav.shared" as const, icon: Users },
  { href: "/transactions", labelKey: "nav.history" as const, icon: Wallet },
  { href: "/notepad", labelKey: "nav.notes" as const, icon: FileText, showBadge: true },
];

export function Navigation() {
  const pathname = usePathname();
  const [notesCount, setNotesCount] = useState<number | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    getNotesCount().then(setNotesCount);
  }, [pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border pb-safe">
      <div className="max-w-md mx-auto flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
                {item.showBadge && notesCount !== null && notesCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center shadow-sm">
                    {notesCount > 99 ? "99+" : notesCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
