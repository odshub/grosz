"use client";

import { BalanceCard } from "@/components/BalanceCard";
import { CategoriesManager } from "@/components/CategoriesManager";
import { CategoryGroup } from "@/components/CategoryGroup";
import { deleteTransaction, deleteTransactions } from "@/app/actions";
import { useOptimisticTransactions } from "./OptimisticProvider";
import { useTranslation } from "@/lib/i18n/client";

// Reuse the Transaction type
type Transaction = any; // simplified for speed, can import if needed

interface BudgetClientProps {
  categories: any[];
}

export function BudgetClient({ categories }: BudgetClientProps) {
  const { t } = useTranslation();
  const { optimisticTxs } = useOptimisticTransactions();

  const txs = optimisticTxs.filter((t: any) => !t.parent_id);

  const paidParentIds = new Set(
    optimisticTxs.filter((t: any) => !t.parent_id && t.is_paid !== false).map((t: any) => t.id)
  );

  const balance = optimisticTxs
    .filter((t: any) => t.currency === "PLN" && t.is_paid !== false)
    .filter((t: any) => !(t.parent_id && paidParentIds.has(t.parent_id)))
    .reduce((acc: number, t: any) => t.type === "INCOME" ? acc + Number(t.amount) : acc - Number(t.amount), 0);

  const incomes = txs.filter((t: any) => t.type === "INCOME");
  const expenses = txs.filter((t: any) => t.type === "EXPENSE");

  // Group expenses by category
  const groupedExpenses = expenses.reduce((acc: any, tx: Transaction) => {
    const catName = tx.categories?.name || t('page.no_category');
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  let plannedExpenses = 0;
  
  const subTxSums = optimisticTxs
    .filter((t: any) => t.parent_id && t.currency === "PLN")
    .reduce((acc: any, t: any) => {
      acc[t.parent_id!] = (acc[t.parent_id!] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  for (const catTxsRaw of Object.values(groupedExpenses)) {
    const catTxs = catTxsRaw as Transaction[];
    
    const plannedForCategory = catTxs
      .filter((t: any) => t.currency === "PLN" && t.categories !== null && t.is_paid === false)
      .reduce((sum: number, t: any) => {
        const parentAmount = Number(t.amount);
        const subSpent = subTxSums[t.id] || 0;
        return sum + Math.max(0, parentAmount - subSpent);
      }, 0);
      
    plannedExpenses += plannedForCategory;
  }

  return (
    <div className="space-y-6">
      <BalanceCard 
        balance={balance}
        plannedExpenses={plannedExpenses}
        fallbackText={t('app.title')}
        texts={{
          currentBalance: t('page.current_balance'),
          plannedExpenses: t('page.planned_expenses'),
          freeMoney: t('page.free_money'),
        }}
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="font-medium text-lg">{t('page.your_transactions')}</h3>
          <CategoriesManager categories={categories} />
        </div>
        
        <div className="space-y-8 pb-4">
          {txs.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{t('page.no_transactions')}</p>
          ) : (
            <>
              {Object.entries(groupedExpenses).map(([catName, catTxsRaw]) => {
                const catTxs = catTxsRaw as Transaction[];
                const color = catTxs[0]?.categories?.color || "#cccccc";
                
                const total = catTxs
                  .filter((t: any) => t.currency === "PLN")
                  .reduce((sum: number, t: any) => t.type === "INCOME" ? sum - Number(t.amount) : sum + Number(t.amount), 0);
                
                return (
                  <CategoryGroup 
                    key={catName}
                    catName={catName}
                    catTxs={catTxs}
                    total={total}
                    color={color}
                    categories={categories}
                    transactionsRaw={optimisticTxs}
                    onDeleteTransaction={deleteTransaction}
                    onDeleteTransactions={deleteTransactions}
                  />
                );
              })}
              
              {incomes.length > 0 && (
                <CategoryGroup 
                  key="income_category"
                  catName={t('page.income_category')}
                  catTxs={incomes}
                  total={incomes
                    .filter((t: any) => t.currency === "PLN")
                    .reduce((sum: number, t: any) => sum - Number(t.amount), 0)
                  }
                  color="#10b981"
                  categories={categories}
                  transactionsRaw={optimisticTxs}
                  onDeleteTransaction={deleteTransaction}
                  onDeleteTransactions={deleteTransactions}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
