"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n/client";

type Transaction = {
  id: string;
  amount: number | string;
  currency: string;
  type: "INCOME" | "EXPENSE";
  label?: string | null;
  categories?: { name: string; color: string } | null;
  scope: string;
  expense_type?: "FIXED" | "FLOATING";
  created_at: string;
  users?: { email: string, name?: string | null } | null;
  parent_id?: string | null;
  is_paid?: boolean;
};

export function HistoryList({ transactions }: { transactions: Transaction[] }) {
  const { t, locale } = useTranslation();

  const getCurrencySymbol = (code: string) => {
    if (code === "USD") return "$";
    if (code === "EUR") return "€";
    return "zł";
  };

  if (transactions.length === 0) {
    return <p className="text-muted-foreground text-center py-8">{t('history.empty')}</p>;
  }

  const personalIncome = transactions.filter(t => t.scope === "PERSONAL" && t.is_paid && t.type === "INCOME").reduce((sum, t) => sum + Number(t.amount), 0);
  const personalExpense = transactions.filter(t => t.scope === "PERSONAL" && t.is_paid && t.type === "EXPENSE").reduce((sum, t) => sum + Number(t.amount), 0);
  const personalBudgets = transactions.filter(t => t.scope === "PERSONAL" && t.expense_type === "FLOATING" && !t.parent_id);

  const sharedIncome = transactions.filter(t => t.scope === "SHARED" && t.is_paid && t.type === "INCOME").reduce((sum, t) => sum + Number(t.amount), 0);
  const sharedExpense = transactions.filter(t => t.scope === "SHARED" && t.is_paid && t.type === "EXPENSE").reduce((sum, t) => sum + Number(t.amount), 0);
  const sharedBudgets = transactions.filter(t => t.scope === "SHARED" && t.expense_type === "FLOATING" && !t.parent_id);

  const displayTransactions = transactions.filter(t => {
    if (!t.is_paid) return false;
    if (t.label?.startsWith('monthly_rollover_marker') && Number(t.amount) === 0) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="p-4 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/50 rounded-xl">
          <h3 className="font-bold text-purple-800 dark:text-purple-300 mb-2">{t('history.personal')}</h3>
          <p className="text-sm">{t('history.stats_income')}: <span className="text-green-600 font-semibold">{personalIncome.toFixed(2)} {getCurrencySymbol("PLN")}</span> • {t('history.stats_spent')}: <span className="text-red-600 font-semibold">{personalExpense.toFixed(2)} {getCurrencySymbol("PLN")}</span></p>
          {personalBudgets.length > 0 && (
            <div className="mt-2 space-y-1">
              {personalBudgets.map(b => {
                const spent = transactions.filter(t => t.parent_id === b.id && t.is_paid).reduce((sum, t) => sum + Number(t.amount), 0);
                return (
                  <p key={b.id} className="text-xs text-muted-foreground">
                    {t('history.stats_budget')} &quot;{b.label || b.categories?.name}&quot;: <span className="font-medium text-foreground">{spent.toFixed(2)} / {Number(b.amount).toFixed(2)} {getCurrencySymbol("PLN")}</span>
                  </p>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-xl">
          <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">{t('history.shared')}</h3>
          <p className="text-sm">{t('history.stats_income')}: <span className="text-green-600 font-semibold">{sharedIncome.toFixed(2)} {getCurrencySymbol("PLN")}</span> • {t('history.stats_spent')}: <span className="text-red-600 font-semibold">{sharedExpense.toFixed(2)} {getCurrencySymbol("PLN")}</span></p>
          {sharedBudgets.length > 0 && (
            <div className="mt-2 space-y-1">
              {sharedBudgets.map(b => {
                const spent = transactions.filter(t => t.parent_id === b.id && t.is_paid).reduce((sum, t) => sum + Number(t.amount), 0);
                return (
                  <p key={b.id} className="text-xs text-muted-foreground">
                    {t('history.stats_budget')} &quot;{b.label || b.categories?.name}&quot;: <span className="font-medium text-foreground">{spent.toFixed(2)} / {Number(b.amount).toFixed(2)} {getCurrencySymbol("PLN")}</span>
                  </p>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
      {displayTransactions.map(tx => {
        const isIncome = tx.type === "INCOME";
        const isShared = tx.scope === "SHARED";
        
        const date = new Date(tx.created_at);
        const dateStr = new Intl.DateTimeFormat(locale === "ru" ? "ru-RU" : "uk-UA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
        const displayLabel = tx.label?.startsWith('monthly_rollover_marker') ? t('tx.rollover_balance') : (tx.label || tx.categories?.name || t('history.untitled'));
        
        return (
          <div key={tx.id} className="flex items-center justify-between p-3.5 bg-card rounded-xl border border-border shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center ${isIncome ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-500" : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500"}`}>
                {isIncome ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-medium text-sm leading-tight text-foreground">
                  {displayLabel}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {dateStr}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold text-white shadow-sm ${isShared ? "bg-blue-500" : "bg-purple-500"}`}>
                    {isShared ? t('history.shared') : t('history.personal')} {isShared && tx.users?.email && `• ${tx.users.name || tx.users.email.split("@")[0]}`}
                  </span>
                </div>
              </div>
            </div>
            <div className={`font-bold whitespace-nowrap pl-2 ${isIncome ? "text-green-600 dark:text-green-500" : "text-foreground"}`}>
              {isIncome ? "+" : "-"}{Number(tx.amount).toFixed(2)} {getCurrencySymbol(tx.currency)}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
