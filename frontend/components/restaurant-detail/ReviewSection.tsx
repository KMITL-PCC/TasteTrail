"use client";

import { Star, Info, X, Camera, Loader2, Link, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useUser } from "@/store/user-store";
import { Separator } from "../ui/separator";

import Image from "next/image";

type Review = {
  images: string[];
  date: string;
  id: string;
  rating: number;
  content: string;
  user: {
    name: string;
    avatar: string | null;
  };
};

type ReviewForm = {
  restaurantId: string;
  rating: number;
  review: string;
  reviewImages: File[];
};

type ReviewData = {
  totalReviews: number;
  averageRating: number;
  ratingBreakdown: { stars: number; count: number; percentage: number }[];
};

const getCsrfToken = async () => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/csrf-token`,
    {
      credentials: "include",
    },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch csrf token");
  }

  return res.json();
};

const getReviews = async (
  restaurantId: string,
  filter?: string,
  sort?: string,
  page?: number,
  limit?: number,
) => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/review/get?restaurantId=${restaurantId}&filter=${filter || ""}&sort=${sort || "newest"}&page=${page || 1}&limit=${limit || 5}`,
    {
      credentials: "include",
    },
  );

  if (!res.ok) {
    throw new Error("Failed to fetch reviews");
  }

  return res.json();
};

const postReview = async (review: ReviewForm, csrfToken: string) => {
  const formData = new FormData();

  formData.append("restaurantId", review.restaurantId);
  formData.append("rating", review.rating.toString());
  formData.append("review", review.review);

  review.reviewImages.forEach((file) => {
    formData.append("reviewImages", file);
  });

  const reviewRes = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/review/create`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "X-CSRF-Token": csrfToken,
      },
      body: formData,
    },
  );

  if (!reviewRes.ok) {
    const errorText = await reviewRes.text();
    throw new Error(`Failed to post review: ${reviewRes.status} ${errorText}`);
  }

  return;
};

const deleteReview = async (restaurantId: string, csrfToken: string) => {
  const reviewRes = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/review/delete?restaurantId=${restaurantId}`,
    {
      method: "DELETE",
      headers: {
        "X-CSRF-Token": csrfToken,
      },
      credentials: "include",
    },
  );

  if (!reviewRes.ok) {
    const errorText = await reviewRes.text();
    throw new Error(
      `Failed to delete review: ${reviewRes.status} ${errorText}`,
    );
  }

  return;
};

const formSchema = z.object({
  rating: z
    .number()
    .min(1, { message: "กรุณาให้คะแนน" })
    .max(5, { message: "คะแนนต้องไม่เกิน 5" }),
  review: z
    .string()
    .min(10, { message: "รีวิวต้องมีอย่างน้อย 10 ตัวอักษร" })
    .max(1000, { message: "รีวิวต้องไม่เกิน 1000 ตัวอักษร" }),
  reviewImages: z
    .array(z.instanceof(File))
    .max(4, { message: "สามารถอัปโหลดได้สูงสุด 4 รูป" })
    .optional(),
});

function StarRating({
  rating,
  size = "sm",
  interactive = false,
  onRatingChange,
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating
              ? "fill-red-500 text-red-500"
              : "fill-gray-200 text-gray-200"
          } ${interactive ? "cursor-pointer transition-transform hover:scale-110" : ""} `}
          onClick={() => interactive && onRatingChange?.(star)}
        />
      ))}
    </div>
  );
}

function RatingBreakdown({ reviewData }: { reviewData: ReviewData }) {
  return (
    <div className="flex items-center gap-8 rating-breakdown-wrapper">
      <div className="text-center">
        <div className="mb-1 text-5xl text-foreground rating-score">
          {reviewData.averageRating}
        </div>
        <div className="text-sm text-muted-foreground">จาก 5</div>
      </div>

      <div className="flex-1 w-full space-y-2">
        {reviewData.ratingBreakdown.map((item) => (
          <div key={item.stars} className="flex items-center gap-2">
            <div className="flex">
              {[...Array(item.stars)].map((_, i) => (
                <Star key={i} className="w-3 h-3 text-gray-400 fill-gray-400" />
              ))}
            </div>
            <div className="flex-1 h-2 bg-gray-200 rounded-full">
              <div
                className="h-2 transition-all duration-300 bg-gray-400 rounded-full"
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RateThisPlace({
  restaurantId,
  csrfToken,
}: {
  restaurantId: string;
  csrfToken: string;
}) {
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: 0,
      review: "",
      reviewImages: [],
    },
  });

  const handleRatingChange = (rating: number) => {
    form.setValue("rating", rating);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages: File[] = [];
    const maxImages = 4;
    const currentImages = selectedImages.length;

    for (
      let i = 0;
      i < Math.min(files.length, maxImages - currentImages);
      i++
    ) {
      const file = files[i];
      if (file && file.type.startsWith("image/")) {
        newImages.push(file);
      }
    }

    if (newImages.length > 0) {
      const updatedImages = [...selectedImages, ...newImages];
      setSelectedImages(updatedImages);
      form.setValue("reviewImages", updatedImages);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = selectedImages.filter((_, i) => i !== index);
    setSelectedImages(updatedImages);
    form.setValue("reviewImages", updatedImages);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      const reviewData: ReviewForm = {
        restaurantId,
        rating: values.rating,
        review: values.review,
        reviewImages: values.reviewImages || [],
      };

      await postReview(reviewData, csrfToken);

      toast.success("ขอบคุณสำหรับการรีวิวร้านนี้!");

      form.reset();
      setSelectedImages([]);
      window.location.reload();
    } catch (error) {
      console.error("Review submission error:", error);
      toast.error("ไม่สามารถส่งรีวิวได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="my-6">
      <CardContent className="p-6 max-[425px]:p-4">
        <h3 className="mb-4 text-center text-lg font-medium max-[425px]:mb-3 max-[425px]:text-base">
          ให้คะแนนร้านนี้
        </h3>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Rating Section */}
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="block text-center">คะแนน</FormLabel>
                  <FormControl>
                    <div className="flex justify-center">
                      <StarRating
                        rating={field.value}
                        size="lg"
                        interactive
                        onRatingChange={handleRatingChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Review Text */}
            <FormField
              control={form.control}
              name="review"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>รีวิวของคุณ</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="แชร์ประสบการณ์การทานอาหารที่ร้านนี้..."
                      className="min-h-[100px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    {field.value?.length || 0}/1000 ตัวอักษร
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <FormField
              control={form.control}
              name="reviewImages"
              render={() => (
                <FormItem>
                  <FormLabel>รูปภาพ (ไม่บังคับ)</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {/* Upload Button */}
                      <div
                        className="p-6 text-center transition-colors border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-gray-400"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Camera className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">
                          คลิกเพื่ออัปโหลดรูปภาพ
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          สูงสุด 4 รูป (JPG, PNG)
                        </p>
                      </div>

                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />

                      {/* Image Preview */}
                      {selectedImages.length > 0 && (
                        <div className="grid grid-cols-2 gap-4">
                          {selectedImages.map((file, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={URL.createObjectURL(file)}
                                alt={`Review image ${index + 1}`}
                                className="object-cover w-full h-24 rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute p-1 text-white transition-opacity bg-red-500 rounded-full opacity-0 -top-2 -right-2 group-hover:opacity-100"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full max-w-xs"
              >
                {isSubmitting ? "กำลังส่ง..." : "ส่งรีวิว"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function FilterSection({
  onFilter,
  selectedFilter,
  onSort,
  selectedSort,
}: {
  onFilter: (filter: string) => void;
  selectedFilter: string;
  onSort: (sort: string) => void;
  selectedSort: string;
}) {
  const filterOptions = [
    { stars: 1, label: "1" },
    { stars: 2, label: "2" },
    { stars: 3, label: "3" },
    { stars: 4, label: "4" },
    { stars: 5, label: "5" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 py-4 filter-section-wrapper">
      <span className="font-medium">ตัวกรอง</span>
      <div className="flex gap-2 filter-buttons-group">
        <Button
          variant={selectedFilter === "all" ? "default" : "outline"}
          size="sm"
          className="h-8 px-3 star-filter-button"
          onClick={() => onFilter("all")}
        >
          ทั้งหมด
        </Button>
        {filterOptions.map((option) => (
          <Button
            key={option.stars}
            variant={
              selectedFilter === option.stars.toString() ? "default" : "outline"
            }
            size="sm"
            className="h-8 px-3 star-filter-button"
            onClick={() => onFilter(option.stars.toString())}
          >
            <div className="flex items-center gap-1">
              {[...Array(option.stars)].map((_, i) => (
                <Star
                  key={i}
                  className={`size-4 ${option.stars.toString() === selectedFilter ? "fill-background text-background" : "fill-gray-400 text-gray-400"}`}
                />
              ))}
            </div>
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2 ml-auto sort-section">
        <span className="text-sm">เรียงตาม</span>
        <Select defaultValue={selectedSort} onValueChange={onSort}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">ใหม่ล่าสุด</SelectItem>
            <SelectItem value="oldest">เก่าสุด</SelectItem>
            <SelectItem value="highest">คะแนนสูงสุด</SelectItem>
            <SelectItem value="lowest">คะแนนต่ำสุด</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="flex items-start gap-3 max-[425px]:gap-2">
      <Avatar className="h-12 w-12 max-[425px]:h-10 max-[425px]:w-10">
        <AvatarImage
          src={review?.user?.avatar || undefined}
          alt={review.user.name}
        />
        <AvatarFallback>{review.user.name[0]}</AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-semibold max-[425px]:text-sm">
            {review.user.name}
          </h4>
        </div>

        <div className="mb-2 flex items-center gap-2 max-[425px]:flex-wrap">
          <StarRating rating={review.rating} size="sm" />
          <span className="text-muted-foreground text-sm max-[425px]:text-xs">
            {review.date}
          </span>
        </div>

        <p className="text-foreground mb-4 leading-relaxed max-[425px]:text-sm">
          {review.content || "ไม่มีข้อความรีวิว"}
        </p>

        {review.images && review.images.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-4">
            {review.images.map((imageUrl, index) => (
              <Image
                key={index}
                src={imageUrl}
                alt={`Review image ${index + 1}`}
                width={100}
                height={100}
                className="object-cover rounded-lg size-full lg:size-40"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MyReview({
  review,
  restaurantId,
  csrfToken,
  reviews,
  setReviews,
  setMyReview,
}: {
  review: Review;
  restaurantId: string;
  csrfToken: string;
  reviews: Review[];
  setReviews: (reviews: Review[]) => void;
  setMyReview: (myReview: Review | null) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteReview = async () => {
    try {
      setIsDeleting(true);
      await deleteReview(restaurantId, csrfToken);
      setReviews(reviews.filter((r) => r.id !== review.id));
      setMyReview(null);
      toast.success("รีวิวของคุณถูกลบเรียบร้อยแล้ว!");
    } catch (error) {
      console.error("Error deleting review:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-start justify-between gap-2">
      <ReviewCard review={review} />
      <Button
        variant="destructive"
        onClick={handleDeleteReview}
        disabled={isDeleting}
      >
        <Trash />
      </Button>
    </div>
  );
}

export function ReviewSection({ restaurantId }: { restaurantId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    limit: 5,
    hasNextPage: false,
    hasPreviousPage: false,
    totalReviews: 0,
  });
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [reviewData, setReviewData] = useState<ReviewData>({
    totalReviews: 0,
    averageRating: 0,
    ratingBreakdown: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState("");
  const { user } = useUser();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setIsLoading(true);
        const { reviews, pagination, reviewData, myReview } = await getReviews(
          restaurantId,
          filter,
          sort,
        );
        console.log(reviewData);
        setReviews(reviews);
        setPagination(pagination);
        setReviewData(reviewData);
        setMyReview(myReview);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [restaurantId, filter, sort]);

  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const { csrfToken } = await getCsrfToken();
        setCsrfToken(csrfToken);
      } catch (error) {
        console.error("Error fetching csrf token:", error);
      }
    };
    fetchCsrfToken();
  }, []);

  return (
    <div className="max-w-4xl gap-4 mx-auto review-section-container">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-4 text-xl section-heading">
          {pagination.totalReviews} รีวิว{" "}
          <span className="text-muted-foreground">
            ({pagination.totalReviews} เรตติ้ง)
          </span>
        </h1>

        <RatingBreakdown reviewData={reviewData} />
      </div>

      <Separator className="my-4" />

      {/* <RankingSection /> */}
      {user ? (
        myReview ? (
          <MyReview
            restaurantId={restaurantId}
            csrfToken={csrfToken}
            review={myReview}
            reviews={reviews}
            setReviews={setReviews}
            setMyReview={setMyReview}
          />
        ) : (
          <RateThisPlace restaurantId={restaurantId} csrfToken={csrfToken} />
        )
      ) : (
        ""
      )}

      <Separator />

      <FilterSection
        onFilter={setFilter}
        selectedFilter={filter}
        onSort={setSort}
        selectedSort={sort}
      />

      {/* Reviews List */}

      <div className="min-h-[100px] space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <Loader2 className="size-8 animate-spin" />
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-2 text-lg text-muted-foreground">
              ยังไม่มีรีวิว
            </div>
            <div className="text-sm text-muted-foreground">
              {filter === "all"
                ? "เป็นคนแรกที่รีวิวร้านนี้"
                : `ไม่มีรีวิวที่ให้คะแนน ${filter} ดาว`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
