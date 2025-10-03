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

  // countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // sanitize email
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
    } catch (err: any) {
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
    } catch (err) {
      setMessage("Unable to resend code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Check your email */}
      <h1 className="text-3xl font-bold text-center text-gray-900">
        Check Your Email
      </h1>
      <p className="mt-2 text-sm text-center text-gray-600">
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
              className="w-12 h-12 text-xl font-semibold text-center placeholder-gray-400 bg-white border border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
              placeholder="-"
            />
          ))}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Enter Verification Code
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          A 5-digit code was sent to{" "}
          <span className="font-medium text-gray-800">{safeEmail}</span>
        </p>
      </div>

      <form onSubmit={handleOtpSubmit} className="space-y-6">
        <div>
          <input
            id="otp"
            name="otp"
            type="text"
            inputMode="numeric"
            maxLength={5}
            required
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
            disabled={isLoading}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-center text-lg tracking-[0.5em] placeholder-gray-400 shadow-sm transition focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-50"
            placeholder="-----"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="justify-center w-full px-4 py-2 text-sm font-medium text-white transition bg-green-600 rounded-md shadow-sm hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-green-400"
          className="w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-green-400"
        >
          {isLoading ? "Verifying..." : "Verify Code"}
        </button>
      </form>

      {/* Resend OTP */}
      <div className="mt-4 text-sm text-center text-gray-600">
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
      <div className="mt-6 space-y-4 text-center text-sm">
        <p className="text-gray-600">
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
        </p>
      </div>

      {message && (
        <div className="mt-4 text-sm text-center text-red-500">{message}</div>
      )}
    </div>
  );
}
