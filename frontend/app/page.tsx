import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="flex items-center justify-center flex-1 p-4 overflow-x-hidden md:p-8 xl:px-16">
      <div className="relative flex flex-col items-center max-w-6xl px-6 mx-auto lg:flex-row">
        <div className="max-w-lg mx-auto text-center lg:ml-0 lg:w-1/2 lg:text-left">
          <h1 className="max-w-2xl mt-8 text-5xl font-medium text-balance md:text-6xl lg:mt-16 xl:text-7xl">
            TasteTrail
          </h1>
          <p className="max-w-2xl mt-8 text-lg text-pretty">
            {/* TODO: Add hero section description ภาษาไทย */}
            ค้นหาร้านอาหารที่คุณต้องการอย่างง่ายดาย ด้วยการค้นหาตามชื่อร้านอาหาร
            ตำแหน่ง ระดับราคา หรือประเภทอาหาร
          </p>

          <div className="flex flex-col items-center justify-center gap-2 mt-12 sm:flex-row lg:justify-start">
            <Button asChild size="lg" className="px-5 text-base group">
              <Link href="/restaurants">
                <span className="text-nowrap">ค้นหาร้านอาหาร</span>
                <ArrowRight
                  size={18}
                  className="ml-2 transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </Button>
          </div>
        </div>
        <Image
          className="-z-10 order-first ml-auto h-56 w-full object-contain sm:h-96 lg:inset-0 lg:order-last lg:h-[550px] lg:w-2/3"
          src="/hero-pic.png"
          alt="Abstract Object"
          height="4000"
          width="3000"
        />
      </div>
    </div>
  );
}
