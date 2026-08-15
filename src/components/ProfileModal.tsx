"use client";

import { useState, useEffect } from "react";
import { LogOut, X, Moon, Sun, Monitor } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { useTranslation } from "@/lib/i18n/client";
import { setLocale, updateUserName, getUserNickname } from "@/app/actions";
import { Check, Loader2 } from "lucide-react";

export function ProfileModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [nickname, setNickname] = useState("");
  const [isSavingNickname, setIsSavingNickname] = useState(false);
  const { t, locale } = useTranslation();
  const { data: session } = useSession();

  const email = session?.user?.email || "";
  
  const getAvatar = () => {
    if (email.includes("i.ds.orlik")) return "👨🏻";
    if (email.includes("zingelanna5")) return "👩🏼";
    return "👤";
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
      getUserNickname().then(name => setNickname(name || ""));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div className="flex items-center gap-2">
        {(nickname || email.split("@")[0]) && (
          <span className="text-sm font-medium text-foreground truncate max-w-40">
            {t('app.hello')}, {nickname || email.split("@")[0]}
          </span>
        )}
        <button 
          onClick={() => setIsOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-2xl leading-none pb-1 shrink-0"
        >
          {getAvatar()}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-end sm:items-center justify-center bg-black/50 sm:p-4">
          <div className="w-full max-w-sm bg-background rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-border">
              <h2 className="text-xl font-bold">{t('profile.title')}</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-muted rounded-full text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 pb-10 sm:pb-6 space-y-6">
              
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

              {/* Push Notifications */}
              <div>
                <button 
                  onClick={async () => {
                    if (!("Notification" in window)) {
                      alert("This browser does not support push notifications.");
                      return;
                    }
                    const permission = await Notification.requestPermission();
                    if (permission === "granted") {
                      try {
                        const registration = await navigator.serviceWorker.ready;
                        let subscription = await registration.pushManager.getSubscription();
                        if (!subscription) {
                          const response = await fetch("/api/push/vapid-public-key");
                          const { publicKey } = await response.json();
                          subscription = await registration.pushManager.subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: publicKey
                          });
                        }
                        await fetch("/api/push/subscribe", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(subscription)
                        });
                        alert(locale === 'uk' ? "Сповіщення увімкнено!" : "Уведомления включены!");
                      } catch (err) {
                        console.error("Failed to subscribe to push notifications", err);
                        alert(locale === 'uk' ? "Помилка при налаштуванні сповіщень." : "Ошибка при настройке уведомлений.");
                      }
                    } else {
                      alert(locale === 'uk' ? "Ви відхилили дозвіл на сповіщення." : "Вы отклонили разрешение на уведомления.");
                    }
                  }}
                  className="w-full p-3 flex items-center justify-center gap-2 border-2 border-primary/20 text-primary font-medium rounded-xl hover:bg-primary/10 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                  {locale === 'uk' ? 'Увімкнути сповіщення' : 'Включить уведомления'}
                </button>
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
