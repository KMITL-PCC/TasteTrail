"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/store/user-store";

import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "../ui/skeleton";

const ProfileForm = () => {
  const { user } = useUser();

  const username = user?.username || "Unknown User";
  const email = user?.email || "unknown@example.com";
  const profilePictureUrl = user?.profilePictureUrl;

  return (
    <Card className="w-full py-0 mx-auto overflow-hidden border shadow-sm rounded-2xl">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="relative h-[100px] w-[100px]">
          {profilePictureUrl ? (
            <Image
              src={profilePictureUrl}
              alt="User"
              fill
              className="object-cover rounded-full"
              sizes="100px"
            />
          ) : (
            <Skeleton className="rounded-full size-full" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-lg font-semibold truncate">{username}</p>
          <p className="text-sm truncate text-muted-foreground">
            Email : {email}
          </p>
        </div>

        <div className="self-center ml-auto">
          <Button variant="outline" size="sm" asChild>
            <Link href="/edit-profile">Edit</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileForm;
