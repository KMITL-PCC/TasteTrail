"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  PopularRestaurant,
  Restaurant,
  PaginationData,
} from "@/types/restaurant";
import { Button } from "@/components/ui/button";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import FilterRestaurant from "@/components/restaurants/FilterRestaurant";
import PrimaryRestaurantCard from "@/components/restaurants/PrimaryRestaurantCard.tsx";
import PrimaryRestaurantCardSkeleton from "@/components/restaurants/PrimaryRestaurantCardSkeleton";
import RecommendFilterButton from "@/components/restaurants/RecommendFilterButton";
import SecondaryRestaurantCard from "@/components/restaurants/SecondaryRestaurantCard";
import SecondaryRestaurantCardSkeleton from "@/components/restaurants/SecondaryRestaurantCardSkeleton";
import BreadcrumbComponent from "@/components/BreadcrumbComponent";
import RestaurantPagination from "@/components/restaurants/RestaurantPagination";
import Link from "next/link";

const getRestaurants = async (
  search: string,
  categories: string,
  ratings: string,
  prices: string,
  page: string,
  limit: string,
) => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/restaurant/get?search=${search || ""}&category=${categories || ""}&rating=${ratings || ""}&priceRate=${prices || ""}&page=${page || "1"}&limit=${limit || "10"}`,
    );

    if (!res.ok) {
      console.error("Failed to fetch restaurants" + res.status);
      return { restaurant: [], pagination: null };
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return { restaurant: [], pagination: null };
  }
};

const getPopularRestaurants = async () => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/restaurant/popular`,
    );

    if (!res.ok) {
      console.error("Failed to fetch popular restaurants" + res.status);
      return { restaurant: [] };
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching popular restaurants:", error);
    return { restaurant: [] };
  }
};

const RestaurantsPageContent = () => {
  const searchParams = useSearchParams();

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [popularRestaurants, setPopularRestaurants] = useState<
    PopularRestaurant[]
  >([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [popularLoading, setPopularLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Read filters from URL parameters
  const filters = {
    search: searchParams.get("search") || "",
    categories: searchParams.get("categories") || "",
    ratings: searchParams.get("ratings") || "",
    prices: searchParams.get("prices") || "",
    limit: "10",
  };

  const fetchRestaurants = async (page = currentPage) => {
    setLoading(true);
    try {
      const { restaurant, pagination: paginationData } = await getRestaurants(
        filters.search,
        filters.categories,
        filters.ratings,
        filters.prices,
        page.toString(),
        filters.limit,
      );
      setRestaurants(restaurant);
      setPagination(paginationData);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPopularRestaurants = async () => {
    setPopularLoading(true);
    try {
      const { popularRestaurants: popular } = await getPopularRestaurants();
      setPopularRestaurants(popular);
    } catch (error) {
      console.error("Error fetching popular restaurants:", error);
    } finally {
      setPopularLoading(false);
    }
  };

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
    fetchRestaurants(1);
    fetchPopularRestaurants();
  }, [searchParams]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchRestaurants(page);
  };

  return (
    <div className="mx-auto flex w-full max-w-[1150px] flex-col gap-2 p-4 pt-0 md:flex-row md:p-8 md:pt-2 xl:px-16">
      <div className="sticky top-19 z-10 flex max-h-[700px] flex-col gap-2 md:top-22">
        {/* Breadcrumb */}
        <BreadcrumbComponent className="hidden md:block" />
        {/* Filter */}
        <FilterRestaurant />
      </div>

      <div className="flex flex-1 flex-col gap-4 md:mt-7">
        <div className="flex flex-1 flex-col gap-4">
          {/* Recommended Restaurants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2">
                <RecommendFilterButton filter="popular" />
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {popularLoading
                ? // Show skeleton loading for popular restaurants
                  Array.from({ length: 3 }).map((_, index) => (
                    <SecondaryRestaurantCardSkeleton key={index} />
                  ))
                : popularRestaurants.map((restaurant: PopularRestaurant) => (
                    <Link
                      href={`/restaurants/${restaurant.restaurant_id}`}
                      key={restaurant.restaurant_id}
                    >
                      <SecondaryRestaurantCard popularRestaurant={restaurant} />
                    </Link>
                  ))}
            </CardContent>
          </Card>

          {/* Restaurants List*/}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  <Button className="hover:bg-primary cursor-default">
                    Restaurants
                  </Button>
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="grid gap-4">
                {loading
                  ? // Show skeleton loading for restaurants
                    Array.from({ length: 5 }).map((_, index) => (
                      <PrimaryRestaurantCardSkeleton key={index} />
                    ))
                  : restaurants.map((restaurant: Restaurant) => (
                      <Link
                        href={`/restaurants/${restaurant.id}`}
                        key={restaurant.id}
                      >
                        <PrimaryRestaurantCard restaurant={restaurant} />
                      </Link>
                    ))}
              </CardContent>
              {pagination && (
                <CardFooter>
                  <RestaurantPagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                  />
                </CardFooter>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const RestaurantsPage = () => {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full max-w-[1150px] flex-col gap-2 p-4 pt-0 md:flex-row md:p-8 md:pt-2 xl:px-16">
          <div className="flex flex-1 flex-col gap-4 md:mt-7">
            <Card>
              <CardContent className="grid gap-4 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <PrimaryRestaurantCardSkeleton key={index} />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <RestaurantsPageContent />
    </Suspense>
  );
};

export default RestaurantsPage;
