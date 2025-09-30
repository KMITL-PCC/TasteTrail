// OtpForm.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
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
  const [otp, setOtp] = useState(["", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(30);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // countdown
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // sanitize email for display (prevent XSS)
  const safeEmail = email ? DOMPurify.sanitize(email) : "";

  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");

    const otpCode = otp.join("");
    // final sanitize - should be only digits
    const safeOtp = otpCode.replace(/[^0-9]/g, "");

    if (!/^\d{5}$/.test(safeOtp)) {
      setMessage("Please enter a valid 5-digit OTP.");
      setIsLoading(false);
      return;
    }

    if (!csrfToken) {
      setMessage("Security token missing. Please refresh the page.");
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
        // show server message but as text only
        setMessage(data?.message || "Invalid OTP. Please try again.");
        setIsLoading(false);
        return;
      }

      setMessage("OTP verified. Please set your new password.");
      setIsLoading(false);
      setFormStep("resetPassword");
    } catch (err: any) {
      setMessage(
        err?.name === "AbortError"
          ? "Request timed out."
          : "Unable to connect to server.",
      );
      setIsLoading(false);
    }
  };

  const handleOtpChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    // only digits, max length 1
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 1);
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);

    // move focus to next if entered
    if (value && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // prevent pasting non-digit content and handle paste of full OTP
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text"); // ✅ ใช้ event.clipboardData
    const digits = text.replace(/[^0-9]/g, "").slice(0, 5);
    if (!digits) return;

    const newOtp = ["", "", "", "", ""];
    for (let i = 0; i < digits.length; i++) newOtp[i] = digits[i];
    setOtp(newOtp);

    // focus after paste to next empty
    const nextIndex = digits.length < 5 ? digits.length : 4;
    setTimeout(() => inputRefs.current[nextIndex]?.focus(), 0);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // block space
    if (e.key === " ") e.preventDefault();
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    setMessage("");

    if (!csrfToken) {
      setMessage("Security token missing. Please refresh the page.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(RESEND_OTP_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        // include email only if backend expects it; sending sanitized email
        body: JSON.stringify({ email: email ? DOMPurify.sanitize(email) : "" }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data?.message || "Failed to resend code.");
        setIsLoading(false);
        return;
      }

      setMessage("A new OTP has been sent to your email.");
      setCountdown(30);
    } catch (err: any) {
      setMessage(
        err?.name === "AbortError"
          ? "Request timed out."
          : "Unable to connect.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <h1 className="text-center text-3xl font-bold text-gray-900">
        Check Your Email
      </h1>
      <p className="mt-2 text-center text-sm text-gray-600">
        We sent a reset link to{" "}
        <span className="font-medium text-gray-800">
          {/* safeEmail is sanitized (text) */}
          {safeEmail || "your email"}
        </span>
        .<br />
        Enter the 5-digit code from the email.
      </p>

      <form
        onSubmit={handleOtpSubmit}
        className="mt-6 space-y-6 text-center"
        noValidate
      >
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="tel"
              inputMode="numeric"
              pattern="\d*"
              value={digit}
              onChange={(e) => handleOtpChange(e, index)}
              onPaste={handlePaste}
              onKeyDown={(e) => handleKeyDown(e as any, index)}
              maxLength={1}
              className="h-12 w-12 rounded-md border border-gray-300 bg-white text-center text-xl font-semibold placeholder-gray-400 shadow-sm focus:border-green-500 focus:ring-1 focus:ring-green-500"
              placeholder="-"
              aria-label={`OTP digit ${index + 1}`}
              autoComplete={index === 0 ? "one-time-code" : "off"}
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

      {message && (
        <div className="mt-4 text-center text-sm text-red-500">{message}</div>
      )}
    </div>
  );
}
