export interface Restaurant {
  id: number;
  name: string;
  description?: string;
  avgRating: number;
  totalReviews: number;
  categories: string[];
  images: string[];
  status: string;
}
export interface PopularRestaurant {
  avg_rating: string;
  total_reviews: number;
  image_url: string;
  name: string;
  popularity_score: string;
  restaurant_id: string;
}

export type RestaurantInfo = {
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
