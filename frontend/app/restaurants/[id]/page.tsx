import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BadgeCheck } from "lucide-react";

import Image from "next/image";
import RestaurantImagesCarousel from "@/components/restaurant-detail/RestaurantImagesCarousel";
import { RestaurantInfoProps } from "@/types";
import GoBackButton from "@/components/GoBackButton";

const restaurantInfo: RestaurantInfoProps = {
  name: "Dib lamun cafe",
  description: "คาเฟ่อร่อยโดนใจ กลางคืนมีเครื่องดื่ม บรรยากาศดี",
  address: "เลขที่ 13 ตำบล ชุมโค อำเภอปะทิว ชุมพร 86160",
  latitude: "10.7253421",
  longitude: "99.3797746",
  status: "Closed",
  minPrice: "30",
  maxPrice: "500",
  image: [
    "https://lh3.googleusercontent.com/p/AF1QipPu7yh6jBKNfQ9LVXYXb3X02OaHsFy2JQN2Yj6F=w289-h312-n-k-no",
    "https://lh3.googleusercontent.com/gps-cs-s/AC9h4npE-KnWUc0FD-2QPTCnEoZueH1W3idMtsRNGGkTxpwoAP7FEqA_kxudVoKUB-tS36s73kZqTQ-usVSG9gv9Y7qQDxVyxHvPKr5pJSgVLPPtu7WFQ0-lEXaQrGrwodTAKhwhIIE=s1360-w1360-h1020",
    "https://lh3.googleusercontent.com/gps-cs-s/AC9h4npSDuEDS1Bl652bgOJzvJdRxs0odYI14yj4CN-FjqQszFqE8gsP1JI5BzzNhrUMdlEGGC7OeWDoi84PegblecaT8yGKi--LrM87k9TSBXrY_XlAbCEemyWPcFWVK7DXhDtAo168Ag=s1360-w1360-h1020",
    "https://lh3.googleusercontent.com/gps-cs-s/AC9h4nqZy7KRc5AIxfrQx3-Dikws7aDBGfiQB_1B8dbBNzwi5C-UiJyGALE8t349DUUzEs4RTnjC-eHbSr6jLoSabb6Pt5yOjFtNGEpmM6EhpLBORWO-eAlPjj3C6XE2wCemaY8zkKFN=s1360-w1360-h1020",
  ],
  openingHour: {
    day: "อาทิตย์ - เสาร์",
    time: "09:00 - 21:00",
  },
  contact: {
    contactType: "phone",
    contactDetail: "012-345-6789",
  },
  services: ["delivery"],
};

const getRestaurantById = async (id: string) => {
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

const RestaurantDetailPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;

  // const { restaurantInfo } = await getRestaurantById(id);
  // const restaurant = restaurantInfo;

  // console.log(restaurant);

  return (
    <div className="relative flex flex-col gap-4 pt-8">
      {/* <div className="grid grid-cols-2 gap-2 px-4">
        <div className="relative border border-border h-80 rounded-xl md:h-96">
          <Image
            src={restaurant.image[0]}
            alt={restaurant.name}
            fill
            objectFit="cover"
            className="rounded-xl"
          />
        </div>
        <div className="relative border border-border h-80 rounded-xl md:h-96">
          <Image
            src={restaurant.image[1]}
            alt={restaurant.name}
            fill
            objectFit="cover"
            className="rounded-xl"
          />
        </div>
      </div> */}

      <GoBackButton className="absolute left-0 z-50 top-1" />

      <RestaurantImagesCarousel restaurantInfo={restaurantInfo} />

      <div className="grid grid-cols-2 grid-rows-2 gap-2 px-4 md:px-8">
        <Card className="col-span-2 md:col-span-1">
          <CardHeader>
            <CardTitle>{restaurantInfo.name}</CardTitle>
          </CardHeader>
          <CardContent>{restaurantInfo.description}</CardContent>
          <CardFooter>{restaurantInfo.status}</CardFooter>
        </Card>

        <Card className="col-span-2 md:col-span-1 md:row-span-2">
          <CardContent className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <h1>เวลาเปิด</h1>
              <p>{restaurantInfo.openingHour.day}</p>
              <p>{restaurantInfo.openingHour.time}</p>
            </div>
            <div>
              <h1>ช่วงราคา</h1>
              <p>
                {restaurantInfo.minPrice} - {restaurantInfo.maxPrice} บาท
              </p>
            </div>
            {restaurantInfo.services.map((service: string) => (
              <div className="flex items-center gap-2" key={service}>
                <BadgeCheck />
                {service}
              </div>
            ))}
          </CardContent>
        </Card>

        {restaurantInfo.address && (
          <Card className="flex items-center justify-center col-span-2 md:col-span-1">
            <CardContent className="flex flex-row items-center gap-4 lg:gap-10 xl:gap-20">
              <a
                href={`https://www.google.com/maps?q=${restaurantInfo.latitude},${restaurantInfo.longitude}`}
                target="_blank"
              >
                <div className="relative mx-auto h-30 w-30 rounded-xl xl:h-40 xl:w-40">
                  <Image
                    src="/map-pic.jpg"
                    alt="map"
                    fill
                    className="object-cover rounded-xl"
                  />
                </div>
              </a>
              <div className="flex flex-col w-full gap-2">
                <p>{restaurantInfo.address}</p>
                <Separator />
                <p>{restaurantInfo.contact.contactDetail}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
export default RestaurantDetailPage;
