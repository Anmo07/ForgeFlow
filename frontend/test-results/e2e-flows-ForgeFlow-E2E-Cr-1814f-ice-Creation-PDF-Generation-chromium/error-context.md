# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 2: Invoice Creation & PDF Generation
- Location: tests-e2e/e2e-flows.spec.ts:119:7

# Error details

```
Error: Seeding failed: When initializing mapper Mapper[Role(roles)], expression 'Permission' failed to locate a name ('Permission'). If this is a class name, consider adding this relationship() to the <class 'app.roles.models.Role'> class after both dependent classes have been defined.
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { execSync } from "child_process";
  3   | import * as path from "path";
  4   | import * as fs from "fs";
  5   | 
  6   | function getEnvFromRoot() {
  7   |   const envPath = path.resolve(__dirname, "../../.env");
  8   |   const envVars: Record<string, string> = { ...process.env };
  9   |   if (fs.existsSync(envPath)) {
  10  |     const content = fs.readFileSync(envPath, "utf8");
  11  |     content.split("\n").forEach(line => {
  12  |       const match = line.trim().match(/^([\w.\-]+)\s*=\s*(.*)?\s*$/);
  13  |       if (match) {
  14  |         const key = match[1];
  15  |         let value = match[2] || "";
  16  |         if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
  17  |           value = value.substring(1, value.length - 1);
  18  |         }
  19  |         if (value.length > 0 && value.startsWith("'") && value.endsWith("'")) {
  20  |           value = value.substring(1, value.length - 1);
  21  |         }
  22  |         envVars[key] = value;
  23  |       }
  24  |     });
  25  |   }
  26  |   return envVars;
  27  | }
  28  | 
  29  | // Helper to run backend seeding/teardown commands
  30  | function runSeeding(orgName: string, email: string, pass: string) {
  31  |   const pythonPath = path.resolve(__dirname, "../../backend/.venv/bin/python");
  32  |   const scriptPath = path.resolve(__dirname, "../../backend/scripts/seed_test_org.py");
  33  |   const result = execSync(
  34  |     `"${pythonPath}" "${scriptPath}" "${orgName}" "${email}" "${pass}"`,
  35  |     { encoding: "utf8", env: getEnvFromRoot() }
  36  |   );
  37  |   return JSON.parse(result);
  38  | }
  39  | 
  40  | function runTeardown(orgId: number, userId: number) {
  41  |   const pythonPath = path.resolve(__dirname, "../../backend/.venv/bin/python");
  42  |   const scriptPath = path.resolve(__dirname, "../../backend/scripts/teardown_test_org.py");
  43  |   execSync(
  44  |     `"${pythonPath}" "${scriptPath}" ${orgId} ${userId}`,
  45  |     { env: getEnvFromRoot() }
  46  |   );
  47  | }
  48  | 
  49  | test.describe("ForgeFlow E2E Critical Flows", () => {
  50  |   let seededData: any = null;
  51  |   const adminEmail = `e2e_admin_${Math.floor(Math.random() * 100000)}@forgeflow.local`;
  52  |   const adminPassword = "SuperPassword123!";
  53  | 
  54  |   test.beforeEach(() => {
  55  |     // Seed an isolated organization for each test case
  56  |     seededData = runSeeding("E2E Test Org", adminEmail, adminPassword);
  57  |     if (seededData.error) {
> 58  |       throw new Error(`Seeding failed: ${seededData.error}`);
      |             ^ Error: Seeding failed: When initializing mapper Mapper[Role(roles)], expression 'Permission' failed to locate a name ('Permission'). If this is a class name, consider adding this relationship() to the <class 'app.roles.models.Role'> class after both dependent classes have been defined.
  59  |     }
  60  |   });
  61  | 
  62  |   test.afterEach(() => {
  63  |     if (seededData && seededData.org_id && seededData.user_id) {
  64  |       try {
  65  |         runTeardown(seededData.org_id, seededData.user_id);
  66  |       } catch (err) {
  67  |         console.error("Cleanup failed:", err);
  68  |       }
  69  |     }
  70  |   });
  71  | 
  72  |   // Flow 1: Full Authentication Lifecycle
  73  |   test("Flow 1: Authentication Lifecycle & Account Lockout", async ({ page }) => {
  74  |     // 1. Go to register page
  75  |     await page.goto("/register");
  76  |     await page.fill('input[type="email"]', `user_${Math.floor(Math.random() * 10000)}@e2e.local`);
  77  |     await page.fill('input[placeholder*="Password"]', "SecurePass1!");
  78  |     await page.fill('input[placeholder*="Full Name"]', "E2E Registrant");
  79  |     
  80  |     // Simulate turnstile checked
  81  |     await page.evaluate(() => {
  82  |       // Mock turnstile token insertion if present
  83  |       const input = document.createElement("input");
  84  |       input.type = "hidden";
  85  |       input.name = "cf-turnstile-response";
  86  |       input.value = "mocked-turnstile-response-token";
  87  |       document.querySelector("form")?.appendChild(input);
  88  |     });
  89  | 
  90  |     // We skip actual email verify/MFA TOTP code extraction in client E2E if mock authentication modes are toggled,
  91  |     // but we simulate the authentication flow steps.
  92  |     await page.goto("/login");
  93  |     await page.fill('input[type="email"]', adminEmail);
  94  |     await page.fill('input[type="password"]', adminPassword);
  95  |     await page.click('button[type="submit"]');
  96  | 
  97  |     // Confirm redirected to dashboard
  98  |     await expect(page).toHaveURL(/.*dashboard/);
  99  | 
  100 |     // Logout
  101 |     await page.click('button[title="Sign Out"]');
  102 |     await expect(page).toHaveURL(/.*login/);
  103 | 
  104 |     // Trigger Account Lockout (5 failed attempts)
  105 |     for (let i = 0; i < 5; i++) {
  106 |       await page.fill('input[type="email"]', adminEmail);
  107 |       await page.fill('input[type="password"]', "wrong-password");
  108 |       await page.click('button[type="submit"]');
  109 |     }
  110 | 
  111 |     // Lockout UI/Notification validation
  112 |     await page.fill('input[type="email"]', adminEmail);
  113 |     await page.fill('input[type="password"]', adminPassword);
  114 |     await page.click('button[type="submit"]');
  115 |     await expect(page.locator("text=locked").or(page.locator("text=too many attempts")).or(page.locator("text=lockout"))).toBeVisible();
  116 |   });
  117 | 
  118 |   // Flow 2: Invoice Creation and PDF Download
  119 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  120 |     // Bypass lockout by logging in with seed details
  121 |     await page.goto("/login");
  122 |     await page.fill('input[type="email"]', adminEmail);
  123 |     await page.fill('input[type="password"]', adminPassword);
  124 |     await page.click('button[type="submit"]');
  125 |     await expect(page).toHaveURL(/.*dashboard/);
  126 | 
  127 |     // Navigate to Invoices
  128 |     await page.goto("/invoices");
  129 | 
  130 |     // Add Client first
  131 |     await page.goto("/crm");
  132 |     await page.click("text=New Client");
  133 |     await page.fill('input[placeholder*="Client Name"]', "E2E Invoice Client");
  134 |     await page.fill('input[type="email"]', "client@invoice.local");
  135 |     await page.click("text=Save");
  136 | 
  137 |     // Create Invoice
  138 |     await page.goto("/invoices");
  139 |     await page.click("text=Create Invoice");
  140 |     
  141 |     // Fill Invoice form
  142 |     await page.selectOption("select", { label: "E2E Invoice Client" });
  143 |     await page.fill('input[type="date"]', new Date().toISOString().split("T")[0]);
  144 |     // Set 3 line items
  145 |     await page.fill('input[placeholder="Item description"]', "Item 1");
  146 |     await page.fill('input[placeholder="Qty"]', "2");
  147 |     await page.fill('input[placeholder="Price"]', "50");
  148 | 
  149 |     await page.click("text=Add Line Item");
  150 |     await page.fill('input[placeholder="Item description"] >> nth=1', "Item 2");
  151 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  152 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  153 | 
  154 |     await page.click("text=Add Line Item");
  155 |     await page.fill('input[placeholder="Item description"] >> nth=2', "Item 3");
  156 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  157 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  158 | 
```