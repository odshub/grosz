"use client";

import { useState, useTransition } from "react";
import { Share2, Lock, Check, Repeat } from "lucide-react";
import { toggleTransactionPaid } from "@/app/actions";
import { cn } from "./Navigation";
import { FloatingTransactionModal } from "@/components/FloatingTransactionModal";
import { useTranslation } from "@/lib/i18n/client";


interface TransactionItemProps {
  id: string;
  amount: number;
  currency: "PLN" | "USD" | "EUR";
  type: "INCOME" | "EXPENSE";
  categoryName: string;
  categoryColor: string;
  isShared: boolean;
  label?: string | null;
  isPaid?: boolean;
  isRecurring?: boolean;
  expenseType?: "FIXED" | "FLOATING";
  subTransactions?: { id: string; amount: number; label: string | null; created_at?: string; currency: string; users?: { email: string, name?: string | null } | null }[];
  onToggleShare?: (id: string) => void;
}

export function TransactionItem({
  id,
  amount,
  currency,
  type,
  categoryName,
  categoryColor,
  isShared,
  label,
  isPaid = false,
  isRecurring = false,
  expenseType = "FIXED",
  subTransactions = [],
  onToggleShare,
}: TransactionItemProps) {
  const currencySymbol = {
    PLN: "zł",
    USD: "$",
    EUR: "€",
  }[currency];

  const { t } = useTranslation();

  const spent = subTransactions.reduce((acc, tx) => acc + Number(tx.amount), 0);
  const remaining = amount - spent;
  const displayAmount = expenseType === "FLOATING" ? remaining : amount;

  const [isPending, startTransition] = useTransition();
  const [isFloatingOpen, setIsFloatingOpen] = useState(false);

  const displayLabel = label?.startsWith('monthly_rollover_marker') ? t('tx.rollover_balance') : (label || categoryName);

  const handleTogglePaid = () => {
    startTransition(async () => {
      await toggleTransactionPaid(id, !isPaid);
    });
  };

  return (
    <div className={cn(
      "flex items-center justify-between p-4 bg-card rounded-xl border border-border shadow-sm transition-all",
      isPaid ? "opacity-75" : "shadow-md"
    )}>
      <div className="flex items-center gap-4">
        <div>
          <p className="font-medium text-base flex items-center gap-1.5">
            {displayLabel}
            {isRecurring && <Repeat className="w-3.5 h-3.5 text-muted-foreground" />}
          </p>
          <p className="text-xs text-muted-foreground">{t('tx.today')}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p
            className={cn(
              "font-semibold text-base transition-colors",
              isPaid && expenseType === "FIXED" && type === "EXPENSE" ? "text-muted-foreground line-through" : (type === "INCOME" ? "text-green-600 dark:text-green-400" : "text-foreground")
            )}
          >
            {type === "INCOME" ? "+" : ""}{displayAmount.toFixed(2)} {currencySymbol}
          </p>
          {expenseType === "FLOATING" && type === "EXPENSE" && <p className="text-[10px] text-muted-foreground font-semibold tracking-wide uppercase mt-0.5">{t('modal.floating.remaining')}</p>}
          {!isPaid && expenseType === "FIXED" && type === "EXPENSE" && <p className="text-[10px] text-orange-500 font-semibold tracking-wide uppercase mt-0.5">{t('tx.unpaid')}</p>}
        </div>
        
        {type === "EXPENSE" && expenseType === "FIXED" && (
          <button
            onClick={handleTogglePaid}
            disabled={isPending}
            className={cn(
              "p-1 rounded-full transition-all shrink-0 active:scale-90",
              isPending && "opacity-50 cursor-not-allowed"
            )}
            title={isPaid ? t('tx.cancel_paid') as string : t('tx.mark_paid') as string}
          >
            <div className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full border-2 transition-colors",
              isPaid 
                ? "bg-emerald-500 border-emerald-500 text-white" 
                : "border-muted-foreground/30 hover:border-muted-foreground/60 bg-transparent"
            )}>
              {isPaid && <Check className="w-4 h-4 stroke-3" />}
            </div>
          </button>
        )}
        
        {type === "EXPENSE" && expenseType === "FLOATING" && (
          <button
            onClick={() => setIsFloatingOpen(true)}
            className="px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20 text-xs font-semibold rounded-full transition-colors"
          >
            {t('btn.open')}
          </button>
        )}

        {onToggleShare && (
          <button
            onClick={() => onToggleShare(id)}
            className={cn(
              "p-2 rounded-full transition-colors",
              isShared 
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
            title={isShared ? t('tx.make_personal') as string : t('tx.make_shared') as string}
          >
            {isShared ? <Share2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </button>
        )}
      </div>

      {isFloatingOpen && expenseType === "FLOATING" && (
        <FloatingTransactionModal
          transaction={{ id, amount, currency, label: label || categoryName, categoryColor }}
          subTransactions={subTransactions}
          onClose={() => setIsFloatingOpen(false)}
        />
      )}
    </div>
  );
}
