"use client";

import { useState, useEffect, memo, useRef } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormContext } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";

/* ---------------- UI: Google Icon ---------------- */
const GoogleIcon = () => (
  <svg className="mr-3 h-5 w-5" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.012,35.836,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);

/* ---------------- Validation Schemas ---------------- */
const registerFormSchema = z
  .object({
    username: z
      .string()
      .min(6, { message: "Username must be at least 6 characters." })
      .max(30, { message: "Username must be at most 30 characters." })
      .regex(/^[A-Za-z0-9_]+$/, {
        message: "Only letters, numbers, and underscore (_) allowed.",
      })
      .refine((val) => !/[<>"'%;()&+]/.test(val), {
        message: "Invalid characters are not allowed.",
      }),

    email: z
      .string()
      .email({ message: "Please enter a valid email address." })
      .refine((val) => !/[<>"'%;()&+]/.test(val), {
        message: "Invalid characters in email.",
      }),

    password: z
      .string()
      .min(6, { message: "Password must be at least 6 characters." })
      .regex(/[a-z]/, {
        message: "Password must contain at least one lowercase letter.",
      })
      .regex(/[A-Z]/, {
        message: "Password must contain at least one uppercase letter.",
      })
      .regex(/[0-9]/, { message: "Password must contain at least one number." })
      .regex(/[^A-Za-z0-9]/, {
        message: "Password must contain at least one special character.",
      }),

    confirmPassword: z
      .string()
      .min(6, { message: "Confirm password must be at least 6 characters." }),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions.",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerFormSchema>;

const otpFormSchema = z.object({
  otp: z
    .string()
    .length(5, { message: "OTP must be exactly 5 digits." })
    .regex(/^\d{5}$/, { message: "OTP must contain only digits." }),
});

/* ---------------- Utils ---------------- */
async function parseErr(res: Response) {
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    return { message: txt || res.statusText };
  }
}

function checkPasswordRules(password: string) {
  return {
    hasLower: /[a-z]/.test(password),
    hasUpper: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
    hasLength: password.length >= 6,
  };
}

function abortableTimeout(ms = 15000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return { ctrl, clear: () => clearTimeout(timer) };
}

/* ---------------- Reusable Pieces ---------------- */
// นับถอยหลัง + ปุ่ม resend
const ResendSection = memo(function ResendSection({
  countdown,
  isResending,
  onResend,
}: {
  countdown: number;
  isResending: boolean;
  onResend: () => void;
}) {
  return (
    <div className="mt-4 text-center text-sm text-gray-600">
      Didn't receive the code?{" "}
      {countdown > 0 ? (
        <span className="font-semibold text-gray-500">
          Resend in {countdown}s
        </span>
      ) : (
        <button
          type="button"
          className="h-auto p-0 font-semibold text-green-600 hover:underline disabled:text-gray-400 disabled:no-underline"
          onClick={onResend}
          disabled={isResending}
        >
          {isResending ? "Resending..." : "Resend OTP"}
        </button>
      )}
    </div>
  );
});

// ช่อง OTP แยก/เมโมไว้
const OtpCodeField = memo(function OtpCodeField({
  autoFocus = true,
}: {
  autoFocus?: boolean;
}) {
  const { control } = useFormContext();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) inputRef.current.focus();
  }, [autoFocus]);

  return (
    <FormField
      control={control}
      name="otp"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="font-medium text-gray-700">OTP Code</FormLabel>
          <FormControl>
            <Input
              ref={inputRef}
              placeholder="Enter 5-digit code"
              inputMode="numeric"
              pattern="\d*"
              autoComplete="one-time-code"
              maxLength={5}
              value={field.value ?? ""}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 5);
                field.onChange(val);
              }}
              onKeyDown={(e) => {
                if (e.key === " " || (e.key.length === 1 && /\D/.test(e.key))) {
                  e.preventDefault();
                }
              }}
              className="h-11 rounded-md border-gray-300 text-center text-base tracking-widest focus:border-green-500 focus:ring-green-500 sm:h-12"
            />
          </FormControl>
          <FormMessage className="text-sm text-red-500" />
        </FormItem>
      )}
    />
  );
});

/* ---------------- Page Component ---------------- */
export default function RegisterForm() {
  const router = useRouter();
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [registrationEmail, setRegistrationEmail] = useState("");
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // resend & countdown state
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [registrationData, setRegistrationData] =
    useState<RegisterFormValues | null>(null);

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL as string;

  // ดึง CSRF
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${backendURL}/api/csrf-token`, {
          credentials: "include",
        });
        if (!r.ok) {
          const e = await parseErr(r);
          toast.error("Security Error", {
            description: e.message || "Could not initialize a secure session.",
          });
          return;
        }
        const data = await r.json();
        setCsrfToken(data.csrfToken);
      } catch (err) {
        toast.error("Connection Error", {
          description: "Could not connect to the server for security setup.",
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ตัวจับเวลา (countdown)
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  // ฟอร์มสมัคร
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
    mode: "onChange",
  });

  // ฟอร์ม OTP
  const otpForm = useForm<z.infer<typeof otpFormSchema>>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { otp: "" },
    shouldUnregister: false,
    mode: "onChange",
  });

  // ส่งข้อมูลสมัคร + ขอ OTP
  async function onRegisterSubmit(values: RegisterFormValues) {
    if (!values.username || !values.email || !values.password) {
      toast.error("Missing data", { description: "Please fill all fields." });
      return;
    }
    if (!csrfToken) {
      toast.error("Security Error", {
        description: "Cannot submit form. Secure token is missing.",
      });
      return;
    }

    toast.info("Registering account...", {
      description: `Username: ${values.username}`,
      duration: 2000,
    });

    try {
      const { ctrl, clear } = abortableTimeout(15000);
      const response = await fetch(`${backendURL}/auth/register/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          username: values.username.trim(),
          email: values.email.trim(),
          password: values.password,
        }),
        credentials: "include",
        signal: ctrl.signal,
      });
      clear();

      if (response.ok) {
        setRegistrationEmail(values.email.trim());
        setRegistrationData(values);
        setShowOtpForm(true);
        setCountdown(50);
        toast.success("Registration Successful!", {
          description: "Please check your email for the OTP code.",
        });
      } else {
        const errorData = await parseErr(response);
        toast.error("Registration Failed", {
          description: errorData.message || `HTTP ${response.status}`,
        });
        console.log("[send-otp error]", response.status, errorData);
      }
    } catch (error: any) {
      toast.error("Connection Error", {
        description:
          error?.name === "AbortError"
            ? "Request timed out."
            : "Unable to connect to the server.",
      });
    }
  }

  // ยืนยัน OTP
  async function onOtpSubmit(values: z.infer<typeof otpFormSchema>) {
    if (!csrfToken) {
      toast.error("Security Error", {
        description: "Cannot submit form. Secure token is missing.",
      });
      return;
    }

    toast.info("Verifying OTP...", { duration: 1500 });

    try {
      const { ctrl, clear } = abortableTimeout(15000);
      const response = await fetch(`${backendURL}/auth/register/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          email: registrationEmail,
          otp: values.otp,
        }),
        credentials: "include",
        signal: ctrl.signal,
      });
      clear();

      if (response.ok) {
        toast.success("Account Verified!", {
          description: "Your account is verified. Redirecting...",
        });
        router.push("/");
      } else {
        const errorData = await parseErr(response);
        toast.error("Verification Failed", {
          description:
            errorData.message || "Invalid OTP code. Please try again.",
        });
      }
    } catch (error: any) {
      toast.error("Connection Error", {
        description:
          error?.name === "AbortError"
            ? "Request timed out."
            : "Unable to connect to the server.",
      });
    }
  }

  // ส่ง OTP ใหม่ (ต้องส่งครบ 3 ฟิลด์ตามฝั่งแบ็กเอนด์)
  async function handleResendOtp() {
    if (!csrfToken || !registrationData) {
      toast.error("Error", {
        description: "Cannot resend OTP. Please try registering again.",
      });
      return;
    }
    setIsResending(true);
    toast.info("Resending OTP...");

    try {
      const { ctrl, clear } = abortableTimeout(15000);
      const response = await fetch(`${backendURL}/auth/register/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          username: registrationData.username.trim(),
          email: registrationData.email.trim(),
          password: registrationData.password,
        }),
        credentials: "include",
        signal: ctrl.signal,
      });
      clear();

      if (response.ok) {
        toast.success("OTP Resent!", {
          description: "A new OTP has been sent to your email.",
        });
        setCountdown(50);
      } else {
        const errorData = await parseErr(response);
        toast.error("Failed to Resend OTP", {
          description: errorData.message || `HTTP ${response.status}`,
        });
      }
    } catch (error: any) {
      toast.error("Connection Error", {
        description:
          error?.name === "AbortError"
            ? "Request timed out."
            : "Unable to connect to the server.",
      });
    } finally {
      setIsResending(false);
    }
  }

  // กลับไปหน้าสมัคร
  const handleBackToRegister = () => {
    setShowOtpForm(false);
    setRegistrationEmail("");
    setRegistrationData(null);
    setCountdown(0);
    otpForm.reset({ otp: "" });
  };

  // Google
  const handleGoogleLogin = () => {
    window.location.href = `${backendURL}/auth/google`;
  };

  /* ---------------- Sub UIs ---------------- */
  const OtpVerificationForm = () => (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          className="rounded-full p-2"
          onClick={handleBackToRegister}
        >
          <ArrowLeft className="h-6 w-6 text-gray-700 sm:h-8 sm:w-8" />
        </Button>
        <h1 className="flex-grow pr-12 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
          Verify OTP
        </h1>
      </div>
      <p className="text-center text-gray-600">
        We have sent an OTP code to your email:{" "}
        <span className="font-semibold text-green-600">
          {registrationEmail}
        </span>
      </p>

      <Form {...otpForm}>
        <form
          onSubmit={otpForm.handleSubmit(onOtpSubmit)}
          className="space-y-4"
        >
          <OtpCodeField autoFocus />
          <Button
            type="submit"
            className="h-12 w-full rounded-md bg-green-500 text-lg font-semibold text-white shadow-md transition-colors duration-200 hover:bg-green-600 sm:h-14"
          >
            Verify Account
          </Button>
        </form>
      </Form>

      <ResendSection
        countdown={countdown}
        isResending={isResending}
        onResend={handleResendOtp}
      />
    </div>
  );

  const RegisterMainForm = () => (
    <div className="flex flex-col">
      <div className="flex items-start justify-center">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Create Account
            </h1>
          </div>

          <Form {...registerForm}>
            <form
              onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
              className="space-y-4"
            >
              <FormField
                control={registerForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium text-gray-700">
                      Username
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Choose a username"
                        {...field}
                        className="focus:border-primary focus:ring-primary h-11 rounded-md border-gray-300 text-base sm:h-12"
                        onKeyDown={(e) => {
                          if (e.key === " ") e.preventDefault();
                        }}
                        onChange={(e) => {
                          const sanitized = e.target.value.replace(
                            /[^A-Za-z0-9]/g,
                            "",
                          );
                          field.onChange(sanitized);
                        }}
                        inputMode="text"
                        autoComplete="username"
                      />
                    </FormControl>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium text-gray-700">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                        className="focus:border-primary focus:ring-primary h-11 rounded-md border-gray-300 text-base sm:h-12"
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="password"
                render={({ field }) => {
                  const rules = checkPasswordRules(field.value || "");
                  return (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            value={field.value} // บังคับ value
                            onChange={field.onChange} // บังคับ onChange
                            onBlur={field.onBlur} // optional
                            placeholder="Enter password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-600"
                          >
                            {showPassword ? (
                              <EyeOff size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </button>
                        </div>
                      </FormControl>

                      <div className="mt-2 space-y-1 text-sm">
                        <p
                          className={
                            rules.hasLength ? "text-green-600" : "text-red-600"
                          }
                        >
                          {rules.hasLength ? "✔" : "✘"} At least 6 characters
                        </p>
                        <p
                          className={
                            rules.hasLower ? "text-green-600" : "text-red-600"
                          }
                        >
                          {rules.hasLower ? "✔" : "✘"} Lowercase letter
                        </p>
                        <p
                          className={
                            rules.hasUpper ? "text-green-600" : "text-red-600"
                          }
                        >
                          {rules.hasUpper ? "✔" : "✘"} Uppercase letter
                        </p>
                        <p
                          className={
                            rules.hasNumber ? "text-green-600" : "text-red-600"
                          }
                        >
                          {rules.hasNumber ? "✔" : "✘"} Number
                        </p>
                        <p
                          className={
                            rules.hasSpecial ? "text-green-600" : "text-red-600"
                          }
                        >
                          {rules.hasSpecial ? "✔" : "✘"} Special character
                        </p>
                      </div>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <FormField
                control={registerForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium text-gray-700">
                      Confirm Password
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          {...field}
                          className="focus:border-primary focus:ring-primary h-11 rounded-md border-gray-300 pr-10 text-base sm:h-12"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                          className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-sm text-red-500" />
                  </FormItem>
                )}
              />

              <FormField
                control={registerForm.control}
                name="terms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-y-0 space-x-3 rounded-md py-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-primary text-sm font-normal whitespace-nowrap">
                        I agree to the{" "}
                        <a
                          href="/terms"
                          className="hover:text-primary underline"
                        >
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a
                          href="/privacy"
                          className="hover:text-primary underline"
                        >
                          Privacy Policy
                        </a>
                        .
                      </FormLabel>
                      <FormMessage className="text-sm text-red-500" />
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={
                  !registerForm.formState.isValid ||
                  !csrfToken /* กันตอน token ยังไม่พร้อม */
                }
                className="bg-primary hover:bg-primary h-12 w-full rounded-md text-lg font-semibold text-white shadow-md transition-colors duration-200 disabled:cursor-not-allowed disabled:bg-gray-400 sm:h-14"
              >
                Register
              </Button>
            </form>
          </Form>

          <div className="mt-6 flex items-center space-x-3">
            <hr className="flex-grow border-gray-300" />
            <span className="text-sm text-gray-500">or</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          <Button
            variant="outline"
            className="h-11 w-full rounded-md border-gray-300 text-base font-medium transition-colors duration-200 hover:bg-gray-50 sm:h-12 sm:text-lg"
            onClick={handleGoogleLogin}
            disabled={!backendURL}
          >
            <GoogleIcon />
            Register with Google
          </Button>

          <div className="mt-4 text-center text-sm">
            <p className="text-gray-600">
              Already have an account?{" "}
              <a
                href="/login"
                className="text-primary font-semibold hover:underline"
              >
                Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  /* ---------------- Render ---------------- */
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-10">
      {showOtpForm ? <OtpVerificationForm /> : <RegisterMainForm />}
    </div>
  );
}
