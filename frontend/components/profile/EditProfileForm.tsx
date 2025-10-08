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
import { useRouter } from "next/navigation";
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

function detectXSS(input: string) {
  return /[<>"'`;]/.test(input);
}

function detectSQLi(input: string) {
  return /\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|OR|AND)\b/i.test(input);
}

export default function EditProfilePage() {
  const router = useRouter();

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
  const [thirdPartyOnly, setThirdPartyOnly] = useState<boolean | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profileChecked, setProfileChecked] = useState(false);

  const [username, setUsername] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const isNewPasswordValid = passwordSchema.safeParse(newPassword).success;
  const isConfirmValid = confirmPassword === newPassword;

  // --- CSRF ---
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(CSRF_ENDPOINT, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) throw new Error("Security token error");
        const data = await res.json();
        setCsrfToken(data?.csrfToken || null);
      } catch (err) {
        toast.error("Connection Error", {
          description: "Could not connect to the server for security setup.",
        });
      }
    })();
  }, []);

  // --- Load profile ---
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
        setThirdPartyOnly(!!user?.thirdPartyOnly);
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
        setThirdPartyOnly(false); // fallback
      } finally {
        setProfileChecked(true);
      }
    })();
  }, []);

  const [avatarError, setAvatarError] = useState<string | null>(null);

  function onUploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_SIZE = 4 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setAvatarError("File is too large. Maximum size is 4MB.");
      e.target.value = "";
      return;
    }
    setAvatarError(null);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function onSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (detectXSS(username) || detectSQLi(username)) {
      toast.error("Cannot save profile", {
        description:
          "Username contains invalid characters or possible injection!",
      });
      return;
    }

    if (!csrfToken) {
      toast.error("Session not ready", {
        description: "Please wait a moment and try again.",
      });
      return;
    }

    try {
      setSavingProfile(true);
      toast.info("Saving profile...");

      const form = new FormData();
      form.set("username", username);
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
      router.push("/login");
    } catch (e: unknown) {
      let message = "Unable to save profile. Please try again.";

      if (e instanceof Error) {
        message = e.message;
      }

      toast.error("Connection Error", {
        description: message,
      });
    } finally {
      setSavingProfile(false);
    }
  }

  const isUsernameValid = username.length >= 3 && username.length <= 20;

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
        description:
          data.message ||
          "Your password has been changed. Redirecting to login...",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      router.push("/login");
    } catch (e: unknown) {
      let message = "Unable to update password. Please try again.";

      if (e instanceof Error) {
        message = e.message;
      }

      toast.error("Connection Error", {
        description: message,
      });
    } finally {
      setSavingPassword(false);
    }
  }

  if (!profileChecked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div>
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="m-0">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" /> Profile
          </TabsTrigger>
          {thirdPartyOnly === false && (
            <TabsTrigger value="password">
              <Lock className="mr-2 h-4 w-4" />
              Password
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <form
            id="profile-form"
            onSubmit={onSaveProfile}
            className="max-h-l w-full max-w-6xl overflow-hidden rounded-2xl border py-0 shadow-sm"
          >
            <Card className="space-y-6 border-0 shadow-sm">
              <CardContent className="grid grid-cols-1 gap-6 py-10 md:grid-cols-12 md:items-center">
                {/* Avatar */}
                <div className="flex justify-center md:col-span-5">
                  <div className="relative size-36">
                    {/* Avatar */}
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

                    {/* ปุ่มลบ avatar */}
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarPreview(null);
                          setAvatarFile(null);
                          if (fileInputRef.current)
                            fileInputRef.current.value = "";
                        }}
                        className="absolute top-0 -right-16 -translate-x-1/4 -translate-y-1/4 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                        title="Remove"
                      >
                        <X />
                      </button>
                    )}

                    {/* input type file แอบไว้ */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onUploadAvatar} // ฟังก์ชันตรวจ 4MB และ preview
                    />

                    {/* overlay เพื่อคลิกเปิด file input */}
                    <div
                      className="absolute inset-0 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    />

                    {/* ข้อความ error ถ้าไฟล์ใหญ่เกิน 4MB */}
                    {avatarError && (
                      <div className="mt-2 flex w-50 justify-center">
                        <p className="text-center text-sm text-red-500">
                          {avatarError}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Account */}
                <div className="flex flex-col justify-center pt-6 md:col-span-7 md:pl-2">
                  <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>
                      Basic account information.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2 pt-5 md:col-span-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)} // ไม่ sanitize
                        placeholder="username"
                        className={`h-11 rounded-md pr-3 text-base focus:ring-green-500 ${
                          username.length === 0
                            ? "border-gray-300 focus:border-green-500"
                            : isUsernameValid
                              ? ""
                              : "border-red-500 focus:border-red-500"
                        }`}
                      />
                      {username.length > 0 && (
                        <>
                          {(detectXSS(username) || detectSQLi(username)) && (
                            <p className="mt-1 text-sm text-red-600">
                              Input rejected for security reasons.
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </div>
              </CardContent>

              <CardFooter className="flex items-center justify-end px-10">
                <Button type="submit" disabled={savingProfile}>
                  <Save className="h-4 w-4" /> Save profile
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {thirdPartyOnly === false && (
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
                  <PasswordField
                    id="currentPassword"
                    label="Current password"
                    value={currentPassword}
                    show={showCurrentPassword}
                    setShow={setShowCurrentPassword}
                    onChange={setCurrentPassword}
                    autoComplete="current-password"
                    showChecks={false}
                  />
                  {/* New Password */}
                  <PasswordField
                    id="newPassword"
                    label="New password"
                    value={newPassword}
                    show={showNewPassword}
                    setShow={setShowNewPassword}
                    onChange={setNewPassword}
                    autoComplete="new-password"
                    showChecks={true}
                  />

                  {/* Confirm Password */}
                  <PasswordField
                    id="confirmPassword"
                    label="Confirm password"
                    value={confirmPassword}
                    show={showConfirmPassword}
                    setShow={setShowConfirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                    showChecks={true}
                    matchValue={newPassword} // สำหรับเช็คว่าตรงกับ new password
                  />
                </CardContent>
                <CardFooter className="flex items-center">
                  {/* ปุ่ม Update password อยู่ซ้าย */}
                  <Button type="submit" disabled={savingPassword}>
                    Update password
                  </Button>

                  {/* กดปุ่มเพื่อพร้อม */}
                  {/* ปุ่ม Update by OTP อยู่ขวาแบบลิงก์สีเขียว */}
                  <Button
                    type="button"
                    variant="link"
                    className="ml-auto text-green-600 hover:text-green-800"
                    onClick={async () => {
                      if (!csrfToken) return toast.error("Session not ready");
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
                      } catch {
                        toast.error("Error sending OTP");
                      }
                    }}
                  >
                    Update by OTP
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </TabsContent>
        )}

        {thirdPartyOnly === true && (
          <TabsContent value="google-info">
            <Card className="p-6 text-center">
              <CardTitle className="text-lg font-semibold">
                Google Account
              </CardTitle>
              <CardDescription>
                This account was created with Google login.
                <br />
                You cannot change your password here. Please use Google sign-in
                instead.
              </CardDescription>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

// PasswordField component เหมือนเดิม
interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  show: boolean;
  setShow: React.Dispatch<React.SetStateAction<boolean>>;
  onChange: (val: string) => void;
  autoComplete?: string;
  showChecks?: boolean; // true สำหรับ new/confirm password
  matchValue?: string; // สำหรับ confirm password
}

function PasswordField({
  id,
  label,
  value,
  show,
  setShow,
  onChange,
  autoComplete,
  showChecks = false,
  matchValue,
}: PasswordFieldProps) {
  const checks = {
    length: value.length >= 8,
    lowercase: /[a-z]/.test(value),
    uppercase: /[A-Z]/.test(value),
    number: /\d/.test(value),
    special: /[!@#$%^&*()\-+=.?]/.test(value),
    match: matchValue !== undefined ? value === matchValue : true,
  };

  const showWarnings = showChecks && value.length > 0;

  return (
    <div className="mb-4">
      <Label htmlFor={id} className="mb-2 block">
        {label}
      </Label>
      <div className="flex h-11 items-center rounded-md border border-gray-300 px-3">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(sanitizePassword(e.target.value))}
          className="flex-1 bg-transparent text-base outline-none"
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setShow((prev) => !prev)}
          className="p-1 text-gray-500 hover:text-gray-800 focus:outline-none"
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {value && (
        <div className="mt-2 grid grid-cols-1 gap-1 text-sm">
          {[
            { check: checks.length, label: "At least 8 characters" },
            { check: checks.lowercase, label: "Lowercase letter" },
            { check: checks.uppercase, label: "Uppercase letter" },
            { check: checks.number, label: "Number" },
            { check: checks.special, label: "Special character (!@#$...)" },
            matchValue !== undefined
              ? { check: checks.match, label: "Must match new password" }
              : null,
          ]
            .filter(Boolean)
            .map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${
                    item!.check ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                <span className="text-xs text-gray-600">{item!.label}</span>
              </div>
            ))}
        </div>
      )}
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
