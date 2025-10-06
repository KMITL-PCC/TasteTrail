"use client";

import { Suspense } from "react";
import UpdateByOtpForm from "@/components/auth/UpdateByOtpForm";
import { useUser } from "@/store/user-store";
import { useRouter } from "next/navigation";

export default function UpdateByOtpPage() {
  const router = useRouter();
  const { user } = useUser();

  if (user?.thirdPartyOnly) {
    router.push("/");
    return null;
  }
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <UpdateByOtpForm />
    </Suspense>
  );
}
