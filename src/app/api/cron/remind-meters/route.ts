import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendNotificationToUser } from "@/lib/push";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: allUsers } = await supabaseAdmin.from("users").select("id, language");
    if (allUsers) {
      for (const u of allUsers) {
        await sendNotificationToUser(u.id, {
          title: u.language === 'ru' ? "Напоминание: Счетчики" : "Нагадування: Лічильники",
          body: u.language === 'ru' ? "Не забудьте внести показания счетчиков!" : "Не забудьте внести показники лічильників!",
          url: "/meters"
        });
      }
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cron meters error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
