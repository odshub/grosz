"use client";
import { useState } from "react";
import { addTransaction } from "@/app/actions";
import { useTranslation } from "@/lib/i18n/client";
import { useOptimisticTransactions } from "./OptimisticProvider";
import { startTransition } from "react";
import { CustomDatePicker } from "./CustomDatePicker";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface AddTransactionModalProps {
  onClose: () => void;
  isSharedPage?: boolean;
  categories: Category[];
  initialExpenseType?: "FIXED" | "FLOATING";
}

export function AddTransactionModal({ onClose, isSharedPage = false, categories, initialExpenseType = "FIXED" }: AddTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  
  // Try to use optimistic context (might be null if modal is used outside provider, but here it's inside)
  let addOptimisticTx: ((tx: unknown) => void) | null = null;
  try {
    const ctx = useOptimisticTransactions();
    addOptimisticTx = ctx.addOptimisticTx;
  } catch {
    // fallback
  }
  
  // Category state
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || "");
  
  const expenseType = initialExpenseType;
  
  // Toggles
  const isShared = isSharedPage;
  const [isRecurring, setIsRecurring] = useState(false);
  const [isVariableAmount, setIsVariableAmount] = useState(false);

  function handleSubmit(formData: FormData) {
    if (!selectedCategory) return;
    
    formData.append("categoryId", selectedCategory);
    formData.append("expenseType", expenseType);
    
    // Build optimistic transaction
    const amount = formData.get("amount") as string;
    const label = formData.get("label") as string;
    const cat = categories.find(c => c.id === selectedCategory);
    
    const fakeTx = {
      id: `temp-${Date.now()}`,
      amount: amount,
      currency: "PLN",
      type: "EXPENSE",
      category_id: selectedCategory,
      categories: cat || null,
      label: label || null,
      is_paid: false, // Expenses default to unpaid if planned
      expense_type: expenseType,
      scope: isShared ? "SHARED" : "PERSONAL",
      created_at: new Date().toISOString(),
    };

    if (addOptimisticTx) {
      startTransition(() => {
        addOptimisticTx(fakeTx);
        addTransaction(formData);
      });
      onClose();
    } else {
      setLoading(true);
      addTransaction(formData).then(() => {
        setLoading(false);
        onClose();
      });
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-md bg-background rounded-t-2xl sm:rounded-xl shadow-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-xl font-bold">{t('modal.expense.add_tx')}</h2>
          <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-muted rounded-full">
            ✕
          </button>
        </div>
        
        <div className="p-6 pb-10 sm:pb-6 overflow-y-auto">
          <form action={handleSubmit} className="space-y-5">
            <input type="hidden" name="type" value="EXPENSE" />

            <input type="hidden" name="expenseType" value={expenseType} />

            <div>
              <label className="block text-sm font-medium mb-1">{expenseType === "FLOATING" ? (t('modal.floating.budget') as string) || 'Сума бюджету' : t('modal.expense.amount_sum')}</label>
              <input type="number" inputMode="decimal" name="amount" step="0.01" required className="w-full p-3 bg-muted rounded-lg outline-none" placeholder="0.00" />
            </div>

            {/* Category Section */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('modal.expense.category')}</label>
                <div className="flex flex-col gap-2">
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-3 bg-muted rounded-lg outline-none"
                    required
                  >
                    {categories.length === 0 && <option value="">{t('modal.expense.no_categories')}</option>}
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('modal.expense.label')}</label>
              <input type="text" name="label" required className="w-full p-3 bg-muted rounded-lg outline-none" placeholder={t('modal.expense.label_placeholder') as string} maxLength={30} />
            </div>

            {expenseType === "FIXED" && (
              <div>
                <label className="block text-sm font-medium mb-1">{(t('modal.expense.operation_date') as string) || 'Дата (необов\'язково)'}</label>
                <CustomDatePicker name="operationDate" className="w-full p-3 bg-muted rounded-lg outline-none" />
              </div>
            )}

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between p-3 bg-muted rounded-xl cursor-pointer" onClick={() => setIsRecurring(!isRecurring)}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{t('modal.expense.recurring')}</span>
                  <span className="text-xs text-muted-foreground">{t('modal.expense.recurring_desc')}</span>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isRecurring ? "bg-primary" : "bg-border/60"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isRecurring ? "translate-x-6" : "translate-x-0"}`} />
                </div>
                <input type="hidden" name="isRecurring" value={isRecurring ? "true" : "false"} />
              </div>

              {isRecurring && expenseType === "FIXED" && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-xl cursor-pointer" onClick={() => setIsVariableAmount(!isVariableAmount)}>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Плаваюча сума</span>
                    <span className="text-xs text-muted-foreground">Сума буде 0.00 у новому місяці</span>
                  </div>
                  <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isVariableAmount ? "bg-primary" : "bg-border/60"}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isVariableAmount ? "translate-x-6" : "translate-x-0"}`} />
                  </div>
                  <input type="hidden" name="isVariableAmount" value={isVariableAmount ? "true" : "false"} />
                </div>
              )}
            </div>

            <input type="hidden" name="isShared" value={isShared ? "true" : "false"} />

            <button disabled={loading} type="submit" className="w-full p-4 bg-primary text-primary-foreground font-bold rounded-xl mt-6 shadow-sm hover:bg-primary/90 transition-colors">
              {loading ? t('modal.expense.saving') : t('modal.expense.add_tx_btn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
