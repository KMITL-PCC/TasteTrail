"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ResetPasswordFormProps {
  setFormStep: (step: "otp" | "resetPassword") => void;
  email: string | null;
  mode: "forgot" | "updateByOtp";
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const CSRF_TOKEN_ENDPOINT = `${BACKEND_URL}/api/csrf-token`;

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

    if (!newPassword || newPassword.length < 8) {
      setMessage("Password must be at least 8 characters long.");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (!csrfToken) {
      setMessage("CSRF token not loaded. Refresh the page and try again.");
      setIsLoading(false);
      return;
    }

    // เลือก endpoint ตาม mode
    const endpoint =
      mode === "forgot"
        ? `${BACKEND_URL}/auth/reset-password`
        : `${BACKEND_URL}/auth/updatepass`;

    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ newPassword, email }),
      });

      const data = await res.json();
      console.log("Server response:", data);

      if (!res.ok)
        throw new Error(data?.message || "Failed to reset password.");

      setMessage("Password reset successful. Redirecting...");

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err: any) {
      console.error("Error resetting password:", err);
      setMessage(err?.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handlePasswordSubmit} className="space-y-6">
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
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
          placeholder="Enter new password"
        />
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
        <div className="text-center text-sm text-red-500">{message}</div>
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
