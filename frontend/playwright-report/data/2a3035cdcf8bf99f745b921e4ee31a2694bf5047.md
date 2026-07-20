# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 1: Authentication Lifecycle & Account Lockout
- Location: tests-e2e/e2e-flows.spec.ts:114:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Test timeout of 30000ms exceeded while running "afterEach" hook.
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { execSync } from "child_process";
  3   | import * as path from "path";
  4   | import * as fs from "fs";
  5   | 
  6   | function getEnvFromRoot(): Record<string, string> {
  7   |   const envPath = path.resolve(__dirname, "../../.env");
  8   |   const envVars: Record<string, string> = {};
  9   |   for (const [key, val] of Object.entries(process.env)) {
  10  |     if (val !== undefined) {
  11  |       envVars[key] = val;
  12  |     }
  13  |   }
  14  |   if (fs.existsSync(envPath)) {
  15  |     const content = fs.readFileSync(envPath, "utf8");
  16  |     content.split("\n").forEach(line => {
  17  |       const match = line.trim().match(/^([\w.\-]+)\s*=\s*(.*)?\s*$/);
  18  |       if (match) {
  19  |         const key = match[1];
  20  |         let value = match[2] || "";
  21  |         if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
  22  |           value = value.substring(1, value.length - 1);
  23  |         }
  24  |         if (value.length > 0 && value.startsWith("'") && value.endsWith("'")) {
  25  |           value = value.substring(1, value.length - 1);
  26  |         }
  27  |         envVars[key] = value;
  28  |       }
  29  |     });
  30  |   }
  31  |   return envVars;
  32  | }
  33  | 
  34  | // Helper to run backend seeding/teardown commands
  35  | function runSeeding(orgName: string, email: string, pass: string) {
  36  |   const pythonPath = path.resolve(__dirname, "../../backend/.venv/bin/python");
  37  |   const scriptPath = path.resolve(__dirname, "../../backend/scripts/seed_test_org.py");
  38  |   const backendPath = path.resolve(__dirname, "../../backend");
  39  |   const result = execSync(
  40  |     `"${pythonPath}" "${scriptPath}" "${orgName}" "${email}" "${pass}"`,
  41  |     { encoding: "utf8", env: getEnvFromRoot() as NodeJS.ProcessEnv, cwd: backendPath }
  42  |   );
  43  |   const lines = result.split("\n");
  44  |   for (const line of lines) {
  45  |     const trimmed = line.trim();
  46  |     if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
  47  |       try {
  48  |         return JSON.parse(trimmed);
  49  |       } catch (e) {
  50  |         // ignore and continue
  51  |       }
  52  |     }
  53  |   }
  54  |   throw new Error(`Failed to find JSON output in seeding result: ${result}`);
  55  | }
  56  | 
  57  | function runTeardown(orgId: number, userId: number) {
  58  |   const pythonPath = path.resolve(__dirname, "../../backend/.venv/bin/python");
  59  |   const scriptPath = path.resolve(__dirname, "../../backend/scripts/teardown_test_org.py");
  60  |   const backendPath = path.resolve(__dirname, "../../backend");
  61  |   execSync(
  62  |     `"${pythonPath}" "${scriptPath}" ${orgId} ${userId}`,
  63  |     { env: getEnvFromRoot() as NodeJS.ProcessEnv, cwd: backendPath }
  64  |   );
  65  | }
  66  | 
  67  | async function submitLoginForm(page: any, email: string, pass: string) {
  68  |   await page.waitForSelector("form");
  69  |   await page.evaluate(() => {
  70  |     localStorage.clear();
  71  |     (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  72  |   });
  73  |   await page.fill('input[type="email"]', email);
  74  |   await page.fill('input[type="password"]', pass);
  75  |   await page.click('button[type="submit"]');
  76  | }
  77  | 
  78  | test.describe("ForgeFlow E2E Critical Flows", () => {
  79  |   let seededData: any = null;
  80  |   let adminEmail = "";
  81  |   const adminPassword = "SuperPassword123!";
  82  | 
  83  |   test.beforeEach(async ({ page }) => {
  84  |     adminEmail = `e2e_admin_${Math.floor(Math.random() * 100000)}@forgeflow.com`;
  85  | 
  86  |     page.on('console', msg => {
  87  |       console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  88  |     });
  89  |     page.on('pageerror', err => {
  90  |       console.log(`BROWSER RUNTIME ERROR: ${err.message}`);
  91  |     });
  92  | 
  93  |     // Seed an isolated organization for each test case
  94  |     seededData = runSeeding("E2E Test Org", adminEmail, adminPassword);
  95  |     if (seededData.error) {
  96  |       throw new Error(`Seeding failed: ${seededData.error}`);
  97  |     }
  98  |   });
  99  | 
> 100 |   test.afterEach(async ({ page }) => {
      |        ^ Test timeout of 30000ms exceeded while running "afterEach" hook.
  101 |     try {
  102 |       await page.evaluate(() => localStorage.clear());
  103 |     } catch (e) {}
  104 |     if (seededData && seededData.org_id && seededData.user_id) {
  105 |       try {
  106 |         runTeardown(seededData.org_id, seededData.user_id);
  107 |       } catch (err) {
  108 |         console.error("Cleanup failed:", err);
  109 |       }
  110 |     }
  111 |   });
  112 | 
  113 |   // Flow 1: Full Authentication Lifecycle
  114 |   test("Flow 1: Authentication Lifecycle & Account Lockout", async ({ page }) => {
  115 |     // 1. Go to register page
  116 |     await page.goto("/register");
  117 |     await page.fill('input[type="email"]', `user_${Math.floor(Math.random() * 10000)}@e2e.com`);
  118 |     await page.fill('#reg-password', "SecurePass1!");
  119 |     await page.fill('#reg-name', "E2E Registrant");
  120 |     
  121 |     // Simulate turnstile checked
  122 |     await page.evaluate(() => {
  123 |       (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  124 |     });
  125 | 
  126 |     // We skip actual email verify/MFA TOTP code extraction in client E2E if mock authentication modes are toggled,
  127 |     // but we simulate the authentication flow steps.
  128 |     await page.goto("/login");
  129 |     await submitLoginForm(page, adminEmail, adminPassword);
  130 | 
  131 |     // Confirm redirected to dashboard
  132 |     await expect(page).toHaveURL(/.*dashboard/);
  133 | 
  134 |     // Logout
  135 |     await page.click('button[title="Sign Out"]', { force: true });
  136 |     await expect(page).toHaveURL(/.*(login|\/)$/);
  137 | 
  138 |     // Trigger Account Lockout (5 failed attempts)
  139 |     for (let i = 0; i < 5; i++) {
  140 |       await submitLoginForm(page, adminEmail, "wrong-password");
  141 |     }
  142 | 
  143 |     // Lockout UI/Notification validation
  144 |     await submitLoginForm(page, adminEmail, adminPassword);
  145 |     await expect(page.locator("text=locked").or(page.locator("text=too many attempts")).or(page.locator("text=lockout"))).toBeVisible();
  146 |   });
  147 | 
  148 |   // Flow 2: Invoice Creation and PDF Download
  149 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  150 |     // Bypass lockout by logging in with seed details
  151 |     await page.goto("/login");
  152 |     await submitLoginForm(page, adminEmail, adminPassword);
  153 |     await expect(page).toHaveURL(/.*dashboard/);
  154 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
  155 | 
  156 |     // Navigate to Invoices
  157 |     await page.goto("/invoices");
  158 | 
  159 |     // Add Client first
  160 |     await page.goto("/crm");
  161 |     await page.click("text=New Client");
  162 |     try {
  163 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  164 |     } catch (e) {
  165 |       await page.click("text=New Client");
  166 |     }
  167 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  168 |     await page.fill('input[type="email"]', "client@invoice.com");
  169 |     await page.click("text=Add Client");
  170 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  171 | 
  172 |     // Create Invoice
  173 |     await page.goto("/invoices");
  174 |     await page.click("text=Create Invoice");
  175 |     try {
  176 |       await page.waitForSelector('text=Create & Render', { timeout: 2000 });
  177 |     } catch (e) {
  178 |       await page.click("text=Create Invoice");
  179 |     }
  180 |     
  181 |     // Fill Invoice form
  182 |     const clientSelector = 'label:has-text("Client Organization") + select option:has-text("E2E Invoice Client")';
  183 |     await page.waitForSelector(clientSelector, { state: "attached" });
  184 |     const clientOptionVal = await page.locator(clientSelector).getAttribute("value");
  185 |     await page.selectOption('label:has-text("Client Organization") + select', clientOptionVal || "");
  186 |     const today = new Date().toISOString().split("T")[0];
  187 |     await page.fill('label:has-text("Issue Date") + input', today);
  188 |     await page.fill('label:has-text("Due Date") + input', today);
  189 |     // Set 3 line items
  190 |     await page.fill('input[placeholder*="product or service"]', "Item 1");
  191 |     await page.fill('input[placeholder="Qty"]', "2");
  192 |     await page.fill('input[placeholder="Price"]', "50");
  193 | 
  194 |     await page.click("text=Add Item");
  195 |     await page.fill('input[placeholder*="product or service"] >> nth=1', "Item 2");
  196 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  197 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  198 | 
  199 |     await page.click("text=Add Item");
  200 |     await page.fill('input[placeholder*="product or service"] >> nth=2', "Item 3");
```