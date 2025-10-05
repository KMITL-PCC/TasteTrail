import matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";

// ✅ บางเวอร์ชันของ jest-dom ไม่มี default export ต้องใช้ import * แทน
import * as jestMatchers from "@testing-library/jest-dom/matchers";

// ✅ ผูก matcher เข้ากับ expect
expect.extend(jestMatchers);
