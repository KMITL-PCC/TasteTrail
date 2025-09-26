export declare namespace Restaurant {
  interface information {
    name: string;
    description: string;
    address: string;
    latitude: number;
    longitude: number;
    services?: number[];
    contactDetail?: string;
  }

  interface price {
    minPrice: number;
    maxPrice: number;
  }

  interface time {
    weekday: number;
    openTime: string;
    closeTime: string;
  }

  interface service {
    service: {
      service: "string";
    };
  }

  interface query {
    limit: number;
    page: number;
    category: string;
    sort: string;
    sortBy: string;
    search: string;
    rating: number;
    priceRate: string;
  }
}
