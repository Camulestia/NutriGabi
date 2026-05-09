import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";

import "@/app/globals.css";
import { AppShellV2 } from "@/components/layout/app-shell-v2";

const inter = Inter({
  subsets: ["latin"]
});

export const metadata: Metadata = {
  title: "NutriConsulta IA",
  description: "Sistema clínico para nutricionistas com acompanhamento longitudinal e interpretação assistida."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
      </head>
      <body className={inter.className}>
        <ClerkProvider
          signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "/sign-in"}
          signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "/sign-up"}
          signInFallbackRedirectUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || "/dashboard"}
          signUpFallbackRedirectUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || "/onboarding"}
        >
          <AppShellV2>{children}</AppShellV2>
        </ClerkProvider>
      </body>
    </html>
  );
}
