"use client";

import { useState } from "react";
import { addTransaction } from "@/app/actions";
import { useTranslation } from "@/lib/i18n/client";
import { useRouter } from "next/navigation";

interface IncomeModalProps {
  onClose: () => void;
  isSharedPage?: boolean;
}

export function IncomeModal({ onClose, isSharedPage = false }: IncomeModalProps) {
  const [loading, setLoading] = useState(false);
  const isShared = isSharedPage;
  const { t } = useTranslation();
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    formData.append("type", "INCOME");
    formData.append("expenseType", "FIXED");
    await addTransaction(formData);
    setLoading(false);
    onClose();
    router.refresh();
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
              <input type="number" inputMode="decimal" name="amount" step="0.01" required className="w-full p-3 bg-muted rounded-lg outline-none font-bold text-green-600 dark:text-green-400" placeholder="0.00" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('modal.income.label')}</label>
              <input type="text" name="label" required className="w-full p-3 bg-muted rounded-lg outline-none" placeholder={t('modal.income.label_placeholder') as string} maxLength={30} />
            </div>

            <input type="hidden" name="isShared" value={isShared ? "true" : "false"} />

            <button disabled={loading} type="submit" className="w-full p-4 bg-green-500 text-white font-bold rounded-xl mt-6 shadow-sm hover:bg-green-600 transition-colors">
              {loading ? t('modal.income.saving') : t('modal.income.add_btn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
