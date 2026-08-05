"use client";

import { useState } from "react";
import { addTransaction, deleteEnvelope } from "@/app/actions";
import { Trash2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";

type Transaction = {
  id: string;
  amount: number | string;
  type: string;
  created_at: string;
  label?: string | null;
  users?: { email?: string | null, name?: string | null } | null;
  is_paid?: boolean;
};

type Envelope = {
  id: string;
  name: string;
  currency: "PLN" | "USD" | "EUR";
  color: string;
  transactions: Transaction[] | null;
  scope: string;
};

export function EnvelopeDetailsModal({ envelope, isSharedPage = false, onClose }: { envelope: Envelope; isSharedPage?: boolean; onClose: () => void }) {
  const [view, setView] = useState<"DETAILS" | "TOP_UP" | "WITHDRAW">("DETAILS");
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const envBalance = (envelope.transactions || []).reduce((acc: number, t) => 
    t.is_paid !== false ? (t.type === "INCOME" ? acc + Number(t.amount) : acc - Number(t.amount)) : acc
  , 0);

  async function handleTransactionSubmit(formData: FormData) {
    setLoading(true);
    // addTransaction expects type, amount, currency, tagId, isShared, etc.
    formData.append("tagId", envelope.id);
    formData.append("currency", envelope.currency);
    formData.append("isShared", isSharedPage ? "true" : "false");
    // For envelope top-up, it's an INCOME. For withdrawal, it's an EXPENSE.
    formData.append("type", view === "TOP_UP" ? "INCOME" : "EXPENSE");
    // Ensure it is paid
    formData.append("isPaid", "true");
    
    await addTransaction(formData);
    setLoading(false);
    onClose();
  }

  async function handleDelete() {
    if (confirm(t('modal.envelope.delete_confirm') as string)) {
      setLoading(true);
      await deleteEnvelope(envelope.id);
      setLoading(false);
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end sm:items-center justify-center bg-black/50">
      <div className="w-full max-w-sm p-6 pb-10 sm:pb-6 bg-background rounded-t-2xl sm:rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => view === "DETAILS" ? onClose() : setView("DETAILS")} 
            className="p-2 text-muted-foreground hover:bg-muted rounded-full -ml-2"
          >
            {view === "DETAILS" ? "✕" : "←"}
          </button>
          <h2 className="text-xl font-bold">{envelope.name}</h2>
          <div className="w-8">
            {view === "DETAILS" && (
              <button 
                onClick={handleDelete}
                disabled={loading}
                className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors -mr-2"
                title={t('btn.delete') as string}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {view === "DETAILS" && (
          <div className="space-y-6">
            <div className="text-center p-4 bg-muted/30 rounded-xl border border-border">
              <p className="text-sm text-muted-foreground">{t('modal.envelope.balance')}</p>
              <p className="text-3xl font-bold mt-1 text-primary">
                {envBalance.toFixed(2)} {envelope.currency}
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setView("TOP_UP")} className="flex-1 p-3 bg-green-500/10 text-green-600 dark:text-green-500 font-medium rounded-xl hover:bg-green-500/20 transition-colors">
                + {t('modal.envelope.topup')}
              </button>
              <button onClick={() => setView("WITHDRAW")} className="flex-1 p-3 bg-red-500/10 text-red-600 dark:text-red-500 font-medium rounded-xl hover:bg-red-500/20 transition-colors">
                - {t('modal.envelope.withdraw')}
              </button>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="font-medium text-sm text-muted-foreground">{t('modal.envelope.history')}</h3>
              <div className="space-y-3">
                {(!envelope.transactions || envelope.transactions.length === 0) ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{t('modal.envelope.empty_history')}</p>
                ) : (
                  // Sort by created_at descending
                  [...envelope.transactions]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((tx, idx) => (
                      <div key={tx.id || idx} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border/50">
                        <div>
                          <p className="text-sm font-medium">{tx.type === "INCOME" ? t('modal.envelope.income') : t('modal.envelope.expense')}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(tx.created_at).toLocaleDateString()}
                            {tx.users?.email && ` • ${tx.users.name || tx.users.email.split('@')[0]}`}
                            {tx.label && ` • ${tx.label}`}
                          </p>
                        </div>
                        <p className={`font-semibold ${tx.type === "INCOME" ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}>
                          {tx.type === "INCOME" ? "+" : "-"}{Number(tx.amount).toFixed(2)} {envelope.currency}
                        </p>
                      </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {(view === "TOP_UP" || view === "WITHDRAW") && (
          <form action={handleTransactionSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('modal.envelope.amount_currency')} ({envelope.currency})</label>
              <input type="number" inputMode="decimal" step="0.01" min="0.01" name="amount" required className="w-full p-3 bg-muted rounded-lg outline-none text-xl font-medium" placeholder="0.00" />
            </div>
            <div>
            <label className="text-sm font-medium">{t('modal.envelope.comment')}</label>
            <input type="text" name="label" className="w-full p-3 bg-muted rounded-lg outline-none" placeholder={view === "TOP_UP" ? t('modal.envelope.topup_placeholder') as string : t('modal.envelope.withdraw_placeholder') as string} />
            </div>
            <button disabled={loading} type="submit" className={`w-full p-4 font-bold rounded-xl mt-4 text-white ${view === "TOP_UP" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>
              {loading ? t('modal.envelope.saving') : view === "TOP_UP" ? t('modal.envelope.topup_btn') : t('modal.envelope.withdraw_btn')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
