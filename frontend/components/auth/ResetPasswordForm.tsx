"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import DOMPurify from "dompurify";
import { Eye, EyeOff } from "lucide-react";

interface ResetPasswordFormProps {
  setFormStep: (step: "otp" | "resetPassword") => void;
  email: string | null;
  mode: "forgot" | "updateByOtp";
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const CSRF_TOKEN_ENDPOINT = `${BACKEND_URL}/api/csrf-token`;

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

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const checks = {
    minLength: newPassword.length >= 8,
    hasLower: /[a-z]/.test(newPassword),
    hasUpper: /[A-Z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    hasSpecial: /[!@#$%^&*()_\-+=[\]{}|:;,.<>/?~]/.test(newPassword),
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const safeNew = DOMPurify.sanitize(newPassword.trim());
    const safeConfirm = DOMPurify.sanitize(confirmPassword.trim());

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

    try {
      passwordSchema.parse(safeNew);
    } catch (err: unknown) {
      let firstMessage = "Invalid password.";

      if (err && typeof err === "object" && "errors" in err) {
        const e = err as { errors?: { message: string }[] };
        if (Array.isArray(e.errors) && e.errors.length > 0) {
          firstMessage = e.errors[0].message;
        }
      }

      setMessage(String(firstMessage));
      setIsLoading(false);
      return;
    }

    if (!csrfToken) {
      setMessage("CSRF token not loaded. Refresh the page and try again.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/auth/updatepass`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ newPassword: safeNew, email }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(
          DOMPurify.sanitize(data?.message || `Failed to reset password`),
        );
        setIsLoading(false);
        return;
      }

      setMessage("Password reset successful. Redirecting...");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: unknown) {
      let msg = "Failed to reset password.";

      if (err && typeof err === "object" && "message" in err) {
        msg = (err as { message?: string }).message ?? msg;
      }

      setMessage(DOMPurify.sanitize(msg));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
        <p className="mt-2 text-sm text-gray-600">
          Please create a new password for your account.
        </p>
      </div>

      <form onSubmit={handlePasswordSubmit} className="space-y-4">
        {/* New Password */}
        <div className="relative">
          <input
            type={showNewPassword ? "text" : "password"}
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 placeholder-gray-400 shadow-sm transition focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-50"
            required
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((s) => !s)}
            className="absolute top-0 right-2 bottom-0 my-auto p-1 text-gray-500 hover:text-gray-800 focus:outline-none"
          >
            {showNewPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 placeholder-gray-400 shadow-sm transition focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-50"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((s) => !s)}
            className="absolute top-0 right-2 bottom-0 my-auto p-1 text-gray-500 hover:text-gray-800 focus:outline-none"
          >
            {showConfirmPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Password checklist */}
        {newPassword && (
          <div className="mt-2 grid grid-cols-1 gap-1 text-sm">
            {[
              { check: checks.minLength, label: "At least 8 characters" },
              { check: checks.hasLower, label: "Lowercase letter" },
              { check: checks.hasUpper, label: "Uppercase letter" },
              { check: checks.hasNumber, label: "Number" },
              {
                check: checks.hasSpecial,
                label: "Special character (!@#$...)",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${
                    item.check ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span className="text-xs text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-green-400"
        >
          {isLoading ? "Saving..." : "Reset Password"}
        </button>

        {/* Message */}
        {message && (
          <div className="text-center text-sm text-green-500">{message}</div>
        )}
      </form>
    </div>
  );
};

export default ResetPasswordForm;
