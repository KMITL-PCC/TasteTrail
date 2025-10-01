"use client";

import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@/store/user-store";
import { ImageZoom } from "@/components/ui/shadcn-io/image-zoom";

const backendURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const CSRF_ENDPOINT = `${backendURL}/api/csrf-token`;

const ProfileForm = () => {
  const { user } = useUser();
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

  // ข้อมูลจาก store
  const username = user?.username || "Unnamed User";
  const email = user?.email || "unknown@example.com";
  const profilePictureUrl = user?.profilePictureUrl || "/user.png";

  return (
    <div className="">
      <Card className="mx-auto mt-9 h-40 max-w-5xl overflow-hidden rounded-2xl border py-0 shadow-sm">
        <CardContent className="flex h-full items-center gap-2">
          <div className="relative flex h-[120px] w-[120px] items-center">
            <ImageZoom>
              <div className="h-[120px] w-[120px] overflow-hidden rounded-full">
                <Image
                  src={profilePictureUrl}
                  alt="User"
                  width={120}
                  height={120}
                  className="object-cover"
                  unoptimized
                />
              </div>
            </ImageZoom>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold">{username}</p>
            <p className="text-muted-foreground truncate text-sm">
              Email : {email}
            </p>
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
