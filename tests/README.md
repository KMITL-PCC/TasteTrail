# Testing by Playwright

- cd tests

## Run All Test 
- npx playwright test

##  Run Test on Folder

`E2E-Tests/`
System Testing 
- npx playwright test --project=E2E-Tests

---

## Run Flie Test

On Folders `E2E-Test/` you can run Each Test

- npx playwright test tests/E2E-Tests/Forgot.spec.js
- npx playwright test tests/E2E-Tests/login.spec.js
- npx playwright test tests/E2E-Tests/Register.spec.js
- npx playwright test tests/E2E-Tests/UpdatePasswd.spec.js

---

## See Test Report
- npx playwright show-report