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
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const ProfileForm = () => {
  const { user } = useUser();

  const username = user?.username || "Unknown User";
  const email = user?.email || "unknown@example.com";
  const profilePictureUrl = user?.profilePictureUrl;

  return (
    <Card className="mx-auto w-full overflow-hidden rounded-2xl border py-0 shadow-sm">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="relative size-[80px]">
          <Avatar className="size-full">
            <Zoom zoomMargin={200}>
              <AvatarImage src={profilePictureUrl} alt="User" />
            </Zoom>
            <AvatarFallback>{username.charAt(0)}</AvatarFallback>
          </Avatar>
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
