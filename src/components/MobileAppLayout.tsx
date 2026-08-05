"use client";

import { Navigation } from "./Navigation";
import { LoginButton } from "./LoginButton";
import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useTranslation } from "@/lib/i18n/client";

export function MobileAppLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center max-w-md mx-auto">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold tracking-tight">{t('app.title')}</h1>
          <p className="text-muted-foreground">{t('app.subtitle')}</p>
          <LoginButton />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg w-full mx-auto min-h-screen relative bg-background flex flex-col shadow-xl overflow-x-hidden">
      <main className="flex-1 pb-16 overflow-y-auto">
        {children}
      </main>
      <Navigation />
    </div>
  );
}
