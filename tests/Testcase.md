## Test cses

# Login Test Cases

*ตารางทดสอบการล็อกอิน (Login)*

## Positive Flow

| ID     | Test Scenario                                  | Test Steps                                                                                        | Expected Result                         | Status    |
| ------ | ---------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------- | --------- |
| TC-001 | Login สำเร็จด้วย Username และ Password ถูกต้อง | 1. เปิดหน้า Login<br>2. ใส่ Username = validUser<br>3. ใส่ Password = validPass123<br>4. กด Login | ระบบพาไปหน้า Home page                  | Completed |
| TC-002 | กด Enter แทนปุ่ม Login                         | 1. ใส่ Username & Password ถูกต้อง<br>2. กดปุ่ม Enter                                             | ระบบ Login สำเร็จเหมือนกดปุ่ม Login     | Completed |
| TC-003 | จำค่า Session หลังจาก Login                    | 1. Login สำเร็จ<br>2. Refresh หน้าเว็บ                                                            | ผู้ใช้ยังอยู่ในระบบ ไม่ถูกเด้งออก       | Completed |
| TC-004 | Logout สำเร็จ                                  | 1. Login เข้าสู่ระบบ<br>2. กด Logout                                                              | ระบบออกจากระบบและ redirect ไปหน้า Login | Completed |

---

## Negative Test Cases

| ID     | Test Scenario                     | Test Steps                                                                 | Expected Result                                        | Status    |
| ------ | --------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ | --------- |
| TC-005 | Username ว่าง / Password ถูกต้อง  | 1. ไม่กรอก Username<br>2. ใส่ Password ถูกต้อง<br>3. กด Login              | ระบบแสดง Error: "Username is required"                 | Completed |
| TC-006 | Password ว่าง                     | 1. กรอก Username ถูกต้อง<br>2. ไม่กรอก Password<br>3. กด Login             | ระบบแสดง Error: "Password is required"                 | Completed |
| TC-007 | ทั้งคู่ว่าง                       | 1. ไม่กรอกทั้ง Username และ Password<br>2. กด Login<br>3. Refresh หน้าเว็บ | ระบบแสดง Error: "Please enter username and password"   | Completed |
| TC-008 | Username หรือ Password ไม่ถูกต้อง | 1. ใส่ Username = validUser<br>2. ใส่ Password = wrongPass<br>3. กด Login  | ระบบแจ้งเตือน "Invalid username or password"           | Completed |
| TC-009 | กรอก Password น้อยกว่า 6 ตัวอักษร | 1. ใส่ Username ถูกต้อง<br>2. ใส่ Password = 123<br>3. กด Login            | ระบบแจ้งเตือน "Password must be at least 6 characters" | Completed |

---

## XSS Test Cases

| ID     | Test Scenario                   | Test Steps                                                                                       | Expected Result                           | Status        |
| ------ | ------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------- | ------------- |
| TC-010 | XSS ใน Username                 | 1. กรอก Username = `<script>alert('XSS')</script>`<br>2. กรอก Password ถูกต้อง<br>3. กด Login    | ระบบไม่ execute script และแจ้ง Error ปกติ | Not Completed |
| TC-011 | XSS ใน Password (image onerror) | 1. กรอก Username ถูกต้อง<br>2. กรอก Password = `<img src=x onerror=alert('XSS')>`<br>3. กด Login | ระบบไม่ execute script และแจ้ง Error ปกติ | Not Completed |
| TC-012 | Reflected XSS (check URL)       | 1. กรอก Username = `<script>alert(1)</script>`<br>2. Submit Form<br>3. ดู URL query string       | ระบบ Escape ค่า Input ไม่ให้ script ทำงาน | Not Completed |

---

## SQL Injection Test Cases
| ID      | Test Scenario                               | Test Steps                                                                                  | Expected Result                                                    | Status        |
| ------- | ------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------- |
| TC-013  | SQLi: `' OR '1'='1` ใน Username             | 1. กรอก Username = `' OR '1'='1`<br>2. กรอก Password = any<br>3. กด Login                   | ระบบไม่ Login สำเร็จ และแสดง Error: "Invalid username or password" | Not Completed |
| TC-0014 | SQLi: `admin' --` ใน Username               | 1. กรอก Username = `admin' --`<br>2. กรอก Password = blank<br>3. กด Login                   | ระบบไม่ Login สำเร็จ และ ไม่ crash                                 | Not Completed |
| TC-0015 | SQLi: `'; DROP TABLE users; --` ใน Password | 1. กรอก Username = validUser<br>2. กรอก Password = `'; DROP TABLE users; --`<br>3. กด Login | ระบบไม่ execute SQL และแจ้ง Error                                  | Not Completed |
| TC-016  | Boolean-based SQLi                          | 1. กรอก Username = `test' AND '1'='1`<br>2. กรอก Password = wrongPass<br>3. กด Login        | ระบบไม่ bypass authentication                                      | Completed     |

---

# Registration Test Cases

*ตารางทดสอบการสมัครสมาชิก (Registration)*

## Positive / Functional

| TC ID   | Test Scenario                                     | Test Steps                                                                                                                                                                                             | Expected Result                                              | Status    |
| ------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | --------- |
| REG-001 | สมัครสำเร็จ (ข้อมูลถูกต้องทุก field และติ๊ก PDPA) | 1. กรอก Username = newUser<br>2. กรอก Email = [user@test.com](mailto:user@test.com)<br>3. กรอก Password = Test@1234<br>4. กรอก Confirm Password = Test@1234<br>5. ติ๊ก PDPA checkbox<br>6. กด Register | ระบบส่ง OTP ไปที่ Email และ Redirect ไปหน้า OTP Verification | Completed |
| REG-002 | กรอก OTP ถูกต้อง                                  | 1. หลังจากสมัครสำเร็จ<br>2. กรอก OTP ที่ได้รับจาก Email<br>3. กด Verify                                                                                                                                | ระบบแสดงข้อความ “Registration Successful” และเข้าใช้งานได้   | Completed |
| REG-003 | OTP ใช้ Hash ถูกต้อง                              | 1. หลังจากสมัครสำเร็จ<br>2. กรอก OTP ที่ได้รับจาก Email<br>3. กด Verify                                                                                                                                | ระบบเก็บ OTP เป็น Hash เท่านั้น                              | Completed |
| REG-004 | OTP หมดอายุ                                       | 1. สมัครสำเร็จ<br>2. รอจน OTP หมดเวลา (เช่น 5 นาที)<br>3. กรอก OTP                                                                                                                                     | ระบบแจ้ง “OTP expired” และไม่ยืนยันสำเร็จ                    | Completed |

---

## Negative / Validation

| TC ID   | Test Scenario                       | Test Steps                                                         | Expected Result                                             | Status        |
| ------- | ----------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------- | ------------- |
| REG-005 | ไม่กรอก Username                    | 1. ไม่กรอก Username<br>2. กรอก field อื่นถูกต้อง<br>3. กด Register | Error: “Username is required”                               | Not Completed |
| REG-006 | ไม่กรอก Email                       | เช่นเดียวกับด้านบน                                                 | Error: “Email is required”                                  | Not Completed |
| REG-007 | Email format ไม่ถูกต้อง             | กรอก Email = abc123                                                | Error: “Invalid email format”                               | Not Completed |
| REG-008 | ไม่กรอก Password                    | Password ว่าง                                                      | Error: “Password is required”                               | Not Completed |
| REG-009 | Password < 8 ตัวอักษร               | เช่น 12345                                                         | Error: “Password must be at least 8 characters”             | Not Completed |
| REG-010 | Confirm Password ไม่ตรงกับ Password | Password = Test@1234, Confirm = Test@12345                         | Error: “Passwords do not match”                             | Not Completed |
| REG-011 | ไม่ติ๊ก PDPA Checkbox               | กรอก field ถูกต้องแต่ไม่ติ๊ก PDPA                                  | ปุ่ม Register ถูก disable หรือ Error “You must accept PDPA” | Not Completed |
| REG-012 | OTP ไม่ถูกต้อง                      | สมัครเสร็จแล้วกรอก OTP ผิด                                         | Error: “Invalid OTP”                                        | Not Completed |
| REG-013 | OTP ใช้ซ้ำ                          | OTP ถูกใช้แล้ว กรอกอีกครั้ง                                        | Error: “OTP already used”                                   | Not Completed |

---

## XSS Test Cases

| TC ID   | Test Scenario   | Test Steps                                      | Expected Result                    | Status        |
| ------- | --------------- | ----------------------------------------------- | ---------------------------------- | ------------- |
| REG-014 | XSS ใน Username | Username = `<script>alert(1)</script>`          | ระบบ Escape input และไม่รัน script | Not Completed |
| REG-015 | XSS ใน Email    | Email = `<img src=x onerror=alert(1)>@test.com` | ระบบ Escape input และแจ้ง Error    | Not Completed |
| REG-016 | XSS ใน Password | Password = `<script>alert('pw')</script>`       | ระบบไม่รัน script แค่แจ้ง Error    | Not Completed |

---

## SQL Injection

| TC ID   | Test Scenario                                | Test Steps                           | Expected Result                   | Status        |
| ------- | -------------------------------------------- | ------------------------------------ | --------------------------------- | ------------- |
| REG-017 | SQLi ใน Username (`' OR '1'='1`)             | Username = `' OR '1'='1`             | ระบบไม่สมัครและแจ้ง Error         | Completed     |
| REG-018 | SQLi ใน Email (`test@test.com' --`)          | Email = `test@test.com' --`          | ระบบไม่ crash, แค่ Error          | Not Completed |
| REG-019 | SQLi ใน Password (`'; DROP TABLE users; --`) | Password = `'; DROP TABLE users; --` | ระบบไม่ execute SQL และแจ้ง Error | Completed     |
| REG-020 | SQLi Boolean-based (`abc' AND '1'='1`)       | Username = `abc' AND '1'='1`         | ระบบไม่ bypass และแจ้ง Error      | Completed     |

---

# Update Password Test Cases

ตารางทดสอบการเปลี่ยนรหัสผ่าน (Update Password)

## Functional / Positive

| ID     | Test Scenario                               | Test Steps                                                                                                                                                                                          | Expected Result                                                                       | Status        |
| ------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------- |
| UP-001 | เปลี่ยนรหัสผ่านสำเร็จ                       | 1. Login เข้าระบบ<br>2. ไปที่หน้า Update Password<br>3. กรอก Old Password = `OldPass@123`<br>4. กรอก New Password = `NewPass@1234`<br>5. กรอก Confirm New Password = `NewPass@1234`<br>6. กด Submit | ระบบแจ้ง “Password updated successfully” และให้ Login ใหม่ (หรือปฏิบัติตามนโยบายระบบ) | Not Completed |
| UP-002 | Old Password ถูกต้อง / New Password ถูกต้อง | 1. กรอกข้อมูลครบทุกช่องถูกต้อง<br>2. กด Submit                                                                                                                                                      | ระบบเปลี่ยนรหัสผ่านได้สำเร็จ                                                          | Not Completed |
| UP-003 | Session หลังเปลี่ยนรหัสผ่าน                 | 1. เปลี่ยนรหัสผ่านสำเร็จ<br>2. Refresh หน้า                                                                                                                                                         | ระบบยังคง session หรือจะให้ทำ logout แล้วบังคับ login ใหม่ ขึ้นกับนโยบายระบบ          | Not Completed |

---

## Validation / Negative

| ID     | Test Scenario                  | Test Steps                               | Expected Result                                          | Status        |
| ------ | ------------------------------ | ---------------------------------------- | -------------------------------------------------------- | ------------- |
| UP-004 | ไม่กรอก Old Password           | ไม่กรอก Old Password แล้ว Submit         | Error: “Old password is required”                        | Not Completed |
| UP-005 | ไม่กรอก New Password           | ไม่กรอก New Password แล้ว Submit         | Error: “New password is required”                        | Not Completed |
| UP-006 | ไม่กรอก Confirm Password       | ไม่กรอก Confirm New Password แล้ว Submit | Error: “Please confirm your new password”                | Not Completed |
| UP-007 | New Password < 8 ตัวอักษร      | New Password = `12345`                   | Error: “Password must be at least 8 characters”          | Not Completed |
| UP-008 | New Password ไม่ตรงกับ Confirm | New = `Test@123`, Confirm = `Test@1234`  | Error: “Passwords do not match”                          | Not Completed |
| UP-009 | Old Password ไม่ถูกต้อง        | กรอก Old Password ผิด                    | Error: “Incorrect old password”                          | Not Completed |
| UP-010 | ใช้ Password เดิมซ้ำ           | Old = `Test@1234`, New = `Test@1234`     | Error: “New password cannot be the same as old password” | Not Completed |

---
## Security (XSS)

| ID     | Test Scenario           | Test Steps                                        | Expected Result                      | Status        |
| ------ | ----------------------- | ------------------------------------------------- | ------------------------------------ | ------------- |
| UP-011 | XSS ใน Old Password     | Old Password = `<script>alert(1)</script>`        | ระบบ Escape input และไม่รัน script   | Not Completed |
| UP-012 | XSS ใน New Password     | New Password = `<img src=x onerror=alert(1)>`     | ระบบไม่ execute script และแจ้ง Error | Not Completed |
| UP-013 | XSS ใน Confirm Password | Confirm Password = `<script>alert('pw')</script>` | ระบบไม่รัน script                    | Not Completed |

---

## SQL Injection

| ID     | Test Scenario                                    | Test Steps                               | Expected Result                   | Status        |
| ------ | ------------------------------------------------ | ---------------------------------------- | --------------------------------- | ------------- |
| UP-014 | SQLi ใน Old Password (`' OR '1'='1`)             | Old Password = `' OR '1'='1`             | ระบบไม่ bypass และแจ้ง Error      | Not Completed |
| UP-015 | SQLi ใน New Password (`'; DROP TABLE users; --`) | New Password = `'; DROP TABLE users; --` | ระบบไม่ execute SQL และแจ้ง Error | Not Completed |
| UP-016 | SQLi Boolean-based (`abc' AND '1'='1`)           | Old Password = `abc' AND '1'='1`         | ระบบไม่ bypass authentication     | Not Completed |

---


# Forgot Password Test Cases

ตารางทดสอบการรีเซ็ตรหัสผ่าน (Forgot Password) — แปลงเป็นไฟล์ Markdown

## Functional / Positive

| ID     | Test Scenario                  | Test Steps                                                                                           | Expected Result                                                | Status        |
| ------ | ------------------------------ | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------- |
| FP-001 | ส่งคำขอ Forgot Password สำเร็จ | 1. เปิดหน้า Forgot Password<br>2. กรอก Email = [user@test.com](mailto:user@test.com)<br>3. กด Submit | ระบบส่ง OTP ไปที่ Email และ redirect ไปหน้า OTP                | Not Completed |
| FP-002 | กรอก OTP ถูกต้อง               | 1. ไปที่หน้า OTP<br>2. กรอก OTP ที่ถูกต้อง<br>3. กด Verify                                           | ระบบพาไปหน้า Reset Password                                    | Not Completed |
| FP-003 | Reset Password สำเร็จ          | 1. กรอก New Password = NewPass@123<br>2. กรอก Confirm Password = NewPass@123<br>3. กด Submit         | ระบบแจ้ง “Password reset successful” และ redirect ไปหน้า Login | Not Completed |
| FP-004 | OTP เก็บแบบ Hash               | ตรวจสอบ DB / Logs ของระบบ                                                                            | OTP ไม่ควรเก็บเป็น Plaintext แต่เก็บเป็น Hash                  | Not Completed |
| FP-005 | OTP หมดอายุ                    | 1. ส่ง OTP แล้วรอจนหมดเวลา (เช่น 5 นาที)<br>2. กรอก OTP                                              | ระบบแจ้ง “OTP expired”                                         | Not Completed |

## Validation / Negative

| ID     | Test Scenario           | Test Steps                          | Expected Result                                 | Status        |
| ------ | ----------------------- | ----------------------------------- | ----------------------------------------------- | ------------- |
| FP-006 | Email ว่าง              | ไม่กรอก Email แล้วกด Submit         | Error: “Email is required”                      | Not Completed |
| FP-007 | Email format ไม่ถูกต้อง | Email = abc123                      | Error: “Invalid email format”                   | Not Completed |
| FP-008 | OTP ไม่ถูกต้อง          | กรอก OTP = 111111                   | Error: “Invalid OTP”                            | Not Completed |
| FP-009 | OTP ใช้ซ้ำ              | กรอก OTP ที่เคยใช้แล้ว              | Error: “OTP already used”                       | Not Completed |
| FP-010 | New Password ว่าง       | ไม่กรอก Password แล้ว Submit        | Error: “Password is required”                   | Not Completed |
| FP-011 | Confirm Password ว่าง   | กรอก Password แต่ไม่กรอก Confirm    | Error: “Confirm Password is required”           | Not Completed |
| FP-012 | Password < 8 ตัวอักษร   | New Password = 12345                | Error: “Password must be at least 8 characters” | Not Completed |
| FP-013 | Password ไม่ตรงกัน      | New = Test@123, Confirm = Test@1234 | Error: “Passwords do not match”                 | Not Completed |

## Security (XSS)

| ID     | Test Scenario   | Test Steps                                    | Expected Result                      | Status        |
| ------ | --------------- | --------------------------------------------- | ------------------------------------ | ------------- |
| FP-014 | XSS ใน Email    | Email = `<script>alert(1)</script>@test.com`  | ระบบ Escape input และไม่รัน script   | Not Completed |
| FP-015 | XSS ใน Password | New Password = `<img src=x onerror=alert(1)>` | ระบบไม่ execute script และแจ้ง Error | Not Completed |
| FP-016 | XSS ใน OTP      | OTP = `<script>alert('otp')</script>`         | ระบบไม่ execute script และแจ้ง Error | Not Completed |

## SQL Injection

| ID     | Test Scenario                                | Test Steps                           | Expected Result                   | Status        |
| ------ | -------------------------------------------- | ------------------------------------ | --------------------------------- | ------------- |
| FP-017 | SQLi ใน Email (`' OR '1'='1`)                | Email = `' OR '1'='1`                | ระบบไม่ส่ง OTP และแจ้ง Error      | Not Completed |
| FP-018 | SQLi ใน OTP (`123456' --`)                   | OTP = `123456' --`                   | ระบบไม่ verify OTP ได้            | Not Completed |
| FP-019 | SQLi ใน Password (`'; DROP TABLE users; --`) | Password = `'; DROP TABLE users; --` | ระบบไม่ execute SQL และแจ้ง Error | Not Completed |
| FP-020 | Boolean-based SQLi (`abc' AND '1'='1`)       | Email = `abc' AND '1'='1`            | ระบบไม่ bypass authentication     | Not Completed |

---

*ไฟล์นี้จัดรูปแบบเป็นตาราง Markdown สามารถดาวน์โหลดหรือคัดลอกไปใช้ได้เลย*
