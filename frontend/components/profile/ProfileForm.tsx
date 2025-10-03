"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/store/user-store";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";

import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "../ui/skeleton";

const ProfileForm = () => {
  const { user } = useUser();

  const username = user?.username || "Unknown User";
  const email = user?.email || "unknown@example.com";
  const profilePictureUrl = user?.profilePictureUrl;

  return (
    <Card className="mx-auto w-full overflow-hidden rounded-2xl border py-0 shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="relative h-[100px] w-[100px]">
          {profilePictureUrl ? (
            <Zoom zoomMargin={200}>
              <Image
                src={profilePictureUrl}
                alt="User"
                fill
                className="rounded-full object-cover"
                sizes="100px"
              />
            </Zoom>
          ) : (
            <Skeleton className="size-full rounded-full" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">{username}</p>
          <p className="text-muted-foreground truncate text-sm">
            Email : {email}
          </p>
        </div>

        <div className="ml-auto self-center">
          <Button variant="outline" size="sm" asChild>
            <Link href="/edit-profile">Edit</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;
