# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 1: Authentication Lifecycle & Account Lockout
- Location: tests-e2e/e2e-flows.spec.ts:119:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.fill: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('input[type="password"]')
    - waiting for" http://localhost:3000/dashboard" navigation to finish...
    - navigated to "http://localhost:3000/dashboard"

```

# Page snapshot

```yaml
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
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { execSync, execFileSync } from "child_process";
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
  39  |   const envs = getEnvFromRoot();
  40  |   const result = execFileSync(
  41  |     pythonPath,
  42  |     [scriptPath, orgName, email, pass],
  43  |     { encoding: "utf8", env: { ...process.env, ...envs }, cwd: backendPath }
  44  |   );
  45  |   const lines = result.split("\n");
  46  |   for (const line of lines) {
  47  |     const trimmed = line.trim();
  48  |     if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
  49  |       try {
  50  |         return JSON.parse(trimmed);
  51  |       } catch (e) {
  52  |         // ignore and continue
  53  |       }
  54  |     }
  55  |   }
  56  |   throw new Error(`Failed to find JSON output in seeding result: ${result}`);
  57  | }
  58  | 
  59  | function runTeardown(orgId: number, userId: number) {
  60  |   const pythonPath = path.resolve(__dirname, "../../backend/.venv/bin/python");
  61  |   const scriptPath = path.resolve(__dirname, "../../backend/scripts/teardown_test_org.py");
  62  |   const backendPath = path.resolve(__dirname, "../../backend");
  63  |   execSync(
  64  |     `"${pythonPath}" "${scriptPath}" ${orgId} ${userId}`,
  65  |     { env: getEnvFromRoot() as NodeJS.ProcessEnv, cwd: backendPath }
  66  |   );
  67  | }
  68  | 
  69  | async function submitLoginForm(page: any, email: string, pass: string) {
  70  |   await page.waitForLoadState("domcontentloaded");
  71  |   await page.waitForSelector("form input[type='email']");
  72  |   await page.evaluate(() => {
  73  |     (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  74  |   });
  75  |   await page.fill('input[type="email"]', email);
> 76  |   await page.fill('input[type="password"]', pass);
      |              ^ Error: page.fill: Test timeout of 60000ms exceeded.
  77  |   await page.click('button[type="submit"]');
  78  |   if (pass !== "wrong-password") {
  79  |     await page.waitForURL(/.*dashboard/, { timeout: 15000 }).catch(() => null);
  80  |   }
  81  | }
  82  | 
  83  | test.describe("ForgeFlow E2E Critical Flows", () => {
  84  |   let seededData: any = null;
  85  |   let adminEmail = "";
  86  |   const adminPassword = "SuperPassword123!";
  87  | 
  88  |   test.beforeEach(async ({ page }) => {
  89  |     adminEmail = `e2e_admin_${Math.floor(Math.random() * 100000)}@forgeflow.com`;
  90  | 
  91  |     page.on('console', msg => {
  92  |       console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  93  |     });
  94  |     page.on('pageerror', err => {
  95  |       console.log(`BROWSER RUNTIME ERROR: ${err.message}`);
  96  |     });
  97  | 
  98  |     // Seed an isolated organization for each test case
  99  |     seededData = runSeeding("E2E Test Org", adminEmail, adminPassword);
  100 |     if (seededData.error) {
  101 |       throw new Error(`Seeding failed: ${seededData.error}`);
  102 |     }
  103 |   });
  104 | 
  105 |   test.afterEach(async ({ page }) => {
  106 |     try {
  107 |       await page.evaluate(() => localStorage.clear());
  108 |     } catch (e) {}
  109 |     if (seededData && seededData.org_id && seededData.user_id) {
  110 |       try {
  111 |         runTeardown(seededData.org_id, seededData.user_id);
  112 |       } catch (err) {
  113 |         console.error("Cleanup failed:", err);
  114 |       }
  115 |     }
  116 |   });
  117 | 
  118 |   // Flow 1: Full Authentication Lifecycle
  119 |   test("Flow 1: Authentication Lifecycle & Account Lockout", async ({ page }) => {
  120 |     test.setTimeout(60000);
  121 | 
  122 |     // 1. Go to register page
  123 |     await page.goto("/register");
  124 |     await page.fill('input[type="email"]', `user_${Math.floor(Math.random() * 10000)}@e2e.com`);
  125 |     await page.fill('#reg-password', "SecurePass1!");
  126 |     await page.fill('#reg-name', "E2E Registrant");
  127 |     
  128 |     // Simulate turnstile checked
  129 |     await page.evaluate(() => {
  130 |       (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  131 |     });
  132 | 
  133 |     await page.goto("/login");
  134 |     await submitLoginForm(page, adminEmail, adminPassword);
  135 | 
  136 |     // Confirm redirected to dashboard
  137 |     await expect(page).toHaveURL(/.*dashboard/);
  138 | 
  139 |     // Logout
  140 |     await page.evaluate(() => {
  141 |       localStorage.clear();
  142 |       document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  143 |       window.location.href = "/login";
  144 |     });
  145 |     await page.waitForURL(/.*login/);
  146 | 
  147 |     // Trigger Account Lockout (5 failed attempts)
  148 |     for (let i = 0; i < 5; i++) {
  149 |       await submitLoginForm(page, adminEmail, "wrong-password");
  150 |     }
  151 | 
  152 |     // Lockout UI/Notification validation
  153 |     await submitLoginForm(page, adminEmail, adminPassword);
  154 |     await expect(page.locator('.text-rose-400').or(page.locator("text=locked")).or(page.locator("text=too many attempts")).or(page.locator("text=lockout")).or(page.locator("text=Account locked"))).toBeVisible();
  155 | 
  156 |     // Flush Redis lockout state so adminEmail is unlocked for subsequent test flows
  157 |     try {
  158 |       execSync("redis-cli flushall");
  159 |     } catch (e) {}
  160 |   });
  161 | 
  162 |   // Flow 2: Invoice Creation and PDF Download
  163 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  164 |     // Bypass lockout by logging in with seed details
  165 |     await page.goto("/login");
  166 |     await submitLoginForm(page, adminEmail, adminPassword);
  167 |     await expect(page).toHaveURL(/.*dashboard/);
  168 | 
  169 |     // Add Client first in CRM
  170 |     await page.goto("/crm");
  171 |     await page.locator('button:has-text("New Client")').first().click();
  172 |     try {
  173 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  174 |     } catch (e) {
  175 |       await page.locator('button:has-text("New Client")').first().click();
  176 |     }
```