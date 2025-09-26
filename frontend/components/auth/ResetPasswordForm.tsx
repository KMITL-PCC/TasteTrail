"use client";

import React, { useState } from "react";

interface ResetPasswordFormProps {
  csrfToken: string;
  setFormStep: (step: "otp" | "resetPassword") => void; // กำหนดให้เป็น "otp" หรือ "resetPassword"
  email: string | null; // เปลี่ยนเป็น string | null เพื่อรองรับกรณีที่ email อาจเป็น null
}

const RESET_PASSWORD_ENDPOINT = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/update-password`;

const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  csrfToken,
  setFormStep,
  email,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

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

    // Submit the new password (use your backend endpoint)
    try {
      // Replace with your actual API endpoint for password reset
      const res = await fetch(RESET_PASSWORD_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Failed to reset password.");
      setMessage("Password reset successful.");
      setFormStep("otp"); // Go back to the OTP step (or login)
    } catch (err: any) {
      setMessage(err?.message || "Failed to reset password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handlePasswordSubmit} className="space-y-6">
      <div className="text-center">
        {/* Set a new password header */}
        <h1 className="text-3xl font-bold text-green-600">
          Set a New Password
        </h1>
        {/* Instruction */}
        <p className="mt-2 text-sm text-gray-600">
          Create a new password. Ensure it differs from previous ones for
          security.
        </p>
      </div>

      {/* New Password Input */}
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
          {/* Key emoji inside the input field */}
          <span className="absolute top-1/2 right-3 -translate-y-1/2 transform text-xl text-gray-500">
            🔒
          </span>
        </div>
      </div>

      {/* Confirm Password Input */}
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-green-400"
      >
        {isLoading ? "Saving..." : "Reset Password"}
      </button>

      {/* Message */}
      {message && (
        <div className="mt-2 text-center text-sm text-red-500">{message}</div>
      )}

      {/* Back Button */}
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
