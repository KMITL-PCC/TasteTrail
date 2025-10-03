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
  const isEdit = pathname.split("/")[3] === "edit";

  if (pathname.split("/")[1] === "restaurants") {
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
                <BreadcrumbLink
                  href={`/restaurants/${pathname.split("/")[2]}`}
                  className={cn(isEdit ? "cursor-pointer" : "cursor-default")}
                >
                  {restaurantName}
                </BreadcrumbLink>
              </BreadcrumbItem>
              {isEdit && (
                <>
                  <BreadcrumbSeparator>/</BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="cursor-default">
                      แก้ไข
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              )}
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList className={cn("px-4", className)}>
        {pathname.split("/").map((path, index) => (
          <BreadcrumbItem key={index}>
            <BreadcrumbLink href={`/${path}`}>
              {path.charAt(0).toUpperCase() + path.slice(1)}
            </BreadcrumbLink>
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
export default BreadcrumbComponent;
