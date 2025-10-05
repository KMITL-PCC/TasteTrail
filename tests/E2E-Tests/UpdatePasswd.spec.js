import {test, expect} from '@playwright/test';

//คุณต้องตั้งค่า Password เป็นค่าเริ่มต้นก่อนที่สามารถ Login ได้
const validUser = 'Test2231';
const validPass = 'Admin1234@';
const newpasswd = 'P@ssw0rd';
const Confirmpasswd = 'P@ssw0rd';

test('Positive test cases UpdatePassword', async ({page}) => {
  await page.goto('http://localhost:3000/');
  //wait for 2 seconds
  await page.waitForTimeout(2000);
  await page.getByRole('link', { name: 'เข้าสู่ระบบ' }).click();
  await page.getByRole('textbox', { name: 'Username' }).fill(validUser);
  await page.getByRole('textbox', { name: 'Password' }).fill(validPass);
  await page.getByRole('button', { name: 'Login', exact: true }).click();
  await page.getByRole('button', { name: 'T', exact: true }).click();
  await page.getByRole('link', { name: 'ข้อมูลส่วนตัว' }).click();
  await page.locator('html').click();
  await page.getByRole('link', { name: 'Edit' }).click();
  await page.getByRole('tab', { name: 'Password' }).click();
  await page.getByRole('textbox', { name: 'Current password' }).fill(validPass);
  await page.getByRole('textbox', { name: 'New password' }).fill(newpasswd);
  await page.getByRole('textbox', { name: 'Confirm password' }).fill(Confirmpasswd);
  await page.getByRole('button', { name: 'Update password' }).click();
  await page.getByRole('button', { name: 'T', exact: true }).click();
  await page.getByText('ออกจากระบบ').click();
})

test('Negative test cases UpdatePassword', async ({page}) => {
    //wait for 2 seconds
    await page.waitForTimeout(2000);
    await page.goto('http://localhost:3000/');
    //wait for 2 seconds
    await page.waitForTimeout(2000);
    await page.getByRole('link', { name: 'เข้าสู่ระบบ' }).click();
    await page.getByRole('textbox', { name: 'Username' }).fill(validUser);
    await page.getByRole('textbox', { name: 'Password' }).fill(validPass);
    await page.getByRole('button', { name: 'Login', exact: true }).click();
    await page.getByRole('button', { name: 'T', exact: true }).click();
    await page.getByRole('link', { name: 'ข้อมูลส่วนตัว' }).click();
    await page.locator('html').click();
    await page.getByRole('link', { name: 'Edit' }).click();
    await page.getByRole('tab', { name: 'Password' }).click();

    //Password Empty
    //wait for 3 seconds
    await page.waitForTimeout(3000);
    await page.getByRole('textbox', { name: 'Current password' }).fill('');
    await page.getByRole('textbox', { name: 'New password' }).fill('Admin1234');
    await page.getByRole('textbox', { name: 'Confirm password' }).fill('Admin1234');
    await page.getByRole('button', { name: 'Update password' }).click();

    //New Password Empty
    //wait for 3 seconds
    await page.waitForTimeout(3000);
    await page.getByRole('textbox', { name: 'Current password' }).fill(newpasswd);
    await page.getByRole('textbox', { name: 'New password' }).fill('');
    await page.getByRole('textbox', { name: 'Confirm password' }).fill('Admin1234@');
    await page.getByRole('button', { name: 'Update password' }).click();

    //Confirm Password Empty
    //wait for 3 seconds
    await page.waitForTimeout(3000);
    await page.getByRole('textbox', { name: 'Current password' }).fill(newpasswd);
    await page.getByRole('textbox', { name: 'New password' }).fill('P@ssw0rd');
    await page.getByRole('textbox', { name: 'Confirm password' }).fill('');
    await page.getByRole('button', { name: 'Update password' }).click();

    //New Password and Confirm Password Missmath
    //wait for 3 seconds
    await page.waitForTimeout(3000);
    await page.getByRole('textbox', { name: 'Current password' }).fill(newpasswd);
    await page.getByRole('textbox', { name: 'New password' }).fill('P@ssw0rd');
    await page.getByRole('textbox', { name: 'Confirm password' }).fill('Admin1234@');
    await page.getByRole('button', { name: 'Update password' }).click();

    //Password < 8 Char
    //wait for 3 seconds
    await page.waitForTimeout(3000);
    await page.getByRole('textbox', { name: 'Current password' }).fill(newpasswd);
    await page.getByRole('textbox', { name: 'New password' }).fill('Admin1');
    await page.getByRole('textbox', { name: 'Confirm password' }).fill('Admin1');
    await page.getByRole('button', { name: 'Update password' }).click();
    //wait for 3 seconds
    await page.waitForTimeout(3000);
});

