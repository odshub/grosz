"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
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
  const [modalType, setModalType] = useState<"TRANSACTION" | "INCOME" | "ENVELOPE" | null>(null);
  const { t } = useTranslation();

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

  if (!modalType) {
    return (
      <div className="fixed inset-0 z-60 flex items-end justify-center bg-black/50 sm:items-center">
        <div className="w-full max-w-sm p-6 bg-background rounded-t-2xl sm:rounded-xl shadow-xl flex flex-col gap-4">
          <h2 className="text-xl font-bold">{t('floating_add.what_to_add')}</h2>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setModalType("TRANSACTION")}
              className="p-4 bg-muted rounded-xl font-medium flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform aspect-square"
            >
              <span className="text-2xl">💸</span>
              <span className="text-sm">{t('modal.expense.title')}</span>
            </button>
            <button 
              onClick={() => setModalType("INCOME")}
              className="p-4 bg-muted rounded-xl font-medium flex flex-col items-center justify-center gap-2 text-green-600 dark:text-green-500 active:scale-95 transition-transform aspect-square"
            >
              <span className="text-2xl">💰</span>
              <span className="text-sm">{t('modal.income.add_btn')}</span>
            </button>
          </div>

          <button onClick={() => setIsOpen(false)} className="w-full p-4 text-muted-foreground pb-8 sm:pb-4 active:scale-95 transition-transform">
            {t('btn.cancel')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {modalType === "TRANSACTION" && (
        <AddTransactionModal categories={categories} isSharedPage={isSharedPage} onClose={() => { setIsOpen(false); setModalType(null); }} />
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
