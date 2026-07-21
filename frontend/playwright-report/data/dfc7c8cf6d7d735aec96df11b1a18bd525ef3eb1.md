# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 1: Authentication Lifecycle & Account Lockout
- Location: tests-e2e/e2e-flows.spec.ts:118:7

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: page.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('button[type="submit"]')
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
          - generic [ref=e101]: "2"
          - generic [ref=e102]: "3"
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
  70  |   await page.waitForSelector("form input[type='email']");
  71  |   await page.evaluate(() => {
  72  |     (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  73  |   });
  74  |   await page.fill('input[type="email"]', email);
  75  |   await page.fill('input[type="password"]', pass);
> 76  |   await page.click('button[type="submit"]');
      |              ^ Error: page.click: Test timeout of 60000ms exceeded.
  77  |   if (pass !== "wrong-password") {
  78  |     await page.waitForURL(/.*dashboard/, { timeout: 15000 }).catch(() => null);
  79  |   }
  80  | }
  81  | 
  82  | test.describe("ForgeFlow E2E Critical Flows", () => {
  83  |   let seededData: any = null;
  84  |   let adminEmail = "";
  85  |   const adminPassword = "SuperPassword123!";
  86  | 
  87  |   test.beforeEach(async ({ page }) => {
  88  |     adminEmail = `e2e_admin_${Math.floor(Math.random() * 100000)}@forgeflow.com`;
  89  | 
  90  |     page.on('console', msg => {
  91  |       console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  92  |     });
  93  |     page.on('pageerror', err => {
  94  |       console.log(`BROWSER RUNTIME ERROR: ${err.message}`);
  95  |     });
  96  | 
  97  |     // Seed an isolated organization for each test case
  98  |     seededData = runSeeding("E2E Test Org", adminEmail, adminPassword);
  99  |     if (seededData.error) {
  100 |       throw new Error(`Seeding failed: ${seededData.error}`);
  101 |     }
  102 |   });
  103 | 
  104 |   test.afterEach(async ({ page }) => {
  105 |     try {
  106 |       await page.evaluate(() => localStorage.clear());
  107 |     } catch (e) {}
  108 |     if (seededData && seededData.org_id && seededData.user_id) {
  109 |       try {
  110 |         runTeardown(seededData.org_id, seededData.user_id);
  111 |       } catch (err) {
  112 |         console.error("Cleanup failed:", err);
  113 |       }
  114 |     }
  115 |   });
  116 | 
  117 |   // Flow 1: Full Authentication Lifecycle
  118 |   test("Flow 1: Authentication Lifecycle & Account Lockout", async ({ page }) => {
  119 |     test.setTimeout(60000);
  120 | 
  121 |     // 1. Go to register page
  122 |     await page.goto("/register");
  123 |     await page.fill('input[type="email"]', `user_${Math.floor(Math.random() * 10000)}@e2e.com`);
  124 |     await page.fill('#reg-password', "SecurePass1!");
  125 |     await page.fill('#reg-name', "E2E Registrant");
  126 |     
  127 |     // Simulate turnstile checked
  128 |     await page.evaluate(() => {
  129 |       (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  130 |     });
  131 | 
  132 |     await page.goto("/login");
  133 |     await submitLoginForm(page, adminEmail, adminPassword);
  134 | 
  135 |     // Confirm redirected to dashboard
  136 |     await expect(page).toHaveURL(/.*dashboard/);
  137 | 
  138 |     // Logout
  139 |     await page.evaluate(() => {
  140 |       localStorage.clear();
  141 |       document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  142 |       window.location.href = "/login";
  143 |     });
  144 |     await page.waitForURL(/.*login/);
  145 | 
  146 |     // Trigger Account Lockout (5 failed attempts)
  147 |     for (let i = 0; i < 5; i++) {
  148 |       await submitLoginForm(page, adminEmail, "wrong-password");
  149 |     }
  150 | 
  151 |     // Lockout UI/Notification validation
  152 |     await submitLoginForm(page, adminEmail, adminPassword);
  153 |     await expect(page.locator('.text-rose-400').or(page.locator("text=locked")).or(page.locator("text=too many attempts")).or(page.locator("text=lockout")).or(page.locator("text=Account locked"))).toBeVisible();
  154 | 
  155 |     // Flush Redis lockout state so adminEmail is unlocked for subsequent test flows
  156 |     try {
  157 |       execSync("redis-cli flushall");
  158 |     } catch (e) {}
  159 |   });
  160 | 
  161 |   // Flow 2: Invoice Creation and PDF Download
  162 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  163 |     // Bypass lockout by logging in with seed details
  164 |     await page.goto("/login");
  165 |     await submitLoginForm(page, adminEmail, adminPassword);
  166 |     await expect(page).toHaveURL(/.*dashboard/);
  167 | 
  168 |     // Add Client first in CRM
  169 |     await page.goto("/crm");
  170 |     await page.locator('button:has-text("New Client")').first().click();
  171 |     try {
  172 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  173 |     } catch (e) {
  174 |       await page.locator('button:has-text("New Client")').first().click();
  175 |     }
  176 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
```