"use client";

import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

function NotFoundContent() {
  const router = useRouter();
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
      <p className="text-lg">The page you are looking for does not exist.</p>
      <Button onClick={() => router.push("/")}>Go to Home</Button>
    </div>
  );
}

export default function NotFound() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NotFoundContent />
    </Suspense>
  );
}
