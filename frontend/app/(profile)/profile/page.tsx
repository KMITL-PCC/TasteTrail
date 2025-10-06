// app/profile/page.tsx
"use client";

import BreadcrumbComponent from "@/components/BreadcrumbComponent";
import ProfileForm from "@/components/profile/ProfileForm";
import ProfileTabsWrapper from "@/components/profile/ProfileTabsWrapper"; // import wrapper แทน

const ProfilePage = () => {
  return (
    <div className="mx-auto flex w-full max-w-[1150px] flex-col gap-2 p-4 pt-2 md:p-8 md:pt-2 xl:px-16">
      <BreadcrumbComponent />
      <ProfileForm />
      <ProfileTabsWrapper /> {/* ใช้ wrapper */}
    </div>
  );
};

export default ProfilePage;
