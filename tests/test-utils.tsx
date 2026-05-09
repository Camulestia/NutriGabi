import { ReactElement } from "react";
import { render } from "@testing-library/react";
import { vi } from "vitest";

export const mockRouter = {
  push: vi.fn(),
  refresh: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  prefetch: vi.fn()
};

export function renderComponent(component: ReactElement) {
  return render(component);
}
