import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import EditProfileForm from "@/components/profile/EditProfileForm";
import { act } from "react-dom/test-utils";
import { describe, beforeEach, test, vi, expect } from "vitest";

// mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
  useSearchParams: vi.fn(() => new URLSearchParams("tab=password")),
}));

// mock toast
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}));

describe("EditProfilePage - Update Password Only", () => {
  beforeEach(() => {
    global.fetch = vi.fn((url: any) => {
      if (url?.toString().includes("/api/csrf-token")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ csrfToken: "mock-csrf" }),
        } as any);
      }
      if (url?.toString().includes("/auth/me")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: { thirdPartyOnly: false } }),
        } as any);
      }
      if (url?.toString().includes("/auth/updatepass-current")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: "Password updated" }),
        } as any);
      }
      return Promise.reject("Unknown endpoint");
    }) as any;
  });

  test("should update password successfully", async () => {
    await act(async () => {
      render(<EditProfileForm />);
    });

    const currentPasswordInput = screen.getByLabelText(/current password/i);
    const newPasswordInput = screen.getByLabelText(/new password/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole("button", {
      name: /update password/i,
    });

    await act(async () => {
      fireEvent.change(currentPasswordInput, {
        target: { value: "OldPass1!" },
      });
      fireEvent.change(newPasswordInput, { target: { value: "NewPass1!" } });
      fireEvent.change(confirmPasswordInput, {
        target: { value: "NewPass1!" },
      });
    });

    await act(async () => {
      fireEvent.submit(submitButton);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/updatepass-current"),
        expect.objectContaining({ method: "PATCH" }),
      );
    });
  });
});
