"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DOMPurify from "dompurify";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

// Backend URL
const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

const ForgotPasswordForm = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formStep, setFormStep] = useState<"email" | "otp" | "resetPassword">(
    "email",
  );
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // ✅ RBAC: ตรวจสอบ provider
  const [providerChecked, setProviderChecked] = useState(false);

  useEffect(() => {
    const checkProvider = async () => {
      try {
        const res = await fetch(`${backendURL}/auth/me`, {
          credentials: "include",
        });
        if (!res.ok) {
          setProviderChecked(true);
          return;
        }
        const data = await res.json();
        if (data.provider === "google") {
          router.replace("/login?error=google-account");
          return;
        }
      } catch (err) {
        console.error("Failed to check provider:", err);
      } finally {
        setProviderChecked(true);
      }
    };
    checkProvider();
  }, [router]);

  // Sanitize input
  const sanitizeInput = (value: string) => {
    return DOMPurify.sanitize(value.trim(), {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  };

  // Email validation
  const isValidEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password strength validation
  const isStrongPassword = (pwd: string) =>
    pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /\d/.test(pwd);

  // Fetch CSRF token on mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch(`${backendURL}/api/csrf-token`, {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Network response was not ok");

        const data = await response.json();
        setCsrfToken(data.csrfToken);
      } catch (error) {
        console.error("Failed to fetch CSRF token:", error);
        toast.error("Connection error. Please try again later.");
      }
    };
    fetchCsrfToken();
  }, []);

  // Countdown for resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Submit email
  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (!csrfToken) {
      toast.error("Security token is missing. Please refresh the page.");
      setIsLoading(false);
      return;
    }

    const safeEmail = sanitizeInput(email);
    if (!safeEmail || !isValidEmail(safeEmail)) {
      toast.error("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendURL}/auth/forgotPass`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ email: safeEmail }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "");

      setFormStep("otp");
      toast.success(`A 5-digit code has been sent to ${safeEmail}.`);
      setCountdown(50);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  // Submit OTP
  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const safeOtp = sanitizeInput(otp);
    if (!/^\d{5}$/.test(safeOtp)) {
      toast.error("Please enter a valid 5-digit OTP.");
      setIsLoading(false);
      return;
    }

    if (!csrfToken) {
      toast.error("Security token is missing. Please refresh the page.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendURL}/auth/verify-otp`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ otp: safeOtp }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "");

      setFormStep("resetPassword");
      toast.success("OTP verified. Please set your new password.");
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  // Submit new password
  const handlePasswordSubmit = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setIsLoading(true);

    const safePassword = sanitizeInput(password);
    const safeConfirmPassword = sanitizeInput(confirmPassword);

    if (
      !isStrongPassword(safePassword) ||
      safePassword !== safeConfirmPassword
    ) {
      toast.error(
        "Passwords must match and be at least 8 chars with uppercase, lowercase, and numbers.",
      );
      setIsLoading(false);
      return;
    }

    if (!csrfToken) {
      toast.error("Security token is missing. Please refresh the page.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendURL}/auth/reset-password`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ newPassword: safePassword }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "");

      toast.success(
        "Password has been reset successfully! Redirecting to login...",
      );

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    if (!csrfToken) {
      toast.error("Security token is missing. Please refresh the page.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendURL}/auth/resend-otp`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "");

      toast.success(data.message || "A new code has been sent.");
      setCountdown(50);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  // Back to email step
  const handleBackToEmail = () => {
    setFormStep("email");
    setOtp("");
  };

  // ✅ ถ้ายังไม่เช็ค provider เสร็จ → แสดง loading
  if (!providerChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-600">Checking account...</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 p-10 pb-64 font-sans">
      {/* Email Form */}
      {formStep === "email" && (
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Forgot Password?
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Enter your email to receive a reset link.
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
              className="w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-green-400"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                href="/login"
                className="inline-block text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
              >
                ← Back to Login
              </Link>
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
              className="w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-green-400"
            >
              {isLoading ? "Verifying..." : "Verify Code"}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                href="/login"
                className="inline-block text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
              >
                ← Back to Login
              </Link>
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
            <button
              onClick={handleBackToEmail}
              className="font-medium text-gray-700 hover:text-gray-900"
            >
              &larr; Use a different email
            </button>
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
            {/* New Password */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 placeholder-gray-400 shadow-sm transition focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none disabled:bg-gray-50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-800 focus:outline-none"
              >
                {showPassword ? (
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
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-gray-800 focus:outline-none"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Password checklist */}
            <div className="mt-2 grid grid-cols-1 gap-1 text-sm">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${
                    password.length >= 8 ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span className="text-xs text-gray-600">
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${
                    /[a-z]/.test(password) ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span className="text-xs text-gray-600">Lowercase letter</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${
                    /[A-Z]/.test(password) ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span className="text-xs text-gray-600">Uppercase letter</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${
                    /\d/.test(password) ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span className="text-xs text-gray-600">Number</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${
                    /[!@#$%^&*()_\-+=[\]{}|:;,.<>/?~]/.test(password)
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                />
                <span className="text-xs text-gray-600">
                  Special character (!@#$...)
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-green-400"
            >
              {isLoading ? "Saving..." : "Reset Password"}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                href="/login"
                className="inline-block text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
              >
                ← Back to Login
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ForgotPasswordForm;
