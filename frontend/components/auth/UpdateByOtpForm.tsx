"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useUser } from "@/store/user-store";

import OtpForm from "./OtpForm";
import ResetPasswordForm from "./ResetPasswordForm";

const backendURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const CSRF_ENDPOINT = `${backendURL}/api/csrf-token`;

export default function UpdateByOtpForm() {
  const router = useRouter();
  const { user } = useUser();
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [formStep, setFormStep] = useState<"otp" | "resetPassword">("otp");

  // ดึง CSRF token
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch(CSRF_ENDPOINT, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch CSRF token");
        const data = await res.json();
        setCsrfToken(data?.csrfToken || null);
      } catch (err) {
        toast.error("Error fetching CSRF token.");
      }
    };
    fetchCsrfToken();
  }, []);

  // ส่ง OTP อัตโนมัติเมื่อ user พร้อม
  useEffect(() => {
    const requestOtp = async () => {
      if (!user?.email || !csrfToken) return;

      try {
        const res = await fetch(`${backendURL}/auth/sendOTP`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({ email: user.email }),
        });

        if (!res.ok) throw new Error("Failed to send OTP.");
        toast.success("OTP has been sent to your email.");
      } catch (err) {
        toast.error("Error sending OTP request.");
      }
    };

    requestOtp();
  }, [user, csrfToken]);

  // ปุ่มย้อนกลับ
  const BackButton = () => {
    if (formStep === "resetPassword") {
      return (
        <button
          type="button"
          onClick={() => setFormStep("otp")}
          className="inline-block mt-4 text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
        >
          ← Back to OTP
        </button>
      );
    }
    return null;
  };

  if (!user) return <div>Loading user data...</div>;

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-10 pb-64 font-sans bg-gray-50">
      {csrfToken ? (
        <>
          {formStep === "otp" && user.email && (
            <OtpForm
              csrfToken={csrfToken}
              setFormStep={setFormStep}
              email={user.email}
            />
          )}

          {formStep === "resetPassword" && user.email && (
            <ResetPasswordForm
              setFormStep={setFormStep}
              email={user.email}
              mode="updateByOtp" // <-- ใช้ endpoint Updatepass
            />
          )}

          <BackButton />
        </>
      ) : (
        <div>Loading CSRF Token...</div>
      )}
    </div>
  );
}
