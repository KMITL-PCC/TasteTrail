import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import React from "react";
import Link from "next/link";

const CallToAction = ({ className }: { className?: string }) => {
  return (
    <Button
      className={`absolute h-12 w-50 rounded-full px-4 py-2 text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 ${className}`}
      asChild
    >
      <Link href="/restaurants">
        <span>LOOK FOR FOOD</span>
        <ArrowRight
          size={18}
          className="ml-2 transition-transform duration-300 group-hover:translate-x-1"
        />
      </Link>
    </Button>
  );
};

export default CallToAction;
