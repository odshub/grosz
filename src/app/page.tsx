import { MobileAppLayout } from "@/components/MobileAppLayout";
import { AppHeader } from "@/components/AppHeader";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { CategoriesManager } from "@/components/CategoriesManager";
import { CategoryGroup } from "@/components/CategoryGroup";
import { BalanceCard } from "@/components/BalanceCard";
import { EnvelopesList } from "@/components/EnvelopesList";
import { supabaseAdmin } from "@/lib/supabase";
import { deleteTransaction, deleteTransactions, executeRollover } from "@/app/actions";
import { TabsView } from "@/components/TabsView";
import { getTranslation } from "@/lib/i18n";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Transaction = {
  id: string;
  amount: number | string;
  currency: "PLN" | "USD" | "EUR";
  type: "INCOME" | "EXPENSE";
  category_id: string;
  categories: { name: string; color: string } | null;
  label?: string | null;
  is_paid?: boolean;
  expense_type?: "FIXED" | "FLOATING";
  parent_id?: string | null;
  scope: string;
  operation_date?: string | null;
};

export default async function Home() {
  const t = await getTranslation();
  
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <MobileAppLayout><div className="p-4 text-center">{t('app.subtitle')}</div></MobileAppLayout>;
  }

  const user = { id: session.user.id, email: session.user.email };

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Trigger rollover check
  const { data: existingMarker } = await supabaseAdmin
    .from("transactions")
    .select("id")
    .eq("user_id", user.id)
    .eq("scope", "PERSONAL")
    .eq("label", "monthly_rollover_marker_PERSONAL")
    .gte("created_at", currentMonthStart);

  if (!existingMarker || existingMarker.length === 0) {
    await executeRollover("PERSONAL");
  } else if (existingMarker.length > 1) {
    await executeRollover("PERSONAL");
  }

  // Parallelize the data fetching
  const [
    { data: transactions },
    { data: envelopes },
    { data: categoriesData }
  ] = await Promise.all([
    supabaseAdmin
      .from("transactions")
      .select(`
        *,
        categories (name, color)
      `)
      .eq("user_id", user.id)
      .or("scope.eq.PERSONAL,scope.is.null")
      .is("tag_id", null)
      .gte("created_at", currentMonthStart)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("tags")
      .select(`*, transactions ( id, amount, type, is_paid, created_at, operation_date, label, users ( email, name ) )`)
      .eq("user_id", user.id)
      .or("scope.eq.PERSONAL,scope.is.null"),
    supabaseAdmin
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .or("scope.eq.PERSONAL,scope.is.null")
  ]);

  const envs = envelopes || [];
  const categories = categoriesData || [];

  const txs = (transactions || []).filter(t => !t.parent_id);

  const paidParentIds = new Set(
    (transactions || []).filter(t => !t.parent_id && t.is_paid !== false).map(t => t.id)
  );

  const balance = (transactions || [])
    .filter(t => t.currency === "PLN" && t.is_paid !== false)
    .filter(t => !(t.parent_id && paidParentIds.has(t.parent_id)))
    .reduce((acc, t) => t.type === "INCOME" ? acc + Number(t.amount) : acc - Number(t.amount), 0);

  const incomes = txs.filter(t => t.type === "INCOME");
  const expenses = txs.filter(t => t.type === "EXPENSE");

  // Group expenses by category
  const groupedExpenses = expenses.reduce((acc, tx: Transaction) => {
    const catName = tx.categories?.name || t('page.no_category');
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  let plannedExpenses = 0;
  
  const subTxSums = (transactions || [])
    .filter(t => t.parent_id && t.currency === "PLN")
    .reduce((acc, t) => {
      acc[t.parent_id!] = (acc[t.parent_id!] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  for (const catTxsRaw of Object.values(groupedExpenses)) {
    const catTxs = catTxsRaw as Transaction[];
    
    const plannedForCategory = catTxs
      .filter(t => t.currency === "PLN" && t.categories !== null && t.is_paid === false)
      .reduce((sum, t) => {
        const parentAmount = Number(t.amount);
        const subSpent = subTxSums[t.id] || 0;
        return sum + Math.max(0, parentAmount - subSpent);
      }, 0);
      
    plannedExpenses += plannedForCategory;
  }

  return (
    <MobileAppLayout>
      <div className="p-4 space-y-6">
        <AppHeader title={t('app.title') as string} />
        
        <TabsView
          tab1Title={t('header.personal_budget') as string}
          tab2Title={t('header.private_envelopes') as string}
          tab1Content={
            <div className="space-y-6">
              <BalanceCard 
                balance={balance}
                plannedExpenses={plannedExpenses}
                fallbackText={t('app.title') as string}
                texts={{
                  currentBalance: t('page.current_balance') as string,
                  plannedExpenses: t('page.planned_expenses') as string,
                  freeMoney: t('page.free_money') as string,
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
                          .filter(t => t.currency === "PLN")
                          .reduce((sum, t) => t.type === "INCOME" ? sum - Number(t.amount) : sum + Number(t.amount), 0);
                        
                        return (
                          <CategoryGroup 
                            key={catName}
                            catName={catName}
                            catTxs={catTxs}
                            total={total}
                            color={color}
                            categories={categories}
                            transactionsRaw={transactions || []}
                            onDeleteTransaction={deleteTransaction}
                            onDeleteTransactions={deleteTransactions}
                          />
                        );
                      })}
                      
                      {incomes.length > 0 && (
                        <CategoryGroup 
                          key="income_category"
                          catName={t('page.income_category') as string}
                          catTxs={incomes}
                          total={incomes
                            .filter(t => t.currency === "PLN")
                            .reduce((sum, t) => sum - Number(t.amount), 0)
                          }
                          color="#10b981"
                          categories={categories}
                          transactionsRaw={transactions || []}
                          onDeleteTransaction={deleteTransaction}
                          onDeleteTransactions={deleteTransactions}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          }
          tab2Content={
            <div className="space-y-4 pt-2">
              <EnvelopesList 
                envelopes={envs.filter((e) => e.scope === 'PERSONAL')} 
                isSharedPage={false} 
                currentMonthStart={currentMonthStart} 
              />
            </div>
          }
          floatingButton={
            <FloatingAddButton categories={categories} currentTab="budget" isSharedPage={false} />
          }
        />
      </div>
    </MobileAppLayout>
  );
}
