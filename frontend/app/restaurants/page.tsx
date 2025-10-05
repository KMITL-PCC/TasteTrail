import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PopularRestaurant, Restaurant } from "@/types/restaurant";
import { Button } from "@/components/ui/button";

import FilterRestaurant from "@/components/restaurants/FilterRestaurant";
import PrimaryRestaurantCard from "@/components/restaurants/PrimaryRestaurantCard.tsx";
import RecommendFilterButton from "@/components/restaurants/RecommendFilterButton";
import SecondaryRestaurantCard from "@/components/restaurants/SecondaryRestaurantCard";
import Link from "next/link";
import BreadcrumbComponent from "@/components/BreadcrumbComponent";
import RestaurantPagination from "@/components/restaurants/RestaurantPagination";

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
      return { restaurant: [] };
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return { restaurant: [] };
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

const RestaurantsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const searchParamsData = await searchParams;
  const { categories, ratings, prices, search, page, limit } =
    searchParamsData as {
      categories: string;
      ratings: string;
      prices: string;
      search: string;
      page: string;
      limit: string;
    };
  const { restaurant, pagination } = await getRestaurants(
    search,
    categories,
    ratings,
    prices,
    page,
    limit,
  );

  const { popularRestaurants } = await getPopularRestaurants();

  return (
    <div className="mx-auto flex w-full max-w-[1150px] flex-col gap-2 p-4 pt-0 md:flex-row md:p-8 md:pt-2 xl:px-16">
      <div className="sticky top-19 z-10 flex max-h-[700px] flex-col gap-2 md:top-22">
        {/* Breadcrumb */}
        <BreadcrumbComponent className="hidden md:block" />
        {/* Filter */}
        <FilterRestaurant />
      </div>

      <div className="flex flex-col flex-1 gap-4 md:mt-7">
        <div className="flex flex-col flex-1 gap-4">
          {/* Recommended Restaurants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2">
                <RecommendFilterButton filter="popular" />
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {popularRestaurants.map((restaurant: PopularRestaurant) => (
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
                  <Button className="cursor-default hover:bg-primary">
                    Restaurants
                  </Button>
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="grid gap-4">
                {restaurant.map((restaurant: Restaurant) => (
                  <Link
                    href={`/restaurants/${restaurant.id}`}
                    key={restaurant.id}
                  >
                    <PrimaryRestaurantCard restaurant={restaurant} />
                  </Link>
                ))}
              </CardContent>
              <CardFooter>
                <RestaurantPagination pagination={pagination} />
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RestaurantsPage;
