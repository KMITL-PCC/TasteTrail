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
import { Upload, Trash2, Save, User, Lock } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

const backendURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const PROFILE_ENDPOINT = `${backendURL}/auth/me`;
const UPDATEPROFILE_ENDPOINT = `${backendURL}/account/updateprofile`;
const PASSWORD_ENDPOINT = `${backendURL}/auth/updatepass-curent`;
const CSRF_ENDPOINT = `${backendURL}/api/csrf-token`;

export default function EditProfilePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultTab =
    (searchParams.get("tab") as "profile" | "password") ?? "profile";

  const [csrfToken, setCsrfToken] = useState<string | null>(null);

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
        if (data?.avatarUrl) setAvatarPreview(data.avatarUrl);
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
        method: "PATCH", // ใช้ PATCH สำหรับการอัปเดตพาสเวิร์ด
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
    } catch (e: any) {
      toast.error("Connection Error", {
        description: "Unable to update password. Please try again.",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="to-muted/50 min-h-screen bg-gradient-to-b from-white">
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

      <div className="container mx-auto px-4 py-8">
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
              className="grid grid-cols-1 gap-6 lg:grid-cols-12"
            >
              <div className="space-y-6 lg:col-span-5">
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle>Avatar</CardTitle>
                    <CardDescription>
                      Upload your profile photo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Avatar className="ring-muted-foreground/20 h-20 w-20 ring-2">
                        {avatarPreview ? (
                          <AvatarImage src={avatarPreview} alt="avatar" />
                        ) : (
                          <AvatarImage src="/placeholder.svg" alt="avatar" />
                        )}
                        <AvatarFallback>
                          {(username?.[0] || "").toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid grid-cols-1 gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={onUploadAvatar}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-4 w-4" /> Upload
                        </Button>
                        {avatarPreview && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setAvatarFile(null);
                              setAvatarPreview(null);
                              if (fileInputRef.current)
                                fileInputRef.current.value = "";
                            }}
                          >
                            <Trash2 className="h-4 w-4" /> Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6 lg:col-span-7">
                <Card>
                  <CardHeader>
                    <CardTitle>Account</CardTitle>
                    <CardDescription>
                      Basic account information.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="username"
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="justify-end">
                    <Button type="submit" disabled={savingProfile}>
                      <Save className="h-4 w-4" /> Save profile
                    </Button>
                  </CardFooter>
                </Card>
              </div>
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
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm new password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <Button type="submit" disabled={savingPassword}>
                    <Lock className="mr-2 h-4 w-4" />
                    {savingPassword ? "Updating..." : "Update password"}
                  </Button>

                  <Link
                    href={`/forgotpassword?from=edit&return=${encodeURIComponent(
                      "/editprofile?tab=password",
                    )}`}
                    className="text-muted-foreground text-sm hover:underline"
                  >
                    Forgot password?
                  </Link>
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
