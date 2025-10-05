# Test cses

---

## Registration Test Cases

*ตารางทดสอบการสมัครสมาชิก (Registration)*

## Positive Test Cases

 TC ID | Test Scenario | Test Steps | Expected Result | Status |
|-------|---------------|------------|-----------------|--------|
| REG-001 | สมัครสำเร็จ (ข้อมูลถูกต้องทุก field และติ๊ก PDPA) | 1. กรอก Username = newUser<br>2. กรอก Email = [user@test.com](mailto:user@test.com)<br>3. กรอก Password = Test@1234<br>4. กรอก Confirm Password = Test@1234<br>5. ติ๊ก PDPA checkbox<br>6. กด Register | ระบบส่ง OTP ไปที่ Email และ Redirect ไปหน้า OTP Verification | Completed |
| REG-002 | กรอก OTP ถูกต้อง | 1. หลังจากสมัครสำเร็จ<br>2. กรอก OTP ที่ได้รับจาก Email<br>3. กด Verify   | ระบบแสดงข้อความ “Registration Successful” และเข้าใช้งานได้   | Completed |
| REG-003 | OTP ใช้ Hash ถูกต้อง| 1. หลังจากสมัครสำเร็จ<br>2. กรอก OTP ที่ได้รับจาก Email<br>3. กด Verify   | ระบบเก็บ OTP เป็น Hash เท่านั้น | Completed |
| REG-004 | OTP หมดอายุ | 1. สมัครสำเร็จ<br>2. รอจน OTP หมดเวลา (เช่น 5 นาที)<br>3. กรอก OTP | ระบบแจ้ง “OTP expired” และไม่ยืนยันสำเร็จ | Completed |

---

## Negative / Validation

 TC ID | Test Scenario | Test Steps | Expected Result | Status |
|-------|---------------|------------|-----------------|--------|
| REG-005 | ไม่กรอก Username | 1. ไม่กรอก Username<br>2. กรอก field อื่นถูกต้อง<br>3. กด Register |Notification message error |  Completed |
| REG-006 | ไม่กรอก Email | เช่นเดียวกับด้านบน  | Notification message error| Completed |
| REG-007 | Email format ไม่ถูกต้อง|กรอก Email = abc123  | Notification message error| Completed |
| REG-008 | ไม่กรอก Password | Password ว่าง |Notification message error| Completed |
| REG-009 | Password < 8 ตัวอักษร | เช่น 12345 | Notification message error | Completed |
| REG-010 | Confirm Password ไม่ตรงกับ Password | Password = Test@1234, Confirm = Test@12345| Notification message error | Completed |
| REG-011 | ไม่ติ๊ก PDPA Checkbox  | กรอก field ถูกต้องแต่ไม่ติ๊ก PDPA | Notification message error  | Completed |
| REG-012 | OTP ไม่ถูกต้อง  | สมัครเสร็จแล้วกรอก OTP ผิด| Notification message error| Completed |
| REG-013 | OTP ใช้ซ้ำ     | OTP ถูกใช้แล้ว กรอกอีกครั้ง | Notification message error | Completed |

---

## XSS Test Cases

 TC ID | Test Scenario | Test Steps | Expected Result | Status |
|-------|---------------|------------|-----------------|--------|
| REG-014 | XSS ใน Username | Username = `<script>alert(1)</script>`| Notification message error| Completed |
| REG-015 | XSS ใน Email    | Email = `<img src=x onerror=alert(1)>@test.com` | Notification message error | Completed |

---

## SQL Injection

 TC ID | Test Scenario | Test Steps | Expected Result | Status |
|-------|---------------|------------|-----------------|--------|
| REG-017 | SQLi ใน Username (`' OR '1'='1`)   | Username = `' OR '1'='1`| Notification message error  | Completed     |
| REG-018 | SQLi ใน Email (`test@test.com' --`) | Email = `test@test.com' --`| Notification message error  | Completed |
| REG-020 | SQLi Boolean-based (`abc' AND '1'='1`) | Username = `abc' AND '1'='1` | Notification message error      | Completed     |

---

## Login Test Cases

*ตารางทดสอบการล็อกอิน (Login)*

## Positive Flow

 TC ID | Test Scenario | Test Steps | Expected Result | Status |
|-------|---------------|------------|-----------------|--------|
| TC-001 | Login สำเร็จด้วย Username และ Password ถูกต้อง | 1. เปิดหน้า Login<br>2. ใส่ Username = validUser<br>3. ใส่ Password = validPass123<br>4. กด Login | ระบบพาไปหน้า Home page| Completed |
| TC-002 | กด Enter แทนปุ่ม Login| 1. ใส่ Username & Password ถูกต้อง<br>2. กดปุ่ม Enter | ระบบ Login สำเร็จเหมือนกดปุ่ม Login  | Completed |
| TC-003 | จำค่า Session หลังจาก Login  | 1. Login สำเร็จ<br>2. Refresh หน้าเว็บ| ผู้ใช้ยังอยู่ในระบบ ไม่ถูกเด้งออก| Completed |
| TC-004 | Logout สำเร็จ| 1. Login เข้าสู่ระบบ<br>2. กด Logou| ระบบออกจากระบบและ redirect ไปหน้า Home Page | Completed |

---

## Negative Test Cases

 TC ID | Test Scenario | Test Steps | Expected Result | Status |
|-------|---------------|------------|-----------------|--------|
| TC-005 | Username ว่าง / Password ถูกต้อง  | 1. ไม่กรอก Username<br>2. ใส่ Password ถูกต้อง<br>3. กด Login | Notification message error | Completed |
| TC-006 | Password ว่าง | 1. กรอก Username ถูกต้อง<br>2. ไม่กรอก Password<br>3. กด Login  |Notification message error | Completed |
| TC-007 | ทั้งคู่ว่าง| 1. ไม่กรอกทั้ง Username และ Password<br>2. กด Login<br>3. Refresh หน้าเว็บ | Notification message error   | Completed |
| TC-008 | Username หรือ Password ไม่ถูกต้อง | 1. ใส่ Username = validUser<br>2. ใส่ Password = wrongPass<br>3. กด Login  | Notification message error    | Completed |
| TC-009 | กรอก Password น้อยกว่า 6 ตัวอักษร | 1. ใส่ Username ถูกต้อง<br>2. ใส่ Password = 123<br>3. กด Login| Notification message error  | Completed |

---

## XSS Test Cases

 TC ID | Test Scenario | Test Steps | Expected Result | Status |
|-------|---------------|------------|-----------------|--------|
| TC-010 | XSS ใน Username                 | 1. กรอก Username = `<script>alert('XSS')</script>`<br>2. กรอก Password ถูกต้อง<br>3. กด Login    |  Notification message error | Completed |
| TC-011 | XSS ใน Password (image onerror) | 1. กรอก Username ถูกต้อง<br>2. กรอก Password = `<img src=x onerror=alert('XSS')>`<br>3. กด Login |  Notification message error | Completed |
| TC-012 | Reflected XSS (check URL)       | 1. กรอก Username = `<script>alert(1)</script>`<br>2. Submit Form<br>3. ดู URL query string       | Notification message error | Completed |

---

## SQL Injection Test Cases
 TC ID | Test Scenario | Test Steps | Expected Result | Status |
|-------|---------------|------------|-----------------|--------|
| TC-013  | SQLi: `' OR '1'='1` ใน Username   | 1. กรอก Username = `' OR '1'='1`<br>2. กรอก Password = any<br>3. กด Login|  Notification message error | Completed |
| TC-0014 | SQLi: `admin' --` ใน Username | 1. กรอก Username = `admin' --`<br>2. กรอก Password = blank<br>3. กด Login|  Notification message error | Completed |
| TC-0015 | SQLi: `'; DROP TABLE users; --` ใน Password | 1. กรอก Username = validUser<br>2. กรอก Password = `'; DROP TABLE users; --`<br>3. กด Login | Notification message error | Completed |
| TC-016  | Boolean-based SQLi| 1. กรอก Username = `test' AND '1'='1`<br>2. กรอก Password = wrongPass<br>3. กด Login |  Notification message error | Completed     |


---

# Update Password Test Cases

*ตารางทดสอบการเปลี่ยนรหัสผ่าน (Update Password)*

## Positive Flow

 TC ID | Test Scenario | Test Steps | Expected Result | Status |
|-------|---------------|------------|-----------------|--------|
| UP-001 | Update Password สำเร็จ (ข้อมูลถูกต้องทุกช่อง) | 1. เข้าสู่ระบบด้วย Username และ Password ที่ถูกต้อง <br>2. ไปหน้า “ข้อมูลส่วนตัว” <br>3. กด Edit → Password <br>4. กรอก Current Password = Admin1234@ <br>5. กรอก New Password = P@ssw0rd <br>6. กรอก Confirm Password = P@ssw0rd <br>7. กด Update Password | ระบบแสดงข้อความ “Password updated successfully” และสามารถ Login ด้วยรหัสใหม่ได้ | Completed |

---

## Negative Test Cases

 TC ID | Test Scenario | Test Steps | Expected Result | Status |
|-------|---------------|------------|-----------------|--------|
| UP-002 | Current Password ว่าง                       | 1. ไปที่หน้า Edit Password <br>2. เว้น Current Password ว่าง <br>3. กรอก New Password และ Confirm Password ถูกต้อง <br>4. กด Update                            | Notification message error            | Completed |
| UP-003 | New Password ว่าง                           | 1. ไปที่หน้า Edit Password <br>2. กรอก Current Password ถูกต้อง <br>3. เว้น New Password ว่าง <br>4. กรอก Confirm Password <br>5. กด Update                    | Notification message error                | Completed |
| UP-004 | Confirm Password ว่าง                       | 1. ไปที่หน้า Edit Password <br>2. กรอก Current Password และ New Password <br>3. เว้น Confirm Password ว่าง <br>4. กด Update                                    | Notification message error              | Completed |
| UP-005 | New Password และ Confirm Password ไม่ตรงกัน | 1. ไปที่หน้า Edit Password <br>2. กรอก Current Password ถูกต้อง <br>3. กรอก New Password = P@ssw0rd <br>4. กรอก Confirm Password = Admin1234@ <br>5. กด Update | Notification message error                  | Completed |
| UP-006 | Password น้อยกว่า 8 ตัวอักษร                | 1. ไปที่หน้า Edit Password <br>2. กรอก Current Password ถูกต้อง <br>3. กรอก New Password = Admin1 <br>4. กรอก Confirm Password = Admin1 <br>5. กด Update       | Notification message error   | Completed |
