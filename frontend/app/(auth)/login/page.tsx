"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

const GoogleIcon = () => (
  <svg className="mr-3 h-5 w-5" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8
      c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039
      l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20
      s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12
      c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4
      C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238
      C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025
      C9.505,39.556,16.227,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574
      l6.19,5.238C42.012,35.836,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);

const formSchema = z.object({
  username: z
    .string()
    .min(6, { message: "Username must be at least 6 characters." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 8 characters." }),
});

function LoginPage() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSuspiciousInput, setHasSuspiciousInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  const [loginError, setLoginError] = useState<string | null>(null);

  // ---------------- detection helpers ----------------
  const detectXSS = (value: string) => {
    const patterns = [
      /<\s*script\b/i,
      /(on\w+\s*=)/i,
      /javascript\s*:/i,
      /<\s*iframe\b/i,
      /&lt;.*&gt;|<.*>/i,
    ];
    return patterns.some((re) => re.test(value));
  };

  // helper: normalize input a bit
  const normalizeInput = (raw: string) => {
    if (!raw) return "";
    // เปลี่ยน smart quotes เป็น plain quotes, ทำ lower-case, trim
    return raw
      .replace(/[\u2018\u2019\u201A\u201B\u2032]/g, "'") // smart single quotes -> '
      .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"') // smart double quotes -> "
      .replace(/\u00A0/g, " ") // non-breaking space -> space
      .toLowerCase()
      .trim();
  };

  const detectSQLi = (value: string) => {
    const v = normalizeInput(value);

    // 1) allowlist check for username (แนะนำให้ใช้จริงสำหรับ username)
    // ถ้าต้องการอนุญาตแค่ a-z0-9_ ให้ตรวจและคืน true = suspicious ถ้ามีตัวอื่น
    const usernameAllowPattern = /^[a-z0-9_@.\-]{0,64}$/; // ปรับตาม policy
    if (v && !usernameAllowPattern.test(v)) return true;

    // 2) patterns ที่ครอบคลุม tautologies / common payloads
    const patterns = [
      // tautologies แบบ ' or '1'='1' / " or "1"="1" / or 1=1
      /(['"]?\s*or\s+['"]?\s*1\s*=\s*['"]?1['"]?)/i,
      /\bor\b\s*1\s*=\s*1/i,
      // union/select blocks
      /\bunion\b[\s\S]*\bselect\b/i,
      /\bselect\b[\s\S]*\bfrom\b/i,
      /\binsert\b[\s\S]*\binto\b/i,
      /\bupdate\b[\s\S]*\bset\b/i,
      /\bdrop\b\s+table\b/i,
      // comment / statement terminator attempts
      /--|\/\*|\*\//i,
      /;+/,
      // exec / xp_ / sp_ stored proc attempts
      /\bexec\b|\bxp_|sp_/i,
      // hex-encoded typical patterns (e.g. 0x27 = ')
      /0x27|0x2d2d/i,
    ];

    if (patterns.some((re) => re.test(v))) return true;

    // 3) ข้อสังเกตอื่น ๆ (เยอะเกินไป = suspicious)
    if (v.length > 100) return true; // username ไม่ควอยู่นานขนาดนี้

    return false;
  };

  // ---------------- form ----------------
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", password: "" },
  });

  // ---------------- watch username ----------------
  useEffect(() => {
    const subscription = form.watch((_, { name }) => {
      if (name === "username" || name === undefined) {
        const username = form.getValues("username") || "";
        const xss = detectXSS(username);
        const sqli = detectSQLi(username);
        setHasSuspiciousInput(xss || sqli);
      }
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // Prefetch หน้าแรก
  useEffect(() => {
    router.prefetch("/");
  }, [router]);

  // Fetch CSRF token
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch(`${backendURL}/api/csrf-token`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setCsrfToken(data.csrfToken);
        } else {
          toast.error("Security token error", {
            description: "Could not establish a secure session.",
          });
        }
      } catch {
        toast.error("Connection Error", {
          description: "Could not connect to the server.",
        });
      }
    };
    if (backendURL) fetchCsrfToken();
  }, [backendURL]);

  const handleGoogleLogin = () => {
    if (backendURL) {
      window.location.href = `${backendURL}/auth/google`;
    } else {
      toast.error("Configuration Error", {
        description: "The Google login service is not available.",
      });
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!backendURL || !csrfToken) return;

    setIsSubmitting(true);
    setLoginError(null); // รีเซ็ต error ก่อน submit

    try {
      const response = await fetch(`${backendURL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          loginform: values.username,
          password: values.password,
        }),
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Login Successful!", { description: "Welcome back!" });
        router.replace("/");
      } else {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData.message ||
          "Invalid username or password. Please try again.";
        setLoginError(message); // เก็บข้อความไว้ใน state
        toast.error("Login Failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-60 flex-1 flex-col items-center justify-center p-10">
      <div className="items-top flex justify-center">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-black">Welcome</h1>
            <p className="text-primary">to your account</p>
          </div>

          <Button
            variant="outline"
            className="h-12 w-full text-base"
            onClick={handleGoogleLogin}
          >
            <GoogleIcon />
            Login with Google
          </Button>

          <div className="flex items-center space-x-2">
            <hr className="flex-grow border-gray-300" />
            <span className="text-sm text-gray-500">or</span>
            <hr className="flex-grow border-gray-300" />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Username"
                        {...field}
                        className="h-12 text-base"
                      />
                    </FormControl>
                    <FormMessage />
                    {hasSuspiciousInput && (
                      <p className="mt-1 text-sm text-red-500">
                        Input rejected for security reasons.
                      </p>
                    )}
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <div className="relative h-12 w-full">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        {...field}
                        className="h-full flex-1 border-none p-0 pl-3 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-800 focus:outline-none"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>

                    <div className="mt-1 min-h-[22px]">
                      {loginError && (
                        <p className="text-sm text-red-500">
                          Incorrect password
                        </p>
                      )}
                    </div>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="h-12 w-full text-lg font-semibold"
                disabled={!csrfToken || isSubmitting || hasSuspiciousInput}
                aria-busy={isSubmitting}
              >
                {isSubmitting
                  ? "Logging in..."
                  : hasSuspiciousInput
                    ? "Invalid input"
                    : "Login"}
              </Button>
            </form>
          </Form>

          <div className="flex justify-between text-sm">
            <Link
              href="/register"
              className="font-semibold text-black hover:underline"
            >
              Register
            </Link>
            <Link
              href={`/forgot-password?from=login&return=${encodeURIComponent("/login")}`}
              className="font-semibold text-black hover:underline"
            >
              Forget password
            </Link>
          </div>

          <p className="text-center text-xs text-gray-500">
            By continuing, you agree to Supabase&apos;s{" "}
            <a href="/terms" className="underline hover:text-black">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/privacy" className="underline hover:text-black">
              Privacy Policy
            </a>
            , and to receive periodic emails with updates.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
