"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "./ui/breadcrumb";

const BreadcrumbComponent = ({
  restaurantName,
}: {
  restaurantName: string;
}) => {
  const pathname = usePathname();

  return (
    <Breadcrumb>
      <BreadcrumbList className="px-4">
        <BreadcrumbItem>
          <BreadcrumbLink href="/restaurants">ร้านอาหาร</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator>/</BreadcrumbSeparator>
        <BreadcrumbItem>
          <BreadcrumbLink className="cursor-default">
            {restaurantName}
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
export default BreadcrumbComponent;
