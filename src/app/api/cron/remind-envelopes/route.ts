import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendNotificationToUser } from "@/lib/push";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Fetch all users once for easy lookup
    const { data: allUsers } = await supabaseAdmin.from("users").select("id, language");
    const userMap = new Map(allUsers?.map(u => [u.id, u]) || []);

    // Find all envelopes with is_monthly_contribution = true
    const { data: envelopes } = await supabaseAdmin
      .from("tags")
      .select("id, name, scope, user_id")
      .eq("is_monthly_contribution", true);

    if (envelopes && envelopes.length > 0) {
      for (const envelope of envelopes) {
        // Check if there's any INCOME transaction for this envelope in the current month
        const { data: contributions } = await supabaseAdmin
          .from("transactions")
          .select("id")
          .eq("tag_id", envelope.id)
          .eq("type", "INCOME")
          .gte("created_at", currentMonthStart)
          .limit(1);

        if (!contributions || contributions.length === 0) {
          if (envelope.scope === "SHARED" && allUsers) {
            // Remind all users
            for (const u of allUsers) {
              await sendNotificationToUser(u.id, {
                title: u.language === 'ru' ? "Напоминание: Конверты" : "Нагадування: Конверти",
                body: u.language === 'ru' 
                  ? `Не забудьте пополнить совместный конверт "${envelope.name}" в этом месяце!` 
                  : `Не забудьте поповнити спільний конверт "${envelope.name}" цього місяця!`,
                url: "/"
              });
            }
          } else if (envelope.scope === "PERSONAL" && envelope.user_id) {
            // Remind only the owner
            const owner = userMap.get(envelope.user_id);
            if (owner) {
              await sendNotificationToUser(owner.id, {
                title: owner.language === 'ru' ? "Напоминание: Конверты" : "Нагадування: Конверти",
                body: owner.language === 'ru' 
                  ? `Не забудьте пополнить конверт "${envelope.name}" в этом месяце!` 
                  : `Не забудьте поповнити конверт "${envelope.name}" цього місяця!`,
                url: "/"
              });
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cron envelopes error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
