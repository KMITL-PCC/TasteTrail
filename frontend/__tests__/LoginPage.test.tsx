import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/app/(auth)/login/page";

// mock next/navigation useRouter
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("LoginPage", () => {
  // stub window.location.href
  beforeEach(() => {
    vi.stubGlobal("location", { href: "" });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders welcome heading", () => {
    render(<LoginPage />);
    const heading = screen.getByRole("heading", { name: /welcome/i });
    expect(heading).toBeInTheDocument();
  });

  it("renders Google login button and can click it", async () => {
    render(<LoginPage />);
    const googleButton = screen.getByRole("button", {
      name: /login with google/i,
    });
    expect(googleButton).toBeInTheDocument();

    await userEvent.click(googleButton);

    // สมมติว่าใน component มีโค้ดแบบ:
    // window.location.href = "/auth/google"
    expect(window.location.href).toContain("/auth/google");
  });

  it("can submit the login form with valid input", async () => {
    render(<LoginPage />);
    const usernameInput = screen.getByPlaceholderText("Username");
    const passwordInput = screen.getByPlaceholderText("Password");

    const loginButton = screen
      .getAllByRole("button", { name: /login/i })
      .find((btn) => btn.getAttribute("type") === "submit");

    if (!loginButton) throw new Error("Login button not found");

    fireEvent.change(usernameInput, { target: { value: "validuser" } });
    fireEvent.change(passwordInput, { target: { value: "validpass" } });

    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(loginButton).not.toBeDisabled();
    });
  });

  it("disables submit button if input is suspicious", async () => {
    render(<LoginPage />);
    const usernameInput = screen.getByPlaceholderText("Username");

    const loginButton = screen
      .getAllByRole("button", { name: /login/i })
      .find((btn) => btn.getAttribute("type") === "submit");

    if (!loginButton) throw new Error("Login button not found");

    fireEvent.change(usernameInput, { target: { value: "admin' OR 1=1" } });

    await waitFor(() => {
      expect(loginButton).toBeDisabled();
    });
  });
});
