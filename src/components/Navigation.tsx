"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Users, Wallet, CreditCard, Gauge } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useTranslation } from "@/lib/i18n/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { href: "/", labelKey: "nav.personal" as const, icon: User },
  { href: "/shared", labelKey: "nav.shared" as const, icon: Users },
  { href: "/transactions", labelKey: "nav.history" as const, icon: Wallet },
  { href: "/meters", labelKey: "nav.meters" as const, icon: Gauge },
  { href: "/credits", labelKey: "nav.credits" as const, icon: CreditCard },
];

export function Navigation() {
  const pathname = usePathname();
  const { t } = useTranslation();

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
              <Icon className={cn("w-5 h-5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
              <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

