"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddEnvelopeModal } from "./AddEnvelopeModal";
import { EnvelopeDetailsModal } from "./EnvelopeDetailsModal";
import { getCurrencySymbol, getCurrencyColor } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import { CreditCard } from "lucide-react";

type Envelope = {
  id: string;
  name: string;
  currency: "PLN" | "USD" | "EUR";
  color: string;
  icon?: string;
  transactions: { id: string; amount: number | string; type: string; is_paid?: boolean; created_at: string; label?: string | null; users?: { email?: string | null } | null }[] | null;
  scope: string;
  is_monthly_contribution?: boolean;
};

export function EnvelopesList({ envelopes, isSharedPage, currentMonthStart }: { envelopes: Envelope[], isSharedPage: boolean, currentMonthStart: string }) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedEnvelopeId, setSelectedEnvelopeId] = useState<string | null>(null);
  const { t } = useTranslation();

  const selectedEnvelope = selectedEnvelopeId 
    ? envelopes.find(e => e.id === selectedEnvelopeId) || null 
    : null;

  return (
    <div className="space-y-4">
      <button 
        onClick={() => setIsAddOpen(true)}
        className="w-full flex items-center justify-center gap-2 p-4 bg-primary/10 text-primary font-medium rounded-xl hover:bg-primary/20 transition-colors"
      >
        <Plus className="w-5 h-5" /> {t('btn.create_envelope')}
      </button>

      <div className="grid grid-cols-2 gap-3 mt-4">
        {envelopes.map((env) => {
          const envBalance = (env.transactions || []).reduce((acc: number, t) => 
            t.is_paid !== false ? (t.type === "INCOME" ? acc + Number(t.amount) : acc - Number(t.amount)) : acc
          , 0);

          const hasIncomeThisMonth = (env.transactions || []).some(t => 
            t.type === "INCOME" && new Date(t.created_at) >= new Date(currentMonthStart)
          );

          const isCard = env.icon === 'credit';

          if (isCard) {
            return (
              <div 
                key={env.id}
                onClick={() => setSelectedEnvelopeId(env.id)}
                className="relative p-4 rounded-xl shadow-md cursor-pointer transition-transform hover:-translate-y-1 active:scale-95 h-32 flex flex-col justify-between overflow-hidden group" 
                style={{ background: `linear-gradient(135deg, ${env.color || '#333'} 0%, #1a1a1a 100%)` }}
              >
                <div className="absolute top-0 right-0 p-2 opacity-10 transition-transform group-hover:scale-110">
                  <CreditCard className="w-20 h-20 transform rotate-12" />
                </div>
                
                <div className="relative z-10 flex justify-between items-start text-white/90">
                  <div className="w-8 h-6 rounded bg-white/20 flex items-center justify-center shadow-sm">
                    <div className="w-5 h-3 border border-white/40 rounded-sm opacity-70" />
                  </div>
                  <CreditCard className="w-5 h-5 opacity-70" />
                </div>
                
                <div className="relative z-10 text-white mt-auto">
                  <p className="text-[10px] text-white/60 uppercase tracking-wider truncate mb-0.5">{env.name}</p>
                  <p className="text-lg font-bold tracking-tight">
                    {envBalance.toFixed(2)} {getCurrencySymbol(env.currency)}
                  </p>
                </div>
                
                {!hasIncomeThisMonth && (env.is_monthly_contribution ?? false) && (
                  <div className="absolute top-3 right-3 z-40 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" title={t('envelope.not_topped_up_this_month')} />
                )}
              </div>
            );
          }

          // Envelope Style
          return (
            <div 
              key={env.id}
              onClick={() => setSelectedEnvelopeId(env.id)}
              className="group relative rounded-xl shadow-sm hover:shadow-md cursor-pointer h-32 flex flex-col justify-end overflow-hidden border border-border transition-all" 
              style={{ backgroundColor: `${env.color}10` }}
            >
              {/* Back of the envelope inside shadow */}
              <div className="absolute inset-x-0 top-0 h-6 bg-linear-to-b from-black/5 to-transparent z-10" />

              {/* The "Money" inside */}
              <div className="absolute top-[25%] left-[20%] right-[20%] z-20 h-[50%] flex justify-center transition-transform duration-300 group-hover:-translate-y-6">
                <div className="absolute w-[90%] h-full bg-green-500/20 border border-green-500/40 rounded-sm transform -rotate-12 origin-bottom-left" />
                <div className="absolute w-[90%] h-full bg-green-500/30 border border-green-500/50 rounded-sm transform rotate-6 origin-bottom-right" />
                <div className="absolute w-[90%] h-full bg-green-500/50 border border-green-500/60 rounded-sm flex items-center justify-center">
                  <div className="w-[50%] h-[40%] border border-green-500/40 rounded-full opacity-60" />
                </div>
              </div>

              {/* Side flaps (Front layer 1) */}
              <div className="absolute top-0 bottom-0 left-0 w-[50%] z-30 drop-shadow-sm" style={{ backgroundColor: `${env.color}15`, clipPath: 'polygon(0 0, 100% 50%, 0 100%)' }} />
              <div className="absolute top-0 bottom-0 right-0 w-[50%] z-30 drop-shadow-sm" style={{ backgroundColor: `${env.color}15`, clipPath: 'polygon(100% 0, 0 50%, 100% 100%)' }} />
              
              {/* Bottom flap (Front layer 2) */}
              <div className="absolute bottom-0 left-0 right-0 h-[65%] z-40 drop-shadow-sm" style={{ backgroundColor: `${env.color}35`, clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' }} />
              
              {/* Info text on front */}
              <div className="relative z-50 mb-2 mx-2 bg-background/80 backdrop-blur-md rounded-lg p-1.5 text-center shadow-sm border border-border/30">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground truncate w-full">{env.name}</p>
                <p className={`text-[0.95rem] font-bold tracking-tight leading-none mt-1 ${getCurrencyColor(env.currency)}`}>
                  {envBalance.toFixed(2)} <span className="text-[10px]">{getCurrencySymbol(env.currency)}</span>
                </p>
              </div>
              
              {!hasIncomeThisMonth && (env.is_monthly_contribution ?? false) && (
                <div className="absolute top-3 right-3 z-50 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" title={t('envelope.not_topped_up_this_month')} />
              )}
            </div>
          );
        })}
      </div>

      {isAddOpen && <AddEnvelopeModal isSharedPage={isSharedPage} onClose={() => setIsAddOpen(false)} />}
      {selectedEnvelope && <EnvelopeDetailsModal envelope={selectedEnvelope} isSharedPage={isSharedPage} onClose={() => setSelectedEnvelopeId(null)} />}
    </div>
  );
}
