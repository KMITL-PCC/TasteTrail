import Image from "next/image";
import Link from "next/link";
import logo from "@/public/logo.svg";
import { cn } from "@/lib/utils";

const Logo = ({
  width,
  height,
  className,
}: {
  width: number;
  height: number;
  className?: string;
}) => {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Image
        src={logo}
        alt="TasteTrail"
        width={width}
        height={height}
        className={cn("rounded-full", className)}
      />
      <span className="hidden text-xl font-medium md:block">TasteTrail</span>
    </Link>
  );
};
export default Logo;
