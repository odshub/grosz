"use client";

import { useState } from "react";
import { addCredit, updateCredit, deleteCredit, makeCreditPayment } from "@/app/actions";
import { useDialog } from "./DialogProvider";

type Credit = {
  id: string;
  user_id: string;
  name: string;
  total_amount: number;
  paid_amount: number;
  monthly_payment: number;
  next_payment_date: string | null;
  notes: string | null;
  created_at: string;
};

interface CreditsClientProps {
  credits: Credit[];
  texts: Record<string, string>;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const datePart = dateStr.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length >= 3) {
    return `${parts[2].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${parts[0]}`;
  }
  return dateStr;
}

function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CreditsClient({ credits: initialCredits, texts }: CreditsClientProps) {
  const { showConfirm } = useDialog();
  const [isAdding, setIsAdding] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const today = new Date();

  function getPaymentStatus(credit: Credit) {
    if (!credit.next_payment_date) return null;
    const nextDate = new Date(credit.next_payment_date);
    const diff = nextDate.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return 'overdue';
    if (days === 0) return 'due_today';
    if (days <= 3) return 'due_soon';
    return null;
  }

  async function handleAdd(formData: FormData) {
    setIsPending(true);
    const result = await addCredit(formData);
    if (result?.error) {
      alert("Error: " + result.error);
    } else {
      setIsAdding(false);
    }
    setIsPending(false);
  }

  async function handleEdit(id: string, formData: FormData) {
    setIsPending(true);
    const result = await updateCredit(id, formData);
    if (result?.error) {
      alert("Error: " + result.error);
    } else {
      setEditingId(null);
    }
    setIsPending(false);
  }

  async function handleDelete(id: string) {
    const confirmed = await showConfirm(texts.delete_confirm);
    if (!confirmed) return;
    setIsPending(true);
    await deleteCredit(id);
    setIsPending(false);
  }

  async function handlePayment(id: string, amount?: number) {
    setIsPending(true);
    await makeCreditPayment(id, amount);
    setPaymentId(null);
    setIsPending(false);
  }

  function renderCreditForm(credit?: Credit) {
    const isEdit = !!credit;
    return (
      <form
        action={(formData) => isEdit ? handleEdit(credit!.id, formData) : handleAdd(formData)}
        className="bg-card p-5 rounded-2xl border border-border shadow-sm space-y-4"
      >
        <h3 className="font-semibold">{isEdit ? texts.edit : texts.add}</h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-1 block">{texts.name}</label>
            <input
              type="text"
              name="name"
              required
              defaultValue={credit?.name}
              placeholder={texts.name_placeholder}
              className="w-full p-3 rounded-xl border border-border bg-background"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">{texts.total_amount}</label>
              <input
                type="number"
                name="totalAmount"
                step="0.01"
                required
                defaultValue={credit?.total_amount}
                placeholder="0.00"
                className="w-full p-3 rounded-xl border border-border bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{texts.paid_amount}</label>
              <input
                type="number"
                name="paidAmount"
                step="0.01"
                defaultValue={credit?.paid_amount || 0}
                className="w-full p-3 rounded-xl border border-border bg-background"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">{texts.monthly_payment}</label>
              <input
                type="number"
                name="monthlyPayment"
                step="0.01"
                required
                defaultValue={credit?.monthly_payment}
                placeholder="0.00"
                className="w-full p-3 rounded-xl border border-border bg-background"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{texts.next_payment}</label>
              <input
                type="date"
                name="nextPaymentDate"
                defaultValue={credit?.next_payment_date?.split('T')[0]?.slice(0, 10) || getTodayStr()}
                className="w-full p-3 rounded-xl border border-border bg-background"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">{texts.notes}</label>
            <textarea
              name="notes"
              defaultValue={credit?.notes || ''}
              placeholder={texts.notes_placeholder}
              className="w-full p-3 rounded-xl border border-border bg-background resize-none min-h-[60px]"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 bg-primary text-primary-foreground py-3 rounded-xl font-medium"
          >
            {isPending ? texts.saving : (isEdit ? texts.save : texts.add)}
          </button>
          <button
            type="button"
            onClick={() => isEdit ? setEditingId(null) : setIsAdding(false)}
            disabled={isPending}
            className="flex-1 bg-muted text-foreground py-3 rounded-xl font-medium"
          >
            {texts.cancel}
          </button>
        </div>
      </form>
    );
  }

  function renderCreditCard(credit: Credit) {
    if (editingId === credit.id) {
      return <div key={credit.id}>{renderCreditForm(credit)}</div>;
    }

    const progress = credit.total_amount > 0 ? (credit.paid_amount / credit.total_amount) * 100 : 0;
    const remaining = credit.total_amount - credit.paid_amount;
    const isCompleted = remaining <= 0;
    const status = getPaymentStatus(credit);

    return (
      <div
        key={credit.id}
        className={`bg-card rounded-2xl shadow-sm border overflow-hidden transition-colors ${
          status === 'overdue' ? 'border-red-500/50' :
          status === 'due_today' ? 'border-yellow-500/50' :
          isCompleted ? 'border-emerald-500/50' :
          'border-border'
        }`}
      >
        {/* Status badge */}
        {status && !isCompleted && (
          <div className={`px-4 py-1.5 text-xs font-bold text-center ${
            status === 'overdue' ? 'bg-red-500/10 text-red-500' :
            status === 'due_today' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
            'bg-blue-500/10 text-blue-600 dark:text-blue-400'
          }`}>
            {status === 'overdue'
              ? `⚠️ ${texts.overdue}`
              : status === 'due_today'
                ? `🔔 ${texts.due_today}`
                : `📅 ${texts.next_payment}: ${formatDate(credit.next_payment_date!)}`}
          </div>
        )}

        {isCompleted && (
          <div className="px-4 py-1.5 text-xs font-bold text-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            ✅ {texts.completed}
          </div>
        )}

        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-lg truncate">{credit.name}</h3>
              {credit.notes && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{credit.notes}</p>
              )}
            </div>
            <div className="flex gap-1 shrink-0 ml-2">
              <button
                onClick={() => setEditingId(credit.id)}
                className="p-1.5 text-muted-foreground hover:text-primary rounded-md transition-colors"
                title={texts.edit}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </button>
              <button
                onClick={() => handleDelete(credit.id)}
                className="p-1.5 text-muted-foreground hover:text-red-500 rounded-md transition-colors"
                title={texts.delete}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>{texts.progress}: {Math.min(progress, 100).toFixed(0)}%</span>
              <span>{credit.paid_amount.toFixed(2)} / {credit.total_amount.toFixed(2)} PLN</span>
            </div>
            <div className="h-2.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-primary'}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 text-center bg-muted/30 p-3 rounded-xl border border-border/50">
            <div>
              <p className="text-xs text-muted-foreground">{texts.remaining}</p>
              <p className="font-bold text-sm">{remaining > 0 ? remaining.toFixed(2) : '0.00'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{texts.monthly_payment}</p>
              <p className="font-bold text-sm">{credit.monthly_payment.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{texts.next_payment}</p>
              <p className="font-bold text-sm">{credit.next_payment_date ? formatDate(credit.next_payment_date) : '—'}</p>
            </div>
          </div>

          {/* Payment */}
          {!isCompleted && (
            <>
              {paymentId === credit.id ? (
                <form
                  action={(formData) => {
                    const amount = parseFloat(formData.get("amount") as string);
                    handlePayment(credit.id, amount);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="number"
                    name="amount"
                    step="0.01"
                    required
                    defaultValue={credit.monthly_payment}
                    className="flex-1 p-2.5 rounded-xl border border-border bg-background"
                    placeholder={texts.payment_amount}
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-medium text-sm"
                  >
                    ✓
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentId(null)}
                    className="px-4 py-2.5 bg-muted rounded-xl font-medium text-sm"
                  >
                    ✕
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setPaymentId(credit.id)}
                  className={`w-full py-2.5 rounded-xl font-medium text-sm transition-colors ${
                    status === 'overdue' || status === 'due_today'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-muted/50 text-foreground hover:bg-muted border border-border'
                  }`}
                >
                  💰 {texts.make_payment}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Summary stats
  const totalDebt = initialCredits.reduce((acc, c) => acc + Math.max(c.total_amount - c.paid_amount, 0), 0);
  const totalMonthly = initialCredits.filter(c => c.total_amount - c.paid_amount > 0).reduce((acc, c) => acc + c.monthly_payment, 0);
  const overdueCount = initialCredits.filter(c => getPaymentStatus(c) === 'overdue' || getPaymentStatus(c) === 'due_today').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-2 border-b border-border">
        <h2 className="text-xl font-semibold">{texts.title}</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="text-primary font-medium flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          {texts.add}
        </button>
      </div>

      {/* Summary card */}
      {initialCredits.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">{texts.total_debt || 'Загальний борг'}</p>
              <p className="font-bold text-lg">{totalDebt.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">PLN</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">{texts.monthly_total || 'Щомісяця'}</p>
              <p className="font-bold text-lg">{totalMonthly.toFixed(0)}</p>
              <p className="text-xs text-muted-foreground">PLN</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">{texts.active_credits || 'Активних'}</p>
              <p className="font-bold text-lg">{initialCredits.filter(c => c.total_amount - c.paid_amount > 0).length}</p>
              {overdueCount > 0 && (
                <p className="text-xs text-red-500 font-medium">⚠️ {overdueCount}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {isAdding && renderCreditForm()}

      {initialCredits.length === 0 && !isAdding ? (
        <div className="text-center py-10 bg-muted/30 rounded-2xl border border-dashed border-border">
          <p className="text-4xl mb-2">💳</p>
          <p className="text-muted-foreground">{texts.empty}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {initialCredits.map(credit => renderCreditCard(credit))}
        </div>
      )}
    </div>
  );
}
