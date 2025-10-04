import { query } from "express-validator";
import { AuthValidation } from "./auth.middleware";
import { ReviewValidation } from "./review.middleware";

export class PaginationValidation extends ReviewValidation {
  static validPage(page: string) {
    return [
      query(page)
        .notEmpty()
        .withMessage("page is required")
        .isInt({ min: 1 })
        .withMessage("Page must be a positive integer"),
    ];
  }

  static validLimit(limit: string) {
    return [
      query(limit)
        .notEmpty()
        .withMessage("limit is required")
        .isInt({ min: 1 })
        .withMessage("Limit must be a positive integer"),
    ];
  }

  static validSort(sort: string) {
    return [
      query(sort)
        .optional()
        .isIn(["oldest", "newest", "highest", "lowest"])
        .withMessage("Sort must be one of: oldest, newest, highest, lowest"),
    ];
  }
}
