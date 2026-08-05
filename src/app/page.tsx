import { MobileAppLayout } from "@/components/MobileAppLayout";
import { AppHeader } from "@/components/AppHeader";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { CategoriesManager } from "@/components/CategoriesManager";
import { CategoryGroup } from "@/components/CategoryGroup";
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

export default async function Home(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const currentTab = typeof searchParams?.tab === 'string' ? searchParams.tab : 'budget';
  const t = await getTranslation();
  
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return <MobileAppLayout><div className="p-4 text-center">{t('app.subtitle')}</div></MobileAppLayout>;
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", session.user.email)
    .single();

  if (!user) {
    return <MobileAppLayout><div className="p-4 text-center">User not found</div></MobileAppLayout>;
  }

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

  // Fetch personal transactions for the current month
  const { data: transactions } = await supabaseAdmin
    .from("transactions")
    .select(`
      *,
      categories (name, color)
    `)
    .eq("user_id", user.id)
    .or("scope.eq.PERSONAL,scope.is.null")
    .is("tag_id", null)
    .gte("created_at", currentMonthStart)
    .order("created_at", { ascending: false });

  // Fetch envelopes (tags)
  const { data: envelopes } = await supabaseAdmin
    .from("tags")
    .select(`*, transactions ( id, amount, type, is_paid, created_at, label, users ( email, name ) )`)
    .eq("user_id", user.id)
    .or("scope.eq.PERSONAL,scope.is.null");

  const envs = envelopes || [];

  const { data: categoriesData } = await supabaseAdmin.from("categories").select("*").eq("user_id", user.id).or("scope.eq.PERSONAL,scope.is.null");
  const categories = categoriesData || [];

  const txs = (transactions || []).filter(t => !t.parent_id);

  const balance = (transactions || [])
    .filter(t => t.currency === "PLN" && t.is_paid !== false)
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

  const plannedExpenses = expenses
    .filter(t => t.currency === "PLN" && t.categories !== null && t.is_paid === false)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  return (
    <MobileAppLayout>
      <div className="p-4 space-y-6">
        <AppHeader title={t('app.title') as string} />
        
        {/* Tab Switcher */}
        <div className="flex bg-muted p-1 rounded-xl mb-6">
          <Link href="/?tab=budget" className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all ${currentTab === 'budget' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t('header.personal_budget')}
          </Link>
          <Link href="/?tab=envelopes" className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all ${currentTab === 'envelopes' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            {t('header.private_envelopes')}
          </Link>
        </div>

        {currentTab === 'budget' && (
          <div className="space-y-6">
            {/* Main balance (Excludes Envelopes) */}
            <div className="relative overflow-hidden rounded-2xl p-6 shadow-xl shadow-emerald-900/20 bg-gradient-to-tr from-emerald-950 via-teal-900 to-emerald-900 border border-emerald-700/50 text-white">
              {/* Decorative elements */}
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-teal-400/20 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                {/* Top Row: Chip and Logo */}
                <div className="flex justify-between items-start">
                  <svg className="w-10 h-10 text-yellow-500/80" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 6h16v12H4V6zm2 2v2h3V8H6zm0 4v2h3v-2H6zm0 4v2h3v-2H6zm10-8v2h2V8h-2zm0 4v2h2v-2h-2zm0 4v2h2v-2h-2zm-5-8v8h3V8h-3z" opacity=".8"/>
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
                  </svg>
                  <span className="font-bold text-lg tracking-widest text-slate-300 opacity-70">GROSZYK</span>
                </div>
                
                {/* Middle: Balance */}
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">{t('page.current_balance')}</p>
                  <h2 className="text-4xl font-bold tracking-tight text-white">
                    {balance.toFixed(2)} <span className="text-2xl font-normal text-slate-300">zł</span>
                  </h2>
                </div>
                
                {/* Bottom Row: Planned Expenses */}
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-slate-400">{t('page.planned_expenses')}</span>
                    <span className="font-semibold text-lg text-slate-200">{plannedExpenses.toFixed(2)} zł</span>
                  </div>
                  <div className="flex items-center gap-1.5 opacity-80">
                    <div className="w-6 h-6 rounded-full bg-red-500 mix-blend-screen"></div>
                    <div className="w-6 h-6 rounded-full bg-yellow-500 mix-blend-screen -ml-3"></div>
                  </div>
                </div>
              </div>
            </div>

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
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {currentTab === 'envelopes' && (
          <div className="space-y-4 pt-2">
            <EnvelopesList 
              envelopes={envs.filter((e) => e.scope === 'PERSONAL')} 
              isSharedPage={false} 
              currentMonthStart={currentMonthStart} 
            />
          </div>
        )}
      </div>
      {currentTab !== 'envelopes' && (
        <FloatingAddButton categories={categories} currentTab={currentTab as "budget"} isSharedPage={false} />
      )}
    </MobileAppLayout>
  );
}
