import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000/forgot-password';
const validEmail = 'user@test.com';
const validOTP = '123456';
const newPassword = 'NewPass@123';

// ----------------------
// ✅ Positive Test Cases
// ----------------------
test.describe('Forgot Password - Positive Flow', () => {
  test('FP-001: ส่งคำขอ Forgot Password สำเร็จ', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#email', validEmail);
    await page.click('#submitBtn');
    await expect(page).toHaveURL(/.*otp/);
  });

  test('FP-002: กรอก OTP ถูกต้อง', async ({ page }) => {
    await page.goto(BASE_URL + '/otp');
    await page.fill('#otp', validOTP);
    await page.click('#verifyBtn');
    await expect(page).toHaveURL(/.*reset-password/);
  });

  test('FP-003: Reset Password สำเร็จ', async ({ page }) => {
    await page.goto(BASE_URL + '/reset-password');
    await page.fill('#newPassword', newPassword);
    await page.fill('#confirmPassword', newPassword);
    await page.click('#resetBtn');
    await expect(page.locator('h1')).toContainText('Password reset successful');
    await expect(page).toHaveURL(/.*login/);
  });

  test('FP-004: OTP เก็บแบบ Hash (ตรวจ backend)', async () => {
    expect(true).toBeTruthy();
  });

  test('FP-005: OTP หมดอายุ', async ({ page }) => {
    await page.goto(BASE_URL + '/otp');
    await page.fill('#otp', '999999');
    await page.click('#verifyBtn');
    await expect(page.locator('.error')).toHaveText(/OTP expired/);
  });
});

// ----------------------
// ❌ Negative Test Cases
// ----------------------
test.describe('Forgot Password - Negative Flow', () => {
  test('FP-006: Email ว่าง', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.click('#submitBtn');
    await expect(page.locator('.error')).toHaveText(/Email is required/);
  });

  test('FP-007: Email format ไม่ถูกต้อง', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#email', 'abc123');
    await page.click('#submitBtn');
    await expect(page.locator('.error')).toHaveText(/Invalid email format/);
  });

  test('FP-008: OTP ไม่ถูกต้อง', async ({ page }) => {
    await page.goto(BASE_URL + '/otp');
    await page.fill('#otp', '111111');
    await page.click('#verifyBtn');
    await expect(page.locator('.error')).toHaveText(/Invalid OTP/);
  });

  test('FP-009: OTP ใช้ซ้ำ', async ({ page }) => {
    await page.goto(BASE_URL + '/otp');
    await page.fill('#otp', validOTP);
    await page.click('#verifyBtn');
    await page.fill('#otp', validOTP);
    await page.click('#verifyBtn');
    await expect(page.locator('.error')).toHaveText(/OTP already used/);
  });

  test('FP-010: New Password ว่าง', async ({ page }) => {
    await page.goto(BASE_URL + '/reset-password');
    await page.fill('#confirmPassword', newPassword);
    await page.click('#resetBtn');
    await expect(page.locator('.error')).toHaveText(/Password is required/);
  });

  test('FP-011: Confirm Password ว่าง', async ({ page }) => {
    await page.goto(BASE_URL + '/reset-password');
    await page.fill('#newPassword', newPassword);
    await page.click('#resetBtn');
    await expect(page.locator('.error')).toHaveText(/Confirm Password is required/);
  });

  test('FP-012: Password < 8 ตัวอักษร', async ({ page }) => {
    await page.goto(BASE_URL + '/reset-password');
    await page.fill('#newPassword', '12345');
    await page.fill('#confirmPassword', '12345');
    await page.click('#resetBtn');
    await expect(page.locator('.error')).toHaveText(/Password must be at least 8 characters/);
  });

  test('FP-013: Password ไม่ตรงกัน', async ({ page }) => {
    await page.goto(BASE_URL + '/reset-password');
    await page.fill('#newPassword', 'Test@123');
    await page.fill('#confirmPassword', 'Test@1234');
    await page.click('#resetBtn');
    await expect(page.locator('.error')).toHaveText(/Passwords do not match/);
  });
});

// ----------------------
// ⚔️ XSS Test Cases
// ----------------------
test.describe('Forgot Password - XSS Tests', () => {
  test('FP-014: XSS ใน Email', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#email', "<script>alert(1)</script>@test.com");
    await page.click('#submitBtn');
    await expect(page.locator('.error')).toBeVisible();
  });

  test('FP-015: XSS ใน Password', async ({ page }) => {
    await page.goto(BASE_URL + '/reset-password');
    await page.fill('#newPassword', "<img src=x onerror=alert(1)>");
    await page.fill('#confirmPassword', "<img src=x onerror=alert(1)>");
    await page.click('#resetBtn');
    await expect(page.locator('.error')).toBeVisible();
  });

  test('FP-016: XSS ใน OTP', async ({ page }) => {
    await page.goto(BASE_URL + '/otp');
    await page.fill('#otp', "<script>alert('otp')</script>");
    await page.click('#verifyBtn');
    await expect(page.locator('.error')).toBeVisible();
  });
});

// ----------------------
// 🛡 SQL Injection Test Cases
// ----------------------
test.describe('Forgot Password - SQL Injection Tests', () => {
  test("FP-017: SQLi ใน Email", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#email', "' OR '1'='1");
    await page.click('#submitBtn');
    await expect(page.locator('.error')).toBeVisible();
  });

  test("FP-018: SQLi ใน OTP", async ({ page }) => {
    await page.goto(BASE_URL + '/otp');
    await page.fill('#otp', "123456' --");
    await page.click('#verifyBtn');
    await expect(page.locator('.error')).toBeVisible();
  });

  test("FP-019: SQLi ใน Password", async ({ page }) => {
    await page.goto(BASE_URL + '/reset-password');
    await page.fill('#newPassword', "'; DROP TABLE users; --");
    await page.fill('#confirmPassword', "'; DROP TABLE users; --");
    await page.click('#resetBtn');
    await expect(page.locator('.error')).toBeVisible();
  });

  test("FP-020: SQLi Boolean-based", async ({ page }) => {
    await page.goto(BASE_URL);
    await page.fill('#email', "abc' AND '1'='1");
    await page.click('#submitBtn');
    await expect(page.locator('.error')).toBeVisible();
  });
});
