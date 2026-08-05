"use client";

import { useState } from "react";
import { addSubTransaction, deleteTransaction } from "@/app/actions";
import { Trash2 } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";
import { useRouter } from "next/navigation";
import { useDialog } from "./DialogProvider";

interface FloatingTransactionModalProps {
  transaction: {
    id: string;
    amount: number;
    currency: string;
    label: string | null;
    categoryColor: string;
  };
  subTransactions: { id: string; amount: number; label: string | null; created_at?: string; currency: string; users?: { email: string, name?: string | null } | null }[];
  onClose: () => void;
}

export function FloatingTransactionModal({ transaction, subTransactions, onClose }: FloatingTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();
  const { showConfirm } = useDialog();

  const spent = subTransactions.reduce((acc, tx) => acc + Number(tx.amount), 0);
  const remaining = transaction.amount - spent;
  const progress = Math.min((spent / transaction.amount) * 100, 100);

  const currencySymbol = {
    PLN: "zł",
    USD: "$",
    EUR: "€",
  }[transaction.currency] || transaction.currency;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    formData.append("parentId", transaction.id);
    await addSubTransaction(formData);
    setLoading(false);
    // don't close, user might want to add multiple
    (document.getElementById('new-purchase-form') as HTMLFormElement)?.reset();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-70 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-md bg-background rounded-t-2xl sm:rounded-xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: transaction.categoryColor }} />
            {transaction.label}
          </h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-muted rounded-full">
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-8 bg-card border border-border p-5 rounded-2xl shadow-sm">
            <div className="flex flex-col items-center justify-center mb-5">
              <span className="text-muted-foreground text-sm font-medium mb-1">{t('modal.floating.remaining')}</span>
              <span className={`text-4xl font-bold tracking-tight ${remaining < 0 ? 'text-red-500' : 'text-foreground'}`}>
                {remaining.toFixed(2)} {currencySymbol}
              </span>
            </div>
            
            <div className="w-full bg-muted rounded-full h-3 mb-3 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500 ease-in-out" 
                style={{ width: `${progress}%`, backgroundColor: remaining < 0 ? '#ef4444' : transaction.categoryColor }} 
              />
            </div>
            
            <div className="flex justify-between text-xs font-medium px-1">
              <span className="text-muted-foreground flex flex-col">
                <span>{t('modal.floating.spent')}</span>
                <strong className="text-foreground text-sm mt-0.5">{spent.toFixed(2)} {currencySymbol}</strong>
              </span>
              <span className="text-muted-foreground flex flex-col text-right">
                <span>{t('modal.floating.budget')}</span>
                <strong className="text-foreground text-sm mt-0.5">{transaction.amount.toFixed(2)} {currencySymbol}</strong>
              </span>
            </div>
          </div>

          <h3 className="font-semibold text-lg mb-3">{t('modal.floating.history')}</h3>
          <div className="space-y-3 mb-6">
            {subTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/20 rounded-xl border border-dashed border-border">
                <p className="text-muted-foreground font-medium">{t('modal.floating.empty')}</p>
                <p className="text-xs text-muted-foreground mt-1">{t('modal.floating.empty_desc')}</p>
              </div>
            ) : (
              subTransactions.map(st => (
                <div key={st.id} className="flex justify-between items-center p-4 bg-card border border-border rounded-xl shadow-sm">
                  <div>
                    <span className="font-medium text-sm block">{st.label || t('history.untitled')}</span>
                    {st.created_at && (
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        {new Intl.DateTimeFormat("uk-UA", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date(st.created_at))}
                        {st.users?.email ? ` • ${st.users.name || st.users.email.split("@")[0]}` : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-foreground">-{Number(st.amount).toFixed(2)} {currencySymbol}</span>
                    <button 
                      onClick={async () => {
                        if (await showConfirm(t('modal.select_tx.title_delete') as string)) {
                          await deleteTransaction(st.id);
                          router.refresh();
                        }
                      }}
                      className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-muted transition-colors"
                      title={t('modal.select_tx.btn_delete') as string}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-3 pb-12 sm:pb-4 border-t border-border bg-card shadow-[0_-10px_40px_rgba(0,0,0,0.05)] w-full">
          <form id="new-purchase-form" action={handleSubmit} className="flex flex-col gap-3 w-full mx-auto">
            <div className="flex gap-2 w-full">
              <input type="text" name="label" placeholder={t('modal.floating.input_what') as string} className="flex-1 min-w-0 p-3 bg-muted border border-border rounded-xl outline-none text-sm focus:ring-2 focus:ring-primary/50 transition-all" required />
              <input type="number" inputMode="decimal" name="amount" step="0.01" placeholder={t('modal.floating.input_amount') as string} className="w-24 shrink-0 p-3 bg-muted border border-border rounded-xl outline-none text-sm focus:ring-2 focus:ring-primary/50 transition-all font-semibold" required />
            </div>
            <button disabled={loading} type="submit" className="w-full py-3.5 bg-primary text-primary-foreground font-bold text-sm rounded-xl disabled:opacity-50 transition-all hover:bg-primary/90 active:scale-95 shadow-md flex items-center justify-center">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                t('modal.floating.add_btn')
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
