import { validationResult, body, query } from "express-validator";
import { AuthValidation } from "./auth.middleware";

export class ReviewValidation extends AuthValidation {
  static validReviewText(text: string) {
    return [
      body(text)
        .trim()
        .matches(/^[a-zA-Z0-9ก-ฮะ-์\s}]+$/u)
        .withMessage(
          "review text can contain letters, numbers, spaces, and emoji"
        ),
    ];
  }

  static validRating(rating: string) {
    return [
      body(rating)
        .trim()
        .notEmpty()
        .withMessage("Rating is required")
        .isInt({ min: 1, max: 5 })
        .withMessage("Rating must be a number between 1 and 5"),
    ];
  }

  static validRestaurantId(restaurantId: string) {
    return [
      body(restaurantId)
        .trim()
        .notEmpty()
        .withMessage("Restaurant Id is required")
        .matches(/^[a-zA-Z0-9]+$/)
        .withMessage("Restaurant Id must contain only letters and numbers"),
    ];
  }

  static validRestaurantIdQuery(restaurantId: string) {
    return [
      query(restaurantId)
        .trim()
        .notEmpty()
        .withMessage("Restaurant Id is required")
        .matches(/^[a-zA-Z0-9]+$/)
        .withMessage("Restaurant Id must contain only letters and numbers"),
    ];
  }
}
