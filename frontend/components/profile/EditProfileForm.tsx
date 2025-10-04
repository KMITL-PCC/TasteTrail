"use client";

import { useState, useRef, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Save, User, Lock, EyeOff, Eye, X } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import z from "zod";

const backendURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const PROFILE_ENDPOINT = `${backendURL}/auth/me`;
const UPDATEPROFILE_ENDPOINT = `${backendURL}/account/updateprofile`;
const PASSWORD_ENDPOINT = `${backendURL}/auth/updatepass-current`;
const CSRF_ENDPOINT = `${backendURL}/api/csrf-token`;

function sanitizePassword(input: string) {
  return input.replace(/[<>"'`;]/g, "").trim();
}

// ---------------- security helpers ----------------
function detectMaliciousInput(input: string) {
  if (!input) return false;

  // any HTML tag => XSS
  const xssPattern = /<[^>]*>/i;

  // common SQLi keywords, comment markers, semicolon, or "sqli"
  const sqliPattern =
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|OR|AND|EXEC|MERGE|ALTER|TRUNCATE)\b|--|;|\/\*|\*\/|sqli)/i;

  return xssPattern.test(input) || sqliPattern.test(input);
}

/**
 * sanitizeUsername:
 * - normalize, trim, remove control chars
 * - remove dangerous bracket characters (<, >) to avoid XSS payloads being sent
 * - allow common username characters plus @ and #
 * - limit length to 30
 *
 * Note: server should still validate/sanitize again.
 */
function sanitizeUsername(raw: string) {
  if (!raw) return "";
  let s = raw.normalize ? raw.normalize("NFKC") : raw;
  s = s.trim();
  // remove control chars
  s = s.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
  // remove angle brackets and quotes (to prevent HTML injection)
  s = s.replace(/[<>\"'`]/g, "");
  // keep only allowed characters (letters, numbers, underscore, dot, dash, @, #)
  s = s.replace(/[^A-Za-z0-9_.\-@#]/g, "");
  s = s.slice(0, 30);
  return s;
}
// --------------------------------------------------

export default function EditProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultTab =
    (searchParams.get("tab") as "profile" | "password") ?? "profile";

  const passwordSchema = z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .max(100, { message: "Password too long." })
    .regex(/^[\w!@#$%^&*()\-+=.?]+$/, {
      message: "Password contains invalid characters.",
    })
    .refine((val) => /[a-z]/.test(val), {
      message: "Password must include at least one lowercase letter.",
    })
    .refine((val) => /[A-Z]/.test(val), {
      message: "Password must include at least one uppercase letter.",
    })
    .refine((val) => /\d/.test(val), {
      message: "Password must include at least one number.",
    })
    .refine((val) => /[!@#$%^&*()\-+=.?]/.test(val), {
      message: "Password must include at least one special character.",
    });

  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Avatar
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Profile
  const [username, setUsername] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // malicious detection message for username
  const [maliciousError, setMaliciousError] = useState("");

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const isNewPasswordValid = passwordSchema.safeParse(newPassword).success;
  const isConfirmValid = confirmPassword === newPassword;

  // === CSRF ===
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(CSRF_ENDPOINT, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) {
          toast.error("Security token error", {
            description: "  .",
          });
          return;
        }
        const data = await res.json();
        setCsrfToken(data?.csrfToken || null);
      } catch (err) {
        toast.error("Connection Error", {
          description: "Could not connect to the server for security setup.",
        });
      }
    })();
  }, []);

  // === Load profile ===
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(PROFILE_ENDPOINT, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) {
          const msg = await pickError(res, "Failed to load profile");
          toast.error("Connection Error", { description: msg });
          return;
        }
        const { user } = await res.json();
        setUsername(user?.username ?? "");

        if (user?.profilePictureUrl) {
          const url = user.profilePictureUrl.startsWith("http")
            ? user.profilePictureUrl
            : `${backendURL}${user.profilePictureUrl}`;
          setAvatarPreview(url);
        }
      } catch (err) {
        toast.error("Connection Error", {
          description: "Unable to fetch your profile. Please try again.",
        });
      }
    })();
  }, []);

  function containsXSSorSQLi(input: string) {
    const patterns = [
      /<\s*script.*?>/i, // XSS แบบง่าย
      /<\/\s*script>/i,
      /['";]/, // SQLi พื้นฐาน ' " ;
      /--/, // SQL comment
      /\/\*/, // SQL comment start
    ];
    return patterns.some((pat) => pat.test(input));
  }

  // ===== Profile upload/preview =====
  // State เพิ่มสำหรับแจ้งเตือนไฟล์ใหญ่
  const [avatarError, setAvatarError] = useState("");

  function onUploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 4 * 1024 * 1024; // 4MB
    if (file.size > MAX_SIZE) {
      setAvatarError("Image size exceeds 4MB.");
      if (e.target) e.target.value = ""; // รีเซ็ต input
      return;
    }

    setAvatarError(""); // ล้าง error
    setAvatarFile(file);

    // แสดงตัวอย่างทันทีด้วย Data URL
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(String(ev.target?.result || ""));
    reader.readAsDataURL(file);
  }

  async function onSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!csrfToken) {
      toast.error("Session not ready", {
        description: "Please wait a moment and try again.",
      });
      return;
    }

    // หากมีการตรวจพบ malicious input ให้บล็อกการส่ง
    // เปลี่ยนฟังก์ชัน detectMaliciousInput ให้คืน string หรือ ""
    function detectMaliciousInput(input: string): string {
      if (!input) return "";
      const xssPattern = /<[^>]*>/i;
      const sqliPattern =
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|OR|AND|EXEC|MERGE|ALTER|TRUNCATE)\b|--|;|\/\*|\*\/|sqli)/i;

      if (xssPattern.test(input) || sqliPattern.test(input)) {
        return "Invalid characters detected.";
      }
      return "";
    }

    // sanitize ก่อนส่ง (server ต้อง validate อีกชั้นเสมอ)
    const safeUsername = sanitizeUsername(username);
    if (!safeUsername) {
      toast.error("Invalid username", {
        description: "Username contains invalid characters.",
      });
      return;
    }

    try {
      setSavingProfile(true);
      toast.info("Saving profile...");

      const form = new FormData();
      form.set("username", safeUsername); // <-- ส่งค่า sanitized
      if (avatarFile) form.set("avatar", avatarFile);

      const res = await fetch(UPDATEPROFILE_ENDPOINT, {
        method: "PUT",
        body: form,
        headers: { "X-CSRF-Token": csrfToken },
        credentials: "include",
      });

      if (!res.ok) {
        const msg = await pickError(res, "Failed to save profile");
        toast.error("Save failed", { description: msg });
        return;
      }

      const data = await res.json();
      toast.success("Profile saved", {
        description: data.message || "Your changes have been updated.",
      });

      if (data?.avatarUrl) setAvatarPreview(data.avatarUrl);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setAvatarFile(null);

      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const ch = new BroadcastChannel("profile-updated");
        ch.postMessage({ ts: Date.now() });
        ch.close();
      }
      router.push("/profile?updated=1");
    } catch (e: any) {
      toast.error("Connection Error", {
        description: "Unable to save profile. Please try again.",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  // ===== Change password (with current) =====
  async function onSavePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!csrfToken) {
      toast.error("Session not ready", {
        description: "Please wait a moment and try again.",
      });
      return;
    }

    const result = passwordSchema.safeParse(newPassword);
    if (!result.success) {
      toast.error("Weak password", {
        description: result.error.issues[0].message,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Password mismatch", {
        description: "Confirmation does not match the new password.",
      });
      return;
    }

    try {
      setSavingPassword(true);
      toast.info("Updating password...");

      const res = await fetch(PASSWORD_ENDPOINT, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const msg = await pickError(res, "Failed to update password");
        toast.error("Update failed", { description: msg });
        return;
      }

      const data = await res.json();
      toast.success("Password updated", {
        description: data.message || "Your password has been changed.",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      router.push("/profile?updated=1");
    } catch (e: any) {
      toast.error("Connection Error", {
        description: "Unable to update password. Please try again.",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div>
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="m-0">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="password">
            <Lock className="mr-2 h-4 w-4" />
            <Lock className="mr-2 h-4 w-4" />
            Password
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <form
            id="profile-form"
            onSubmit={onSaveProfile}
            className="max-h-l w-full max-w-6xl overflow-hidden rounded-2xl border py-0 shadow-sm"
            className="max-h-l w-full max-w-6xl overflow-hidden rounded-2xl border py-0 shadow-sm"
          >
            <Card className="space-y-6 border-0 shadow-sm">
              <CardContent className="grid grid-cols-1 gap-6 py-10 md:grid-cols-12 md:items-center">
                <div className="flex justify-center md:col-span-5">
                  <div className="relative size-36">
                    <Avatar className="ring-muted-foreground/20 h-50 w-50 cursor-pointer ring-2">
                    <Avatar className="ring-muted-foreground/20 h-50 w-50 cursor-pointer ring-2">
                      {avatarPreview ? (
                        <AvatarImage src={avatarPreview} alt="avatar" />
                      ) : (
                        <AvatarImage src="/placeholder.svg" alt="avatar" />
                      )}
                      <AvatarFallback>
                        {(username?.[0] || "").toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarPreview(null);
                          setAvatarFile(null);
                          setAvatarError("");
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        className="absolute top-0 -right-16 -translate-x-1/4 -translate-y-1/4 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                        className="absolute top-0 -right-16 -translate-x-1/4 -translate-y-1/4 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                        title="Remove"
                      >
                        <X />
                      </button>
                    )}

                    {avatarError && (
                      <p className="mt-2 text-sm text-red-600">{avatarError}</p>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onUploadAvatar}
                    />

                    <div
                      className="absolute inset-0 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-center pt-6 md:col-span-7 md:pl-2">
                  <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>
                      Basic account information.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2 pt-5 md:col-span-2">
                    <div className="space-y-2 pt-5 md:col-span-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => {
                          const val = e.target.value;
                          setUsername(val);

                          // detect malicious input (now returns boolean)
                          const isBad = detectMaliciousInput(val);
                          if (isBad) {
                            setMaliciousError("Invalid characters detected.");
                          } else {
                            setMaliciousError("");
                          }
                        }}
                        placeholder="username"
                        className={`h-11 rounded-md border px-3 ${
                          maliciousError
                            ? "border-red-500 focus:border-red-500"
                            : "border-gray-300 focus:border-green-500"
                        }`}
                      />
                      {maliciousError && (
                        <p className="mt-1 text-sm text-red-600">
                          {maliciousError}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-end px-10">
                <Button type="submit" disabled={savingProfile}>
                  <Save className="h-4 w-4" /> Save profile
                  <Save className="h-4 w-4" /> Save profile
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        <TabsContent value="password">
          <form onSubmit={onSavePassword}>
            <Card>
              <CardHeader>
                <CardTitle>Change password</CardTitle>
                <CardDescription>
                  Use current password to set a new one.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {/* Current Password */}
                <div>
                  <Label htmlFor="currentPassword" className="mb-2 block">
                    Current password
                  </Label>
                  <div className="flex items-center rounded-md border focus-within:ring-2 focus-within:ring-green-500">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) =>
                        setCurrentPassword(sanitizePassword(e.target.value))
                      }
                      className="h-11 flex-1 border-0 focus:ring-0"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      aria-label={
                        showCurrentPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      className="px-3 text-gray-500 hover:text-gray-800 focus:outline-none"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <Label htmlFor="newPassword" className="mb-2 block">
                    New password
                  </Label>
                  <div
                    className={`flex items-center rounded-md focus-within:ring-2 focus-within:ring-green-500 ${
                      newPassword.length === 0
                        ? "border border-gray-300"
                        : isNewPasswordValid
                          ? "border border-green-500"
                          : "border border-red-500"
                    }`}
                  >
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(sanitizePassword(e.target.value))
                      }
                      className="h-11 flex-1 border-0 focus:ring-0"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="px-3 text-gray-500 hover:text-gray-800 focus:outline-none"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* Password strength checklist */}
                  {newPassword.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm">
                      <li
                        className={
                          /[a-z]/.test(newPassword)
                            ? "text-green-600"
                            : "text-gray-500"
                        }
                      >
                        • Lowercase letter
                      </li>
                      <li
                        className={
                          /[A-Z]/.test(newPassword)
                            ? "text-green-600"
                            : "text-gray-500"
                        }
                      >
                        • Uppercase letter
                      </li>
                      <li
                        className={
                          /\d/.test(newPassword)
                            ? "text-green-600"
                            : "text-gray-500"
                        }
                      >
                        • Number
                      </li>
                      <li
                        className={
                          /[!@#$%^&*()\-+=.?]/.test(newPassword)
                            ? "text-green-600"
                            : "text-gray-500"
                        }
                      >
                        • Special character (!@#$%^&*()-+=.?)
                      </li>
                      <li
                        className={
                          newPassword.length >= 6
                            ? "text-green-600"
                            : "text-gray-500"
                        }
                      >
                        • At least 6 characters
                      </li>
                    </ul>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="confirmPassword" className="mb-2 block">
                    Confirm password
                  </Label>
                  <div
                    className={`flex items-center rounded-md focus-within:ring-2 focus-within:ring-green-500 ${
                      confirmPassword.length === 0
                        ? "border border-gray-300"
                        : confirmPassword === newPassword
                          ? "border border-green-500"
                          : "border border-red-500"
                    }`}
                  >
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(sanitizePassword(e.target.value))
                      }
                      className="h-11 flex-1 border-0 focus:ring-0"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="px-3 text-gray-500 hover:text-gray-800 focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="submit" disabled={savingPassword}>
                  <Lock className="mr-2 h-4 w-4" />
                  <Lock className="mr-2 h-4 w-4" />
                  {savingPassword ? "Updating..." : "Update password"}
                </Button>

                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={async () => {
                    if (!csrfToken) {
                      toast.error("Session not ready");
                      return;
                    }
                    try {
                      const res = await fetch(`${backendURL}/auth/sendOTP`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "X-CSRF-Token": csrfToken,
                        },
                        credentials: "include",
                      });
                      if (!res.ok) throw new Error("Failed to send OTP");

                      toast.success("OTP sent successfully!");
                      router.push(
                        `/update-by-otp?return=${encodeURIComponent("/editprofile?tab=password")}`,
                      );
                    } catch (err) {
                      toast.error("Error sending OTP");
                    }
                  }}
                >
                  Update By OTP
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}

async function pickError(res: Response, fallback: string) {
  try {
    const clone = res.clone();
    const j = await clone.json();
    return j?.message || fallback;
  } catch {
    const clone = res.clone();
    const t = await clone.text();
    return t || fallback;
  }
}
