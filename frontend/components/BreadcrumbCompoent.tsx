"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";
import { cn } from "@/lib/utils";

const BreadcrumbComponent = ({
  className,
  restaurantName,
}: {
  restaurantName?: string;
  className?: string;
}) => {
  const pathname = usePathname();

  return (
    <Breadcrumb>
      <BreadcrumbList className={cn("px-4", className)}>
        <BreadcrumbItem>
          <BreadcrumbLink href="/restaurants">ร้านอาหาร</BreadcrumbLink>
        </BreadcrumbItem>
        {restaurantName && (
          <>
            <BreadcrumbSeparator>/</BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink className="cursor-default">
                {restaurantName}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
export default BreadcrumbComponent;
