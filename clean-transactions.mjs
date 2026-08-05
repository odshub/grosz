import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanTransactions() {
  console.log("Cleaning transactions...");
  const { error } = await supabaseAdmin.from("transactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (error) {
    console.error("Failed to clean transactions:", error);
  } else {
    console.log("Successfully cleaned all transactions.");
  }
}

cleanTransactions();
