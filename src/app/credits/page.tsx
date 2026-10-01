import { MobileAppLayout } from "@/components/MobileAppLayout";
import { AppHeader } from "@/components/AppHeader";
import { supabaseAdmin } from "@/lib/supabase";
import { getTranslation } from "@/lib/i18n";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreditsClient } from "@/components/CreditsClient";

export default async function CreditsPage() {
  const t = await getTranslation();
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/api/auth/signin");
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!user) {
    return <div className="p-4 text-center">User not found</div>;
  }

  // Private per-user: only fetch credits for the current user
  const { data: credits } = await supabaseAdmin
    .from("credits")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const texts = {
    title: t('credits.title'),
    empty: t('credits.empty'),
    add: t('credits.add'),
    name: t('credits.name'),
    name_placeholder: t('credits.name_placeholder'),
    total_amount: t('credits.total_amount'),
    paid_amount: t('credits.paid_amount'),
    remaining: t('credits.remaining'),
    monthly_payment: t('credits.monthly_payment'),
    next_payment: t('credits.next_payment'),
    notes: t('credits.notes'),
    notes_placeholder: t('credits.notes_placeholder'),
    make_payment: t('credits.make_payment'),
    progress: t('credits.progress'),
    overdue: t('credits.overdue'),
    due_today: t('credits.due_today'),
    completed: t('credits.completed'),
    saving: t('credits.saving'),
    payment_amount: t('credits.payment_amount'),
    delete_confirm: t('credits.delete_confirm'),
    total_debt: t('credits.total_debt'),
    monthly_total: t('credits.monthly_total'),
    active_credits: t('credits.active_credits'),
    edit: t('btn.edit'),
    delete: t('btn.delete'),
    cancel: t('btn.cancel'),
    save: t('btn.save'),
  };

  return (
    <MobileAppLayout>
      <div className="p-4 space-y-6 pb-24">
        <AppHeader title={t('nav.credits') as string} />
        <CreditsClient credits={credits || []} texts={texts} />
      </div>
    </MobileAppLayout>
  );
}
