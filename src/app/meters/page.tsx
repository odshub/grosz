import { MobileAppLayout } from "@/components/MobileAppLayout";
import { AppHeader } from "@/components/AppHeader";
import { supabaseAdmin } from "@/lib/supabase";
import { getTranslation } from "@/lib/i18n";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MetersManager } from "@/components/MetersManager";

export default async function MetersPage() {
  const t = await getTranslation();
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <MobileAppLayout>
        <div className="p-4 text-center">{t('app.subtitle')}</div>
      </MobileAppLayout>
    );
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("email", session.user.email)
    .single();

  if (!user) {
    return (
      <MobileAppLayout>
        <div className="p-4 text-center">User not found</div>
      </MobileAppLayout>
    );
  }

  const [{ data: meters }, { data: meterReadings }] = await Promise.all([
    supabaseAdmin
      .from("meters")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabaseAdmin
      .from("meter_readings")
      .select("*, meters!inner(user_id)")
      .eq("meters.user_id", user.id)
      .order("date", { ascending: false })
  ]);

  const texts = {
    title: t('meters.title'),
    empty: t('meters.empty'),
    add: t('meters.add'),
    name: t('meters.name'),
    name_placeholder: t('meters.name_placeholder'),
    unit: t('meters.unit'),
    unit_placeholder: t('meters.unit_placeholder'),
    price: t('meters.price'),
    add_reading: t('meters.add_reading'),
    prev_reading: t('meters.prev_reading'),
    current_reading: t('meters.current_reading'),
    diff: t('meters.diff'),
    total_cost: t('meters.total_cost'),
    date: t('meters.date'),
    saving: t('meters.saving'),
    history: t('meters.history'),
    no_history: t('meters.no_history'),
    delete: t('btn.delete'),
    cancel: t('btn.cancel'),
    delete_confirm: t('meters.delete_confirm'),
    validation_reading_less: t('meters.validation_reading_less'),
    all_records: t('meters.all_records'),
    nothing_found: t('meters.nothing_found'),
  };

  return (
    <MobileAppLayout>
      <div className="p-4 space-y-6 pb-24">
        <AppHeader title={t('nav.meters') as string} />
        
        <MetersManager 
          meters={meters || []} 
          readings={meterReadings || []} 
          texts={texts} 
        />
      </div>
    </MobileAppLayout>
  );
}
