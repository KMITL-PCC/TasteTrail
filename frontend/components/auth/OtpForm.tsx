"use client";

import React, { useState, useEffect } from "react";

interface OtpFormProps {
  csrfToken: string;
  setFormStep: (step: "otp" | "resetPassword") => void;
  email: string | null; // เปลี่ยนจาก string เป็น string | null
}

const VERIFY_OTP_ENDPOINT = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/verify-otp`;
const RESEND_OTP_ENDPOINT = `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/resend-otp`;

export default function OtpForm({
  csrfToken,
  setFormStep,
  email,
}: OtpFormProps) {
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(30);

  // Countdown for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const otpCode = otp.join("");
    if (!/^\d{5}$/.test(otpCode)) {
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
        body: JSON.stringify({ otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Invalid OTP.");
      setMessage("OTP verified. Please set your new password.");
      setFormStep("resetPassword"); // เปลี่ยนไปที่ขั้นตอน resetPassword
    } catch (err: any) {
      setMessage(err?.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    const updatedOtp = [...otp];
    updatedOtp[index] = value;
    setOtp(updatedOtp);

    // Automatically move to next input field when a digit is entered
    if (value && index < 4) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return; // Wait until countdown reaches 0
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
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to resend code.");
      setMessage("A new OTP has been sent to your email.");
      setCountdown(30);
    } catch (err: any) {
      setMessage(err?.message || "Failed to resend OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Check your email */}
      <h1 className="text-center text-3xl font-bold text-gray-900">
        Check Your Email
      </h1>
      <p className="mt-2 text-center text-sm text-gray-600">
        We sent a reset link to{" "}
        <span className="font-medium text-gray-800">{email}</span>.<br />
        Enter the 5-digit code mentioned in the email.
      </p>

      {/* OTP Form */}
      <form onSubmit={handleOtpSubmit} className="mt-6 space-y-6 text-center">
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              value={digit}
              onChange={(e) => handleOtpChange(e, index)}
              maxLength={1}
              className="h-12 w-12 rounded-md border border-gray-300 bg-white text-center text-xl font-semibold placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
              placeholder="-"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-green-400"
        >
          {isLoading ? "Verifying..." : "Verify OTP"}
        </button>
      </form>

      {/* Resend OTP */}
      <div className="mt-4 text-center text-sm text-gray-600">
        Didn't receive the code?{" "}
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

      {/* Message */}
      {message && (
        <div className="mt-4 text-center text-sm text-red-500">{message}</div>
      )}
    </div>
  );
}
