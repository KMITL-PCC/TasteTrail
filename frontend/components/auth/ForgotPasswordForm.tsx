"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

const backendURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

// ปรับ endpoint ให้ตรงกับ back ของคุณ
const CSRF_ENDPOINT = `${backendURL}/api/csrf-token`;
const SEND_OTP_ENDPOINT = `${backendURL}/auth/forgotPass`;
const VERIFY_OTP_ENDPOINT = `${backendURL}/auth/verify-otp`;
const RESEND_OTP_ENDPOINT = `${backendURL}/auth/resend-otp`;
const RESET_PASS_ENDPOINT = `${backendURL}/auth/reset-password`;

export default function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ รับต้นทางและปลายทางจาก query
  const fromParam = (searchParams.get("from") || "").toLowerCase(); // "edit" | "login" | ""
  const returnParam = searchParams.get("return") || ""; // path ปลายทาง
  const cameFromEdit =
    fromParam === "edit" || returnParam.includes("/editprofile");
  const cameFromLogin = fromParam === "login" || returnParam === "/login";

  // คำนวณลิงก์ย้อนกลับ
  const backToEditHref =
    returnParam && cameFromEdit ? returnParam : "/editprofile?tab=password";
  const backToLoginHref = returnParam && cameFromLogin ? returnParam : "/login";

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const [isLoading, setIsLoading] = useState(false);

  const [formStep, setFormStep] = useState<"email" | "otp" | "resetPassword">(
    "email",
  );
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // พรีฟิลด์ email จาก query (?email=...)
  useEffect(() => {
    const qEmail = searchParams.get("email");
    if (qEmail) setEmail(qEmail);
  }, [searchParams]);

  // ซ่อนข้อความอัตโนมัติ
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  // ดึง CSRF token
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(CSRF_ENDPOINT, { credentials: "include" });
        if (!res.ok) throw new Error("Failed to fetch CSRF");
        const data = await res.json();
        setCsrfToken(data?.csrfToken || null);
      } catch (err) {
        console.error(err);
        setMessage("Connection error. Please try again later.");
        setMessageType("error");
      }
    })();
  }, []);

  // countdown resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const headersJson = (token: string | null) => ({
    "Content-Type": "application/json",
    "X-CSRF-Token": token || "",
  });

  // STEP 1: ส่งอีเมลเพื่อรับ OTP
  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!csrfToken) {
      setMessage("Security token is missing. Please refresh the page.");
      setMessageType("error");
      setIsLoading(false);
      return;
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setMessage("Please enter a valid email address.");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(SEND_OTP_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: headersJson(csrfToken),
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to send code.");
      setFormStep("otp");
      setMessage(data?.message || `A 5-digit code has been sent to ${email}.`);
      setMessageType("success");
      setCountdown(50);
    } catch (err: any) {
      setMessage(err?.message || "Failed to send code.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: ยืนยัน OTP
  const handleOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!/^\d{5}$/.test(otp)) {
      setMessage("Please enter a valid 5-digit OTP.");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(VERIFY_OTP_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: headersJson(csrfToken),
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Invalid OTP.");
      setFormStep("resetPassword");
      setMessage("OTP verified. Please set your new password.");
      setMessageType("success");
    } catch (err: any) {
      setMessage(err?.message || "Invalid OTP. Please try again.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: ตั้งรหัสใหม่ → เสร็จแล้ว “กลับตามที่มา”
  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!password || password !== confirmPassword || password.length < 8) {
      setMessage("Passwords do not match or are too short (min 8 characters).");
      setMessageType("error");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(RESET_PASS_ENDPOINT, {
        method: "PATCH",
        credentials: "include",
        headers: headersJson(csrfToken),
        body: JSON.stringify({ email, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.message || "Failed to reset password.");

      setMessage("Password has been reset successfully!");
      setMessageType("success");

      // ✅ เลือกกลับตามที่มา
      const dest = cameFromEdit
        ? backToEditHref
        : cameFromLogin
          ? backToLoginHref
          : "/login"; // fallback

      setTimeout(() => router.push(dest), 1000);
    } catch (err: any) {
      setMessage(err?.message || "Failed to reset password. Please try again.");
      setMessageType("error");
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
        headers: headersJson(csrfToken),
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to resend code.");
      setMessage(data?.message || "A new code has been sent.");
      setMessageType("success");
      setCountdown(50);
    } catch (err: any) {
      setMessage(err?.message || "Failed to resend code.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ ปุ่มย้อนกลับ “ปุ่มเดียวตามต้นทาง”
  const BackLinks = () => {
    if (cameFromEdit) {
      return (
        <button
          type="button"
          onClick={() => router.push(backToEditHref)}
          className="mt-2 inline-block text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
        >
          ← Back to Edit profile
        </button>
      );
    }
    if (cameFromLogin) {
      return (
        <button
          type="button"
          onClick={() => router.push(backToLoginHref)}
          className="mt-2 inline-block text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
        >
          ← Back to Login
        </button>
      );
    }
    // ไม่รู้ว่ามาจากไหน → ไม่แสดงปุ่ม
    return null;
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 p-10 pb-64 font-sans">
      {/* Popup Message */}
      {message && (
        <div
          className={`absolute top-20 rounded-md px-4 py-3 text-sm font-medium ${
            messageType === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* Email Form */}
      {formStep === "email" && (
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Forgot Password?
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email to receive a reset code.
            </p>
          </div>
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 placeholder-gray-400 shadow-sm transition focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-50"
                placeholder="Your Email"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !csrfToken}
              className="w-full justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-green-400"
            >
              {isLoading ? "Sending..." : "Send Code"}
            </button>
            <div className="text-center">
              <BackLinks />
            </div>
          </form>
        </div>
      )}

      {/* OTP Form */}
      {formStep === "otp" && (
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Enter Verification Code
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              A 5-digit code was sent to{" "}
              <span className="font-medium text-gray-800">{email}</span>
            </p>
          </div>
          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div>
              <label htmlFor="otp" className="sr-only">
                OTP Code
              </label>
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
              className="w-full justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-green-400"
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </button>
            <div className="text-center">
              <BackLinks />
            </div>
          </form>

          <div className="mt-6 space-y-4 text-center text-sm">
            <p className="text-gray-600">
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
            </p>
          </div>
        </div>
      )}

      {/* Reset Password Form */}
      {formStep === "resetPassword" && (
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Set New Password
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Please create a new password for your account.
            </p>
          </div>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">
                New Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 placeholder-gray-400 shadow-sm transition focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-50"
                placeholder="New Password"
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 placeholder-gray-400 shadow-sm transition focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-50"
                placeholder="Confirm New Password"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-green-400"
            >
              {isLoading ? "Saving..." : "Reset Password"}
            </button>
            <div className="text-center">
              <BackLinks />
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
