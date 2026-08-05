"use client";

import { useState, useEffect } from "react";
import { LogOut, X, Fish, Moon, Sun, Monitor } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useTranslation } from "@/lib/i18n/client";
import { setLocale, updateUserName, getUserNickname } from "@/app/actions";
import { Check, Loader2 } from "lucide-react";

const FishIcon = () => <Fish className="w-8 h-8" strokeWidth={1.5} />;

const LionIcon = () => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="w-8 h-8"
  >
    {/* Mane (outer wavy circle effect via simple path) */}
    <path d="M12 22c5.5 0 10-4.5 10-10S17.5 2 12 2 2 6.5 2 12s4.5 10 10 10z" />
    {/* Face (inner circle) */}
    <circle cx="12" cy="12" r="6" />
    {/* Eyes */}
    <path d="M10 11h.01" />
    <path d="M14 11h.01" />
    {/* Nose/Mouth */}
    <path d="M12 13v1" />
    {/* Whiskers */}
    <path d="M6 12h2" />
    <path d="M16 12h2" />
    <path d="M7 14l1.5-1" />
    <path d="M15.5 13l1.5 1" />
  </svg>
);

export function ProfileModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [avatar, setAvatar] = useState<"fish" | "lion">("lion");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const { t, locale } = useTranslation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      const saved = localStorage.getItem("groszyk_avatar");
      if (saved === "fish" || saved === "lion") {
        setAvatar(saved);
      }
      getUserNickname().then(name => setNickname(name || ""));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleAvatarChange = (choice: "fish" | "lion") => {
    setAvatar(choice);
    localStorage.setItem("groszyk_avatar", choice);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-full hover:bg-muted text-primary transition-colors"
      >
        {avatar === "fish" ? <FishIcon /> : <LionIcon />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 sm:p-4">
          <div className="w-full max-w-sm bg-background rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-border">
              <h2 className="text-xl font-bold">{t('profile.title')}</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-muted rounded-full text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 pb-10 sm:pb-6 space-y-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3 text-center">{t('profile.choose_avatar')}</p>
                <div className="flex items-center justify-center gap-6">
                  <button 
                    onClick={() => handleAvatarChange("fish")}
                    className={`p-4 rounded-xl border-2 transition-all ${avatar === "fish" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                  >
                    <FishIcon />
                  </button>
                  <button 
                    onClick={() => handleAvatarChange("lion")}
                    className={`p-4 rounded-xl border-2 transition-all ${avatar === "lion" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                  >
                    <LionIcon />
                  </button>
                </div>
              </div>
              
              {/* Nickname Selection */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3 text-center">{t('profile.nickname')}</p>
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder={t('profile.nickname_placeholder') as string}
                    className="flex-1 px-4 py-2 rounded-xl border border-border bg-background"
                  />
                  <button 
                    onClick={async () => {
                      setIsSavingNickname(true);
                      await updateUserName(nickname);
                      setIsSavingNickname(false);
                    }}
                    disabled={isSavingNickname}
                    className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center min-w-10"
                    title={t('profile.nickname_save') as string}
                  >
                    {isSavingNickname ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              {/* Theme Selection */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3 text-center">{t('profile.appearance')}</p>
                <div className="flex items-center justify-center gap-4">
                  <button 
                    onClick={() => setTheme("light")}
                    className={`p-3 rounded-xl border-2 transition-all ${mounted && theme === "light" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                  >
                    <Sun className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setTheme("dark")}
                    className={`p-3 rounded-xl border-2 transition-all ${mounted && theme === "dark" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                  >
                    <Moon className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => setTheme("system")}
                    className={`p-3 rounded-xl border-2 transition-all ${mounted && theme === "system" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                  >
                    <Monitor className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Language Selection */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3 text-center">{t('profile.language')}</p>
                <div className="flex items-center justify-center gap-4">
                  <button 
                    onClick={() => setLocale("uk")}
                    className={`px-4 py-2 rounded-xl border-2 transition-all font-semibold ${locale === "uk" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                  >
                    UK
                  </button>
                  <button 
                    onClick={() => setLocale("ru")}
                    className={`px-4 py-2 rounded-xl border-2 transition-all font-semibold ${locale === "ru" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}
                  >
                    RU
                  </button>
                </div>
              </div>
              
              <button 
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full p-4 flex items-center justify-center gap-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-bold rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                {t('btn.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
