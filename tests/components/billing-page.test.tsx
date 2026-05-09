import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BillingPageView } from "@/components/billing/billing-page";
import { createBillingSummary } from "@/tests/factories";
import { renderComponent } from "@/tests/test-utils";

describe("BillingPageView", () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  it("renders the current free plan and patient limit", () => {
    renderComponent(<BillingPageView initialSummary={createBillingSummary()} />);

    expect(screen.getByText("Plano Gratuito")).toBeInTheDocument();
    expect(screen.getByText("Assinatura do produto")).toBeInTheDocument();
    expect(screen.getByText("Até 5 pacientes")).toBeInTheDocument();
  });

  it("shows a friendly message when payment cannot be started", async () => {
    const user = userEvent.setup();
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ message: "Pagamento indisponível." }), {
        status: 503,
        headers: { "Content-Type": "application/json" }
      })
    );

    renderComponent(<BillingPageView initialSummary={createBillingSummary()} />);

    await user.click(screen.getAllByRole("button", { name: /assinar plano profissional/i })[0]);

    await waitFor(() => {
      expect(screen.getByText("Pagamento indisponível.")).toBeInTheDocument();
    });
  });
});
