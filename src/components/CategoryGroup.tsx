"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Trash2, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { TransactionItem } from "./TransactionItem";
import { SelectTransactionModal } from "./SelectTransactionModal";
import { EditTransactionModal } from "./EditTransactionModal";
import { useDialog } from "./DialogProvider";
import { useTranslation } from "@/lib/i18n/client";

// Reusing the type from page.tsx roughly
type Transaction = {
  id: string;
  amount: number | string;
  currency: string;
  type: "INCOME" | "EXPENSE";
  category_id: string;
  categories: { name: string; color: string } | null;
  label?: string | null;
  is_paid?: boolean;
  expense_type?: "FIXED" | "FLOATING";
  parent_id?: string | null;
  scope: string;
  created_at?: string;
  operation_date?: string | null;
  is_recurring?: boolean;
  is_variable_amount?: boolean;
  users?: { email: string, name?: string | null } | null;
};

interface CategoryGroupProps {
  catName: string;
  catTxs: Transaction[];
  total: number;
  color: string;
  categories: { id: string; name: string; color: string }[];
  transactionsRaw: Transaction[];
  onDeleteTransaction: (id: string) => Promise<void>;
  onDeleteTransactions?: (ids: string[]) => Promise<void>;
}

export function CategoryGroup({
  catName,
  catTxs,
  total,
  color,
  categories,
  transactionsRaw,
  onDeleteTransaction,
  onDeleteTransactions
}: CategoryGroupProps) {
  const [selectMode, setSelectMode] = useState<"EDIT" | "DELETE" | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { showConfirm } = useDialog();
  const { t } = useTranslation();

  const unpaidTxs = catTxs.filter(tx => !tx.is_paid);
  const paidTxs = catTxs.filter(tx => tx.is_paid);
  const visibleTxs = showCompleted ? catTxs : unpaidTxs;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectConfirm = async (transactionId: string | string[]) => {
    if (selectMode === "DELETE") {
      if (await showConfirm(t('modal.select_tx.title_delete') as string)) {
        if (Array.isArray(transactionId) && onDeleteTransactions) {
          await onDeleteTransactions(transactionId);
        } else if (typeof transactionId === "string") {
          await onDeleteTransaction(transactionId);
        }
        setSelectMode(null);
        router.refresh();
      }
    } else if (selectMode === "EDIT") {
      const tx = catTxs.find(t => t.id === transactionId);
      if (tx) {
        setTransactionToEdit(tx);
      }
      setSelectMode(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b-2 pb-2" style={{ borderColor: `${color}40` }}>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
          <h4 className="font-semibold text-lg">{catName}</h4>
          
          <div className="relative ml-2" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-lg z-10 py-1 overflow-hidden">
                <button
                  onClick={() => {
                    setSelectMode("EDIT");
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                  {t('btn.edit')}
                </button>
                <button
                  onClick={() => {
                    setSelectMode("DELETE");
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('btn.delete')}
                </button>
              </div>
            )}
          </div>
        </div>
        <span className="font-medium text-muted-foreground">
          {total > 0 ? "" : total < 0 ? "+" : ""}{Math.abs(total).toFixed(2)} zł
        </span>
      </div>
      <div className="space-y-2">
        {visibleTxs.map((tx: Transaction) => (
          <TransactionItem
            key={tx.id}
            id={tx.id}
            amount={Number(tx.amount)}
            currency={tx.currency as "PLN" | "USD" | "EUR"}
            type={tx.type}
            categoryName={tx.categories?.name || "Без категорії"}
            categoryColor={tx.categories?.color || "#cccccc"}
            isShared={tx.scope === "SHARED"}
            label={tx.label}
            isPaid={tx.is_paid ?? false}
            isRecurring={tx.is_recurring ?? false}
            isVariableAmount={tx.is_variable_amount ?? false}
            expenseType={tx.expense_type}
            operationDate={tx.operation_date ?? null}
            subTransactions={
              transactionsRaw
                .filter(sub => sub.parent_id === tx.id)
                .map(sub => ({
                  id: sub.id,
                  amount: Number(sub.amount),
                  label: sub.label || null,
                  currency: sub.currency,
                  created_at: sub.created_at,
                  operation_date: sub.operation_date,
                  users: sub.users
                }))
            }
          />
        ))}
      </div>
      
      {paidTxs.length > 0 && (
        <button 
          onClick={() => setShowCompleted(!showCompleted)}
          className="w-full py-2 mt-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted rounded-lg"
        >
          {showCompleted 
            ? t('cat.hide_completed') 
            : unpaidTxs.length === 0 
              ? t('cat.show_all_completed').replace('{{count}}', paidTxs.length.toString())
              : t('cat.show_completed').replace('{{count}}', paidTxs.length.toString())
          }
        </button>
      )}

      {selectMode && (
        <SelectTransactionModal
          mode={selectMode}
          categoryName={catName}
          transactions={catTxs.map(t => ({
            id: t.id,
            amount: Number(t.amount),
            currency: t.currency,
            type: t.type,
            label: t.label,
            isPaid: t.is_paid,
            isRecurring: t.is_recurring,
            expenseType: t.expense_type,
            operationDate: t.operation_date
          }))}
          onClose={() => setSelectMode(null)}
          onConfirm={handleSelectConfirm}
        />
      )}

      {transactionToEdit && (
        <EditTransactionModal
          transaction={{
            id: transactionToEdit.id,
            amount: Number(transactionToEdit.amount),
            currency: transactionToEdit.currency as "PLN" | "USD" | "EUR",
            type: transactionToEdit.type,
            label: transactionToEdit.label || null,
            categoryId: transactionToEdit.category_id,
            isPaid: transactionToEdit.is_paid ?? false,
            isShared: transactionToEdit.scope === "SHARED",
            isRecurring: transactionToEdit.is_recurring ?? false,
            expenseType: transactionToEdit.expense_type
          }}
          categories={categories}
          onClose={() => setTransactionToEdit(null)}
        />
      )}
    </div>
  );
}
