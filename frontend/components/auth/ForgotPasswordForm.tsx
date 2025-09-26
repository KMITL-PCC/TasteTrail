"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OtpForm from "./OtpForm"; // สำหรับการแสดง OTPForm
import ResetPasswordForm from "./ResetPasswordForm"; // สำหรับการแสดง ResetPasswordForm
import EmailForm from "./EmailForm"; // เพิ่ม EmailForm
import { toast } from "sonner";

const backendURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const PROFILE_ENDPOINT = `${backendURL}/auth/me`; // ใช้เพื่อดึงข้อมูลผู้ใช้
const CSRF_ENDPOINT = `${backendURL}/api/csrf-token`; // CSRF token endpoint

export default function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [formStep, setFormStep] = useState<"email" | "otp" | "resetPassword">(
    "email",
  );

  // ตรวจสอบ query parameter ที่รับมาจาก EditProfile
  const fromEdit = searchParams.get("from") === "edit"; // หากมาจาก EditProfile

  // ดึงข้อมูลจาก /me และ CSRF token
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch(PROFILE_ENDPOINT, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setEmail(data?.email || null); // เก็บอีเมลจาก /me
      } catch (err) {
        toast.error("Error fetching user data.");
      }
    };

    const fetchCsrfToken = async () => {
      try {
        const res = await fetch(CSRF_ENDPOINT, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch CSRF token");
        const data = await res.json();
        setCsrfToken(data?.csrfToken || null); // เก็บ csrfToken
      } catch (err) {
        toast.error("Error fetching CSRF token.");
      }
    };

    fetchUserData();
    fetchCsrfToken();
  }, []);

  // หากมีอีเมลใน /me และมาจาก EditProfile ให้ไปยัง OTP ทันที
  useEffect(() => {
    if (email && fromEdit) {
      setFormStep("otp"); // ข้ามไปที่หน้า OTP
    }
  }, [email, fromEdit]);

  const handleEmailSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!csrfToken) {
      toast.error("Session not ready", {
        description: "Please wait a moment and try again.",
      });
      return;
    }

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    // ส่งคำขอ OTP
    try {
      const res = await fetch(`${backendURL}/auth/forgotPass`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error("Failed to send OTP request.");
      setFormStep("otp"); // เปลี่ยนไปหน้า OTPForm
    } catch (err) {
      toast.error("Error sending OTP request.");
    }
  };

  const BackButton = () => {
    if (formStep === "otp") {
      return (
        <button
          type="button"
          onClick={() => setFormStep("email")}
          className="mt-4 inline-block text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
        >
          ← Back to Email
        </button>
      );
    }

    if (formStep === "resetPassword") {
      return (
        <button
          type="button"
          onClick={() => setFormStep("otp")}
          className="mt-4 inline-block text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
        >
          ← Back to OTP
        </button>
      );
    }

    return null; // ไม่มีปุ่มย้อนกลับในขั้นตอน "email"
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 p-10 pb-64 font-sans">
      {csrfToken ? (
        <>
          {/* เช็คอีเมลจาก /me */}
          {formStep === "email" && !email && (
            <EmailForm
              csrfToken={csrfToken}
              setFormStep={setFormStep}
              setEmail={setEmail}
            />
          )}

          {/* หากมีอีเมลไปหน้า OTPForm ทันที */}
          {formStep === "otp" && email && (
            <OtpForm
              csrfToken={csrfToken}
              setFormStep={setFormStep}
              email={email} // ส่ง email จาก /me ไปที่ OTP Form
            />
          )}

          {/* ขั้นตอน Reset Password */}
          {formStep === "resetPassword" && email && (
            <ResetPasswordForm
              csrfToken={csrfToken}
              setFormStep={setFormStep}
              email={email}
            />
          )}

          {/* ปุ่มย้อนกลับ */}
          <BackButton />
        </>
      ) : (
        <div>Loading CSRF Token...</div> // แสดงข้อความระหว่างการโหลด CSRF Token
      )}
    </div>
  );
}
