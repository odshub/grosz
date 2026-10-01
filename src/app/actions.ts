"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotificationToUser } from "@/lib/push";

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
  const isVariableAmount = formData.get("isVariableAmount") === "true";
  const operationDate = formData.get("operationDate") as string || null;

  let finalCategoryId = categoryId || null;
  if (!finalCategoryId && type !== "INCOME" && !tagId) {
    const { data: cat } = await supabaseAdmin.from("categories").select("id").eq("user_id", user.id).limit(1).single();
    if (cat) finalCategoryId = cat.id;
  }

  let createdAt = new Date().toISOString();
  if (operationDate) {
    createdAt = new Date(`${operationDate}T12:00:00Z`).toISOString();
  }

  const scope = isShared ? "SHARED" : "PERSONAL";

  const { error } = await supabaseAdmin.from("transactions").insert({
    amount,
    type,
    currency,
    scope,
    user_id: user.id,
    category_id: finalCategoryId || null,
    tag_id: tagId || null,
    label,
    is_paid: isPaid,
    expense_type: expenseType,
    is_recurring: isRecurring,
    is_variable_amount: isVariableAmount,
    operation_date: operationDate,
    created_at: createdAt,
  });
  if (error) {
    console.error("Error adding transaction:", error);
    return { error: error.message };
  }

  // Check if we need to recalculate rollovers for past months
  await recalculateRolloversFrom(scope, new Date(createdAt), user.id);

  // Push notification for shared envelope top-up
  if (isShared && type === "INCOME" && tagId) {
    try {
      const { data: tag } = await supabaseAdmin.from("tags").select("name").eq("id", tagId).single();
      if (tag) {
        const { data: allUsers } = await supabaseAdmin.from("users").select("id, language, name");
        if (allUsers) {
          for (const u of allUsers) {
            if (u.id !== user.id) {
              const userName = user.name || user.email?.split("@")[0] || "Користувач";
              await sendNotificationToUser(u.id, {
                title: u.language === 'ru' ? "Пополнение конверта" : "Поповнення конверту",
                body: u.language === 'ru' 
                  ? `${userName} пополнил(а) ${tag.name} на ${amount} ${currency}` 
                  : `${userName} поповнив(ла) ${tag.name} на ${amount} ${currency}`,
                url: "/"
              });
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to send envelope top-up push", e);
    }
  }

  revalidatePath("/");
  revalidatePath("/shared");
  return { success: true };
}

export async function deleteTransaction(id: string) {
  const { data: tx } = await supabaseAdmin.from("transactions").select("created_at, scope, user_id").eq("id", id).single();
  await supabaseAdmin.from("transactions").delete().eq("id", id);
  if (tx) {
    await recalculateRolloversFrom(tx.scope as "PERSONAL" | "SHARED", new Date(tx.created_at), tx.user_id);
  }
  revalidatePath("/");
  revalidatePath("/shared");
  revalidatePath("/transactions");
}

export async function deleteTransactions(ids: string[]) {
  if (!ids || ids.length === 0) return;
  
  // We need to fetch them to know their months to recalculate
  const { data: txs } = await supabaseAdmin.from("transactions").select("created_at, scope, user_id").in("id", ids);
  await supabaseAdmin.from("transactions").delete().in("id", ids);
  
  if (txs) {
    // Unique user-scope-month combinations

    for (const tx of txs) {
      // Find the earliest month for each user/scope
      await recalculateRolloversFrom(tx.scope as "PERSONAL" | "SHARED", new Date(tx.created_at), tx.user_id);
    }
  }

  revalidatePath("/");
  revalidatePath("/shared");
  revalidatePath("/transactions");
}


export async function editTransaction(id: string, formData: FormData) {
  const { data: oldTx } = await supabaseAdmin.from("transactions").select("created_at, scope, user_id").eq("id", id).single();

  const amount = parseFloat(formData.get("amount") as string);
  const type = formData.get("type") as "INCOME" | "EXPENSE";
  const currency = (formData.get("currency") as "PLN" | "USD" | "EUR") || "PLN";
  const categoryId = formData.get("categoryId") as string;
  const label = (formData.get("label") as string) || null;
  const isPaid = formData.get("isPaid") === "true";
  const isShared = formData.get("isShared") === "true";
  const isRecurring = formData.get("isRecurring") === "true";
  const operationDate = formData.get("operationDate") as string || null;

  let createdAt = undefined;
  if (operationDate) {
    createdAt = new Date(`${operationDate}T12:00:00Z`).toISOString();
  }

  await supabaseAdmin.from("transactions").update({
    amount,
    type,
    currency,
    category_id: categoryId,
    label,
    is_paid: isPaid,
    scope: isShared ? "SHARED" : "PERSONAL",
    is_recurring: isRecurring,
    operation_date: operationDate,
    ...(createdAt ? { created_at: createdAt } : {})
  }).eq("id", id);

  if (oldTx) {
    await recalculateRolloversFrom(oldTx.scope as "PERSONAL" | "SHARED", new Date(oldTx.created_at), oldTx.user_id);
    if (createdAt) {
       const oldMonth = new Date(oldTx.created_at).getMonth();
       const newMonth = new Date(createdAt).getMonth();
       if (oldMonth !== newMonth || new Date(oldTx.created_at).getFullYear() !== new Date(createdAt).getFullYear()) {
         await recalculateRolloversFrom(isShared ? "SHARED" : "PERSONAL", new Date(createdAt), oldTx.user_id);
       }
    }
  }

  revalidatePath("/");
  revalidatePath("/shared");
}

export async function addSubTransaction(formData: FormData) {
  const { user } = await getCurrentUser();
  const parentId = formData.get("parentId") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const label = (formData.get("label") as string) || null;
  const operationDate = formData.get("operationDate") as string || null;
  
  let createdAt = new Date().toISOString();
  if (operationDate) {
    createdAt = new Date(`${operationDate}T12:00:00Z`).toISOString();
  }
  
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
    operation_date: operationDate,
    created_at: createdAt,
  });

  await recalculateRolloversFrom(parent.scope as "PERSONAL" | "SHARED", new Date(createdAt), user.id);

  revalidatePath("/");
  revalidatePath("/shared");
}

export async function toggleTransactionPaid(id: string, isPaid: boolean) {
  const { data: tx } = await supabaseAdmin.from("transactions").select("operation_date").eq("id", id).single();
  const updateData: Record<string, boolean | string> = { is_paid: isPaid };
  if (isPaid && tx && !tx.operation_date) {
    updateData.operation_date = new Date().toISOString();
  }
  await supabaseAdmin.from("transactions").update(updateData).eq("id", id);
  revalidatePath("/");
  revalidatePath("/shared");
}

export async function updateTransactionAmount(id: string, newAmount: number) {
  await supabaseAdmin.from("transactions").update({ amount: newAmount }).eq("id", id);
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
  const icon = (formData.get("icon") as "cash" | "credit") || "cash";
  const isShared = formData.get("isShared") === "true";
  const color = "#" + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  const isMonthlyContribution = formData.get("isMonthlyContribution") === "true";

  await supabaseAdmin.from("tags").insert({
    name,
    currency,
    icon,
    color,
    user_id: user.id,
    scope: isShared ? "SHARED" : "PERSONAL",
    is_monthly_contribution: isMonthlyContribution,
  });

  revalidatePath("/");
  revalidatePath("/shared");
}

export async function deleteEnvelope(id: string) {
  // Delete transactions associated with the envelope
  await supabaseAdmin.from("transactions").delete().eq("tag_id", id);
  
  // Delete envelope
  await supabaseAdmin.from("tags").delete().eq("id", id);
  revalidatePath("/");
  revalidatePath("/shared");
}

export async function saveSharedNote(content: string) {
  const { data: notes } = await supabaseAdmin.from("shared_notes").select("*").limit(1);
  const { user } = await getCurrentUser();
  
  if (notes && notes.length > 0) {
    await supabaseAdmin.from("shared_notes").update({ content }).eq("id", notes[0].id);
  } else {
    await supabaseAdmin.from("shared_notes").insert({ content });
  }
  
  try {
    const { data: allUsers } = await supabaseAdmin.from("users").select("id, language");
    if (allUsers) {
      for (const u of allUsers) {
        if (u.id !== user.id) { // Notify others
          await sendNotificationToUser(u.id, {
            title: u.language === 'ru' ? "Общая заметка обновлена" : "Спільну нотатку оновлено",
            body: content,
            url: "/notepad"
          });
        }
      }
    }
  } catch (e) {
    console.error("Failed to send shared note push", e);
  }

  revalidatePath("/notepad");
}

export async function executeRollover(scope: "PERSONAL" | "SHARED" = "PERSONAL", shouldRevalidate: boolean = false, targetDate?: Date) {
  const { user } = await getCurrentUser();
  const now = targetDate || new Date();
  
  // Start of current month
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  // Start of previous month
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  // Start of next month (to bound the marker query)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();

  // 1. Check if rollover is already done for this month
  let markersQuery = supabaseAdmin
    .from("transactions")
    .select("id")
    .eq("scope", scope)
    .eq("label", `monthly_rollover_marker_${scope}`)
    .gte("created_at", currentMonthStart)
    .lt("created_at", nextMonthStart);

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
    .is("tag_id", null)
    .gte("created_at", prevMonthStart)
    .lt("created_at", currentMonthStart);

  if (scope === "PERSONAL") {
    prevQuery = prevQuery.eq("user_id", user.id);
  }

  const { data: prevTransactions } = await prevQuery;

  let prevBalance = 0;
  if (prevTransactions) {
    const paidParentIds = new Set(
      prevTransactions.filter(t => !t.parent_id && t.is_paid !== false).map(t => t.id)
    );
    
    // Calculate total incomes and expenses for this scope.
    for (const t of prevTransactions) {
      if (t.is_paid === false) continue; // Unpaid budgets don't affect balance
      if (t.parent_id && paidParentIds.has(t.parent_id)) continue; // Exclude sub-txs of paid parents
      
      if (t.type === "INCOME") {
        prevBalance += Number(t.amount);
      } else if (t.type === "EXPENSE") {
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
      const tAny = t as Record<string, unknown>;
      await supabaseAdmin.from("transactions").insert({
        amount: tAny.is_variable_amount ? 0 : t.amount,
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
        is_variable_amount: tAny.is_variable_amount,
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

async function recalculateRolloversFrom(scope: "PERSONAL" | "SHARED", fromDate: Date, userId: string) {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startMonth = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);

  // If the transaction is in the current month or future, no rollover needs to be updated.
  if (startMonth.getTime() >= currentMonth.getTime()) return;

  // Recalculate for every month from startMonth + 1 up to currentMonth
  let monthToRecalculate = new Date(startMonth.getFullYear(), startMonth.getMonth() + 1, 1);
  
  while (monthToRecalculate.getTime() <= currentMonth.getTime()) {
    const monthStartIso = monthToRecalculate.toISOString();
    const nextMonthIso = new Date(monthToRecalculate.getFullYear(), monthToRecalculate.getMonth() + 1, 1).toISOString();
    
    // Delete existing marker and any duplicated ones in that specific month
    let deleteQuery = supabaseAdmin
      .from("transactions")
      .delete()
      .eq("scope", scope)
      .eq("label", `monthly_rollover_marker_${scope}`)
      .gte("created_at", monthStartIso)
      .lt("created_at", nextMonthIso);

    if (scope === "PERSONAL") {
      deleteQuery = deleteQuery.eq("user_id", userId);
    }
    await deleteQuery;

    // Run executeRollover for this month (pass false for shouldRevalidate to avoid redundant invalidations)
    await executeRollover(scope, false, monthToRecalculate);
    
    // Move to next month
    monthToRecalculate = new Date(monthToRecalculate.getFullYear(), monthToRecalculate.getMonth() + 1, 1);
  }
}

export async function createNote(content: string) {
  const { user } = await getCurrentUser();
  await supabaseAdmin.from('notes').insert({
    content,
    user_id: user.id
  });
  
  try {
    const { data: allUsers } = await supabaseAdmin.from("users").select("id, language");
    if (allUsers) {
      for (const u of allUsers) {
        if (u.id !== user.id) { // Notify others
          await sendNotificationToUser(u.id, {
            title: u.language === 'ru' ? "Новая заметка" : "Нова нотатка",
            body: content,
            url: "/notepad"
          });
        }
      }
    }
  } catch (e) {
    console.error("Failed to send note push", e);
  }
  
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
  
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      await supabaseAdmin.from("users").update({ language: locale }).eq("email", session.user.email);
    }
  } catch (e) {
    console.error("Failed to save language to DB", e);
  }
  
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

// ==========================================
// METERS (Лічильники)
// ==========================================

export async function addMeter(formData: FormData) {
  const { user } = await getCurrentUser();
  const name = formData.get("name") as string;
  const unit = formData.get("unit") as string;
  const defaultPrice = formData.get("defaultPricePerUnit") ? parseFloat(formData.get("defaultPricePerUnit") as string) : null;

  const { error } = await supabaseAdmin.from("meters").insert({
    user_id: user.id,
    name,
    unit,
    default_price_per_unit: defaultPrice,
  });

  if (error) {
    console.error("Error adding meter:", error);
    return { error: error.message };
  }

  revalidatePath("/meters");
  return { success: true };
}

export async function deleteMeter(id: string) {
  await supabaseAdmin.from("meters").delete().eq("id", id);
  revalidatePath("/meters");
}

export async function addMeterReading(formData: FormData) {
  const meterId = formData.get("meterId") as string;
  let date = formData.get("date") as string;
  if (date && date.length === 7) {
    date = `${date}-01`;
  }
  const previousReading = parseFloat(formData.get("previousReading") as string) || 0;
  const currentReading = parseFloat(formData.get("currentReading") as string);
  const pricePerUnit = parseFloat(formData.get("pricePerUnit") as string);
  
  const totalCost = (currentReading - previousReading) * pricePerUnit;

  const { error } = await supabaseAdmin.from("meter_readings").insert({
    meter_id: meterId,
    date,
    previous_reading: previousReading,
    current_reading: currentReading,
    price_per_unit: pricePerUnit,
    total_cost: totalCost > 0 ? totalCost : 0,
  });

  if (error) {
    console.error("Error adding meter reading:", error);
    return { error: error.message };
  }

  revalidatePath("/meters");
  return { success: true };
}

export async function deleteMeterReading(id: string) {
  await supabaseAdmin.from("meter_readings").delete().eq("id", id);
  revalidatePath("/meters");
}

export async function updateMeterReading(id: string, formData: FormData) {
  const date = formData.get("date") as string;
  const previousReading = parseFloat(formData.get("previousReading") as string) || 0;
  const currentReading = parseFloat(formData.get("currentReading") as string);
  const pricePerUnit = parseFloat(formData.get("pricePerUnit") as string);

  const totalCost = (currentReading - previousReading) * pricePerUnit;

  const { error } = await supabaseAdmin.from("meter_readings").update({
    date,
    previous_reading: previousReading,
    current_reading: currentReading,
    price_per_unit: pricePerUnit,
    total_cost: totalCost > 0 ? totalCost : 0,
  }).eq("id", id);

  if (error) {
    console.error("Error updating meter reading:", error);
    return { error: error.message };
  }

  revalidatePath("/meters");
  return { success: true };
}

// ==========================================
// CREDITS (Кредити)
// ==========================================

export async function addCredit(formData: FormData) {
  const { user } = await getCurrentUser();
  const name = formData.get("name") as string;
  const totalAmount = parseFloat(formData.get("totalAmount") as string);
  const paidAmount = parseFloat(formData.get("paidAmount") as string) || 0;
  const monthlyPayment = parseFloat(formData.get("monthlyPayment") as string);
  const nextPaymentDate = formData.get("nextPaymentDate") as string || null;
  const notes = (formData.get("notes") as string) || null;

  const { error } = await supabaseAdmin.from("credits").insert({
    user_id: user.id,
    name,
    total_amount: totalAmount,
    paid_amount: paidAmount,
    monthly_payment: monthlyPayment,
    next_payment_date: nextPaymentDate || null,
    notes,
  });

  if (error) {
    console.error("Error adding credit:", error);
    return { error: error.message };
  }

  revalidatePath("/credits");
  return { success: true };
}

export async function updateCredit(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const totalAmount = parseFloat(formData.get("totalAmount") as string);
  const paidAmount = parseFloat(formData.get("paidAmount") as string) || 0;
  const monthlyPayment = parseFloat(formData.get("monthlyPayment") as string);
  const nextPaymentDate = formData.get("nextPaymentDate") as string || null;
  const notes = (formData.get("notes") as string) || null;

  const { error } = await supabaseAdmin.from("credits").update({
    name,
    total_amount: totalAmount,
    paid_amount: paidAmount,
    monthly_payment: monthlyPayment,
    next_payment_date: nextPaymentDate || null,
    notes,
  }).eq("id", id);

  if (error) {
    console.error("Error updating credit:", error);
    return { error: error.message };
  }

  revalidatePath("/credits");
  return { success: true };
}

export async function deleteCredit(id: string) {
  await supabaseAdmin.from("credits").delete().eq("id", id);
  revalidatePath("/credits");
}

export async function makeCreditPayment(id: string, amount?: number) {
  const { data: credit } = await supabaseAdmin.from("credits").select("*").eq("id", id).single();
  if (!credit) return { error: "Credit not found" };

  const paymentAmount = amount || credit.monthly_payment;
  const newPaidAmount = Number(credit.paid_amount) + paymentAmount;

  // Calculate next payment date (one month later)
  let nextDate = null;
  if (credit.next_payment_date) {
    const d = new Date(credit.next_payment_date);
    d.setMonth(d.getMonth() + 1);
    nextDate = d.toISOString().slice(0, 10);
  }

  await supabaseAdmin.from("credits").update({
    paid_amount: newPaidAmount > credit.total_amount ? credit.total_amount : newPaidAmount,
    next_payment_date: newPaidAmount >= credit.total_amount ? null : nextDate,
  }).eq("id", id);

  revalidatePath("/credits");
  return { success: true };
}
