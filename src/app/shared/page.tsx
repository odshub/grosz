import { MobileAppLayout } from "@/components/MobileAppLayout";
import { AppHeader } from "@/components/AppHeader";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { EnvelopesList } from "@/components/EnvelopesList";
import { TabsView } from "@/components/TabsView";
import { SharedBudgetClient } from "@/components/SharedBudgetClient";
import { OptimisticProvider } from "@/components/OptimisticProvider";
import { supabaseAdmin } from "@/lib/supabase";
import { executeRollover } from "@/app/actions";
import { getTranslation } from "@/lib/i18n";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function SharedFinances() {
  const t = await getTranslation();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return <MobileAppLayout><div className="p-4 text-center">{t('app.subtitle')}</div></MobileAppLayout>;
  }

  const user = { id: session.user.id, email: session.user.email };

  // Trigger rollover check
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

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
      .eq("scope", "SHARED")
      .is("tag_id", null)
      .gte("created_at", currentMonthStart)
      .order("created_at", { ascending: false }),
    supabaseAdmin
      .from("tags")
      .select(`
        *,
        transactions ( id, amount, type, is_paid, created_at, operation_date, label, users ( email, name ) )
      `)
      .eq("scope", "SHARED"),
    supabaseAdmin
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .eq("scope", "SHARED")
  ]);

  const envs = envelopes || [];
  const categories = categoriesData || [];

  return (
    <MobileAppLayout>
      <div className="p-4 space-y-6">
        <AppHeader title={t('page.shared_finances') as string} />
        
        <OptimisticProvider transactions={transactions || []}>
          <TabsView
            tab1Title={t('header.shared_budget') as string}
            tab2Title={t('header.shared_envelopes') as string}
            tab1Content={
              <SharedBudgetClient key="tab1" categories={categories} />
            }
            tab2Content={
              <div key="tab2" className="space-y-4 pt-2">
                <EnvelopesList 
                  envelopes={envs.filter((e: { scope?: string }) => e.scope === 'SHARED' || !e.scope)} 
                  isSharedPage={true} 
                  currentMonthStart={currentMonthStart} 
                />
              </div>
            }
            floatingButton={
              <FloatingAddButton key="floating-btn" isSharedPage={true} currentTab="budget" categories={categories} />
            }
          />
        </OptimisticProvider>
      </div>
    </MobileAppLayout>
  );
}
