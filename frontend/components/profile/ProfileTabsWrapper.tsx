// app/profile/ProfileTabsWrapper.tsx
"use client";

import { Suspense } from "react";
import ProfileTabs from "@/components/profile/ProfileTabs";

const ProfileTabsWrapper = () => {
  return (
    <Suspense fallback={<div>Loading tabs…</div>}>
      <ProfileTabs />
    </Suspense>
  );
};

export default ProfileTabsWrapper;
