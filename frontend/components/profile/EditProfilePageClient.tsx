"use client";

import { Suspense } from "react";
import EditProfileForm from "@/components/profile/EditProfileForm";

export default function EditProfilePageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditProfileForm />
    </Suspense>
  );
}
