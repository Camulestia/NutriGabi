import type { ReactNode } from "react";
import userEvent from "@testing-library/user-event";
import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppShellV2 } from "@/components/layout/app-shell-v2";
import { renderComponent } from "@/tests/test-utils";

vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    user: {
      fullName: "Nutricionista Teste",
      firstName: "Nutri",
      lastName: "Teste",
      primaryEmailAddress: {
        emailAddress: "nutri@test.local"
      }
    }
  }),
  SignOutButton: ({ children }: { children: ReactNode }) => children
}));

const billingResponse = {
  plan: "free",
  status: "inactive",
  currentPeriodEnd: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  patientCount: 0,
  patientLimit: 5,
  canCreatePatient: true,
  access: {
    plan: "free",
    patientLimit: 5,
    canUseAdvancedAgenda: false,
    canUseMealPlans: false,
    canExportPdf: false,
    canUseFullReports: false
  }
};

describe("AppShellV2 mobile navigation", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(billingResponse), {
          headers: { "Content-Type": "application/json" }
        })
      )
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("opens the mobile menu when the hamburger button is clicked", async () => {
    const user = userEvent.setup();

    renderComponent(
      <AppShellV2>
        <div>Conteúdo</div>
      </AppShellV2>
    );

    await user.click(screen.getByTestId("mobile-menu-button"));

    expect(screen.getByTestId("mobile-sidebar-drawer")).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Menu principal" })).toBeInTheDocument();
  });

  it("closes the mobile menu when the overlay is clicked", async () => {
    const user = userEvent.setup();

    renderComponent(
      <AppShellV2>
        <div>Conteúdo</div>
      </AppShellV2>
    );

    await user.click(screen.getByTestId("mobile-menu-button"));
    await user.click(screen.getByTestId("mobile-sidebar-overlay"));

    expect(screen.queryByTestId("mobile-sidebar-drawer")).not.toBeInTheDocument();
  });

  it("closes the mobile menu when a menu item is clicked", async () => {
    const user = userEvent.setup();

    renderComponent(
      <AppShellV2>
        <div>Conteúdo</div>
      </AppShellV2>
    );

    await user.click(screen.getByTestId("mobile-menu-button"));
    const drawer = screen.getByTestId("mobile-sidebar-drawer");
    await user.click(within(drawer).getByRole("link", { name: /pacientes/i }));

    expect(screen.queryByTestId("mobile-sidebar-drawer")).not.toBeInTheDocument();
  });
});
