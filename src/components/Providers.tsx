"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { DialogProvider } from "./DialogProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SessionProvider>
        <DialogProvider>
          {children}
        </DialogProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
