"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AddEnvelopeModal } from "./AddEnvelopeModal";
import { EnvelopeDetailsModal } from "./EnvelopeDetailsModal";
import { getCurrencySymbol, getCurrencyColor } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/client";
import { Wallet, CreditCard } from "lucide-react";

type Envelope = {
  id: string;
  name: string;
  currency: "PLN" | "USD" | "EUR";
  color: string;
  icon?: string;
  transactions: { id: string; amount: number | string; type: string; is_paid?: boolean; created_at: string; label?: string | null; users?: { email?: string | null } | null }[] | null;
  scope: string;
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

          return (
            <div 
              key={env.id} 
              onClick={() => setSelectedEnvelopeId(env.id)}
              className="p-4 bg-card rounded-xl border border-border shadow-sm flex flex-col justify-between cursor-pointer hover:border-primary/50 transition-colors active:scale-95"
            >
              <div>
                <div className="flex items-center gap-2">
                  {env.icon === 'credit' ? <CreditCard className="w-4 h-4 text-muted-foreground" /> : <Wallet className="w-4 h-4 text-muted-foreground" />}
                  <p className="font-medium">{env.name}</p>
                </div>
                <p className={`text-xl font-bold mt-2 ${getCurrencyColor(env.currency)}`}>
                  {envBalance.toFixed(2)} {getCurrencySymbol(env.currency)}
                </p>
              </div>
              {!hasIncomeThisMonth && (
                <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t border-border/50">
                  {t('envelope.not_topped_up_this_month')}
                </p>
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
