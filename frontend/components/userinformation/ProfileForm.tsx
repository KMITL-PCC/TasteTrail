"use client";

import Image from "next/image";
import React from "react";
import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const backendURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const PROFILE_ENDPOINT = `${backendURL}/profile`;

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load profile");
  return res.json();
};

const ProfileForm = () => {
  const { data, isLoading, error } = useSWR(PROFILE_ENDPOINT, fetcher, {
    revalidateOnFocus: true,
  });

  const fullName = data
    ? `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim()
    : "";
  const email = data?.email ?? "unknown@example.com";
  const avatarUrl = data?.avatarUrl || "/user.png";

  return (
    <div className="to-muted/50 min-h-screen bg-gradient-to-b from-white">
      <Card className="mx-auto mt-16 max-w-6xl overflow-hidden rounded-2xl border py-0 shadow-sm">
        <CardContent className="flex items-center gap-2">
          <div className="relative h-[120px] w-[120px]">
            <Image
              src={avatarUrl}
              alt="User"
              fill
              className="rounded-full object-cover"
              sizes="120px"
              // NOTE: ถ้า avatarUrl เป็นโดเมนอื่น เช่น http://localhost:3001/...
              // ต้องอนุญาตโดเมนนั้นใน next.config.js -> images.remotePatterns
              // มิฉะนั้นให้ใช้ <img> ธรรมดาแทน
            />
          </div>

          <div className="min-w-0 flex-1">
            {isLoading ? (
              <>
                <p className="bg-muted h-4 w-48 animate-pulse rounded" />
                <p className="bg-muted mt-2 h-3 w-64 animate-pulse rounded" />
              </>
            ) : error ? (
              <>
                <p className="truncate text-lg font-semibold">Failed to load</p>
                <p className="text-sm text-red-500">Please refresh the page.</p>
              </>
            ) : (
              <>
                <p className="truncate text-lg font-semibold">
                  {fullName || "Unnamed User"}
                </p>
                <p className="text-muted-foreground text-sm">Email : {email}</p>
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
