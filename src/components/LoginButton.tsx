"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { LogIn, LogOut } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";

export function LoginButton() {
  const { t } = useTranslation();
  const { data: session } = useSession();

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">{session.user?.email}</span>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md"
        >
          <LogOut className="w-4 h-4" />
          {t('btn.logout')}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md"
    >
      <LogIn className="w-4 h-4" />
      {t('btn.login_google')}
    </button>
  );
}
