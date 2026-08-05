"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslation } from "@/lib/i18n/client";

export function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);
  const [logoReady, setLogoReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    // Reveal logo with a slight delay
    const logoTimer = setTimeout(() => setLogoReady(true), 150);
    
    // Start fading out the entire splash screen
    const fadeTimer = setTimeout(() => setFade(true), 2600);
    const hideTimer = setTimeout(() => setShow(false), 3300);

    // Fast and smooth counter to 100%
    const progInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) return 100;
        const inc = Math.random() * 6 + 2; 
        return Math.min(p + inc, 100);
      });
    }, 50);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
      clearInterval(progInterval);
    };
  }, []);

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes scaleIn {
          0% { transform: scale(0.6) translateY(40px); opacity: 0; }
          60% { transform: scale(1.05) translateY(-5px); opacity: 1; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes rotateGlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .bg-animated {
          background: linear-gradient(-45deg, #051c14, #0d3b2e, #165e3b, #0d3b2e);
          background-size: 300% 300%;
          animation: gradientMove 8s ease infinite;
        }

        .spinner-ring {
          position: absolute;
          inset: -3px;
          border-radius: 35px;
          background: conic-gradient(from 0deg, transparent 0%, transparent 60%, rgba(202,175,107,1) 100%);
          animation: rotateGlow 2s linear infinite;
          z-index: 0;
        }

        .icon-container {
          position: relative;
          z-index: 10;
          border-radius: 32px;
          background: #0d3b2e;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05);
        }
      `}</style>

      <div
        className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out ${
          fade ? "opacity-0 pointer-events-none" : "opacity-100"
        } bg-animated`}
      >
        {/* Main content block */}
        <div 
          className="flex flex-col items-center"
          style={{
            opacity: logoReady ? 1 : 0,
            animation: logoReady ? "scaleIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards" : "none",
          }}
        >
          {/* Logo with spinning border and float */}
          <div style={{ animation: "float 4s ease-in-out infinite" }}>
            <div className="relative">
              <div className="spinner-ring" />
              <div className="icon-container">
                <Image
                  src="/icon.png"
                  alt="Groszyk"
                  width={128}
                  height={128}
                  priority
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <h1 className="mt-10 text-4xl font-black tracking-tight text-white drop-shadow-lg">
            {t("app.title")}
          </h1>
          <p className="mt-2 text-[13px] font-bold tracking-[0.25em] text-[#caaf6b] uppercase opacity-90 drop-shadow-md">
            {t("app.subtitle")}
          </p>
        </div>

        {/* Loading Progress Section */}
        <div className="absolute bottom-16 flex flex-col items-center w-full max-w-[220px]">
          <div className="flex justify-between w-full text-[10px] font-bold text-white/60 mb-2.5 uppercase tracking-widest px-1">
            <span>{t('app.loading')}</span>
            <span className="text-[#caaf6b] tabular-nums">{Math.floor(progress)}%</span>
          </div>
          <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden relative shadow-inner">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#8a7238] to-[#caaf6b] rounded-full transition-all duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
