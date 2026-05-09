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
  free: "Gratuito",
  pro: "Profissional",
  clinic: "Clínica"
};

const statusLabels: Record<string, string> = {
  active: "Ativa",
  inactive: "Inativa",
  canceled: "Cancelada",
  canceling: "Cancelamento agendado",
  past_due: "Pagamento pendente",
  unpaid: "Não paga",
  trialing: "Em teste"
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
      return "Pagamento cancelado. Você pode retomar quando quiser.";
    }

    if (searchState?.portal === "unavailable") {
      return "Portal do Stripe ainda não configurado neste ambiente.";
    }

    return null;
  });

  const currentPlanLabel = planLabels[summary.plan];
  const currentStatusLabel = statusLabels[summary.status] ?? summary.status;
  const nextBillingLabel = summary.currentPeriodEnd ? formatDate(summary.currentPeriodEnd) : "Sem cobrança programada";
  const hasPaidPlan = summary.plan === "pro" || summary.plan === "clinic";
  const freeSlots = summary.patientLimit === null ? "Ilimitado" : `${Math.max(summary.patientLimit - summary.patientCount, 0)} restantes`;

  const planCards = useMemo(
    () => [
      {
        key: "free",
        title: "Plano Gratuito",
        accent: "bg-[#f7f9fa] text-ink",
        description: "Até 5 pacientes e funcionalidades básicas para começar.",
        features: ["Até 5 pacientes", "Prontuário nutricional", "Consultas e evolução básica"],
        cta: summary.plan === "free" ? "Plano atual" : "Voltar ao Gratuito",
        disabled: summary.plan === "free",
        action: async () => {
          setFeedback("O retorno ao plano gratuito será controlado pelo gerenciamento da assinatura.");
        }
      },
      {
        key: "pro",
        title: "Plano Profissional",
        accent: "bg-moss text-white",
        description: "Pacientes ilimitados, agenda completa, PDF e planejamento alimentar.",
        features: ["Pacientes ilimitados", "Agenda completa", "Relatórios PDF", "Planejamento alimentar"],
        cta: summary.plan === "pro" ? "Plano atual" : "Assinar plano Profissional",
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
              setFeedback(payload.message ?? "Não foi possível iniciar o pagamento agora.");
              setLoading(null);
              return;
            }
            window.location.href = payload.url;
          } catch {
            setFeedback("Não foi possível iniciar o pagamento agora.");
            setLoading(null);
          }
        }
      },
      {
        key: "clinic",
        title: "Plano Clínica",
        accent: "bg-[#eef6ff] text-[#1d4ed8]",
        description: "Base pronta para múltiplos usuários, equipe e gestão ampliada.",
        features: ["Estrutura para equipe", "Expansão futura do dashboard", "Fluxo preparado para clínica"],
        cta: summary.plan === "clinic" ? "Plano atual" : "Solicitar plano Clínica",
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
              setFeedback(payload.message ?? "Não foi possível iniciar o pagamento agora.");
              setLoading(null);
              return;
            }
            window.location.href = payload.url;
          } catch {
            setFeedback("Não foi possível iniciar o pagamento agora.");
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
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Assinatura do produto</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted">
              Controle o plano atual, acompanhe o status da assinatura e atualize o plano sem interromper a rotina clínica.
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
                Assinar plano Profissional
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
        <MetricCard label="Status da assinatura" value={currentStatusLabel} subtitle="Situação da assinatura" />
        <MetricCard label="Próxima cobrança" value={nextBillingLabel} subtitle="Fim do período atual" />
        <MetricCard label="Pacientes" value={String(summary.patientCount)} subtitle={summary.patientLimit === null ? "Sem limite" : `${freeSlots} no plano Gratuito`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <Section
            eyebrow="Planos"
            title="Escolha o nível de acesso"
            description="A experiência clínica continua utilizável no plano gratuito, com atualização simples para recursos avançados."
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
            description="Os limites do plano são exibidos de forma clara, sem interromper totalmente o uso do sistema."
          >
            <div className="space-y-3">
              <AccessRow label="Limite de pacientes" value={summary.patientLimit === null ? "Ilimitado" : `Até ${summary.patientLimit}`} />
              <AccessRow label="Agenda completa" value={summary.access.canUseAdvancedAgenda ? "Liberada" : "Disponível no plano Profissional"} />
              <AccessRow label="Relatórios em PDF" value={summary.access.canExportPdf ? "Liberados" : "Disponível no plano Profissional"} />
              <AccessRow label="Planejamento alimentar" value={summary.access.canUseMealPlans ? "Liberado" : "Disponível no plano Profissional"} />
            </div>

            <div className="mt-5 rounded-3xl border border-[#caece6] bg-[#f8fdfc] p-4 text-sm text-muted">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-4 w-4 text-moss" />
                <div>
                  <p className="font-medium text-ink">Atualização de plano disponível</p>
                  <p className="mt-1 leading-6">Quando um limite do plano gratuito é atingido, o sistema mostra um aviso claro e leva você direto para esta área de assinatura.</p>
                </div>
              </div>
            </div>

            {hasPaidPlan ? (
              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="secondary" onClick={openPortal} disabled={loading === "portal"}>
                  {loading === "portal" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Alterar plano
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
