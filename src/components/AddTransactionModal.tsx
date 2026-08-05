"use client";

import { useState } from "react";
import { addTransaction } from "@/app/actions";
import { useTranslation } from "@/lib/i18n/client";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface AddTransactionModalProps {
  onClose: () => void;
  isSharedPage?: boolean;
  categories: Category[];
}

export function AddTransactionModal({ onClose, isSharedPage = false, categories }: AddTransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  
  // Category state
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || "");
  
  const [expenseType, setExpenseType] = useState<"FIXED" | "FLOATING">("FIXED");
  
  // Toggles
  const [isShared, setIsShared] = useState(isSharedPage);

  async function handleSubmit(formData: FormData) {
    if (!selectedCategory) return;
    setLoading(true);
    formData.append("categoryId", selectedCategory);
    formData.append("expenseType", expenseType);
    await addTransaction(formData);
    setLoading(false);
    onClose();
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

            <div>
              <label className="block text-sm font-medium mb-1">{t('modal.expense.expense_type')}</label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer has-checked:bg-primary/10 has-checked:border-primary transition-colors">
                  <input type="radio" name="expenseType" value="FIXED" checked={expenseType === "FIXED"} onChange={() => setExpenseType("FIXED")} className="sr-only" />
                  <span className="font-medium">{t('modal.expense.type_fixed')}</span>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer has-checked:bg-primary/10 has-checked:border-primary transition-colors">
                  <input type="radio" name="expenseType" value="FLOATING" checked={expenseType === "FLOATING"} onChange={() => setExpenseType("FLOATING")} className="sr-only" />
                  <span className="font-medium">{t('modal.expense.type_floating')}</span>
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{expenseType === "FLOATING" ? t('modal.floating.budget') : t('modal.expense.amount_sum')}</label>
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

            <div className="space-y-2 pt-2">

              <div className="flex items-center justify-between p-3 bg-muted rounded-xl cursor-pointer" onClick={() => setIsShared(!isShared)}>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{t('modal.expense.shared_expense')}</span>
                  <span className="text-xs text-muted-foreground">{t('modal.expense.shared_desc')}</span>
                </div>
                <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isShared ? "bg-primary" : "bg-border/60"}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${isShared ? "translate-x-6" : "translate-x-0"}`} />
                </div>
                <input type="hidden" name="isShared" value={isShared ? "true" : "false"} />
              </div>
            </div>

            <button disabled={loading} type="submit" className="w-full p-4 bg-primary text-primary-foreground font-bold rounded-xl mt-6 shadow-sm hover:bg-primary/90 transition-colors">
              {loading ? t('modal.expense.saving') : t('modal.expense.add_tx_btn')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
