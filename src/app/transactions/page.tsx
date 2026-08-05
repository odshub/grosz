import { MobileAppLayout } from "@/components/MobileAppLayout";
import { AppHeader } from "@/components/AppHeader";
import { supabaseAdmin } from "@/lib/supabase";
import { MonthSelector } from "@/components/MonthSelector";
import { HistoryList } from "@/components/HistoryList";
import { getTranslation } from "@/lib/i18n";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HistoryPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const t = await getTranslation();
  
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", session.user.email)
    .single();

  if (!user) {
    return <div className="p-4 text-center">User not found in database.</div>;
  }

  // Determine current month from URL or fallback to real current month
  const now = new Date();
  const currentMonthStr = typeof searchParams?.month === "string" 
    ? searchParams.month 
    : `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const [year, month] = currentMonthStr.split("-").map(Number);
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 1).toISOString();

  // Fetch ALL actual transactions (paid, no envelopes) for this month
  const { data: transactions } = await supabaseAdmin
    .from("transactions")
    .select(`
      *,
      categories (name, color),
      users (email, name)
    `)
    .or(`user_id.eq.${user.id},scope.eq.SHARED`)
    .is("tag_id", null)
    .gte("created_at", startDate)
    .lt("created_at", endDate)
    .order("created_at", { ascending: false });

  const txs = (transactions || []);

  // Generate last 6 months for the selector
  const availableMonths = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    availableMonths.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  // Ensure the requested month is in the list if they navigated manually
  if (!availableMonths.includes(currentMonthStr)) {
    availableMonths.push(currentMonthStr);
    availableMonths.sort().reverse(); // simplistic sort
  }

  return (
    <MobileAppLayout>
      <div className="pt-4 pb-20">
        <div className="px-4 mb-6">
          <AppHeader title={t('page.history') as string} />
        </div>
        
        <MonthSelector months={availableMonths} />
        
        <div className="px-4">
          <HistoryList transactions={txs as any} />
        </div>
      </div>
    </MobileAppLayout>
  );
}
