import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

const validUser = 'newUser';
const validEmail = 'user@test.com';
const validPass = 'Test@1234';

test('Positive test cases Register', async ({ page }) => {
  await page.goto(BASE_URL + '/register');
  // wait 1000 ms
  await page.waitForTimeout(1000);
  await page.getByRole('textbox', { name: 'username' }).fill(validUser);
  // wait 500 ms
  await page.waitForTimeout(500); 
  await page.getByRole('textbox', { name: 'Email' }).fill(validEmail);
  await page.getByRole('textbox', { name: 'Password', exact: true }).fill(validPass);
  await page.getByRole('textbox', { name: 'Confirm Password' , exact: true  }).fill(validPass);
  await page.getByRole('checkbox', { name: 'I agree to the Terms of' }).click();
  await page.getByRole('button', { name: 'Register', exact: true }).click();;
  await page.waitForTimeout(2000);
});

test.describe('Negative test cases Register ', () => {
  test('REG-005: Not has Username', async ({ page }) => {
    await page.goto(BASE_URL + '/register');
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'username' }).fill('');
    await page.waitForTimeout(500); 
    await page.getByRole('textbox', { name: 'Email' }).fill(validEmail);
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(validPass);
    await page.getByRole('textbox', { name: 'Confirm Password' , exact: true  }).fill(validPass);
    await page.getByRole('checkbox', { name: 'I agree to the Terms of' }).click();
    await page.waitForTimeout(2000);
  });
  test('REG-006: Not has Email', async ({ page }) => {
    await page.goto(BASE_URL + '/register');
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'username' }).fill(validUser);
    await page.waitForTimeout(500); 
    await page.getByRole('textbox', { name: 'Email' }).fill('');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(validPass);
    await page.getByRole('textbox', { name: 'Confirm Password' , exact: true  }).fill(validPass);
    await page.getByRole('checkbox', { name: 'I agree to the Terms of' }).click();
    await page.waitForTimeout(2000);

  });

  test('REG-007: Email format No Complet', async ({ page }) => {
    await page.goto(BASE_URL + '/register');
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'username' }).fill(validUser);
    await page.waitForTimeout(500); 
    await page.getByRole('textbox', { name: 'Email' }).fill('Test@test');
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(validPass);
    await page.getByRole('textbox', { name: 'Confirm Password' , exact: true  }).fill(validPass);
    await page.getByRole('checkbox', { name: 'I agree to the Terms of' }).click();
    await page.waitForTimeout(2000);

  });

  test('REG-008: Not has Password', async ({ page }) => {
    await page.goto(BASE_URL + '/register');
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'username' }).fill(validUser);
    await page.waitForTimeout(500); 
    await page.getByRole('textbox', { name: 'Email' }).fill(validEmail);
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('');
    await page.getByRole('textbox', { name: 'Confirm Password' , exact: true  }).fill(validPass);
    await page.getByRole('checkbox', { name: 'I agree to the Terms of' }).click();
    await page.waitForTimeout(2000);
  
  });

  test('REG-009: Password < 8 Char', async ({ page }) => {
    await page.goto(BASE_URL + '/register');
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'username' }).fill(validUser);
    await page.waitForTimeout(500); 
    await page.getByRole('textbox', { name: 'Email' }).fill(validEmail);
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('12');
    await page.getByRole('textbox', { name: 'Confirm Password' , exact: true  }).fill('12');
    await page.getByRole('checkbox', { name: 'I agree to the Terms of' }).click();
    await page.waitForTimeout(2000);
  });

  test('REG-010: Confirm Password ไม่ตรง', async ({ page }) => {
    await page.goto(BASE_URL + '/register');
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'username' }).fill(validUser);
    await page.waitForTimeout(500); 
    await page.getByRole('textbox', { name: 'Email' }).fill(validEmail);
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill('123456');
    await page.getByRole('textbox', { name: 'Confirm Password' , exact: true  }).fill('654321');
    await page.getByRole('checkbox', { name: 'I agree to the Terms of' }).click();
    await page.waitForTimeout(2000);

  });

  test('REG-011: Not Click PDPA Checkbox', async ({ page }) => {
    await page.goto(BASE_URL + '/register');
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'username' }).fill(validUser);
    await page.waitForTimeout(500); 
    await page.getByRole('textbox', { name: 'Email' }).fill(validEmail);
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(validPass);
    await page.getByRole('textbox', { name: 'Confirm Password' , exact: true  }).fill(validPass);
    await page.waitForTimeout(2000);
  });
});


test.describe('Register - XSS Tests', () => {
  test('REG-014: XSS in Username', async ({ page }) => {
    await page.goto(BASE_URL + '/register');
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'username' }).fill("<script>alert(1)</script>");
    await page.waitForTimeout(500); 
    await page.getByRole('textbox', { name: 'Email' }).fill(validEmail);
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(validPass);
    await page.getByRole('textbox', { name: 'Confirm Password' , exact: true  }).fill(validPass);
    await page.getByRole('checkbox', { name: 'I agree to the Terms of' }).click();
    await page.waitForTimeout(2000);
  });

  test('REG-015: XSS in Email', async ({ page }) => {
    await page.goto(BASE_URL + '/register');
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'username' }).fill(validUser);
    await page.waitForTimeout(500); 
    await page.getByRole('textbox', { name: 'Email' }).fill("<img src=x onerror=alert(1)>@test.com");
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(validPass);
    await page.getByRole('textbox', { name: 'Confirm Password' , exact: true  }).fill(validPass);
    await page.getByRole('checkbox', { name: 'I agree to the Terms of' }).click();
    await page.waitForTimeout(2000);
  });

  test('REG-016: XSS in Password', async ({ page }) => {
    await page.goto(BASE_URL + '/register');
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'username' }).fill(validUser);
    await page.waitForTimeout(500); 
    await page.getByRole('textbox', { name: 'Email' }).fill(validUser);
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill("<script>alert('pw')</script>");
    await page.getByRole('textbox', { name: 'Confirm Password' , exact: true  }).fill("<script>alert('pw')</script>");
    await page.getByRole('checkbox', { name: 'I agree to the Terms of' }).click();
    await page.waitForTimeout(2000);

  });
});

test.describe('Register - SQL Injection Tests', () => {
  test("REG-017: SQLi on Username", async ({ page }) => {
    await page.goto(BASE_URL + '/register');
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'username' }).fill( "' OR '1'='1");
    await page.waitForTimeout(500); 
    await page.getByRole('textbox', { name: 'Email' }).fill(validEmail);
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(validPass);
    await page.getByRole('textbox', { name: 'Confirm Password' , exact: true  }).fill(validPass);
    await page.getByRole('checkbox', { name: 'I agree to the Terms of' }).click();
    await page.waitForTimeout(2000);
  });

  test("REG-018: SQLi in Email", async ({ page }) => {
    await page.goto(BASE_URL + '/register');
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'username' }).fill(validUser);
    await page.waitForTimeout(500); 
    await page.getByRole('textbox', { name: 'Email' }).fill("test@test.com' --");
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(validPass);
    await page.getByRole('textbox', { name: 'Confirm Password' , exact: true  }).fill(validPass);
    await page.getByRole('checkbox', { name: 'I agree to the Terms of' }).click();
    await page.waitForTimeout(2000);
  });

  test("REG-020: SQLi Boolean-based in Username", async ({ page }) => {
    await page.goto(BASE_URL + '/register');
    await page.waitForTimeout(1000);
    await page.getByRole('textbox', { name: 'username' }).fill( "abc' AND '1'='1");
    await page.waitForTimeout(500); 
    await page.getByRole('textbox', { name: 'Email' }).fill(validEmail);
    await page.getByRole('textbox', { name: 'Password', exact: true }).fill(validPass);
    await page.getByRole('textbox', { name: 'Confirm Password' , exact: true  }).fill(validPass);
    await page.getByRole('checkbox', { name: 'I agree to the Terms of' }).click();
    await page.waitForTimeout(2000);

  });
});