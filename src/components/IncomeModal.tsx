"use client";

import { useState } from "react";
import { addTransaction } from "@/app/actions";
import { useTranslation } from "@/lib/i18n/client";

interface IncomeModalProps {
  onClose: () => void;
  isSharedPage?: boolean;
}

export function IncomeModal({ onClose, isSharedPage = false }: IncomeModalProps) {
  const [loading, setLoading] = useState(false);
  const [isShared, setIsShared] = useState(isSharedPage);
  const { t } = useTranslation();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    formData.append("type", "INCOME");
    formData.append("expenseType", "FIXED");
    await addTransaction(formData);
    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-md bg-background rounded-t-2xl sm:rounded-xl shadow-xl max-h-[90vh] flex flex-col border-t-4 border-green-500">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-xl font-bold text-green-600 dark:text-green-500">{t('modal.income.title')}</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-muted rounded-full">
            ✕
          </button>
        </div>
        
        <div className="p-6 pb-10 sm:pb-6 overflow-y-auto">
          <form action={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">{t('modal.income.amount')}</label>
              <input type="number" name="amount" step="0.01" required className="w-full p-3 bg-muted rounded-lg outline-none font-bold text-green-600 dark:text-green-400" placeholder="0.00" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('modal.income.label')}</label>
              <input type="text" name="label" required className="w-full p-3 bg-muted rounded-lg outline-none" placeholder={t('modal.income.label_placeholder') as string} maxLength={30} />
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl cursor-pointer" onClick={() => setIsShared(!isShared)}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{t('modal.income.shared_switch')}</span>
                  <span className="text-xs text-muted-foreground">{t('modal.income.shared_desc')}</span>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isShared ? "bg-green-500" : "bg-border/60"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isShared ? "translate-x-6" : "translate-x-0"}`} />
                </div>
                <input type="hidden" name="isShared" value={isShared ? "true" : "false"} />
              </div>
            </div>

            <button disabled={loading} type="submit" className="w-full p-4 bg-green-500 text-white font-bold rounded-xl mt-6 shadow-sm hover:bg-green-600 transition-colors">
              {loading ? t('modal.income.saving') : t('modal.income.add_btn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
