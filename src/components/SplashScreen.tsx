"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/client";

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);
  const [ready, setReady] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const readyTimer = setTimeout(() => setReady(true), 50);
    
    // Start fade out at 1.6s
    const fadeTimer = setTimeout(() => setFade(true), 1600);
    
    // Remove from DOM at 2.0s
    const hideTimer = setTimeout(() => setShow(false), 2000);

    return () => {
      clearTimeout(readyTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-100 flex flex-col items-center justify-center bg-background transition-all duration-400 ease-in-out ${
        fade ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
      }`}
    >
      <div 
        className="flex flex-col items-center justify-center gap-8 transition-all duration-500 ease-out"
        style={{
          opacity: ready ? 1 : 0,
          transform: ready ? "translateY(0)" : "translateY(10px)",
        }}
      >
        <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl shadow-2xl">
          {/* Контейнер для ефекту контуру */}
          <div className="absolute -inset-[3.5px] rounded-[1.75rem] overflow-hidden bg-primary/10">
             {/* Spinning gradient */}
             <div 
               className="absolute inset-[-100%] animate-[spin_1.5s_linear_infinite] opacity-90" 
               style={{ background: 'conic-gradient(from 0deg, transparent 40%, var(--color-primary) 100%)' }}
             />
          </div>
          
          {/* Логотип */}
          <div className="absolute inset-0 overflow-hidden rounded-3xl bg-background z-10 flex items-center justify-center p-[2px]">
            <div className="w-full h-full rounded-[1.3rem] overflow-hidden bg-muted/20">
              <Image
                src="/icon.png"
                alt="Groszyk"
                width={96}
                height={96}
                priority
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Назва застосунку */}
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("app.title")}
        </h1>
      </div>
    </div>
  );
}
