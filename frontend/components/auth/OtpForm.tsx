"use client";

import React, { useEffect, useState } from "react";
import DOMPurify from "dompurify";

interface OtpFormProps {
  csrfToken: string;
  setFormStep: (step: "otp" | "resetPassword") => void;
  email: string | null;
}

const VERIFY_OTP_ENDPOINT = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify-otp`;
const RESEND_OTP_ENDPOINT = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/resend-otp`;

export default function OtpForm({
  csrfToken,
  setFormStep,
  email,
}: OtpFormProps) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(30);

  // Countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const safeEmail = email ? DOMPurify.sanitize(email) : "";

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const safeOtp = otp.replace(/[^0-9]/g, "");
    if (!/^\d{5}$/.test(safeOtp)) {
      setMessage("Please enter a valid 5-digit OTP.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(VERIFY_OTP_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ otp: safeOtp }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data?.message || "Invalid OTP. Please try again.");
        setIsLoading(false);
        return;
      }

      setMessage("OTP verified. Please set your new password.");
      setFormStep("resetPassword");
    } catch {
      setMessage("Unable to connect to server.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    setMessage("");

    try {
      const res = await fetch(RESEND_OTP_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ email: safeEmail }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data?.message || "Failed to resend code.");
        return;
      }

      setMessage("A new OTP has been sent to your email.");
      setCountdown(30);
    } catch {
      setMessage("Unable to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <h1 className="text-center text-3xl font-bold text-gray-900">
        Check Your Email
      </h1>
      <p className="mt-2 text-center text-sm text-gray-600">
        We sent a reset code to{" "}
        <span className="font-medium text-gray-800">{safeEmail}</span>. Enter
        the 5-digit code below.
      </p>

      <form onSubmit={handleOtpSubmit} className="mt-6 space-y-4">
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
          disabled={isLoading}
          placeholder="-----"
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-center text-lg tracking-[0.5em] placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 disabled:bg-gray-50"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-green-400"
        >
          {isLoading ? "Verifying..." : "Verify Code"}
        </button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-600">
        Didn&apos;t receive the code?{" "}
        {countdown > 0 ? (
          <span className="font-medium text-gray-400">
            You can resend in {countdown}s
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isLoading}
            className="font-medium text-green-600 hover:text-green-500 focus:outline-none disabled:opacity-50"
          >
            Resend code
          </button>
        )}
      </div>

      {message && (
        <div className="mt-4 text-center text-sm text-red-500">{message}</div>
      )}
    </div>
  );
}
