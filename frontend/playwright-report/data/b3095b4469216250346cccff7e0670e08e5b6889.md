# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 1: Authentication Lifecycle & Account Lockout
- Location: tests-e2e/e2e-flows.spec.ts:42:7

# Error details

```
Error: Command failed: python3 /Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/scripts/seed_test_org.py "E2E Test Org" "e2e_admin_52330@forgeflow.local" "SuperPassword123!"
Traceback (most recent call last):
  File "/Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/scripts/seed_test_org.py", line 12, in <module>
    from app.common.database import SessionLocal
  File "/Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/app/common/database.py", line 2, in <module>
    from sqlalchemy import create_engine, Column, DateTime
ModuleNotFoundError: No module named 'sqlalchemy'

```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { execSync } from "child_process";
  3   | import * as path from "path";
  4   | import * as fs from "fs";
  5   | 
  6   | // Helper to run backend seeding/teardown commands
  7   | function runSeeding(orgName: string, email: string, pass: string) {
  8   |   const scriptPath = path.resolve(__dirname, "../../backend/scripts/seed_test_org.py");
> 9   |   const result = execSync(`python3 ${scriptPath} "${orgName}" "${email}" "${pass}"`, { encoding: "utf8" });
      |                          ^ Error: Command failed: python3 /Users/anmoljangra/Downloads/Project/FogreFlow/ForgeFlow/backend/scripts/seed_test_org.py "E2E Test Org" "e2e_admin_52330@forgeflow.local" "SuperPassword123!"
  10  |   return JSON.parse(result);
  11  | }
  12  | 
  13  | function runTeardown(orgId: number, userId: number) {
  14  |   const scriptPath = path.resolve(__dirname, "../../backend/scripts/teardown_test_org.py");
  15  |   execSync(`python3 ${scriptPath} ${orgId} ${userId}`);
  16  | }
  17  | 
  18  | test.describe("ForgeFlow E2E Critical Flows", () => {
  19  |   let seededData: any = null;
  20  |   const adminEmail = `e2e_admin_${Math.floor(Math.random() * 100000)}@forgeflow.local`;
  21  |   const adminPassword = "SuperPassword123!";
  22  | 
  23  |   test.beforeEach(() => {
  24  |     // Seed an isolated organization for each test case
  25  |     seededData = runSeeding("E2E Test Org", adminEmail, adminPassword);
  26  |     if (seededData.error) {
  27  |       throw new Error(`Seeding failed: ${seededData.error}`);
  28  |     }
  29  |   });
  30  | 
  31  |   test.afterEach(() => {
  32  |     if (seededData && seededData.org_id && seededData.user_id) {
  33  |       try {
  34  |         runTeardown(seededData.org_id, seededData.user_id);
  35  |       } catch (err) {
  36  |         console.error("Cleanup failed:", err);
  37  |       }
  38  |     }
  39  |   });
  40  | 
  41  |   // Flow 1: Full Authentication Lifecycle
  42  |   test("Flow 1: Authentication Lifecycle & Account Lockout", async ({ page }) => {
  43  |     // 1. Go to register page
  44  |     await page.goto("/register");
  45  |     await page.fill('input[type="email"]', `user_${Math.floor(Math.random() * 10000)}@e2e.local`);
  46  |     await page.fill('input[placeholder*="Password"]', "SecurePass1!");
  47  |     await page.fill('input[placeholder*="Full Name"]', "E2E Registrant");
  48  |     
  49  |     // Simulate turnstile checked
  50  |     await page.evaluate(() => {
  51  |       // Mock turnstile token insertion if present
  52  |       const input = document.createElement("input");
  53  |       input.type = "hidden";
  54  |       input.name = "cf-turnstile-response";
  55  |       input.value = "mocked-turnstile-response-token";
  56  |       document.querySelector("form")?.appendChild(input);
  57  |     });
  58  | 
  59  |     // We skip actual email verify/MFA TOTP code extraction in client E2E if mock authentication modes are toggled,
  60  |     // but we simulate the authentication flow steps.
  61  |     await page.goto("/login");
  62  |     await page.fill('input[type="email"]', adminEmail);
  63  |     await page.fill('input[type="password"]', adminPassword);
  64  |     await page.click('button[type="submit"]');
  65  | 
  66  |     // Confirm redirected to dashboard
  67  |     await expect(page).toHaveURL(/.*dashboard/);
  68  | 
  69  |     // Logout
  70  |     await page.click('button[title="Sign Out"]');
  71  |     await expect(page).toHaveURL(/.*login/);
  72  | 
  73  |     // Trigger Account Lockout (5 failed attempts)
  74  |     for (let i = 0; i < 5; i++) {
  75  |       await page.fill('input[type="email"]', adminEmail);
  76  |       await page.fill('input[type="password"]', "wrong-password");
  77  |       await page.click('button[type="submit"]');
  78  |     }
  79  | 
  80  |     // Lockout UI/Notification validation
  81  |     await page.fill('input[type="email"]', adminEmail);
  82  |     await page.fill('input[type="password"]', adminPassword);
  83  |     await page.click('button[type="submit"]');
  84  |     await expect(page.locator("text=locked").or(page.locator("text=too many attempts")).or(page.locator("text=lockout"))).toBeVisible();
  85  |   });
  86  | 
  87  |   // Flow 2: Invoice Creation and PDF Download
  88  |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  89  |     // Bypass lockout by logging in with seed details
  90  |     await page.goto("/login");
  91  |     await page.fill('input[type="email"]', adminEmail);
  92  |     await page.fill('input[type="password"]', adminPassword);
  93  |     await page.click('button[type="submit"]');
  94  |     await expect(page).toHaveURL(/.*dashboard/);
  95  | 
  96  |     // Navigate to Invoices
  97  |     await page.goto("/invoices");
  98  | 
  99  |     // Add Client first
  100 |     await page.goto("/crm");
  101 |     await page.click("text=New Client");
  102 |     await page.fill('input[placeholder*="Client Name"]', "E2E Invoice Client");
  103 |     await page.fill('input[type="email"]', "client@invoice.local");
  104 |     await page.click("text=Save");
  105 | 
  106 |     // Create Invoice
  107 |     await page.goto("/invoices");
  108 |     await page.click("text=Create Invoice");
  109 |     
```