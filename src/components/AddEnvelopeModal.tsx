"use client";

import { useState } from "react";
import { addEnvelope } from "@/app/actions";
import { useTranslation } from "@/lib/i18n/client";
import { Wallet, CreditCard } from "lucide-react";

export function AddEnvelopeModal({ onClose, isSharedPage = false }: { onClose: () => void, isSharedPage?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [icon, setIcon] = useState<"cash" | "credit">("cash");
  const [isMonthlyContribution, setIsMonthlyContribution] = useState(true);
  const { t } = useTranslation();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    await addEnvelope(formData);
    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full max-w-sm p-6 pb-10 sm:pb-6 bg-background rounded-t-2xl sm:rounded-xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{t('modal.envelope.add_title')}</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-muted rounded-full">
            ✕
          </button>
        </div>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="isShared" value={isSharedPage ? "true" : "false"} />
          <input type="hidden" name="icon" value={icon} />
          <div>
            <label className="block text-sm font-medium mb-1">{t('modal.envelope.name_label')}</label>
            <input type="text" name="name" required className="w-full p-3 bg-muted rounded-lg outline-none" placeholder={t('modal.envelope.name_placeholder') as string} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t('modal.envelope.currency_label')}</label>
            <select name="currency" className="w-full p-3 bg-muted rounded-lg outline-none">
              <option value="PLN">PLN (zł)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Тип конверта</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIcon("cash")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${icon === 'cash' ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:bg-muted'}`}
              >
                <Wallet className="w-4 h-4" />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setIcon("credit")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-colors ${icon === 'credit' ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-border hover:bg-muted'}`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Credit</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between p-3 bg-muted rounded-xl cursor-pointer" onClick={() => setIsMonthlyContribution(!isMonthlyContribution)}>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Щомісячний внесок</span>
                <span className="text-xs text-muted-foreground">Нагадування про поповнення</span>
              </div>
              <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isMonthlyContribution ? "bg-primary" : "bg-border/60"}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isMonthlyContribution ? "translate-x-6" : "translate-x-0"}`} />
              </div>
              <input type="hidden" name="isMonthlyContribution" value={isMonthlyContribution ? "true" : "false"} />
            </div>
          </div>
          <button disabled={loading} type="submit" className="w-full p-4 bg-primary text-primary-foreground font-bold rounded-xl mt-4">
            {loading ? t('modal.envelope.creating') : t('modal.envelope.create_btn')}
          </button>
        </form>
      </div>
    </div>
  );
}
