"use client";

import { createContext, useContext, useOptimistic, ReactNode } from "react";

// Simplified type
type Transaction = any;

interface OptimisticContextType {
  optimisticTxs: Transaction[];
  addOptimisticTx: (tx: Transaction) => void;
}

const OptimisticContext = createContext<OptimisticContextType | null>(null);

export function OptimisticProvider({ 
  transactions, 
  children 
}: { 
  transactions: Transaction[];
  children: ReactNode;
}) {
  const [optimisticTxs, addOptimisticTx] = useOptimistic(
    transactions,
    (state, newTx: Transaction) => [newTx, ...state]
  );

  return (
    <OptimisticContext.Provider value={{ optimisticTxs, addOptimisticTx }}>
      {children}
    </OptimisticContext.Provider>
  );
}

export function useOptimisticTransactions() {
  const context = useContext(OptimisticContext);
  if (!context) {
    throw new Error("useOptimisticTransactions must be used within OptimisticProvider");
  }
  return context;
}
