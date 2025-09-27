import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CallToAction = () => {
  return (
    <div className="fixed bottom-4 left-0 mt-30 flex w-full justify-center md:absolute md:top-[950px] md:left-1/2 md:w-auto md:-translate-x-1/2 lg:absolute lg:top-[470px] lg:left-1/2 lg:w-auto lg:-translate-x-1/2">
      <Link href="/restaurants">
        <Button className="inline-flex items-center justify-center px-4 py-2 text-sm font-bold text-white transition-transform rounded-full shadow-lg group hover:scale-105">
          <span>LOOK FOR FOOD</span>
          <ArrowRight
            size={18}
            className="ml-2 transition-transform duration-300 group-hover:translate-x-1"
          />
        </Button>
      </Link>
    </div>
  );
};

export default CallToAction;
