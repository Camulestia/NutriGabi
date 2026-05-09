"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, CreditCard, LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";

import { Button, buttonStyles } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Section } from "@/components/ui/section";
import { BillingSummary, UserPlan } from "@/lib/types";
import { formatDate } from "@/lib/utils";

type Props = {
  initialSummary: BillingSummary;
  searchState?: {
    checkout?: string;
    mock?: string;
    portal?: string;
  };
};

const planLabels: Record<UserPlan, string> = {
  free: "Free",
  pro: "Pro",
  clinic: "Clinic"
};

export function BillingPageView({ initialSummary, searchState }: Props) {
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState<null | "checkout" | "portal" | "cancel">(null);
  const [feedback, setFeedback] = useState<string | null>(() => {
    if (searchState?.checkout === "success") {
      return searchState.mock === "1"
        ? "Upgrade simulado com sucesso no ambiente de desenvolvimento."
        : "Pagamento concluído. O acesso será atualizado automaticamente pela confirmação do Stripe.";
    }

    if (searchState?.checkout === "canceled") {
      return "Checkout cancelado. Você pode retomar quando quiser.";
    }

    if (searchState?.portal === "unavailable") {
      return "Portal do Stripe ainda não configurado neste ambiente.";
    }

    return null;
  });

  const currentPlanLabel = planLabels[summary.plan];
  const nextBillingLabel = summary.currentPeriodEnd ? formatDate(summary.currentPeriodEnd) : "Sem cobrança programada";
  const hasPaidPlan = summary.plan === "pro" || summary.plan === "clinic";
  const freeSlots = summary.patientLimit === null ? "Ilimitado" : `${Math.max(summary.patientLimit - summary.patientCount, 0)} restantes`;

  const planCards = useMemo(
    () => [
      {
        key: "free",
        title: "Plano Free",
        accent: "bg-[#f7f9fa] text-ink",
        description: "Até 5 pacientes e funcionalidades básicas para começar.",
        features: ["Até 5 pacientes", "Prontuário nutricional", "Consultas e evolução básica"],
        cta: summary.plan === "free" ? "Plano atual" : "Voltar ao Free",
        disabled: summary.plan === "free",
        action: async () => {
          setFeedback("O retorno ao plano Free será controlado pelo gerenciamento da assinatura.");
        }
      },
      {
        key: "pro",
        title: "Plano Pro",
        accent: "bg-moss text-white",
        description: "Pacientes ilimitados, agenda completa, PDF e planejamento alimentar.",
        features: ["Pacientes ilimitados", "Agenda completa", "Relatórios PDF", "Planejamento alimentar"],
        cta: summary.plan === "pro" ? "Plano atual" : "Assinar plano Pro",
        disabled: summary.plan === "pro",
        action: async () => {
          setLoading("checkout");
          setFeedback(null);
          try {
            const response = await fetch("/api/billing/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan: "pro" })
            });
            const payload = (await response.json()) as { url?: string; message?: string };
            if (!response.ok || !payload.url) {
              setFeedback(payload.message ?? "Não foi possível iniciar o checkout agora.");
              setLoading(null);
              return;
            }
            window.location.href = payload.url;
          } catch {
            setFeedback("Não foi possível iniciar o checkout agora.");
            setLoading(null);
          }
        }
      },
      {
        key: "clinic",
        title: "Clinic",
        accent: "bg-[#eef6ff] text-[#1d4ed8]",
        description: "Base pronta para múltiplos usuários, equipe e gestão ampliada.",
        features: ["Estrutura para equipe", "Expansão futura do dashboard", "Fluxo preparado para clínica"],
        cta: summary.plan === "clinic" ? "Plano atual" : "Solicitar Clinic",
        disabled: summary.plan === "clinic",
        action: async () => {
          setLoading("checkout");
          setFeedback(null);
          try {
            const response = await fetch("/api/billing/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ plan: "clinic" })
            });
            const payload = (await response.json()) as { url?: string; message?: string };
            if (!response.ok || !payload.url) {
              setFeedback(payload.message ?? "Não foi possível iniciar o checkout agora.");
              setLoading(null);
              return;
            }
            window.location.href = payload.url;
          } catch {
            setFeedback("Não foi possível iniciar o checkout agora.");
            setLoading(null);
          }
        }
      }
    ],
    [summary.plan]
  );

  const openPortal = async () => {
    setLoading("portal");
    setFeedback(null);

    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const payload = (await response.json()) as { url?: string; message?: string };
      if (!response.ok || !payload.url) {
        setFeedback(payload.message ?? "Não foi possível abrir o portal de assinatura.");
        setLoading(null);
        return;
      }
      window.location.href = payload.url;
    } catch {
      setFeedback("Não foi possível abrir o portal de assinatura.");
      setLoading(null);
    }
  };

  const cancelSubscription = async () => {
    setLoading("cancel");
    setFeedback(null);

    try {
      const response = await fetch("/api/billing/cancel", { method: "POST" });
      const payload = (await response.json()) as BillingSummary | { message?: string };
      if (!response.ok || !("plan" in payload)) {
        setFeedback(("message" in payload && payload.message) || "Não foi possível cancelar a assinatura.");
        setLoading(null);
        return;
      }

      setSummary(payload);
      setFeedback("Assinatura configurada para encerramento no fim do período atual.");
    } catch {
      setFeedback("Não foi possível cancelar a assinatura.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-sm font-semibold text-moss">Assinatura</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Billing do SaaS</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              Controle o plano atual, acompanhe status da assinatura e faça upgrade sem interromper a rotina clínica.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/patients" className={buttonStyles({ variant: "secondary" })}>
              Voltar aos pacientes
            </Link>
            {hasPaidPlan ? (
              <Button variant="secondary" onClick={openPortal} disabled={loading === "portal"}>
                {loading === "portal" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Gerenciar assinatura
              </Button>
            ) : (
              <Button onClick={planCards[1].action} disabled={loading === "checkout"}>
                {loading === "checkout" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Assinar plano Pro
              </Button>
            )}
          </div>
        </div>
      </Card>

      {feedback ? (
        <div className="rounded-2xl border border-[#caece6] bg-[#effbf8] px-4 py-3 text-sm text-[#0f766e]">{feedback}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Plano atual" value={currentPlanLabel} subtitle="Acesso aplicado no app" tone="mint" />
        <MetricCard label="Status" value={summary.status} subtitle="Situação da assinatura" />
        <MetricCard label="Próxima cobrança" value={nextBillingLabel} subtitle="Fim do período atual" />
        <MetricCard label="Pacientes" value={String(summary.patientCount)} subtitle={summary.patientLimit === null ? "Sem limite" : `${freeSlots} no plano Free`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <Section
            eyebrow="Planos"
            title="Escolha o nível de acesso"
            description="A experiência clínica continua utilizável no Free, com upgrade suave para recursos avançados."
          >
            <div className="grid gap-4 xl:grid-cols-3">
              {planCards.map((plan) => (
                <div key={plan.key} className="rounded-3xl border border-line bg-white p-5">
                  <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${plan.accent}`}>{plan.title}</div>
                  <p className="mt-4 text-sm leading-6 text-muted">{plan.description}</p>
                  <div className="mt-4 space-y-2">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2 text-sm text-ink">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-moss" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5">
                    <Button
                      variant={plan.key === "pro" ? "primary" : "secondary"}
                      className="w-full justify-center"
                      onClick={plan.action}
                      disabled={plan.disabled || loading === "checkout"}
                    >
                      {loading === "checkout" && (plan.key === "pro" || plan.key === "clinic") ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                      {plan.cta}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </Card>

        <Card>
          <Section
            eyebrow="Acesso"
            title="Regras atuais do usuário"
            description="O bloqueio é sempre contextualizado com orientação de upgrade, sem travar todo o sistema."
          >
            <div className="space-y-3">
              <AccessRow label="Limite de pacientes" value={summary.patientLimit === null ? "Ilimitado" : `Até ${summary.patientLimit}`} />
              <AccessRow label="Agenda completa" value={summary.access.canUseAdvancedAgenda ? "Liberada" : "Disponível no Pro"} />
              <AccessRow label="Relatórios em PDF" value={summary.access.canExportPdf ? "Liberados" : "Disponível no Pro"} />
              <AccessRow label="Planejamento alimentar" value={summary.access.canUseMealPlans ? "Liberado" : "Disponível no Pro"} />
            </div>

            <div className="mt-5 rounded-3xl border border-[#caece6] bg-[#f8fdfc] p-4 text-sm text-muted">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-moss" />
                <div>
                  <p className="font-medium text-ink">Upgrade orientado por UX</p>
                  <p className="mt-1 leading-6">Quando um limite do Free é atingido, o app exibe uma mensagem clara e leva direto para esta tela de billing.</p>
                </div>
              </div>
            </div>

            {hasPaidPlan ? (
              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="secondary" onClick={openPortal} disabled={loading === "portal"}>
                  {loading === "portal" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Upgrade ou downgrade
                </Button>
                <Button variant="outline" onClick={cancelSubscription} disabled={loading === "cancel"}>
                  {loading === "cancel" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Cancelar
                </Button>
              </div>
            ) : null}
          </Section>
        </Card>
      </div>
    </div>
  );
}

function AccessRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-line bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}
