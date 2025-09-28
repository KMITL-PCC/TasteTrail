"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // import router

interface ResetPasswordFormProps {
  csrfToken: string;
  setFormStep: (step: "otp" | "resetPassword") => void;
  email: string | null;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const RESET_PASSWORD_ENDPOINT = `${BACKEND_URL}/auth/reset-password`;
const CSRF_TOKEN_ENDPOINT = `${BACKEND_URL}/api/csrf-token`;

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  setFormStep,
  email,
}) => {
  const router = useRouter(); // ใช้ router
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

    try {
      const res = await fetch(RESET_PASSWORD_ENDPOINT, {
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

      setMessage("Password reset successful. Redirecting to login...");

      // redirect ไปหน้า login หลังจาก 1.5 วินาที
      setTimeout(() => {
        router.push("/login"); // เปลี่ยนเป็น path หน้า login ของคุณ
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
        <div className="relative">
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 pr-12 shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder="Enter new password"
          />
          <span className="absolute top-1/2 right-3 -translate-y-1/2 transform text-xl text-gray-500">
            🔒
          </span>
        </div>
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
          name="confirmPassword"
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
        className="w-full justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-green-400"
      >
        {isLoading ? "Saving..." : "Reset Password"}
      </button>

      {message && (
        <div className="mt-2 text-center text-sm text-red-500">{message}</div>
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
