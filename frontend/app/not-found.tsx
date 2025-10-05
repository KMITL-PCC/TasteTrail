"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const NotFound = () => {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-4">
      <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
      <p className="text-lg">The page you are looking for does not exist.</p>
      <Button onClick={() => router.push("/")}>Go to Home</Button>
    </div>
  );
};
export default NotFound;
