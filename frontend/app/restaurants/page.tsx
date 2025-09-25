import FilterRestaurant from "@/components/restaurants/FilterRestaurant";
import PrimaryRestaurantCard from "@/components/restaurants/PrimaryRestaurantCard.tsx";
import RecommendFilterButton from "@/components/restaurants/RecommendFilterButton";
import SecondaryRestaurantCard from "@/components/restaurants/SecondaryRestaurantCard";
import Link from "next/link";
import restaurantData from "@/mockdata/restaurant.json";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RestaurantProps } from "@/types";

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
  const { restaurant } = await getRestaurants(
    search,
    categories,
    ratings,
    prices,
  );

  console.log(restaurant);

  return (
    <div className="flex flex-col gap-4 p-4 md:flex-row md:p-8">
      {/* Filter */}
      <div>
        <FilterRestaurant />
      </div>

      <div className="flex flex-1 flex-col gap-4">
        {/* Recommended Restaurants */}
        {/* <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex gap-2">
                <RecommendFilterButton filter="popular" />
                <RecommendFilterButton filter="new" />
                ร้านยอดนิยม
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
              <CardTitle>Restaurants</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="grid gap-4">
              {restaurant.map((restaurant: RestaurantProps) => (
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
  );
};
export default RestaurantsPage;
