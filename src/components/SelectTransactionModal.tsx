"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "./Navigation";
import { useTranslation } from "@/lib/i18n/client";

interface SelectTransactionModalProps {
  mode: "EDIT" | "DELETE";
  categoryName: string;
  transactions: {
    id: string;
    amount: number;
    currency: string;
    type: "INCOME" | "EXPENSE";
    label?: string | null;
    isPaid?: boolean;
    expenseType?: "FIXED" | "FLOATING";
    operationDate?: string | null;
  }[];
  onClose: () => void;
  onConfirm: (transactionId: string | string[]) => void;
}

export function SelectTransactionModal({
  mode,
  categoryName,
  transactions,
  onClose,
  onConfirm,
}: SelectTransactionModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { t } = useTranslation();

  const title = mode === "EDIT" ? t('modal.select_tx.title_edit') : t('modal.select_tx.title_delete');
  const confirmText = mode === "EDIT" ? t('modal.select_tx.btn_edit') : t('modal.select_tx.btn_delete');

  return (
    <div className="fixed inset-0 z-70 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-md bg-background rounded-t-2xl sm:rounded-xl shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-muted rounded-full">
            ✕
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {mode === "DELETE" && transactions.length > 0 && (
            <div className="flex justify-end mb-2">
              <button 
                onClick={() => setSelectedIds(selectedIds.length === transactions.length ? [] : transactions.map(t => t.id))}
                className="text-sm font-medium text-primary hover:underline"
              >
                {selectedIds.length === transactions.length ? t('btn.deselect_all') : t('btn.select_all')}
              </button>
            </div>
          )}
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">{t('error.no_categories')}</p>
          ) : (
            transactions.map(tx => {
              const displayLabel = tx.label?.startsWith('monthly_rollover_marker') ? t('tx.rollover_balance') : (tx.label || categoryName);
              const currencySymbol = { PLN: "zł", USD: "$", EUR: "€" }[tx.currency] || tx.currency;
              const isSelected = mode === "EDIT" ? selectedId === tx.id : selectedIds.includes(tx.id);
              
              return (
                <div 
                  key={tx.id}
                  onClick={() => {
                    if (mode === "EDIT") {
                      setSelectedId(tx.id);
                    } else {
                      setSelectedIds(prev => prev.includes(tx.id) ? prev.filter(id => id !== tx.id) : [...prev, tx.id]);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all",
                    isSelected 
                      ? (mode === "EDIT" ? "border-primary bg-primary/5" : "border-red-500 bg-red-500/5")
                      : "border-border bg-card hover:bg-muted/50",
                    tx.isPaid && tx.expenseType === "FIXED" && "opacity-75"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center shrink-0",
                      isSelected 
                        ? (mode === "EDIT" ? "border-primary bg-primary text-primary-foreground" : "border-red-500 bg-red-500 text-white")
                        : "border-muted-foreground/30"
                    )}>
                      {isSelected && <Check className="w-3 h-3 stroke-3" />}
                    </div>
                    <div>
                      <p className="font-medium text-base">{displayLabel}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-semibold text-base",
                      tx.isPaid && tx.expenseType === "FIXED" ? "text-muted-foreground line-through" : (tx.type === "INCOME" ? "text-green-600 dark:text-green-400" : "text-foreground")
                    )}>
                      {tx.type === "INCOME" ? "+" : ""}{tx.amount.toFixed(2)} {currencySymbol}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 pb-10 sm:pb-4 border-t border-border bg-muted/30 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 p-3 rounded-lg font-semibold bg-muted text-foreground hover:bg-muted/80 transition-colors"
          >
            {t('btn.cancel')}
          </button>
          <button
            onClick={() => {
              if (mode === "EDIT" && selectedId) onConfirm(selectedId);
              if (mode === "DELETE" && selectedIds.length > 0) onConfirm(selectedIds);
            }}
            disabled={mode === "EDIT" ? !selectedId : selectedIds.length === 0}
            className={cn(
              "flex-1 p-3 rounded-lg font-bold text-white transition-colors disabled:opacity-50",
              mode === "EDIT" ? "bg-primary hover:bg-primary/90" : "bg-red-500 hover:bg-red-600"
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
