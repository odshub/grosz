"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Not authenticated");
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", session.user.email)
    .single();

  if (!user) {
    throw new Error("User not found in database");
  }
  
  return { user };
}

export async function addTransaction(formData: FormData) {
  const { user } = await getCurrentUser();
  
  const amount = parseFloat(formData.get("amount") as string);
  const type = formData.get("type") as "INCOME" | "EXPENSE";
  const currency = (formData.get("currency") as "PLN" | "USD" | "EUR") || "PLN";
  const tagId = formData.get("tagId") as string | null;
  const isShared = formData.get("isShared") === "true";
  
  const categoryId = formData.get("categoryId") as string;
  const label = (formData.get("label") as string) || null;
  const explicitIsPaid = formData.get("isPaid");
  const isPaid = explicitIsPaid !== null ? explicitIsPaid === "true" : type === "INCOME";
  const expenseType = (formData.get("expenseType") as string) || "FIXED";
  const isRecurring = formData.get("isRecurring") === "true";

  let finalCategoryId = categoryId || null;
  if (!finalCategoryId && type !== "INCOME") {
    const { data: cat } = await supabaseAdmin.from("categories").select("id").eq("user_id", user.id).limit(1).single();
    if (cat) finalCategoryId = cat.id;
  }

  const { error } = await supabaseAdmin.from("transactions").insert({
    amount,
    type,
    currency,
    scope: isShared ? "SHARED" : "PERSONAL",
    user_id: user.id,
    category_id: finalCategoryId || null,
    tag_id: tagId || null,
    label,
    is_paid: isPaid,
    expense_type: expenseType,
    is_recurring: isRecurring,
  });
  if (error) {
    console.error("Error adding transaction:", error);
    return { error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/shared");
  return { success: true };
}

export async function deleteTransaction(id: string) {
  await supabaseAdmin.from("transactions").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/shared");
  revalidatePath("/transactions");
}

export async function editTransaction(id: string, formData: FormData) {
  const amount = parseFloat(formData.get("amount") as string);
  const type = formData.get("type") as "INCOME" | "EXPENSE";
  const currency = (formData.get("currency") as "PLN" | "USD" | "EUR") || "PLN";
  const categoryId = formData.get("categoryId") as string;
  const label = (formData.get("label") as string) || null;
  const isPaid = formData.get("isPaid") === "true";
  const isShared = formData.get("isShared") === "true";
  const isRecurring = formData.get("isRecurring") === "true";

  await supabaseAdmin.from("transactions").update({
    amount,
    type,
    currency,
    category_id: categoryId,
    label,
    is_paid: isPaid,
    scope: isShared ? "SHARED" : "PERSONAL",
    is_recurring: isRecurring,
  }).eq("id", id);

  revalidatePath("/");
  revalidatePath("/shared");
}

export async function addSubTransaction(formData: FormData) {
  const { user } = await getCurrentUser();
  const parentId = formData.get("parentId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const label = (formData.get("label") as string) || null;
  
  // We need the parent's currency and category and type to match
  const { data: parent } = await supabaseAdmin.from("transactions").select("*").eq("id", parentId).single();
  if (!parent) return;

  await supabaseAdmin.from("transactions").insert({
    amount,
    type: parent.type,
    currency: parent.currency,
    scope: parent.scope,
    user_id: user.id,
    category_id: parent.category_id,
    label,
    is_paid: true, // Sub-transactions are considered "spent"
    expense_type: "FIXED",
    parent_id: parentId,
  });

  revalidatePath("/");
  revalidatePath("/shared");
}

export async function toggleTransactionPaid(id: string, isPaid: boolean) {
  await supabaseAdmin.from("transactions").update({ is_paid: isPaid }).eq("id", id);
  revalidatePath("/");
  revalidatePath("/shared");
}

export async function addCategory(formData: FormData) {
  const { user } = await getCurrentUser();
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;
  const scope = (formData.get("scope") as string) || "PERSONAL";

  await supabaseAdmin.from("categories").insert({
    name,
    color,
    user_id: user.id,
    scope,
  });

  revalidatePath("/");
  revalidatePath("/shared");
}

export async function updateCategory(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;

  await supabaseAdmin.from("categories").update({
    name,
    color,
  }).eq("id", id);

  revalidatePath("/");
  revalidatePath("/shared");
}

export async function deleteCategory(id: string) {
  // Check if there are transactions with this category
  const { data: txs } = await supabaseAdmin
    .from("transactions")
    .select("id")
    .eq("category_id", id)
    .limit(1);

  if (txs && txs.length > 0) {
    return { error: 'HAS_TRANSACTIONS' };
  }

  await supabaseAdmin.from("categories").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/shared");
  return { success: true };
}

export async function addEnvelope(formData: FormData) {
  const { user } = await getCurrentUser();
  const name = formData.get("name") as string;
  const currency = (formData.get("currency") as "PLN" | "USD" | "EUR") || "PLN";
  const isShared = formData.get("isShared") === "true";
  const color = "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');

  await supabaseAdmin.from("tags").insert({
    name,
    currency,
    color,
    user_id: user.id,
    scope: isShared ? "SHARED" : "PERSONAL",
  });

  revalidatePath("/");
  revalidatePath("/shared");
}

export async function deleteEnvelope(id: string) {
  // Disconnect transactions first
  await supabaseAdmin.from("transactions").update({ tag_id: null }).eq("tag_id", id);
  
  // Delete envelope
  await supabaseAdmin.from("tags").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/shared");
}

export async function saveSharedNote(content: string) {
  const { data: notes } = await supabaseAdmin.from("shared_notes").select("*").limit(1);
  
  if (notes && notes.length > 0) {
    await supabaseAdmin.from("shared_notes").update({ content }).eq("id", notes[0].id);
  } else {
    await supabaseAdmin.from("shared_notes").insert({ content });
  }
  revalidatePath("/notepad");
}

export async function executeRollover(scope: "PERSONAL" | "SHARED" = "PERSONAL", shouldRevalidate: boolean = false) {
  const { user } = await getCurrentUser();
  const now = new Date();
  
  // Start of current month
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  // Start of previous month
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  // 1. Check if rollover is already done for this month
  let markersQuery = supabaseAdmin
    .from("transactions")
    .select("id")
    .eq("scope", scope)
    .eq("label", `monthly_rollover_marker_${scope}`)
    .gte("created_at", currentMonthStart);

  if (scope === "PERSONAL") {
    markersQuery = markersQuery.eq("user_id", user.id);
  }

  const { data: existingMarkers } = await markersQuery;

  if (existingMarkers && existingMarkers.length > 0) {
    if (existingMarkers.length > 1) {
      // Delete duplicates that might have been created due to race conditions
      const idsToDelete = existingMarkers.slice(1).map(m => m.id);
      await supabaseAdmin.from("transactions").delete().in("id", idsToDelete);
    }
    return; // Already rolled over
  }

  // 2. Calculate balance of the previous month
  let prevQuery = supabaseAdmin
    .from("transactions")
    .select("*")
    .eq("scope", scope)
    .gte("created_at", prevMonthStart)
    .lt("created_at", currentMonthStart);

  if (scope === "PERSONAL") {
    prevQuery = prevQuery.eq("user_id", user.id);
  }

  const { data: prevTransactions } = await prevQuery;

  let prevBalance = 0;
  if (prevTransactions) {
    // Calculate total incomes and expenses for this scope.
    for (const t of prevTransactions) {
      if (t.is_paid === false) continue; // Unpaid budgets don't affect balance
      if (t.type === "INCOME") {
        prevBalance += Number(t.amount);
      } else if (t.type === "EXPENSE" && t.is_paid) {
        prevBalance -= Number(t.amount);
      }
    }
  }

  // 4. Copy unpaid templates (budgets) from previous month
  if (prevTransactions) {
    const templatesToCopy = prevTransactions.filter(t => 
      t.type === "EXPENSE" && 
      t.parent_id === null &&
      !t.label?.startsWith("monthly_rollover_marker") &&
      (!t.is_paid || t.is_recurring) // Unpaid budgets OR recurring transactions
    );

    for (const t of templatesToCopy) {
      await supabaseAdmin.from("transactions").insert({
        amount: t.amount,
        type: t.type,
        currency: t.currency,
        scope: t.scope,
        user_id: user.id,
        category_id: t.category_id,
        tag_id: t.tag_id,
        label: t.label,
        is_paid: false,
        expense_type: t.expense_type,
        is_recurring: t.is_recurring,
        created_at: new Date(now.getFullYear(), now.getMonth(), 1, 12, 5, 0).toISOString()
      });
    }
  }

  // 3 & 5. Create the marker which also carries the remainder balance
  await supabaseAdmin.from("transactions").insert({
    amount: prevBalance > 0 ? prevBalance : 0,
    type: "INCOME",
    currency: "PLN", // Defaulting to PLN
    scope: scope,
    user_id: user.id,
    label: `monthly_rollover_marker_${scope}`,
    is_paid: true,
    expense_type: "FIXED",
    created_at: new Date(now.getFullYear(), now.getMonth(), 1, 12, 10, 0).toISOString()
  });

  if (shouldRevalidate) {
    revalidatePath("/");
    revalidatePath("/shared");
  }
}

export async function createNote(content: string) {
  const { user } = await getCurrentUser();
  await supabaseAdmin.from('notes').insert({
    content,
    user_id: user.id
  });
  revalidatePath('/notepad');
}

export async function deleteNote(id: string) {
  await supabaseAdmin.from('notes').delete().eq('id', id);
  revalidatePath('/notepad');
}

export async function getNotesCount() {
  const { count, error } = await supabaseAdmin.from('notes').select('*', { count: 'exact', head: true });
  if (error) {
    console.error('Error getting notes count', error);
    return 0;
  }
  return count || 0;
}

export async function setLocale(locale: "uk" | "ru") {
  const cookieStore = await cookies();
  cookieStore.set("locale", locale, { maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/");
}

export async function updateUserName(name: string) {
  const { user } = await getCurrentUser();
  await supabaseAdmin.from("users").update({ name }).eq("id", user.id);
  revalidatePath("/");
  revalidatePath("/shared");
  revalidatePath("/transactions");
  revalidatePath("/notepad");
}

export async function getUserNickname() {
  const { user } = await getCurrentUser();
  return user.name || "";
}
