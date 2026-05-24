import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/features/auth/components/AuthProvider";
import { QueryProvider } from "@/lib/providers/QueryProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "Zeus",
  description: "Zeus Orchestrator — Root of Trust module managing authentication, user directory, and audit trail.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} antialiased`}>
        {/*
         * AuthProvider wraps the entire app.
         * It runs initialLoad() once on mount:
         *   - Calls POST /auth/refresh silently
         *   - If cookie is valid → restores session (auto-login)
         *   - If cookie is expired → clears state, lets AuthGuard redirect to /login
         * Shows a loading screen while bootstrapping is in progress.
         */}
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#212427',
              border: '1px solid #3C3F42',
              color: '#FFFFFF',
            },
          }}
        />
      </body>
    </html>
  );
}
