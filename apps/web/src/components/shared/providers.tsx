"use client";

import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    // attribute="class" → next-themes injects "dark" class on <html>
    // defaultTheme="system" → respects OS preference on first visit
    // enableSystem → listens to prefers-color-scheme media query
    // disableTransitionOnChange → prevents flash of unstyled content on toggle
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SessionProvider refetchOnWindowFocus={false} refetchInterval={30 * 60}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            theme="system"
          />
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
