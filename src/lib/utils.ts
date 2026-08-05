import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getCurrencySymbol = (code: string) => {
  switch (code) {
    case "USD": return "$";
    case "EUR": return "€";
    case "PLN": return "zł";
    default: return code;
  }
};

export const getCurrencyColor = (code: string) => {
  switch (code) {
    case "USD": return "text-green-600 dark:text-green-500";
    case "EUR": return "text-blue-600 dark:text-blue-500";
    case "PLN": return "text-primary";
    default: return "text-foreground";
  }
};
