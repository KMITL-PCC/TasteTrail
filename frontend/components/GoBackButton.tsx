"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

const GoBackButton = ({ className }: { className?: string }) => {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      onClick={() => router.push("/")}
      className={cn("size-7 rounded-full", className)}
    >
      <ArrowLeftIcon className="text-black size-4" />
    </Button>
  );
};

export default GoBackButton;
