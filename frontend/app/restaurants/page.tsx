import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RestaurantProps } from "@/types";

import FilterRestaurant from "@/components/restaurants/FilterRestaurant";
import PrimaryRestaurantCard from "@/components/restaurants/PrimaryRestaurantCard.tsx";
import RecommendFilterButton from "@/components/restaurants/RecommendFilterButton";
import SecondaryRestaurantCard from "@/components/restaurants/SecondaryRestaurantCard";
import Link from "next/link";
import restaurantData from "@/mockdata/restaurants.json";
import BreadcrumbComponent from "@/components/BreadcrumbCompoent";

const getRestaurants = async (
  search: string,
  categories: string,
  ratings: string,
  prices: string,
) => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/restaurant/get?search=${search || ""}&category=${categories || ""}&rating=${ratings || ""}&priceRate=${prices || ""}`,
    );
    if (!res.ok) {
      return { restaurant: [] };
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    return { restaurant: [] };
  }
};

const RestaurantsPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) => {
  const searchParamsData = await searchParams;
  const { categories, ratings, prices, search } = searchParamsData as {
    categories: string;
    ratings: string;
    prices: string;
    search: string;
  };
  // const { restaurant } = await getRestaurants(
  //   search,
  //   categories,
  //   ratings,
  //   prices,
  // );

  // console.log(restaurant);

  return (
    <div className="mx-auto flex max-w-[1300px] flex-col gap-2 p-4 pt-2 md:p-8 md:pt-2">
      {/* Breadcrumb */}
      <BreadcrumbComponent className="hidden md:block" />
      <div className="flex flex-col w-full gap-4 md:flex-row">
        {/* Filter */}
        <div>
          <FilterRestaurant />
        </div>

        <div className="flex flex-col flex-1 gap-4">
          {/* Recommended Restaurants */}
          {/* <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2">
                <RecommendFilterButton filter="popular" />
                <RecommendFilterButton filter="new" />
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="grid grid-cols-3 gap-4">
              <Link href="/restaurants/1">
                <SecondaryRestaurantCard />
              </Link>
              <Link href="/restaurants/2">
                <SecondaryRestaurantCard />
              </Link>
              <Link href="/restaurants/3">
                <SecondaryRestaurantCard className="hidden md:flex" />
              </Link>
              <Link href="/restaurants/4">
                <SecondaryRestaurantCard className="hidden lg:flex" />
              </Link>
              {restaurantData.slice(0, 3).map((restaurant) => (
                <Link
                  href={`/restaurants/${restaurant.id}`}
                  key={restaurant.id}
                >
                  <SecondaryRestaurantCard restaurant={restaurant} />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div> */}

          {/* Map */}
          {/* <div>
          <Card>
            <CardHeader>
              <CardTitle>Map</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent>
              <p>Card Content</p>
            </CardContent>
          </Card>
        </div> */}

          {/* Restaurants List*/}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">
                  Restaurants
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="grid gap-4">
                {restaurantData.map((restaurant: RestaurantProps) => (
                  <Link
                    href={`/restaurants/${restaurant.id}`}
                    key={restaurant.id}
                  >
                    <PrimaryRestaurantCard restaurant={restaurant} />
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
export default RestaurantsPage;
