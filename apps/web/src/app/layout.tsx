import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/shared/providers";
import "@/styles/globals.css";

// Plus Jakarta Sans: the sole typeface for FitVector Pro
// Weights: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "FitVector — AI-Powered Job Search",
    template: "%s | FitVector",
  },
  description:
    "Find your perfect job match with AI-powered resume tailoring, smart job matching, and automated outreach.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-512x512.png",
  },
};

export const viewport: Viewport = {
  // Theme-aware browser chrome: brand blue in light, dark slate in dark
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0369A1" },
    { media: "(prefers-color-scheme: dark)",  color: "#0F172A" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning required by next-themes (class injection on <html>)
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${jakarta.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
