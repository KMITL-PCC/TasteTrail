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

const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-3" viewBox="0 0 48 48">
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    ></path>
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    ></path>
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    ></path>
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.012,35.836,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    ></path>
  </svg>
);

const formSchema = z.object({
  username: z
    .string()
    .min(2, { message: "Username must be at least 2 characters." }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." }),
});

export default function LoginForm() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

  // Prefetch หน้าแรกให้ไวขึ้น
  useEffect(() => {
    router.prefetch("/");
  }, [router]);

  // 1) ดึง CSRF token
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch(`${backendURL}/api/csrf-token`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setCsrfToken(data.csrfToken);
          console.log("CSRF Token obtained.");
        } else {
          toast.error("Security token error", {
            description: "Could not establish a secure session.",
          });
        }
      } catch (error) {
        console.error("Error fetching CSRF token:", error);
        toast.error("Connection Error", {
          description: "Could not connect to the server for security setup.",
        });
      }
    };
    if (backendURL) fetchCsrfToken();
  }, [backendURL]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { username: "", password: "" },
  });

  // Google login
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
    if (!backendURL) {
      toast.error("Configuration Error", {
        description: "Backend URL is missing.",
      });
      return;
    }
    if (!csrfToken) {
      toast.error("Session not ready", {
        description: "Please wait a moment and try again.",
      });
      return;
    }

    setIsSubmitting(true);
    toast.info("Verifying data...", {
      description: `Username: ${values.username}`,
      duration: 2000,
    });

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
        const data = await response.json();
        console.log("Login successful:", data);
        toast.success("Login Successful!", { description: "Welcome back!" });

        // ⬇️ กลับหน้าหลักทันที และล้างหน้า login จาก history
        router.replace("/");
        // ถ้าโฮมเพจอ่าน session ฝั่งเซิร์ฟเวอร์อยู่แล้ว จะโหลดสถานะใหม่ให้เอง
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Login failed:", errorData);
        toast.error("Login Failed", {
          description:
            errorData.message ||
            "Invalid username or password. Please try again.",
        });
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Connection Error", {
        description: "Unable to connect to the server. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col p-10 min-h-60 md:p-10">
      <div className="flex justify-center flex-grow items-top">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-black">Welcome</h1>
            <p className="text-primary">to your account</p>
          </div>

          {/* Google Login */}
          <Button
            variant="outline"
            className="w-full h-12 text-base"
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
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Password"
                        {...field}
                        className="h-12 text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ปุ่ม Submit — ไม่ครอบด้วย <Link> */}
              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold"
                disabled={!csrfToken || isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? "Logging in..." : "Login"}
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
              href={`/forgotpassword?from=login&return=${encodeURIComponent("/login")}`}
              className="font-semibold text-black hover:underline"
            >
              Forget password
            </Link>
          </div>

          <p className="text-xs text-center text-gray-500">
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
