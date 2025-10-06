"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { PaginationData } from "@/types/restaurant";

const RestaurantPagination = ({
  pagination,
  onPageChange,
}: {
  pagination: PaginationData;
  onPageChange: (page: number) => void;
}) => {
  const { currentPage, totalPages, hasNextPage, hasPreviousPage } = pagination;

  // Don't show pagination if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, currentPage + 2);

      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push("ellipsis-start");
        }
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push("ellipsis-end");
        }
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => hasPreviousPage && onPageChange(currentPage - 1)}
            className={
              !hasPreviousPage
                ? "text-muted-foreground pointer-events-none opacity-50"
                : "hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
            }
          />
        </PaginationItem>

        {getVisiblePages().map((page, index) => (
          <PaginationItem key={index}>
            {page === "ellipsis-start" || page === "ellipsis-end" ? (
              <PaginationEllipsis className="text-muted-foreground" />
            ) : (
              <PaginationLink
                onClick={() => onPageChange(page as number)}
                isActive={currentPage === page}
                className={`cursor-pointer transition-colors ${
                  currentPage === page
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground cursor-not-allowed"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            onClick={() => hasNextPage && onPageChange(currentPage + 1)}
            className={
              !hasNextPage
                ? "text-muted-foreground pointer-events-none opacity-50"
                : "hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
export default RestaurantPagination;
