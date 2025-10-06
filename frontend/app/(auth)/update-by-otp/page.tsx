"use client";

import { Suspense } from "react";
import UpdateByOtpForm from "@/components/auth/UpdateByOtpForm";

export default function UpdateByOtpPage() {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <UpdateByOtpForm />
    </Suspense>
  );
}
