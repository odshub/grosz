"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useTranslation } from "@/lib/i18n/client";

type DialogContextType = {
  showAlert: (message: string, title?: string) => void;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
};

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used within a DialogProvider");
  }
  return context;
}

export function DialogProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  
  const [alertState, setAlertState] = useState<{ isOpen: boolean; message: string; title?: string }>({ 
    isOpen: false, 
    message: "" 
  });
  
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    message: string;
    title?: string;
    resolve?: (value: boolean) => void;
  }>({ 
    isOpen: false, 
    message: "" 
  });

  const showAlert = useCallback((message: string, title?: string) => {
    setAlertState({ isOpen: true, message, title });
  }, []);

  const showConfirm = useCallback((message: string, title?: string) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ isOpen: true, message, title, resolve });
    });
  }, []);

  const handleAlertClose = () => {
    setAlertState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = (value: boolean) => {
    if (confirmState.resolve) {
      confirmState.resolve(value);
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Alert Modal */}
      {alertState.isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 sm:p-0">
          <div className="w-full max-w-sm bg-background rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              {alertState.title && <h3 className="text-xl font-bold mb-3">{alertState.title}</h3>}
              <p className="text-muted-foreground">{alertState.message}</p>
            </div>
            <div className="p-4 flex justify-center gap-3">
              <button 
                onClick={handleAlertClose}
                className="w-full py-3.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-colors"
              >
                ОК
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 sm:p-0">
          <div className="w-full max-w-sm bg-background rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              {confirmState.title && <h3 className="text-xl font-bold mb-3">{confirmState.title}</h3>}
              <p className="text-muted-foreground">{confirmState.message}</p>
            </div>
            <div className="p-4 flex gap-3">
              <button 
                onClick={() => handleConfirm(false)}
                className="flex-1 py-3.5 bg-muted text-muted-foreground font-bold rounded-xl hover:bg-muted/80 transition-colors"
              >
                {t('btn.cancel') as string}
              </button>
              <button 
                onClick={() => handleConfirm(true)}
                className="flex-1 py-3.5 bg-red-500/10 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition-colors"
              >
                ОК
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
