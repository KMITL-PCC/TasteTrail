"use client";

import React, { useState } from "react";

interface EmailFormProps {
  csrfToken: string;
  setFormStep: (step: "email" | "otp" | "resetPassword") => void;
  setEmail: (email: string) => void;
}

const backendURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const SEND_OTP_ENDPOINT = `${backendURL}/auth/forgotPass`; // แก้ไข URL ที่ไม่ถูกต้อง

const EmailForm: React.FC<EmailFormProps> = ({
  csrfToken,
  setFormStep,
  setEmail,
}) => {
  const [email, setEmailInput] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setMessage("Please enter a valid email address.");
      setIsLoading(false);
      return;
    }

    setEmail(email); // อัพเดตค่า email ด้วย setEmail

    // ส่งคำขอ OTP
    try {
      const res = await fetch(SEND_OTP_ENDPOINT, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ email }), // ส่งค่า email ไปที่ backend
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to send code.");
      setFormStep("otp"); // เปลี่ยนไปที่ขั้นตอน OTP
    } catch (err: any) {
      setMessage(err?.message || "Failed to send code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleEmailSubmit} className="space-y-6">
      <div className="text-center">
        {/* Title */}
        <h1 className="font-inter text-3xl text-green-600">Forgot Password</h1>
        {/* Description */}
        <p className="font-inter mt-2 text-sm text-gray-600">
          Please enter your email to reset the password
        </p>
      </div>

      {/* Email Input */}
      <div className="mt-4">
        {/* <label
          htmlFor="email"
          className="font-inter block text-sm text-gray-700"
        >
          Email
        </label> */}
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={(e) => setEmailInput(e.target.value)}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-green-400"
      >
        {isLoading ? "Sending..." : "Send OTP"}
      </button>

      {/* Message */}
      {message && (
        <div className="mt-2 text-center text-sm text-red-500">{message}</div>
      )}
    </form>
  );
};

export default EmailForm;
