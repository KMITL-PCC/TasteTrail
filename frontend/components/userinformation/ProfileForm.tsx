"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import useSWR, { useSWRConfig } from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUserStore } from "@/store/user-store"; // path ของคุณเอง

const backendURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const PROFILE_ENDPOINT = `${backendURL}/profile`;
const CSRF_ENDPOINT = `${backendURL}/api/csrf-token`;

const fetcher = async (url: string, csrfToken?: string) => {
  const res = await fetch(url, {
    credentials: "include",
    headers: csrfToken ? { "X-CSRF-Token": csrfToken } : undefined,
  });
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
};

const ProfileForm = () => {
  const { user, setUser } = useUserStore();
  const { mutate } = useSWRConfig();
  const searchParams = useSearchParams();

  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  // โหลด CSRF token
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const res = await fetch(CSRF_ENDPOINT, {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        setCsrfToken(data.csrfToken || null);
      } catch (err) {
        console.error("Failed to load CSRF token");
      }
    };
    fetchCsrfToken();
  }, []);

  // SWR fetch เผื่อ user ยังไม่มีข้อมูลใน store
  const { data, isLoading, error } = useSWR(
    user || !csrfToken ? null : [PROFILE_ENDPOINT, csrfToken],
    fetcher,
    { revalidateOnFocus: true },
  );

  // ถ้ามีข้อมูลจาก API ให้ set ใน store
  useEffect(() => {
    if (data) {
      setUser({
        username: data.username || "Unnamed User",
        email: data.email || "unknown@example.com",
        role: data.role || "user",
        profilePictureUrl: data.avatarUrl || "/user.png",
      });
    }
  }, [data, setUser]);

  // Revalidate เมื่อมี ?updated=1
  useEffect(() => {
    if (searchParams.get("updated") === "1") {
      mutate(PROFILE_ENDPOINT);
    }
  }, [searchParams, mutate]);

  // ฟัง BroadcastChannel จากหน้า Edit
  useEffect(() => {
    if (typeof window === "undefined" || !("BroadcastChannel" in window))
      return;
    const ch = new BroadcastChannel("profile-updated");
    ch.onmessage = () => {
      mutate(PROFILE_ENDPOINT);
    };
    return () => ch.close();
  }, [mutate]);

  // เตรียมข้อมูลจาก store
  const username = user?.username || "Unnamed User";
  const email = user?.email || "unknown@example.com";
  const profilePictureUrl = user?.profilePictureUrl || "/user.png";

  return (
    <div className="to-muted/50 min-h-screen bg-gradient-to-b from-white">
      <Card className="mx-auto mt-16 max-w-6xl overflow-hidden rounded-2xl border py-0 shadow-sm">
        <CardContent className="flex items-center gap-2">
          <div className="relative h-[120px] w-[120px]">
            <Image
              src={profilePictureUrl}
              alt="User"
              fill
              className="rounded-full object-cover"
              sizes="120px"
            />
          </div>

          <div className="min-w-0 flex-1">
            {isLoading && !user ? (
              <>
                <p className="bg-muted h-4 w-48 animate-pulse rounded" />
                <p className="bg-muted mt-2 h-3 w-64 animate-pulse rounded" />
              </>
            ) : error && !user ? (
              <>
                <p className="truncate text-lg font-semibold">Failed to load</p>
                <p className="text-sm text-red-500">Please refresh the page.</p>
              </>
            ) : (
              <>
                <p className="truncate text-lg font-semibold">{username}</p>
                <p className="text-muted-foreground truncate text-sm">
                  Email : {email}
                </p>
              </>
            )}
          </div>

          <div className="ml-auto self-center">
            <Button variant="outline" size="sm" asChild>
              <Link href="/editprofile">Edit</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileForm;
