import { MobileAppLayout } from "@/components/MobileAppLayout";
import { AppHeader } from "@/components/AppHeader";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { EnvelopesList } from "@/components/EnvelopesList";
import { TabsView } from "@/components/TabsView";
import { BudgetClient } from "@/components/BudgetClient";
import { OptimisticProvider } from "@/components/OptimisticProvider";
import { supabaseAdmin } from "@/lib/supabase";
import { executeRollover } from "@/app/actions";
import { getTranslation } from "@/lib/i18n";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
  
  return (
    <MobileAppLayout>
      <div className="p-4 space-y-6">
        <AppHeader title={t('app.title') as string} />
        
        <OptimisticProvider transactions={transactions || []}>
          <TabsView
            tab1Title={t('header.personal_budget') as string}
            tab2Title={t('header.private_envelopes') as string}
            tab1Content={
              <BudgetClient key="tab1" categories={categories} />
            }
            tab2Content={
              <div key="tab2" className="space-y-4 pt-2">
                <EnvelopesList 
                  envelopes={envs.filter((e) => e.scope === 'PERSONAL')} 
                  isSharedPage={false} 
                  currentMonthStart={currentMonthStart} 
                />
              </div>
            }
            floatingButton={
              <FloatingAddButton key="floating-btn" categories={categories} currentTab="budget" isSharedPage={false} />
            }
          />
        </OptimisticProvider>
      </div>
    </MobileAppLayout>
  );
}
