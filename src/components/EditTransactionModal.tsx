"use client";

import { useState } from "react";
import { editTransaction } from "@/app/actions";
import { useTranslation } from "@/lib/i18n/client";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface EditTransactionModalProps {
  onClose: () => void;
  categories: Category[];
  transaction: {
    id: string;
    amount: number;
    currency: "PLN" | "USD" | "EUR";
    type: "INCOME" | "EXPENSE";
    categoryId: string;
    label: string | null;
    isPaid: boolean;
    isShared: boolean;
    isRecurring: boolean;
    expenseType?: "FIXED" | "FLOATING";
    operationDate?: string | null;
  };
}

export function EditTransactionModal({ onClose, categories, transaction }: EditTransactionModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  // State from transaction
  const [selectedCategory, setSelectedCategory] = useState<string>(transaction.categoryId || (categories[0]?.id || ""));
  const [type, setType] = useState<"INCOME" | "EXPENSE">(transaction.type);
  const [expenseType, setExpenseType] = useState<"FIXED" | "FLOATING">(transaction.expenseType || "FIXED");
  const [amount, setAmount] = useState<string>(transaction.amount.toString());
  const [currency, setCurrency] = useState<"PLN" | "USD" | "EUR">(transaction.currency);
  const [label, setLabel] = useState<string>(transaction.label || "");
  const [operationDate, setOperationDate] = useState<string>(transaction.operationDate ? transaction.operationDate.split('T')[0] : "");
  const [isRecurring, setIsRecurring] = useState<boolean>(transaction.isRecurring || false);
  const isShared = transaction.isShared;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (type === "EXPENSE" && !selectedCategory) return;
    if (!amount) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("amount", amount);
    formData.append("currency", currency);
    formData.append("type", type);
    
    if (type === "EXPENSE") {
      formData.append("categoryId", selectedCategory);
      formData.append("expenseType", expenseType);
    } else {
      formData.append("categoryId", "");
      formData.append("expenseType", "FIXED");
    }
    
    if (label) formData.append("label", label);
    formData.append("isRecurring", isRecurring ? "true" : "false");
    formData.append("isPaid", transaction.isPaid ? "true" : "false");
    formData.append("isShared", isShared ? "true" : "false");
    
    await editTransaction(transaction.id, formData);
    setLoading(false);
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-md bg-background rounded-t-2xl sm:rounded-xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-xl font-bold">{t('modal.edit_tx.title')}</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-muted rounded-full">
            ✕
          </button>
        </div>
        
        <div className="p-6 pb-10 sm:pb-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">{t('modal.edit_tx.type')}</label>
              <div className="flex gap-2">
                <label className="flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer has-checked:bg-primary/10 has-checked:border-primary transition-colors">
                  <input type="radio" name="type" value="EXPENSE" checked={type === "EXPENSE"} onChange={() => setType("EXPENSE")} className="sr-only" />
                  <span>{t('modal.edit_tx.expense')}</span>
                </label>
                <label className="flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer has-checked:bg-primary/10 has-checked:border-primary transition-colors">
                  <input type="radio" name="type" value="INCOME" checked={type === "INCOME"} onChange={() => setType("INCOME")} className="sr-only" />
                  <span>{t('modal.edit_tx.income')}</span>
                </label>
              </div>
            </div>

            {type === "EXPENSE" && (
              <div>
                <label className="block text-sm font-medium mb-1">{t('modal.edit_tx.expense_type')}</label>
                <div className="flex gap-2">
                  <label className="flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer has-checked:bg-primary/10 has-checked:border-primary transition-colors">
                    <input type="radio" name="expenseType" value="FIXED" checked={expenseType === "FIXED"} onChange={() => setExpenseType("FIXED")} className="sr-only" />
                    <span>{t('modal.edit_tx.fixed')}</span>
                  </label>
                  <label className="flex-1 flex items-center justify-center p-3 border rounded-lg cursor-pointer has-checked:bg-primary/10 has-checked:border-primary transition-colors">
                    <input type="radio" name="expenseType" value="FLOATING" checked={expenseType === "FLOATING"} onChange={() => setExpenseType("FLOATING")} className="sr-only" />
                    <span>{t('modal.edit_tx.floating')}</span>
                  </label>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">{expenseType === "FLOATING" ? t('modal.edit_tx.budget') : t('modal.edit_tx.amount')}</label>
                <input type="number" inputMode="decimal" name="amount" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-3 bg-muted rounded-lg outline-none" placeholder="0.00" />
              </div>
              <div className="w-1/3">
                <label className="block text-sm font-medium mb-1">{t('modal.edit_tx.currency')}</label>
                <select name="currency" value={currency} onChange={e => setCurrency(e.target.value as "PLN" | "USD" | "EUR")} className="w-full p-3 bg-muted rounded-lg outline-none">
                  <option value="PLN">PLN (zł)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            {/* Category Section */}
            {type === "EXPENSE" && (
              <div>
                <label className="block text-sm font-medium mb-1">{t('modal.edit_tx.category')}</label>
                  <div className="flex flex-col gap-2">
                    <select 
                      value={selectedCategory} 
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full p-3 bg-muted rounded-lg outline-none"
                      required
                    >
                      {categories.length === 0 && <option value="">{t('modal.edit_tx.no_categories')}</option>}
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">{t('modal.edit_tx.label')}</label>
              <input type="text" name="label" required value={label} onChange={e => setLabel(e.target.value)} className="w-full p-3 bg-muted rounded-lg outline-none" placeholder={t('modal.edit_tx.label_placeholder') as string} maxLength={30} />
            </div>

            {type === "EXPENSE" && (
              <div>
                <label className="block text-sm font-medium mb-1">{t('modal.expense.operation_date')}</label>
                <input type="date" name="operationDate" value={operationDate} onChange={e => setOperationDate(e.target.value)} className="w-full p-3 bg-muted rounded-lg outline-none dark:scheme-dark" />
              </div>
            )}

            {type === "EXPENSE" && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between p-3 bg-muted rounded-xl cursor-pointer" onClick={() => setIsRecurring(!isRecurring)}>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{t('modal.edit_tx.recurring')}</span>
                    <span className="text-xs text-muted-foreground">{t('modal.edit_tx.recurring_desc')}</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isRecurring ? "bg-primary" : "bg-border/60"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isRecurring ? "translate-x-6" : "translate-x-0"}`} />
                  </div>
                  <input type="hidden" name="isRecurring" value={isRecurring ? "true" : "false"} />
                </div>
              </div>
            )}

            <input type="hidden" name="isShared" value={isShared ? "true" : "false"} />

            <button disabled={loading} type="submit" className="w-full p-4 bg-primary text-primary-foreground font-bold rounded-xl mt-6 shadow-sm hover:bg-primary/90 transition-colors">
              {loading ? t('modal.edit_tx.saving') : t('modal.edit_tx.save_btn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
