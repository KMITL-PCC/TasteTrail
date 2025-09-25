export interface RestaurantProps {
  id: number;
  name: string;
  description?: string;
  avgRating: number;
  totalReviews: number;
  categories: string[];
  images: string[];
}

export type RestaurantInfoProps = {
  name: string;
  description: string;
  address: string;
  latitude: string;
  longitude: string;
  status: string;
  minPrice: string;
  maxPrice: string;
  image: string[];
  openingHour: {
    day: string;
    time: string;
  };
  contact: {
    contactType: string;
    contactDetail: string;
  };
  services: string[];
};
