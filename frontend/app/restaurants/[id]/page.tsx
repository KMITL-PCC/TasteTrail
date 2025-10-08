"use client";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  PhoneIcon,
  Locate,
  Share,
  CircleAlert,
  SquareCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReviewSection } from "@/components/restaurant-detail/ReviewSection";
import { useEffect, useState, use } from "react";
import { RestaurantInfo } from "@/types/restaurant";

import Image from "next/image";
import RestaurantImagesCarousel from "@/components/restaurant-detail/RestaurantImagesCarousel";
import Link from "next/link";
import RestaurantStatus from "../../../components/restaurant-detail/RestaurantStatus";
import BreadcrumbComponent from "@/components/BreadcrumbComponent";
import EditRestaurantButton from "@/components/restaurant-detail/EditRestaurantButton";
import { getRestaurantById } from "@/lib/api/restaurant";

const RestaurantDetailPage = ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const [restaurantInfo, setRestaurantInfo] = useState<RestaurantInfo | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const { id } = use(params);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const data = await getRestaurantById(id);
        setRestaurantInfo(data.restaurantInfo);
        console.log(data.restaurantInfo);
      } catch (error) {
        console.error("Error fetching restaurant:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!restaurantInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Restaurant not found
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex max-w-[1150px] flex-col gap-4 pt-2 pb-4 md:pb-8 xl:px-16">
      <div className="flex flex-col gap-2">
        {/* Breadcrumb */}

        <BreadcrumbComponent restaurantName={restaurantInfo.name} />

        {/* Restaurant Images Carousel */}
        <RestaurantImagesCarousel restaurantInfo={restaurantInfo} />
      </div>

      {/* Restaurant Info */}
      {/* Desktop */}
      <div className="hidden gap-4 px-4 lg:flex">
        <div className="flex flex-col flex-1 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-normal">
                {restaurantInfo.name}
              </CardTitle>
              {/* Edit Button */}
              <CardAction>
                <EditRestaurantButton />
              </CardAction>
              <CardDescription className="text-base">
                {restaurantInfo.description}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <RestaurantStatus status={restaurantInfo.status} />
            </CardFooter>
          </Card>

          {restaurantInfo.address && (
            <Card className="flex items-center justify-center">
              <CardContent className="flex flex-row items-center justify-between w-full gap-14">
                <Link
                  href={`https://www.google.com/maps?q=${restaurantInfo.latitude},${restaurantInfo.longitude}`}
                  target="_blank"
                >
                  <div className="relative size-45">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="oklch(0.5523 0.1927 32.7272)"
                      width="45"
                      height="45"
                      className="absolute z-10 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" fill="white" />
                    </svg>
                    <Image
                      src="/google-map.webp"
                      alt="map"
                      fill
                      className="object-cover rounded-xl"
                    />
                  </div>
                </Link>
                <div className="flex flex-col w-full gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <p>{restaurantInfo.address}</p>
                    <Button variant="secondary" asChild>
                      <Link
                        href={`https://www.google.com/maps?q=${restaurantInfo.latitude},${restaurantInfo.longitude}`}
                        target="_blank"
                      >
                        ดูเส้นทาง
                      </Link>
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between gap-2">
                    <p>เบอร์โทร: {restaurantInfo.contact.contactDetail}</p>
                    <Link href={`tel:${restaurantInfo.contact.contactDetail}`}>
                      <PhoneIcon className="size-5" />
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <ReviewSection restaurantId={id} />
            </CardContent>
          </Card>
        </div>

        <div className="min-w-[300px]">
          <Card>
            <CardContent className="flex flex-col gap-2">
              <div className="flex flex-col gap-2">
                <h1 className="w-full text-base font-medium text-left">
                  เวลาเปิดร้าน
                </h1>
                {restaurantInfo.openingHour &&
                  (Array.isArray(restaurantInfo.openingHour) ? (
                    restaurantInfo.openingHour.map(
                      (hour: { day: string; time: string }, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-2 text-sm text-muted-foreground"
                        >
                          <p>{hour.day}</p>
                          <p>{hour.time}</p>
                        </div>
                      ),
                    )
                  ) : (
                    <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                      <p>{restaurantInfo.openingHour.day}</p>
                      <p>{restaurantInfo.openingHour.time}</p>
                    </div>
                  ))}
              </div>
              <div className="flex flex-col items-start gap-2">
                <h1 className="w-full text-base font-medium text-left">
                  ช่วงราคา
                </h1>
                <p className="text-sm text-muted-foreground">
                  {restaurantInfo.minPrice} - {restaurantInfo.maxPrice} ฿
                </p>
              </div>
              <ul>
                {restaurantInfo.services.map((service: string) => (
                  <li className="flex items-center gap-2" key={service}>
                    <SquareCheck className="text-white size-6 fill-green-500" />
                    <span>{service}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex flex-col flex-1 gap-6 px-4 lg:hidden">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-xl">{restaurantInfo.name}</h1>
            <EditRestaurantButton />
          </div>
          <p className="text-base text-muted-foreground">
            {restaurantInfo.description}
          </p>
          <div className="flex items-center justify-between gap-2">
            <RestaurantStatus status={restaurantInfo.status} />
            {/* More Info Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 text-muted-foreground"
                >
                  ข้อมูลเพิ่มเติม
                  <span>
                    <CircleAlert />
                  </span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader className="gap-4">
                  <DialogTitle>ข้อมูลเพิ่มเติม</DialogTitle>
                  <Separator />
                  <div className="flex flex-col gap-2">
                    <h1 className="w-full text-base font-medium text-left">
                      เวลาเปิดร้าน
                    </h1>
                    {restaurantInfo.openingHour &&
                      (Array.isArray(restaurantInfo.openingHour) ? (
                        restaurantInfo.openingHour.map(
                          (
                            hour: { day: string; time: string },
                            index: number,
                          ) => (
                            <div
                              key={index}
                              className="flex items-center justify-between gap-2 text-sm text-muted-foreground"
                            >
                              <p>{hour.day}</p>
                              <p>{hour.time}</p>
                            </div>
                          ),
                        )
                      ) : (
                        <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
                          <p>{restaurantInfo.openingHour.day}</p>
                          <p>{restaurantInfo.openingHour.time}</p>
                        </div>
                      ))}
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    <h1 className="w-full text-base font-medium text-left">
                      ช่วงราคา
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      {restaurantInfo.minPrice} - {restaurantInfo.maxPrice} ฿
                    </p>
                  </div>
                  <ul>
                    {restaurantInfo.services.map((service: string) => (
                      <li className="flex items-center gap-2" key={service}>
                        <SquareCheck className="text-white size-6 fill-green-500" />
                        <span>{service}</span>
                      </li>
                    ))}
                  </ul>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <Separator />

        {restaurantInfo.address && (
          <div className="flex flex-col gap-4">
            <Link
              href={`https://www.google.com/maps?q=${restaurantInfo.latitude},${restaurantInfo.longitude}`}
              target="_blank"
            >
              <div className="relative w-full h-25">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="oklch(0.5523 0.1927 32.7272)"
                  width="45"
                  height="45"
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" fill="white" />
                </svg>
                <Image
                  src="/google-map.webp"
                  alt="map"
                  fill
                  className="object-cover rounded-xl"
                />
              </div>
            </Link>

            <ul className="flex items-center justify-between w-full gap-2 px-10 text-sm md:px-18">
              <li className="flex flex-col items-center gap-2 rounded-full">
                <Link
                  href={`https://www.google.com/maps?q=${restaurantInfo.latitude},${restaurantInfo.longitude}`}
                  target="_blank"
                  className="bg-accent rounded-full p-1.5"
                >
                  <Locate className="size-5" />
                </Link>
                <p>ดูเส้นทาง</p>
              </li>
              <li className="flex flex-col items-center gap-2">
                <Link
                  href={`tel:${restaurantInfo.contact.contactDetail}`}
                  className="bg-accent rounded-full p-1.5"
                >
                  <PhoneIcon className="size-5" />
                </Link>
                <p>ติดต่อ</p>
              </li>
              <li className="flex flex-col items-center gap-2">
                <span className="bg-accent rounded-full p-1.5">
                  <Share className="size-5" />
                </span>
                <p>แชร์</p>
              </li>
            </ul>

            <Separator />

            <div className="flex flex-col gap-4">
              <Link
                href={`https://www.google.com/maps?q=${restaurantInfo.latitude},${restaurantInfo.longitude}`}
                target="_blank"
              >
                <p>{restaurantInfo.address}</p>
              </Link>
              <Separator />
              <Link href={`tel:${restaurantInfo.contact.contactDetail}`}>
                <p>เบอร์โทร: {restaurantInfo.contact.contactDetail}</p>
              </Link>
            </div>
          </div>
        )}

        <Separator />

        <ReviewSection restaurantId={id} />
      </div>
    </div>
  );
};
export default RestaurantDetailPage;
