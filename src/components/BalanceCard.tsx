"use client";

import { useState } from "react";
import { EditableGreeting } from "./EditableGreeting";

interface BalanceCardProps {
  balance: number;
  plannedExpenses: number;
  fallbackText: string;
  texts: {
    currentBalance: string;
    plannedExpenses: string;
    freeMoney: string;
  };
}

export function BalanceCard({ balance, plannedExpenses, fallbackText, texts }: BalanceCardProps) {
  const [showFreeMoney, setShowFreeMoney] = useState(false);
  const freeMoney = balance - plannedExpenses;

  return (
    <div className="flex flex-col gap-2">
      <div 
        className="relative overflow-hidden rounded-2xl p-6 shadow-xl shadow-emerald-900/20 bg-linear-to-tr from-emerald-950 via-teal-900 to-emerald-900 border border-emerald-700/50 text-white cursor-pointer transition-transform active:scale-[0.98]"
        onClick={() => setShowFreeMoney((prev) => !prev)}
      >
        {/* Decorative elements */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col h-full justify-between gap-8">
          {/* Top Row: Chip and Logo */}
          <div className="flex justify-between items-start">
            <svg className="w-10 h-10 text-yellow-500/80" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 6h16v12H4V6zm2 2v2h3V8H6zm0 4v2h3v-2H6zm0 4v2h3v-2H6zm10-8v2h2V8h-2zm0 4v2h2v-2h-2zm0 4v2h2v-2h-2zm-5-8v8h3V8h-3z" opacity=".8"/>
              <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
            </svg>
            <div onClick={(e) => e.stopPropagation()}>
              <EditableGreeting fallbackText={fallbackText} />
            </div>
          </div>
          
          {/* Middle: Balance */}
          <div>
            <p className="text-sm font-medium text-slate-400 mb-1">{texts.currentBalance}</p>
            <h2 className="text-4xl font-bold tracking-tight text-white">
              {balance.toFixed(2)} <span className="text-2xl font-normal text-slate-300">zł</span>
            </h2>
          </div>
          
          {/* Bottom Row: Planned Expenses */}
          <div className="flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">{texts.plannedExpenses}</span>
              <span className="font-semibold text-lg text-slate-200">{plannedExpenses.toFixed(2)} zł</span>
            </div>
            <div className="flex items-center gap-1.5 opacity-80">
              <div className="w-6 h-6 rounded-full bg-red-500 mix-blend-screen"></div>
              <div className="w-6 h-6 rounded-full bg-yellow-500 mix-blend-screen -ml-3"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Free Money Banner */}
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${showFreeMoney ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="bg-yellow-400/90 text-yellow-950 px-4 py-3 rounded-xl shadow-sm border border-yellow-300/50 flex justify-between items-center mx-1">
          <span className="font-medium text-sm">{texts.freeMoney}</span>
          <span className="font-bold text-lg">{freeMoney.toFixed(2)} zł</span>
        </div>
      </div>
    </div>
  );
}
