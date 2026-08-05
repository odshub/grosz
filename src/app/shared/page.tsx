import { MobileAppLayout } from "@/components/MobileAppLayout";
import { AppHeader } from "@/components/AppHeader";
import { CategoryGroup } from "@/components/CategoryGroup";
import { CategoriesManager } from "@/components/CategoriesManager";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { EnvelopesList } from "@/components/EnvelopesList";
import { supabaseAdmin } from "@/lib/supabase";
import { deleteTransaction, executeRollover } from "@/app/actions";
import Link from "next/link";
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
};

export default async function SharedFinances(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const currentTab = typeof searchParams?.tab === 'string' ? searchParams.tab : 'budget';
  const t = await getTranslation();

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return <MobileAppLayout><div className="p-4 text-center">{t('app.subtitle')}</div></MobileAppLayout>;
  }

  // Trigger rollover check
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", session.user.email)
    .single();

  if (!user) {
    return <MobileAppLayout><div className="p-4 text-center">User not found</div></MobileAppLayout>;
  }

  const { data: existingMarker } = await supabaseAdmin
    .from("transactions")
    .select("id")
    .eq("scope", "SHARED")
    .eq("label", "monthly_rollover_marker_SHARED")
    .gte("created_at", currentMonthStart);

  if (!existingMarker || existingMarker.length === 0) {
    await executeRollover("SHARED");
  } else if (existingMarker.length > 1) {
    await executeRollover("SHARED"); // Triggers duplicate cleanup
  }

  // Fetch shared transactions for the current month
  const { data: transactions } = await supabaseAdmin
    .from("transactions")
    .select(`
      *,
      categories (name, color)
    `)
    .eq("scope", "SHARED")
    .is("tag_id", null)
    .gte("created_at", currentMonthStart)
    .order("created_at", { ascending: false });

  // Fetch envelopes (tags) and their specific transactions
  const { data: envelopes } = await supabaseAdmin
    .from("tags")
    .select(`
      *,
      transactions ( id, amount, type, is_paid, created_at, label, users ( email, name ) )
    `)
    .eq("scope", "SHARED");

  const { data: categoriesData } = await supabaseAdmin.from("categories").select("*").eq("user_id", user.id).eq("scope", "SHARED");
  const categories = categoriesData || [];

  const txs = (transactions || []).filter(t => !t.parent_id);
  const envs = envelopes || [];

  // Calculate overall shared balance
  const sharedBalance = (transactions || [])
    .filter(t => t.currency === "PLN" && t.is_paid !== false)
    .reduce((acc, t) => t.type === "INCOME" ? acc + Number(t.amount) : acc - Number(t.amount), 0);

  const incomes = txs.filter(t => t.type === "INCOME");
  const expenses = txs.filter(t => t.type === "EXPENSE");

  const groupedExpenses = expenses.reduce((acc, tx: Transaction) => {
    const catName = tx.categories?.name || t('page.no_category');
    if (!acc[catName]) acc[catName] = [];
    acc[catName].push(tx);
    return acc;
  }, {} as Record<string, Transaction[]>);

  return (
    <MobileAppLayout>
      <div className="p-4 space-y-6">
        <AppHeader title={t('page.shared_finances') as string} />
        
        {/* Tab Switcher */}
        <div className="flex bg-muted p-1 rounded-xl">
          <Link href="/shared?tab=budget" className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all ${currentTab === 'budget' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t('header.shared_budget')}
          </Link>
          <Link href="/shared?tab=envelopes" className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all ${currentTab === 'envelopes' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t('header.shared_envelopes')}
          </Link>
        </div>

        {currentTab === 'budget' && (
          <div className="space-y-6">
            <div className="p-6 bg-card rounded-xl border border-border shadow-sm">
              <p className="text-sm text-muted-foreground mb-1">{t('page.shared_balance')}</p>
              <h2 className="text-4xl font-semibold tracking-tight">{sharedBalance.toFixed(2)} zł</h2>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <h3 className="font-medium text-lg">{t('page.your_transactions_shared')}</h3>
                <CategoriesManager categories={categories} scope="SHARED" />
              </div>
              
              <div className="space-y-6">
                {txs.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">{t('page.no_transactions')}</p>
                ) : (
                  <>
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
                      />
                    )}
                    
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
                        />
                      );
                    })}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'envelopes' && (
          <div className="space-y-4 pt-2">
            <EnvelopesList 
              envelopes={envs.filter((e) => e.scope === 'SHARED' || !e.scope)} 
              isSharedPage={true} 
              currentMonthStart={currentMonthStart} 
            />
          </div>
        )}
      </div>
      {currentTab !== 'envelopes' && (
        <FloatingAddButton isSharedPage={true} currentTab={currentTab as "budget" | "envelopes"} categories={categories} />
      )}
    </MobileAppLayout>
  );
}
