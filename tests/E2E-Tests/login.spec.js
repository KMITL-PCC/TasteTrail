import {test, expect} from '@playwright/test';
const BASE_URL = 'http://localhost:3000';
const validUser = 'Testuser108';
const validPass = 'Test1234';

test('Positive test cases Login', async ({page}) => {
    await page.goto('http://localhost:3000/login');
    //wait for 2 seconds
    await page.waitForTimeout(2000);
    //wait for 2 seconds
    await page.waitForTimeout(2000);
    await page.getByRole('textbox', { name: 'Username' }).fill(validUser);
    await page.getByRole('textbox', { name: 'Password' }).fill(validPass);
    //wiat for 500 ms
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    //wait for 4 seconds
    await page.waitForTimeout(4000);
});
// Negative Test Cases
test.describe('Negative Test Cases Login', () => {
  test('TC-005: Username Empty', async ({ page }) => {
    //wait for 2 seconds
    await page.waitForTimeout(2000);
    await page.goto('http://localhost:3000/login');
    await page.getByRole('textbox', { name: 'Username' }).fill('');
    await page.getByRole('textbox', { name: 'Password' }).fill(validPass);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    // await for 2 seconds
    await page.waitForTimeout(2000);

  });

  test('TC-006: Password Empty', async ({ page }) => {
    await page.waitForTimeout(2000);
    await page.goto('http://localhost:3000/login');
    await page.getByRole('textbox', { name: 'Username' }).fill(validUser);
    await page.getByRole('textbox', { name: 'Password' }).fill('');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    // await for 2 seconds
    await page.waitForTimeout(2000);
  });

  test('TC-007: All Empty', async ({ page }) => {
    //wait for 2 seconds
    await page.waitForTimeout(2000);
    await page.goto('http://localhost:3000/login');
    await page.getByRole('textbox', { name: 'Username' }).fill('');
    await page.getByRole('textbox', { name: 'Password' }).fill('');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    // await for 2 seconds
    await page.waitForTimeout(2000);
  });

  test('TC-008: Username or Password Missmath', async ({ page }) => {
        //wait for 2 seconds
    await page.waitForTimeout(2000);
    await page.goto('http://localhost:3000/login');
    await page.getByRole('textbox', { name: 'Username' }).fill(validUser);
    await page.getByRole('textbox', { name: 'Password' }).fill('wrongPass');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    // await for 2 seconds
    await page.waitForTimeout(2000);

  });

  test('TC-009: Password < 8 Char', async ({ page }) => {
    //wait for 2 seconds
    await page.waitForTimeout(2000);
    await page.goto('http://localhost:3000/login');
    await page.getByRole('textbox', { name: 'Username' }).fill(validUser);
    await page.getByRole('textbox', { name: 'Password' }).fill('123');
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    // await for 2 seconds
    await page.waitForTimeout(2000);
  });
});
// XSS Test Cases

test.describe('XSS Test Cases', () => {
  test('TC-010: XSS in Username', async ({ page }) => {
    //wait for 2 seconds
    await page.waitForTimeout(2000);
    await page.goto('http://localhost:3000/login');
    await page.getByRole('textbox', { name: 'Username' }).fill("<script>alert('XSS')</script>");
    await page.getByRole('textbox', { name: 'Password' }).fill(validPass);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    // await for 2 seconds
    await page.waitForTimeout(2000);
  });

  test('TC-011: XSS in Password', async ({ page }) => {
    //wait for 2 seconds
    await page.waitForTimeout(2000);
    await page.goto('http://localhost:3000/login');
    await page.getByRole('textbox', { name: 'Username' }).fill(validUser);
    await page.getByRole('textbox', { name: 'Password' }).fill("<img src=x onerror=alert('XSS')>");
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    // await for 2 seconds
    await page.waitForTimeout(2000);
    // await expect(page.locator('.error')).toBeVisible();

  });

  test('TC-012: Reflected XSS (URL)', async ({ page }) => {
    //wait for 2 seconds
    await page.waitForTimeout(2000);
    await page.goto('http://localhost:3000/login');
    await page.getByRole('textbox', { name: 'Username' }).fill("<script>alert(1)</script>");
    await page.getByRole('textbox', { name: 'Password' }).fill(validPass);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    // await for 2 seconds
    await page.waitForTimeout(2000);
    // await expect(page.locator('.error')).toBeVisible();
  });
  });
// SQL Injection Test Cases
test.describe('SQL Injection Tests cases', () => {
  test("TC-013: SQLi - ' OR '1'='1", async ({ page }) => {
    //wait for 2 seconds
    await page.waitForTimeout(2000);
    await page.goto('http://localhost:3000/login');
    await page.getByRole('textbox', { name: 'Username' }).fill("' OR '1'='1");
    await page.getByRole('textbox', { name: 'Password' }).fill (validPass);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    // wait for 2 seconds
    await page.waitForTimeout(2000);

  });

  test("TC-014: SQLi - admin' --", async ({ page }) => {
    await page.goto( 'http://localhost:3000/login');
    //wait for 2 seconds
    await page.waitForTimeout(2000);
    await page.getByRole('textbox', { name: 'Username' }).fill("admin' --");
    await page.getByRole('textbox', { name: 'Password' }).fill(validPass);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    // wait for 2 seconds
    await page.waitForTimeout(2000);

  });

  test("TC-015: SQLi - '; DROP TABLE users; --", async ({ page }) => {
    await page.goto( 'http://localhost:3000/login');
    //wait for 2 seconds
    await page.waitForTimeout(2000);
    await page.getByRole('textbox', { name: 'Username' }).fill(validUser);
    await page.getByRole('textbox', { name: 'Password' }).fill("'; DROP TABLE users; --");
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    // wait for 2 seconds
    await page.waitForTimeout(2000);

  });

  test("TC-016: SQLi - Boolean-based", async ({ page }) => {
    await page.goto( 'http://localhost:3000/login');
    //wait for 2 seconds
    await page.waitForTimeout(2000);
    await page.getByRole('textbox', { name: 'Username' }).fill("test' AND '1'='1");
    await page.getByRole('textbox', { name: 'Password' }).fill(validPass);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    // wait for 2 seconds
    await page.waitForTimeout(2000);
  });

});
