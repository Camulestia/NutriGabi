"use client";

import { useEffect, useState } from "react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { CreditCard, LayoutDashboard, LogOut, Menu, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { BillingSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/patients", label: "Pacientes", icon: Users },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Configurações", icon: Settings }
];

const shelllessRoutes = ["/sign-in", "/sign-up", "/privacy", "/terms", "/onboarding"];

export function AppShellV2({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const [billing, setBilling] = useState<BillingSummary | null>(null);

  const isAuthRoute = shelllessRoutes.some((route) => pathname.startsWith(route));

  useEffect(() => {
    if (!user) {
      setBilling(null);
      return;
    }

    const controller = new AbortController();

    fetch("/api/billing", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as BillingSummary;
      })
      .then((payload) => {
        if (payload) {
          setBilling(payload);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [user]);

  if (isAuthRoute) {
    return <div className="min-h-screen bg-sand">{children}</div>;
  }

  const displayName = user?.fullName?.trim() || user?.firstName || "Profissional";
  const email = user?.primaryEmailAddress?.emailAddress || "Sessão autenticada";
  const initials = user?.firstName?.[0]?.toUpperCase() || user?.lastName?.[0]?.toUpperCase() || user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() || "N";

  return (
    <div className="min-h-screen bg-sand">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 px-4 py-4 lg:px-6">
        <aside className="hidden w-[260px] shrink-0 lg:block">
          <div className="panel sticky top-4 flex h-[calc(100vh-2rem)] flex-col rounded-[28px] border px-5 py-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-moss text-lg font-semibold text-white">N</div>
              <div>
                <p className="text-sm font-semibold text-ink">NutriConsulta IA</p>
                <p className="text-xs text-muted">SaaS clínico para nutrição</p>
              </div>
            </div>

            <nav className="mt-8 space-y-2">
              {items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                      active ? "bg-moss text-white shadow-sm" : "text-muted hover:bg-sage hover:text-ink"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto rounded-[24px] border border-[#caece6] bg-sage p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-moss">Fluxo de consulta</p>
              <p className="mt-2 text-sm leading-6 text-ink">
                Interface otimizada para consultório, com leitura rápida, cards clínicos e jornada passo a passo.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="panel mb-6 rounded-[28px] border px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Abrir menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-line bg-white text-muted lg:hidden"
                >
                  <Menu className="h-4 w-4" />
                </button>
                <div>
                  <p className="text-lg font-semibold text-ink">NutriConsulta IA</p>
                  <p className="text-sm text-muted">Prontuário nutricional, evolução e apoio clínico com IA</p>
                </div>
              </div>

              {user ? (
                <div className="flex flex-wrap items-center justify-end gap-3">
                  <div className="flex items-center gap-3 rounded-full border border-line bg-white px-3 py-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-moss text-sm font-semibold text-white">{initials}</div>
                    <div>
                      <p className="text-sm font-medium text-ink">{displayName}</p>
                      <p className="text-xs text-muted">{email}{billing ? ` • ${billing.plan.toUpperCase()}` : ""}</p>
                    </div>
                  </div>

                  <SignOutButton>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink transition hover:border-moss hover:text-moss"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sair</span>
                    </button>
                  </SignOutButton>
                </div>
              ) : null}
            </div>
          </header>

          {children}
        </main>
      </div>
    </div>
  );
}
