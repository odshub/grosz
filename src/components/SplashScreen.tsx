"use client";

import { useEffect, useState } from "react";
import { PiggyBank, CircleDollarSign } from "lucide-react";

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Start fading out after 2 seconds
    const timer1 = setTimeout(() => setFade(true), 2000);
    const timer2 = setTimeout(() => setShow(false), 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes coinDrop {
          0% { transform: translateY(-80px) scale(1); opacity: 0; }
          20% { transform: translateY(-40px) scale(1); opacity: 1; }
          70% { transform: translateY(0px) scale(1); opacity: 1; }
          90% { transform: translateY(15px) scale(0.5); opacity: 0; }
          100% { transform: translateY(15px) scale(0); opacity: 0; }
        }
        .animate-coin-drop {
          animation: coinDrop 1.2s ease-in-out infinite;
        }
      `}</style>
      <div 
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-background transition-opacity duration-500 ease-in-out ${
          fade ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="relative w-32 h-32 flex items-center justify-center mb-6">
          <CircleDollarSign 
            className="absolute top-0 w-8 h-8 text-yellow-500 fill-yellow-100 dark:fill-yellow-900/50 animate-coin-drop" 
            style={{ zIndex: 1 }} 
            strokeWidth={1.5} 
          />
          <PiggyBank 
            className="w-24 h-24 text-primary fill-background relative" 
            style={{ zIndex: 10 }}
            strokeWidth={1.5} 
          />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Mój Groszyk</h1>
      </div>
    </>
  );
}
