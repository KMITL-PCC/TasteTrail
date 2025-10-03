"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { RestaurantInfo } from "@/types/restaurant";

import Image from "next/image";
import { Skeleton } from "../ui/skeleton";

export default function RestaurantImagesCarousel({
  restaurantInfo,
}: {
  restaurantInfo: RestaurantInfo;
}) {
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true }),
  );

  if (restaurantInfo.image.length === 0) {
    return (
      <Carousel
        plugins={[plugin.current]}
        opts={{ loop: true }}
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent>
          {[1, 2, 3, 4, 5].map((image) => (
            <CarouselItem key={image} className="pl-2 basis-1/2 lg:basis-1/3">
              <Card className="py-0 border-none rounded-none">
                <CardContent className="relative flex items-center justify-center p-0 aspect-square">
                  <Skeleton className="grid rounded-none size-full place-items-center">
                    No Image
                  </Skeleton>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    );
  }

  return (
    <Carousel
      plugins={[plugin.current]}
      opts={{ loop: true }}
      onMouseEnter={plugin.current.stop}
      onMouseLeave={plugin.current.reset}
    >
      <CarouselContent>
        {restaurantInfo.image.map((image) => (
          <CarouselItem key={image} className="pl-1 basis-1/2 lg:basis-1/3">
            <Card className="py-0 border-none">
              <CardContent className="relative flex items-center justify-center aspect-square">
                <Image
                  src={image}
                  alt={restaurantInfo.name}
                  fill
                  objectFit="cover"
                />
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
