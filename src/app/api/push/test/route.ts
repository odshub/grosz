import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendNotificationToUser } from "@/lib/push";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user id
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, language")
      .eq("email", session.user.email)
      .single();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const title = user.language === 'ru' ? "Тестовое уведомление" : "Тестове сповіщення";
    const body = user.language === 'ru' 
      ? "Если вы видите это, уведомления работают отлично! 🎉" 
      : "Якщо ви бачите це, сповіщення працюють чудово! 🎉";

    await sendNotificationToUser(user.id, {
      title,
      body,
      url: "/"
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Test push error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
