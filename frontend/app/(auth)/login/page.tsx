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
  <svg className="mr-3 h-5 w-5" viewBox="0 0 48 48">
    {/* ...icon path... */}
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

function LoginPage() {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSuspiciousInput, setHasSuspiciousInput] = useState(false);

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;
  const router = useRouter();

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

  const detectSQLi = (value: string) => {
    const patterns = [
      /(\bor\b|\band\b)\s+1\s*=\s*1/i,
      /union\s+select/i,
      /select\b.*\bfrom\b/i,
      /insert\s+into/i,
      /update\s+\w+\s+set/i,
      /drop\s+table/i,
      /--|;|#|\bexec\b/i,
    ];
    return patterns.some((re) => re.test(value));
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
      } catch (error) {
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
    if (!backendURL) return;
    if (!csrfToken) return;

    setIsSubmitting(true);

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
        toast.error("Login Failed", {
          description:
            errorData.message ||
            "Invalid username or password. Please try again.",
        });
      }
    } catch {
      toast.error("Connection Error", {
        description: "Unable to connect to the server.",
      });
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
                        Suspicious input detected! Remove HTML tags or SQL
                        keywords.
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

              <Button
                type="submit"
                className="h-12 w-full text-lg font-semibold"
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
