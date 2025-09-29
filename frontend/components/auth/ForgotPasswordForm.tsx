"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

// The backend URL is correctly defined here and will be used throughout the component.
const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

const ForgotPasswordForm = () => {
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

  // Hide message after 3s
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Fetch CSRF token on mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch(`${backendURL}/api/csrf-token`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setCsrfToken(data.csrfToken);
        console.log("CSRF Token fetched successfully.");
      } catch (error) {
        console.error("Failed to fetch CSRF token:", error);
        setMessage("Connection error. Please try again later.");
        setMessageType("error");
      }
    };
    fetchCsrfToken();
  }, []);

  // Countdown
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
      const response = await fetch(`${backendURL}/auth/forgotPass`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset link.");
      }

      setFormStep("otp");
      setMessage(data.message || `A 5-digit code has been sent to ${email}.`);
      setMessageType("success");
      setCountdown(50);
    } catch (error: any) {
      setMessage(error.message || "An unexpected error occurred.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Submit OTP
  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    if (otp.length !== 5 || !/^\d{5}$/.test(otp)) {
      setMessage("Please enter a valid 5-digit OTP.");
      setMessageType("error");
      setIsLoading(false);
      return;
    }
    if (!csrfToken) {
      setMessage("Security token is missing. Please refresh the page.");
      setMessageType("error");
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
        body: JSON.stringify({ otp }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Invalid OTP.");
      }

      setFormStep("resetPassword");
      setMessage("OTP verified. Please set your new password.");
      setMessageType("success");
    } catch (error: any) {
      setMessage(error.message || "Invalid OTP. Please try again.");
      setMessageType("error");
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

    if (!password || password !== confirmPassword || password.length < 8) {
      setMessage("Passwords do not match or are too short (min 8 characters).");
      setMessageType("error");
      setIsLoading(false);
      return;
    }
    if (!csrfToken) {
      setMessage("Security token is missing. Please refresh the page.");
      setMessageType("error");
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
        body: JSON.stringify({ newPassword: password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setMessage(
        "Password has been reset successfully! Redirecting to login...",
      );
      setMessageType("success");

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error: any) {
      setMessage(
        error.message || "Failed to reset password. Please try again.",
      );
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    setMessage("");
    if (!csrfToken) {
      setMessage("Security token is missing. Please refresh the page.");
      setMessageType("error");
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
      if (!response.ok) {
        throw new Error(data.message || "Failed to resend code.");
      }

      setMessage(data.message || "A new code has been sent.");
      setMessageType("success");
      setCountdown(50);
    } catch (error: any) {
      setMessage(error.message || "Failed to resend code.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  // Back to email step
  const handleBackToEmail = () => {
    setFormStep("email");
    setMessage("");
    setOtp("");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 p-10 pb-64 font-sans">
      {/* Popup Message */}
      {message && (
        <div
          className={`absolute top-20 rounded-md px-4 py-3 text-sm font-medium ${messageType === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
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

            {/* Text link back to Login */}
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

            {/* Text link back to Login */}
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
              className="w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-green-400"
            >
              {isLoading ? "Saving..." : "Reset Password"}
            </button>

            {/* Text link back to Login */}
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
