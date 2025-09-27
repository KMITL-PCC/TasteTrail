"use client";

import * as React from "react";
import Autoplay from "embla-carousel-autoplay";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { RestaurantInfoProps } from "@/types";

import Image from "next/image";

export default function RestaurantImagesCarousel({
  restaurantInfo,
}: {
  restaurantInfo: RestaurantInfoProps;
}) {
  const plugin = React.useRef(
    Autoplay({ delay: 2000, stopOnInteraction: true }),
  );

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
