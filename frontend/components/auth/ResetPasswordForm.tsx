"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import DOMPurify from "dompurify";

interface ResetPasswordFormProps {
  setFormStep: (step: "otp" | "resetPassword") => void;
  email: string | null;
  mode: "forgot" | "updateByOtp";
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const CSRF_TOKEN_ENDPOINT = `${BACKEND_URL}/api/csrf-token`;

// Password schema: at least 8 chars, <=100, must include lower, upper, digit, special (selected set),
// and explicitly forbid dangerous characters like < > " ' `
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(100, "Password too long")
  .regex(/(?=.*[a-z])/, { message: "Password must include a lowercase letter" })
  .regex(/(?=.*[A-Z])/, {
    message: "Password must include an uppercase letter",
  })
  .regex(/(?=.*\d)/, { message: "Password must include a number" })
  .regex(/(?=.*[!@#$%^&*()_\-+=[\]{}|:;,.<>/?~])/, {
    message: "Password must include a special character",
  })
  .refine((val) => !/[<>"'`]/.test(val), {
    message: "Password contains invalid characters (e.g. <, >, \", ', `).",
  });

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  setFormStep,
  email,
  mode,
}) => {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch(CSRF_TOKEN_ENDPOINT, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch CSRF token");
        const data = await res.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error("CSRF token error:", err);
      }
    };
    fetchCsrfToken();
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    // sanitize inputs (trim + strip any HTML)
    const safeNew = DOMPurify.sanitize(newPassword.trim());
    const safeConfirm = DOMPurify.sanitize(confirmPassword.trim());

    // basic quick checks
    if (!safeNew || safeNew.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }
    if (safeNew !== safeConfirm) {
      setMessage("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    // run full zod validation for better error messages
    try {
      passwordSchema.parse(safeNew);
    } catch (err: any) {
      // zod error structure: err.errors is an array
      const first =
        Array.isArray(err?.errors) && err.errors.length > 0
          ? err.errors[0].message
          : "Invalid password.";
      setMessage(String(first));
      setIsLoading(false);
      return;
    }

    if (!csrfToken) {
      setMessage("CSRF token not loaded. Refresh the page and try again.");
      setIsLoading(false);
      return;
    }

    // choose endpoint
    const endpoint =
      mode === "forgot"
        ? `${BACKEND_URL}/auth/reset-password`
        : `${BACKEND_URL}/auth/updatepass`;

    try {
      // send sanitized new password
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ newPassword: safeNew, email }),
      });

      const data = await res.json().catch(() => ({}));
      console.log("Server response:", data);

      if (!res.ok) {
        const serverMsg =
          data?.message || `Failed to reset password (status ${res.status})`;
        // sanitize server message before showing
        setMessage(DOMPurify.sanitize(String(serverMsg)));
        setIsLoading(false);
        return;
      }

      setMessage("Password reset successful. Redirecting...");
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      console.error("Error resetting password:", err);
      const msg =
        err?.message ||
        "Failed to reset password. Please check your connection.";
      setMessage(DOMPurify.sanitize(String(msg)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handlePasswordSubmit} className="space-y-6" noValidate>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-green-600">
          Set a New Password
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Create a new password. Ensure it differs from previous ones for
          security.
        </p>
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium text-gray-700"
        >
          New Password
        </label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          aria-describedby="password-hint"
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
          placeholder="Enter new password"
        />
        <p id="password-hint" className="mt-1 text-xs text-gray-500">
          At least 8 characters, include upper & lower case, a number and a
          special character.
        </p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700"
        >
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
          placeholder="Confirm new password"
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-green-400"
      >
        {isLoading ? "Saving..." : "Reset Password"}
      </button>

      {message && (
        <div
          className="text-center text-sm text-red-500"
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      )}

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setFormStep("otp")}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ← Back to OTP
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
