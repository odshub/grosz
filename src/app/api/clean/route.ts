import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseAdmin.from("users").select("*").limit(1);
  return NextResponse.json({ data, error });
}
