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

import Image from "next/image";
import RestaurantImagesCarousel from "@/components/restaurant-detail/RestaurantImagesCarousel";
import Link from "next/link";
import RestaurantStatus from "../../../components/restaurant-detail/RestaurantStatus";
import BreadcrumbComponent from "@/components/BreadcrumbComponent";
import EditRestaurantButton from "@/components/restaurant-detail/EditRestaurantButton";

export const getRestaurantById = async (id: string) => {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/restaurant/get/${id}`,
      {
        credentials: "include",
      },
    );
    if (!res.ok) {
      throw new Error("Failed to fetch restaurant" + res.status);
    }
    return res.json();
  } catch (error) {
    throw new Error("Failed to fetch restaurant" + error);
  }
};

export const RestaurantDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  const { restaurantInfo } = await getRestaurantById(id);

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
        <div className="flex flex-1 flex-col gap-4">
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
              <CardContent className="flex w-full flex-row items-center justify-between gap-14">
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
                      className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                    >
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" fill="white" />
                    </svg>
                    <Image
                      src="/google-map.webp"
                      alt="map"
                      fill
                      className="rounded-xl object-cover"
                    />
                  </div>
                </Link>
                <div className="flex w-full flex-col gap-2">
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
                <h1 className="w-full text-left text-base font-medium">
                  เวลาเปิดร้าน
                </h1>
                <div className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
                  <p>{restaurantInfo.openingHour.day}</p>
                  <p>{restaurantInfo.openingHour.time}</p>
                </div>
              </div>
              <div className="flex flex-col items-start gap-2">
                <h1 className="w-full text-left text-base font-medium">
                  ช่วงราคา
                </h1>
                <p className="text-muted-foreground text-sm">
                  {restaurantInfo.minPrice} - {restaurantInfo.maxPrice} ฿
                </p>
              </div>
              <ul>
                {restaurantInfo.services.map((service: string) => (
                  <li className="flex items-center gap-2" key={service}>
                    <SquareCheck className="size-6 fill-green-500 text-white" />
                    <span>{service}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile */}
      <div className="flex flex-1 flex-col gap-6 px-4 lg:hidden">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h1 className="text-xl">{restaurantInfo.name}</h1>
            <EditRestaurantButton />
          </div>
          <p className="text-muted-foreground text-base">
            {restaurantInfo.description}
          </p>
          <div className="flex items-center justify-between gap-2">
            <RestaurantStatus status={restaurantInfo.status} />
            {/* More Info Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-muted-foreground flex items-center gap-2"
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
                    <h1 className="w-full text-left text-base font-medium">
                      เวลาเปิดร้าน
                    </h1>
                    <div className="text-muted-foreground flex items-center justify-between gap-2 text-sm">
                      <p>{restaurantInfo.openingHour.day}</p>
                      <p>{restaurantInfo.openingHour.time}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2">
                    <h1 className="w-full text-left text-base font-medium">
                      ช่วงราคา
                    </h1>
                    <p className="text-muted-foreground text-sm">
                      {restaurantInfo.minPrice} - {restaurantInfo.maxPrice} ฿
                    </p>
                  </div>
                  <ul>
                    {restaurantInfo.services.map((service: string) => (
                      <li className="flex items-center gap-2" key={service}>
                        <SquareCheck className="size-6 fill-green-500 text-white" />
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
              <div className="relative h-25 w-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="oklch(0.5523 0.1927 32.7272)"
                  width="45"
                  height="45"
                  className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" fill="white" />
                </svg>
                <Image
                  src="/google-map.webp"
                  alt="map"
                  fill
                  className="rounded-xl object-cover"
                />
              </div>
            </Link>

            <ul className="flex w-full items-center justify-between gap-2 px-10 text-sm md:px-18">
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
