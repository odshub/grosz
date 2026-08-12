"use client";

import { useState, useEffect } from "react";
import { Plus, TrendingDown, TrendingUp, Pin, PieChart } from "lucide-react";
import { AddTransactionModal } from "./AddTransactionModal";
import { IncomeModal } from "./IncomeModal";
import { AddEnvelopeModal } from "./AddEnvelopeModal";
import { useTranslation } from "@/lib/i18n/client";

interface FloatingAddButtonProps {
  isSharedPage?: boolean;
  currentTab?: "personal" | "budget" | "envelopes";
  categories?: { id: string; name: string; color: string }[];
}

export function FloatingAddButton({ isSharedPage = false, currentTab = "personal", categories = [] }: FloatingAddButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<"SELECT_EXPENSE_TYPE" | "TRANSACTION" | "INCOME" | "ENVELOPE" | null>(null);
  const [expenseType, setExpenseType] = useState<"FIXED" | "FLOATING">("FIXED");
  const { t } = useTranslation();

  // Prevent background scrolling when any modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          setIsOpen(true);
          if (currentTab === "envelopes") {
            setModalType("ENVELOPE");
          } else {
            setModalType(null);
          }
        }}
        className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-transform active:scale-95 z-50"
      >
        <Plus className="w-6 h-6" />
      </button>
    );
  }

  if (!modalType || modalType === "SELECT_EXPENSE_TYPE") {
    return (
      <div className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 sm:items-center">
        <div className="w-full max-w-sm p-6 bg-background rounded-t-2xl sm:rounded-xl shadow-xl flex flex-col gap-4 animate-in slide-in-from-bottom-4 fade-in duration-200">
          <h2 className="text-xl font-bold">
            {!modalType ? t('floating_add.what_to_add') : t('modal.expense.expense_type')}
          </h2>
          <div className="overflow-hidden w-full px-1">
            <div className="grid">
              
              {/* Step 1: Type Selection */}
              <div 
                className={`col-start-1 row-start-1 grid grid-cols-2 gap-3 transition-all duration-300 ease-in-out ${modalType === 'SELECT_EXPENSE_TYPE' ? 'translate-y-full opacity-0 pointer-events-none' : 'translate-y-0 opacity-100'}`}
              >
                <button 
                  onClick={() => setModalType("SELECT_EXPENSE_TYPE")}
                  className="p-4 bg-muted rounded-xl font-medium flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform aspect-square"
                >
                  <TrendingDown className="w-8 h-8 text-rose-500" />
                  <span className="text-sm">{t('modal.expense.title')}</span>
                </button>
                <button 
                  onClick={() => setModalType("INCOME")}
                  className="p-4 bg-muted rounded-xl font-medium flex flex-col items-center justify-center gap-2 text-emerald-600 dark:text-emerald-500 active:scale-95 transition-transform aspect-square"
                >
                  <TrendingUp className="w-8 h-8 text-emerald-600 dark:text-emerald-500" />
                  <span className="text-sm">{t('modal.income.add_btn')}</span>
                </button>
              </div>

              {/* Step 2: Expense Type Selection */}
              <div 
                className={`col-start-1 row-start-1 grid grid-cols-2 gap-3 transition-all duration-300 ease-in-out ${modalType === 'SELECT_EXPENSE_TYPE' ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}
              >
                <button 
                  onClick={() => {
                    setExpenseType("FIXED");
                    setModalType("TRANSACTION");
                  }}
                  className="p-4 bg-muted rounded-xl font-medium flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform aspect-square"
                >
                  <Pin className="w-8 h-8 text-primary" />
                  <span className="text-sm">{t('modal.expense.type_fixed') || "Фіксована витрата"}</span>
                </button>
                <button 
                  onClick={() => {
                    setExpenseType("FLOATING");
                    setModalType("TRANSACTION");
                  }}
                  className="p-4 bg-muted rounded-xl font-medium flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform aspect-square text-blue-600 dark:text-blue-500"
                >
                  <PieChart className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                  <span className="text-sm">{t('modal.expense.type_floating') || "Створити бюджет"}</span>
                </button>
              </div>

            </div>
          </div>

          <button 
            onClick={() => {
              if (modalType === "SELECT_EXPENSE_TYPE") {
                setModalType(null); // Go back
              } else {
                setIsOpen(false);
              }
            }} 
            className="w-full p-4 text-muted-foreground pb-8 sm:pb-4 active:scale-95 transition-transform"
          >
            {modalType === "SELECT_EXPENSE_TYPE" ? "Назад" : t('btn.cancel')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {modalType === "TRANSACTION" && (
        <AddTransactionModal initialExpenseType={expenseType} categories={categories} isSharedPage={isSharedPage} onClose={() => { setIsOpen(false); setModalType(null); }} />
      )}
      {modalType === "INCOME" && (
        <IncomeModal isSharedPage={isSharedPage} onClose={() => { setIsOpen(false); setModalType(null); }} />
      )}
      {modalType === "ENVELOPE" && (
        <AddEnvelopeModal isSharedPage={isSharedPage} onClose={() => { setIsOpen(false); setModalType(null); }} />
      )}
    </>
  );
}
