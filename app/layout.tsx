import type { Metadata } from "next";
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
        <AppShellV2>{children}</AppShellV2>
      </body>
    </html>
  );
}
