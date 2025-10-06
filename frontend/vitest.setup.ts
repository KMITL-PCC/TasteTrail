import matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";

// ✅ บางเวอร์ชันของ jest-dom ไม่มี default export ต้องใช้ import * แทน
import * as jestMatchers from "@testing-library/jest-dom/matchers";

// ✅ ผูก matcher เข้ากับ expect
expect.extend(jestMatchers);

// vitest.setup.ts
import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock next/router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserverMock;

// Mock fetch (เรียกใช้งานใน RegisterForm)
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ csrfToken: "mock-csrf-token" }),
    text: () => Promise.resolve(""),
  }),
) as any;

// Mock toast (sonner)
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));
