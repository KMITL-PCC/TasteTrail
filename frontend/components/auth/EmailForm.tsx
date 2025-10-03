// EmailForm.tsx
"use client";

import React, { useState, FormEvent } from "react";
import DOMPurify from "dompurify";

interface EmailFormProps {
  csrfToken: string;
  setFormStep: (step: "email" | "otp" | "resetPassword") => void;
  setEmail: (email: string) => void;
  onSubmit: (email: string) => void;
}

// ฟังก์ชัน sanitize input (กัน XSS)
const sanitizeInput = (value: string) =>
  DOMPurify.sanitize(value.trim(), {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

// ฟังก์ชัน validate email format
const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

const EmailForm: React.FC<EmailFormProps> = ({
  setFormStep,
  setEmail,
  onSubmit,
}) => {
  const [localEmail, setLocalEmail] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // sanitize email
    const safeEmail = sanitizeInput(localEmail);

    if (!safeEmail || !isValidEmail(safeEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    setEmail(safeEmail); // เก็บค่า email แบบ sanitize แล้ว
    onSubmit(safeEmail); // ส่งค่าไป backend
    setFormStep("otp");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-4 rounded-md bg-white p-6 shadow-md"
    >
      <h2 className="text-center text-2xl font-bold text-gray-800">
        Forgot Password
      </h2>
      <p className="text-center text-sm text-gray-600">
        Enter your email to receive an OTP for resetting your password.
      </p>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={localEmail}
          onChange={(e) => setLocalEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Send OTP
      </button>
    </form>
  );
};

export default EmailForm;
