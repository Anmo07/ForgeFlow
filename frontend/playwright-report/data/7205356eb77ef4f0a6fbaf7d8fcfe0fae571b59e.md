# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 1: Authentication Lifecycle & Account Lockout
- Location: tests-e2e/e2e-flows.spec.ts:115:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('form') to be visible
    - waiting for" http://localhost:3000/login" navigation to finish...
    - navigated to "http://localhost:3000/dashboard"
    - waiting for" http://localhost:3000/dashboard" navigation to finish...
    - navigated to "http://localhost:3000/dashboard"
    - waiting for" http://localhost:3000/login" navigation to finish...

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]:
        - link "ForgeFlow" [ref=e7] [cursor=pointer]:
          - /url: /
          - generic [ref=e8]: ForgeFlow
        - generic [ref=e9]:
          - navigation [ref=e11]:
            - list [ref=e12]:
              - listitem [ref=e13]:
                - link "Home" [ref=e14] [cursor=pointer]:
                  - /url: /
              - listitem [ref=e15]:
                - link "Features" [ref=e16] [cursor=pointer]:
                  - /url: /#features
              - listitem [ref=e17]:
                - link "Pricing" [ref=e18] [cursor=pointer]:
                  - /url: /#pricing
              - listitem [ref=e19]:
                - link "About" [ref=e20] [cursor=pointer]:
                  - /url: /#about
              - listitem [ref=e21]:
                - link "Contact" [ref=e22] [cursor=pointer]:
                  - /url: /#contact
          - generic [ref=e23]:
            - link "Sign In" [ref=e24] [cursor=pointer]:
              - /url: /login
            - link "Sign Up" [ref=e25] [cursor=pointer]:
              - /url: /register
            - button "theme toggler" [ref=e27] [cursor=pointer]:
              - img [ref=e28]
    - img [ref=e32]
    - contentinfo [ref=e34]:
      - generic [ref=e36]:
        - generic [ref=e37]:
          - generic [ref=e39]:
            - link "ForgeFlow" [ref=e40] [cursor=pointer]:
              - /url: /
              - generic [ref=e41]: ForgeFlow
            - paragraph [ref=e42]: The unified command center and billing automation engine for modern IT Managed Service Providers.
            - generic [ref=e43]:
              - link "Facebook" [ref=e44] [cursor=pointer]:
                - /url: /
                - img [ref=e45]
              - link "Twitter" [ref=e47] [cursor=pointer]:
                - /url: /
                - img [ref=e48]
              - link "YouTube" [ref=e50] [cursor=pointer]:
                - /url: /
                - img [ref=e51]
              - link "LinkedIn" [ref=e53] [cursor=pointer]:
                - /url: /
                - img [ref=e54]
          - generic [ref=e57]:
            - heading "Useful Links" [level=2] [ref=e58]
            - list [ref=e59]:
              - listitem [ref=e60]:
                - link "Features" [ref=e61] [cursor=pointer]:
                  - /url: /#features
              - listitem [ref=e62]:
                - link "Pricing" [ref=e63] [cursor=pointer]:
                  - /url: /#pricing
              - listitem [ref=e64]:
                - link "About" [ref=e65] [cursor=pointer]:
                  - /url: /#about
          - generic [ref=e67]:
            - heading "Terms" [level=2] [ref=e68]
            - list [ref=e69]:
              - listitem [ref=e70]:
                - link "TOS" [ref=e71] [cursor=pointer]:
                  - /url: /terms
              - listitem [ref=e72]:
                - link "Privacy Policy" [ref=e73] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e74]:
                - link "Refund Policy" [ref=e75] [cursor=pointer]:
                  - /url: /
          - generic [ref=e77]:
            - heading "Support & Help" [level=2] [ref=e78]
            - list [ref=e79]:
              - listitem [ref=e80]:
                - link "Open Support Ticket" [ref=e81] [cursor=pointer]:
                  - /url: /#contact
              - listitem [ref=e82]:
                - link "Terms of Use" [ref=e83] [cursor=pointer]:
                  - /url: /
              - listitem [ref=e84]:
                - link "About" [ref=e85] [cursor=pointer]:
                  - /url: /#about
        - paragraph [ref=e88]: © 2026 ForgeFlow. Built for IT Service Providers.
  - generic [ref=e93] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e94]:
      - img [ref=e95]
    - generic [ref=e98]:
      - button "Open issues overlay" [ref=e99]:
        - generic [ref=e100]:
          - generic [ref=e101]: "3"
          - generic [ref=e102]: "4"
        - generic [ref=e103]:
          - text: Issue
          - generic [ref=e104]: s
      - button "Collapse issues badge" [ref=e105]:
        - img [ref=e106]
  - alert [ref=e108]
  - generic [ref=e109]:
    - img [ref=e111]
    - button "Open Tanstack query devtools" [ref=e159] [cursor=pointer]:
      - img [ref=e160]
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
> 68  |   await page.waitForSelector("form");
      |              ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  69  |   await page.evaluate(() => {
  70  |     (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  71  |   });
  72  |   await page.fill('input[type="email"]', email);
  73  |   await page.fill('input[type="password"]', pass);
  74  |   const respPromise = page.waitForResponse((resp: any) => resp.url().includes("/api/auth/login"), { timeout: 5000 }).catch(() => null);
  75  |   await page.click('button[type="submit"]');
  76  |   await respPromise;
  77  | }
  78  | 
  79  | test.describe("ForgeFlow E2E Critical Flows", () => {
  80  |   let seededData: any = null;
  81  |   let adminEmail = "";
  82  |   const adminPassword = "SuperPassword123!";
  83  | 
  84  |   test.beforeEach(async ({ page }) => {
  85  |     adminEmail = `e2e_admin_${Math.floor(Math.random() * 100000)}@forgeflow.com`;
  86  | 
  87  |     page.on('console', msg => {
  88  |       console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  89  |     });
  90  |     page.on('pageerror', err => {
  91  |       console.log(`BROWSER RUNTIME ERROR: ${err.message}`);
  92  |     });
  93  | 
  94  |     // Seed an isolated organization for each test case
  95  |     seededData = runSeeding("E2E Test Org", adminEmail, adminPassword);
  96  |     if (seededData.error) {
  97  |       throw new Error(`Seeding failed: ${seededData.error}`);
  98  |     }
  99  |   });
  100 | 
  101 |   test.afterEach(async ({ page }) => {
  102 |     try {
  103 |       await page.evaluate(() => localStorage.clear());
  104 |     } catch (e) {}
  105 |     if (seededData && seededData.org_id && seededData.user_id) {
  106 |       try {
  107 |         runTeardown(seededData.org_id, seededData.user_id);
  108 |       } catch (err) {
  109 |         console.error("Cleanup failed:", err);
  110 |       }
  111 |     }
  112 |   });
  113 | 
  114 |   // Flow 1: Full Authentication Lifecycle
  115 |   test("Flow 1: Authentication Lifecycle & Account Lockout", async ({ page }) => {
  116 |     // 1. Go to register page
  117 |     await page.goto("/register");
  118 |     await page.fill('input[type="email"]', `user_${Math.floor(Math.random() * 10000)}@e2e.com`);
  119 |     await page.fill('#reg-password', "SecurePass1!");
  120 |     await page.fill('#reg-name', "E2E Registrant");
  121 |     
  122 |     // Simulate turnstile checked
  123 |     await page.evaluate(() => {
  124 |       (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  125 |     });
  126 | 
  127 |     await page.goto("/login");
  128 |     await submitLoginForm(page, adminEmail, adminPassword);
  129 | 
  130 |     // Confirm redirected to dashboard
  131 |     await expect(page).toHaveURL(/.*dashboard/);
  132 | 
  133 |     // Logout
  134 |     await page.locator('button[title="Sign Out"], button:has-text("Sign Out")').first().click({ force: true });
  135 |     await expect(page).toHaveURL(/.*(login|\/)$/);
  136 | 
  137 |     // Trigger Account Lockout (5 failed attempts)
  138 |     for (let i = 0; i < 5; i++) {
  139 |       await submitLoginForm(page, adminEmail, "wrong-password");
  140 |     }
  141 | 
  142 |     // Lockout UI/Notification validation
  143 |     await submitLoginForm(page, adminEmail, adminPassword);
  144 |     await expect(page.locator("text=locked").or(page.locator("text=too many attempts")).or(page.locator("text=lockout")).or(page.locator("text=Account locked"))).toBeVisible();
  145 |   });
  146 | 
  147 |   // Flow 2: Invoice Creation and PDF Download
  148 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  149 |     // Bypass lockout by logging in with seed details
  150 |     await page.goto("/login");
  151 |     await submitLoginForm(page, adminEmail, adminPassword);
  152 |     await expect(page).toHaveURL(/.*dashboard/);
  153 | 
  154 |     // Add Client first in CRM
  155 |     await page.goto("/crm");
  156 |     await page.waitForLoadState("networkidle");
  157 |     await page.locator('button:has-text("New Client")').first().click();
  158 |     try {
  159 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  160 |     } catch (e) {
  161 |       await page.locator('button:has-text("New Client")').first().click();
  162 |     }
  163 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  164 |     await page.fill('input[type="email"]', "client@invoice.com");
  165 |     await page.locator('button[type="submit"]:has-text("Add Client")').click();
  166 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  167 | 
  168 |     // Create Invoice
```