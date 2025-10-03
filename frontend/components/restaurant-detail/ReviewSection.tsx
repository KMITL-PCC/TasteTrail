"use client";

import {
  Star,
  ChevronRight,
  ThumbsUp,
  MessageCircle,
  Share,
  MoreHorizontal,
  Eye,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const reviewData = {
  totalReviews: 1,
  totalRatings: 1,
  averageRating: 0,
  maxRating: 5,
  ratingBreakdown: [
    { stars: 5, count: 0, percentage: 0 },
    { stars: 4, count: 0, percentage: 0 },
    { stars: 3, count: 0, percentage: 0 },
    { stars: 2, count: 0, percentage: 0 },
    { stars: 1, count: 0, percentage: 0 },
  ],
  ranking: {
    position: 3,
    total: 84,
    category: "ร้านสเต็ก ในเขตบางบอน",
  },
};

const reviews = [
  {
    id: 1,
    user: {
      name: "Suphaporn",
      avatar: "/thai-woman-avatar.jpg",
      followers: 0,
      reviews: 9,
      photos: 5,
      isVerified: true,
    },
    rating: 5,
    date: "เมื่อ เดือนที่แล้ว",
    views: 31,
    menuItem: "ไข่ขิน (Scrambled eggs)",
    content:
      "อยากจะบอกว่ามันดีมากเลย ราคาสบายกระเป๋า บรรยากาศดีครบจบในร้านเดียวเลย",
    likes: 0,
    comments: 0,
  },
  {
    id: 2,
    user: {
      name: "Bow",
      avatar: "/thai-woman-bow-avatar.jpg",
      followers: 0,
      reviews: 5,
      photos: 4,
      isVerified: true,
    },
    rating: 0,
    date: "",
    views: 0,
    menuItem: "",
    content: "เนื้อหาของรีวิวถูกซ่อนเนื่องจากระบบคัดกรอง",
    likes: 0,
    comments: 0,
    isHidden: true,
  },
];

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

function RatingBreakdown() {
  return (
    <div className="flex items-center gap-8 px-16 rating-breakdown-wrapper">
      <div className="text-center">
        <div className="mb-1 text-5xl text-foreground rating-score">
          {reviewData.averageRating}
        </div>
        <div className="text-sm text-muted-foreground">
          จาก {reviewData.maxRating}
        </div>
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

function RankingSection() {
  return (
    <div className="flex items-center justify-between py-4 border-b">
      <div>
        <h3 className="text-lg font-semibold">
          อันดับ #{reviewData.ranking.position} จาก {reviewData.ranking.total}
        </h3>
        <p className="text-sm text-muted-foreground">
          {reviewData.ranking.category}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </div>
  );
}

function RateThisPlace() {
  return (
    <Card className="my-6">
      <CardContent className="flex flex-col items-center p-6 text-center max-[425px]:p-4">
        <h3 className="mb-4 text-lg font-medium max-[425px]:mb-3 max-[425px]:text-base">
          ให้คะแนนร้านนี้
        </h3>
        <StarRating rating={0} size="lg" interactive />
      </CardContent>
    </Card>
  );
}

function FilterSection() {
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
        {filterOptions.map((option) => (
          <Button
            key={option.stars}
            variant="outline"
            size="sm"
            className="h-8 px-3 bg-transparent star-filter-button"
          >
            <div className="flex items-center gap-1">
              {[...Array(option.stars)].map((_, i) => (
                <Star key={i} className="w-3 h-3 text-gray-400 fill-gray-400" />
              ))}
            </div>
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2 ml-auto sort-section">
        <span className="text-sm">เรียงตาม</span>
        <Select defaultValue="popular">
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">ยอดนิยม</SelectItem>
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

function ReviewCard({ review }: { review: (typeof reviews)[0] }) {
  return (
    <div className="flex items-start gap-3 max-[425px]:gap-2">
      <Avatar className="h-12 w-12 max-[425px]:h-10 max-[425px]:w-10">
        <AvatarImage
          src={review.user.avatar || "/placeholder.svg"}
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

        <div className="text-muted-foreground review-user-stats mb-3 flex items-center gap-4 text-sm max-[425px]:gap-2">
          <span className="flex items-center gap-1">
            <span>👥</span> {review.user.followers}
          </span>
          <span className="flex items-center gap-1">
            <span>⭐</span> {review.user.reviews}
          </span>
          <span className="flex items-center gap-1">
            <span>📷</span> {review.user.photos}
          </span>
          {review.user.isVerified && (
            <Badge
              variant="secondary"
              className="bg-green-100 text-xs text-green-700 max-[425px]:text-[10px]"
            >
              ยืนยันตัวตนแล้ว
            </Badge>
          )}
        </div>

        {!review.isHidden && (
          <>
            <div className="mb-2 flex items-center gap-2 max-[425px]:flex-wrap">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-muted-foreground text-sm max-[425px]:text-xs">
                {review.date}
              </span>
              <div className="text-muted-foreground flex items-center gap-1 text-sm max-[425px]:text-xs">
                <Eye className="w-3 h-3" />
                <span>ดูแล้ว {review.views}</span>
              </div>
            </div>

            {review.menuItem && (
              <p className="mb-2 font-medium max-[425px]:text-sm">
                เมนูเด็ด: {review.menuItem}
              </p>
            )}

            <p className="text-foreground mb-4 leading-relaxed max-[425px]:text-sm">
              {review.content}
            </p>

            <div className="review-actions flex items-center gap-6 max-[425px]:gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 review-action-button"
              >
                <ThumbsUp className="mr-1 h-4 w-4 max-[425px]:h-3 max-[425px]:w-3" />
                <span className="max-[425px]:text-xs">{review.likes} Like</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 review-action-button"
              >
                <MessageCircle className="mr-1 h-4 w-4 max-[425px]:h-3 max-[425px]:w-3" />
                <span className="max-[425px]:text-xs">
                  {review.comments} Comment
                </span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 review-action-button"
              >
                <Share className="mr-1 h-4 w-4 max-[425px]:h-3 max-[425px]:w-3" />
                <span className="max-[425px]:text-xs">Share</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-8 w-8 p-0 max-[425px]:h-7 max-[425px]:w-7"
              >
                <MoreHorizontal className="h-4 w-4 max-[425px]:h-3 max-[425px]:w-3" />
              </Button>
            </div>
          </>
        )}

        {review.isHidden && (
          <div className="text-muted-foreground flex items-center gap-2 max-[425px]:flex-col max-[425px]:items-start">
            <Info className="w-4 h-4" />
            <span className="text-sm max-[425px]:text-xs">
              {review.content}
            </span>
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-blue-600 max-[425px]:text-xs"
            >
              กดเพื่อแสดงรีวิว
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReviewSection() {
  return (
    <div className="max-w-4xl gap-4 mx-auto review-section-container">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-4 text-xl section-heading">
          {reviewData.totalReviews} รีวิว{" "}
          <span className="text-muted-foreground">
            ({reviewData.totalRatings} เรตติ้ง)
          </span>
        </h1>

        <RatingBreakdown />
      </div>

      {/* <RankingSection /> */}
      <RateThisPlace />
      <FilterSection />

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
}
