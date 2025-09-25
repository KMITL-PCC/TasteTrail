"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

const FilterButton = ({ filter = "popular" }: { filter: string }) => {
  const searchParams = useSearchParams();
  const text = filter === "popular" ? "ร้านยอดนิยม" : "ร้านใหม่มาแรง";

  return (
    <Button
      variant={`${searchParams.get("filter") === filter ? "default" : "outline"}`}
      asChild
    >
      <Link href={`/restaurants?filter=${filter}`}>{text}</Link>
    </Button>
  );
};
export default FilterButton;
