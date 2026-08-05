"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { TransactionItem } from "./TransactionItem";
import { SelectTransactionModal } from "./SelectTransactionModal";
import { EditTransactionModal } from "./EditTransactionModal";

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
}

export function CategoryGroup({
  catName,
  catTxs,
  total,
  color,
  categories,
  transactionsRaw,
  onDeleteTransaction
}: CategoryGroupProps) {
  const [selectMode, setSelectMode] = useState<"EDIT" | "DELETE" | null>(null);
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [showAll, setShowAll] = useState(false);

  const handleSelectConfirm = async (transactionId: string) => {
    if (selectMode === "DELETE") {
      if (confirm("Ви дійсно хочете видалити цю операцію?")) {
        await onDeleteTransaction(transactionId);
        setSelectMode(null);
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
          
          <div className="flex items-center ml-2 gap-1">
            <button
              onClick={() => setSelectMode("EDIT")}
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-full transition-colors"
              title="Редагувати"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectMode("DELETE")}
              className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors"
              title="Видалити"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        <span className="font-medium text-muted-foreground">
          {total > 0 ? "" : total < 0 ? "+" : ""}{Math.abs(total).toFixed(2)} zł
        </span>
      </div>
      <div className="space-y-2">
        {(showAll ? catTxs : catTxs.slice(0, 10)).map((tx: Transaction) => (
          <TransactionItem
            key={tx.id}
            id={tx.id}
            amount={Number(tx.amount)}
            currency={tx.currency as any}
            type={tx.type}
            categoryName={tx.categories?.name || "Без категорії"}
            categoryColor={tx.categories?.color || "#cccccc"}
            isShared={tx.scope === "SHARED"}
            label={tx.label}
            isPaid={tx.is_paid ?? false}
            expenseType={tx.expense_type}
            subTransactions={
              transactionsRaw
                .filter(sub => sub.parent_id === tx.id)
                .map(sub => ({
                  id: sub.id,
                  amount: Number(sub.amount),
                  label: sub.label || null,
                  currency: sub.currency,
                  created_at: sub.created_at,
                  users: sub.users
                }))
            }
          />
        ))}
      </div>
      
      {catTxs.length > 10 && (
        <button 
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 mt-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted rounded-lg"
        >
          {showAll ? "Приховати" : `Показати всі (${catTxs.length})`}
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
            expenseType: t.expense_type
          }))}
          onClose={() => setSelectMode(null)}
          onConfirm={handleSelectConfirm}
        />
      )}

      {transactionToEdit && (
        <EditTransactionModal
          transaction={{
            id: transactionToEdit.id,
            amount: Number(transactionToEdit.amount).toString(),
            currency: transactionToEdit.currency as any,
            type: transactionToEdit.type,
            label: transactionToEdit.label || null,
            categoryId: transactionToEdit.category_id,
            isPaid: transactionToEdit.is_paid ?? false,
            isShared: transactionToEdit.scope === "SHARED",
            expenseType: transactionToEdit.expense_type
          }}
          categories={categories}
          onClose={() => setTransactionToEdit(null)}
        />
      )}
    </div>
  );
}
