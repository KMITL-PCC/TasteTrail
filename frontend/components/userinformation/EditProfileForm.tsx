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
import { Upload, Trash2, Save, User, Lock, EyeOff, Eye } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

const backendURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const PROFILE_ENDPOINT = `${backendURL}/auth/me`;
const UPDATEPROFILE_ENDPOINT = `${backendURL}/account/updateprofile`;
const PASSWORD_ENDPOINT = `${backendURL}/auth/updatepass-current`;
const CSRF_ENDPOINT = `${backendURL}/api/csrf-token`;

function sanitizePassword(input: string) {
  return input.replace(/[<>"'`;]/g, "").trim();
}

export default function EditProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultTab =
    (searchParams.get("tab") as "profile" | "password") ?? "profile";

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

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

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
          method: "GET", // ใช้ GET แทน PUT ในการดึงข้อมูล
          credentials: "include",
        });
        if (!res.ok) {
          const msg = await pickError(res, "Failed to load profile");
          toast.error("Connection Error", { description: msg });
          return;
        }
        const data = await res.json();
        setUsername(data?.username ?? "");
        if (data?.avatarUrl) {
          const url = data.avatarUrl.startsWith("http")
            ? data.avatarUrl
            : `${backendURL}${data.avatarUrl}`;
          setAvatarPreview(url);
        }
      } catch (err) {
        toast.error("Connection Error", {
          description: "Unable to fetch your profile. Please try again.",
        });
      }
    })();
  }, []);

  // ===== Profile upload/preview =====
  function onUploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // จำกัดไฟล์ ≤ 2MB
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("Image too large", {
        description: "Please select an image smaller than 2MB.",
      });
      if (e.target) e.target.value = "";
      return;
    }

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

    try {
      setSavingProfile(true);
      toast.info("Saving profile...");

      const form = new FormData();
      form.set("username", username);
      if (avatarFile) form.set("avatar", avatarFile);

      const res = await fetch(UPDATEPROFILE_ENDPOINT, {
        method: "PUT", // ใช้ PATCH สำหรับการอัปเดตข้อมูล
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

      if (data?.avatarUrl) setAvatarPreview(data.avatarUrl); // ใช้รูปใหม่จาก backend
      if (fileInputRef.current) fileInputRef.current.value = "";
      setAvatarFile(null);

      // Broadcast ให้หน้าอื่นรู้ว่ามีการอัปเดต
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

      // ล้างฟิลด์
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // ✅ Redirect ไปหน้า profile หลัง update สำเร็จ
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
    <div className="">
      <div className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 w-full border-b backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Link
              href="/profile"
              className="text-foreground inline-flex items-center gap-2 font-medium hover:underline"
            >
              <User className="h-4 w-4" /> Profile
            </Link>
            <span>/</span>
            <span className="text-foreground">Edit profile</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-30 py-8">
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="password">
              <Lock className="mr-2 h-4 w-4" />
              Password
            </TabsTrigger>
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
                    <div className="relative h-36 w-36">
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
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                          className="absolute top-0 right-0 -translate-x-1/4 -translate-y-1/4 rounded-full bg-red-600 p-1 text-white hover:bg-red-700"
                          title="Remove"
                        >
                          ✕
                        </button>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setAvatarFile(file);
                          setAvatarPreview(URL.createObjectURL(file));
                        }}
                      />

                      <div
                        className="absolute inset-0 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      />
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
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="username"
                        />
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
                  <div className="relative">
                    <Label htmlFor="currentPassword">Current password</Label>
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) =>
                        setCurrentPassword(sanitizePassword(e.target.value))
                      }
                      className="h-11 rounded-md border-gray-300 pr-10 text-base focus:border-green-500 focus:ring-green-500"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      aria-label={
                        showCurrentPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800 focus:outline-none"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* New Password */}
                  <div className="relative">
                    <Label htmlFor="newPassword">New password</Label>
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(sanitizePassword(e.target.value))
                      }
                      className="h-11 rounded-md border-gray-300 pr-10 text-base focus:border-green-500 focus:ring-green-500"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      aria-label={
                        showNewPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800 focus:outline-none"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <Label htmlFor="confirmPassword">Confirm password</Label>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(sanitizePassword(e.target.value))
                      }
                      className="h-11 rounded-md border-gray-300 pr-10 text-base focus:border-green-500 focus:ring-green-500"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800 focus:outline-none"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="submit" disabled={savingPassword}>
                    <Lock className="mr-2 h-4 w-4" />
                    {savingPassword ? "Updating..." : "Update password"}
                  </Button>

                  <Button
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
                          `/updatebyotp?return=${encodeURIComponent("/editprofile?tab=password")}`,
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
    </div>
  );
}

async function pickError(res: Response, fallback: string) {
  try {
    const clone = res.clone(); // สร้างสำเนาของ response
    const j = await clone.json(); // อ่านข้อมูลจากสำเนาของ response
    return j?.message || fallback; // ส่งคืนข้อความหรือข้อความ fallback
  } catch {
    const clone = res.clone(); // สร้างสำเนาใหม่อีกครั้งหากการอ่านเป็น JSON ล้มเหลว
    const t = await clone.text(); // อ่านข้อมูลจากสำเนาเป็น text
    return t || fallback; // ส่งคืนข้อความหรือข้อความ fallback
  }
}
