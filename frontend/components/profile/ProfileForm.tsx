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
    <Card className="w-full py-0 mx-auto overflow-hidden border shadow-sm rounded-2xl">
      <CardContent className="flex items-center gap-4 p-4">
        <div className="relative size-[80px]">
          <Avatar className="size-full">
            <Zoom zoomMargin={200}>
              <AvatarImage src={profilePictureUrl} alt="User" />
            </Zoom>
            <AvatarFallback>{username.charAt(0)}</AvatarFallback>
          </Avatar>
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
