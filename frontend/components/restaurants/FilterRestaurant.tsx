"use client";

import { Label } from "../ui/label";
import { Card, CardContent } from "../ui/card";
import { Checkbox } from "../ui/checkbox";
import { Separator } from "../ui/separator";
import { ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetTrigger, SheetContent } from "../ui/sheet";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type FilterProps = {
  categoriesData: { id: string; name: string }[];
  ratingsData: { id: string; name: string }[];
  pricesData: { id: string; name: string }[];
};

const filters: FilterProps = {
  categoriesData: [
    { id: "ร้านอาหารตามสั่ง", name: "ร้านอาหารตามสั่ง" },
    { id: "ร้านก๋วยเตี๋ยว", name: "ร้านก๋วยเตี๋ยว" },
    { id: "คาเฟ่", name: "คาเฟ่" },
    { id: "ร้านเครื่องดื่ม", name: "ร้านเครื่องดื่ม" },
    { id: "ร้านอาหารอีสาน", name: "ร้านอาหารอีสาน" },
    { id: "ร้านของหวาน", name: "ร้านของหวาน" },
    { id: "ร้านของกินเล่น", name: "ร้านของกินเล่น" },
    { id: "อาหารฮาลาล", name: "อาหารฮาลาล" },
  ],

  ratingsData: [
    { id: "2", name: "2.0+" },
    { id: "4", name: "4.0+" },
  ],

  pricesData: [
    { id: "40", name: "ต่ำกว่า40" },
    { id: "40-100", name: "40-100" },
    { id: "100", name: "100+" },
  ],
};

const FilterRestaurant = () => {
  const { categoriesData, ratingsData, pricesData } = filters;

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialCategories = searchParams.get("category")?.split(",") || [];
  const initialRatings = searchParams.get("rating") || "";
  const initialPrices = searchParams.get("price") || "";

  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(initialCategories);

  const [selectedRatings, setSelectedRatings] =
    useState<string>(initialRatings);

  const [selectedPrices, setSelectedPrices] = useState<string>(initialPrices);

  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleCategoryChange = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const handleRatingChange = (rating: string) => {
    setSelectedRatings((prev) => (prev === rating ? "" : rating));
  };

  const handlePriceChange = (price: string) => {
    setSelectedPrices((prev) => (prev === price ? "" : price));
  };

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (selectedCategories.length > 0) {
      params.set("categories", selectedCategories.join());
    } else {
      params.delete("categories");
    }
    if (selectedRatings.length > 0) {
      params.set("ratings", selectedRatings.toString());
    } else {
      params.delete("ratings");
    }
    if (selectedPrices.length > 0) {
      params.set("prices", selectedPrices.toString());
    } else {
      params.delete("prices");
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [
    selectedCategories,
    selectedRatings,
    selectedPrices,
    router,
    pathname,
    searchParams,
  ]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSheetOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <Card className="hidden w-50 md:flex lg:w-70">
        <CardContent className="flex flex-col gap-4 px-0">
          {/* Category */}
          <div className="flex flex-col gap-3 px-3">
            <h1 className="text-md font-semibold">Category</h1>

            {categoriesData.map((category) => (
              <div className="flex items-center gap-2" key={category.id}>
                <Checkbox
                  id={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => handleCategoryChange(category.id)}
                />
                <Label htmlFor={category.id}>{category.name}</Label>
              </div>
            ))}
          </div>

          <Separator />

          {/* Rating */}
          <div className="flex flex-col gap-3 px-3">
            <h1 className="text-md font-semibold">Rating</h1>

            {ratingsData.map((rating) => (
              <div className="flex items-center gap-2" key={rating.id}>
                <Checkbox
                  id={rating.id}
                  checked={selectedRatings === rating.id}
                  onCheckedChange={() => handleRatingChange(rating.id)}
                />
                <Label htmlFor={rating.id}>{rating.name}</Label>
              </div>
            ))}
          </div>

          <Separator />

          {/* Price */}
          <div className="flex flex-col gap-3 px-3">
            <h1 className="text-md font-semibold">Price</h1>
            {pricesData.map((price) => (
              <div className="flex items-center gap-2" key={price.id}>
                <Checkbox
                  id={price.id}
                  checked={selectedPrices === price.id}
                  onCheckedChange={() => handlePriceChange(price.id)}
                />
                <Label htmlFor={price.id}>{price.name}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mobile */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="md:hidden">
            ร้านอาหาร <ChevronDown />
          </Button>
        </SheetTrigger>
        <SheetContent side="top" className="py-6">
          {/* Category */}
          <div className="flex flex-col gap-3 px-3">
            <h1 className="text-md font-semibold">Category</h1>
            {categoriesData.map((category) => (
              <div className="flex items-center gap-2" key={category.id}>
                <Checkbox
                  id={`mobile-${category.id}`}
                  checked={selectedCategories.includes(category.id)}
                  onCheckedChange={() => handleCategoryChange(category.id)}
                />
                <Label htmlFor={`mobile-${category.id}`}>{category.name}</Label>
              </div>
            ))}
          </div>

          <Separator />

          {/* Rating */}
          <div className="flex flex-col gap-3 px-3">
            <h1 className="text-md font-semibold">Rating</h1>
            {ratingsData.map((rating) => (
              <div className="flex items-center gap-2" key={rating.id}>
                <Checkbox
                  id={`mobile-${rating.id}`}
                  checked={selectedRatings === rating.id}
                  onCheckedChange={() => handleRatingChange(rating.id)}
                />
                <Label htmlFor={`mobile-${rating.id}`}>{rating.name}</Label>
              </div>
            ))}
          </div>

          <Separator />

          {/* Price */}
          <div className="flex flex-col gap-3 px-3">
            <h1 className="text-md font-semibold">Price</h1>
            {pricesData.map((price) => (
              <div className="flex items-center gap-2" key={price.id}>
                <Checkbox
                  id={`mobile-${price.id}`}
                  checked={selectedPrices === price.id}
                  onCheckedChange={() => handlePriceChange(price.id)}
                />
                <Label htmlFor={`mobile-${price.id}`}>{price.name}</Label>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
export default FilterRestaurant;
