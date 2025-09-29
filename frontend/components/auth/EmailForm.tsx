// EmailForm.tsx
"use client";

import React, { useState, FormEvent } from "react";

interface EmailFormProps {
  csrfToken: string;
  setFormStep: (step: "email" | "otp" | "resetPassword") => void;
  setEmail: (email: string) => void;
  onSubmit: (email: string) => void;
}

const EmailForm: React.FC<EmailFormProps> = ({
  setFormStep,
  setEmail,
  onSubmit,
}) => {
  const [localEmail, setLocalEmail] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!localEmail || !/\S+@\S+\.\S+/.test(localEmail)) {
      alert("Please enter a valid email address.");
      return;
    }

    setEmail(localEmail);
    onSubmit(localEmail);
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
