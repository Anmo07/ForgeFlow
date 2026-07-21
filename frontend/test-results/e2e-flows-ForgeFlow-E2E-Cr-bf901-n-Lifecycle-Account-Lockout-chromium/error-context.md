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
Error: page.waitForSelector: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('button[type=\'submit\']:not([disabled])') to be visible
    - waiting for" http://localhost:3000/dashboard" navigation to finish...
    - navigated to "http://localhost:3000/dashboard"

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]: Dashboard
      - generic [ref=e6]:
        - button "Search... ⌘K" [ref=e7]:
          - generic [ref=e8]:
            - img [ref=e9]
            - generic [ref=e12]: Search...
          - generic [ref=e13]: ⌘K
        - button "Toggle theme" [ref=e14]:
          - img [ref=e15]
        - button "Notifications" [ref=e17]:
          - img [ref=e18]
        - button "User profile menu" [ref=e23] [cursor=pointer]:
          - generic [ref=e24]: W
          - img [ref=e25]
    - complementary [ref=e27]:
      - generic [ref=e28]:
        - generic [ref=e29]:
          - link "ForgeFlow" [ref=e30] [cursor=pointer]:
            - /url: /dashboard
          - button "NovaTech IT Solutions" [expanded] [ref=e33]:
            - generic [ref=e34]: NovaTech IT Solutions
            - img [ref=e35]
        - navigation [ref=e37]:
          - link "Dashboard" [ref=e38] [cursor=pointer]:
            - /url: /dashboard
            - generic [ref=e40]:
              - img [ref=e41]
              - generic [ref=e46]: Dashboard
          - link "Projects" [ref=e47] [cursor=pointer]:
            - /url: /projects
            - generic [ref=e48]:
              - img [ref=e49]
              - generic [ref=e51]: Projects
          - link "CRM" [ref=e52] [cursor=pointer]:
            - /url: /crm
            - generic [ref=e53]:
              - img [ref=e54]
              - generic [ref=e59]: CRM
          - link "Invoices" [ref=e60] [cursor=pointer]:
            - /url: /invoices
            - generic [ref=e61]:
              - img [ref=e62]
              - generic [ref=e65]: Invoices
          - link "Org Settings" [ref=e66] [cursor=pointer]:
            - /url: /settings/members
            - generic [ref=e67]:
              - img [ref=e68]
              - generic [ref=e69]: Org Settings
        - generic [ref=e70]:
          - generic [ref=e71]:
            - generic [ref=e72]: W
            - generic [ref=e73]:
              - generic [ref=e74]: Workspace Owner
              - generic [ref=e75]: user@company.com
          - button "Sign Out" [ref=e76]:
            - img [ref=e77]
    - main [ref=e80]:
      - generic [ref=e82]:
        - generic [ref=e83]:
          - generic [ref=e84]:
            - generic [ref=e85]:
              - img [ref=e86]
              - text: Operations Overview
            - heading "Welcome back, Workspace Owner" [level=1] [ref=e89]
            - paragraph [ref=e90]: Here is a summary of what's happening at NovaTech IT Solutions today.
          - generic [ref=e91]:
            - link "Manage Projects" [ref=e92] [cursor=pointer]:
              - /url: /projects
            - link "New Invoice" [ref=e93] [cursor=pointer]:
              - /url: /invoices
              - img [ref=e94]
              - text: New Invoice
        - generic [ref=e95]:
          - generic [ref=e96]:
            - generic [ref=e97]:
              - img [ref=e99]
              - generic [ref=e102]: +5.8%
            - generic [ref=e103]:
              - paragraph [ref=e104]: "1"
              - paragraph [ref=e105]: Active Projects
            - img [ref=e106]
          - generic [ref=e108]:
            - generic [ref=e109]:
              - img [ref=e111]
              - generic [ref=e114]: +12.4%
            - generic [ref=e115]:
              - paragraph [ref=e116]: $125,000
              - paragraph [ref=e117]: Pipeline Value
            - img [ref=e118]
          - generic [ref=e120]:
            - generic [ref=e121]:
              - img [ref=e123]
              - generic [ref=e126]: +8.2%
            - generic [ref=e127]:
              - paragraph [ref=e128]: $45,000
              - paragraph [ref=e129]: Won Deals
            - img [ref=e130]
          - generic [ref=e132]:
            - generic [ref=e133]:
              - img [ref=e135]
              - generic [ref=e137]: "-3.2%"
            - generic [ref=e138]:
              - paragraph [ref=e139]: $22,100
              - paragraph [ref=e140]: Outstanding
            - img [ref=e141]
        - generic [ref=e143]:
          - generic [ref=e144]:
            - generic [ref=e145]:
              - heading "Projects Snapshot" [level=3] [ref=e146]:
                - img [ref=e147]
                - text: Projects Snapshot
              - link "View all" [ref=e150] [cursor=pointer]:
                - /url: /projects
                - text: View all
                - img [ref=e151]
            - 'link "E2E Projects Space Project ID: #1" [ref=e154] [cursor=pointer]':
              - /url: /projects/1
              - generic [ref=e155]:
                - img [ref=e157]
                - generic [ref=e160]:
                  - heading "E2E Projects Space" [level=4] [ref=e161]
                  - paragraph [ref=e162]: "Project ID: #1"
              - img [ref=e163]
          - generic [ref=e166]:
            - heading "Recent Activity" [level=3] [ref=e168]:
              - img [ref=e169]
              - text: Recent Activity
            - generic [ref=e174]:
              - img [ref=e175]
              - generic [ref=e179]: No recent activity logs.
  - generic [ref=e184] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e185]:
      - img [ref=e186]
    - generic [ref=e189]:
      - button "Open issues overlay" [ref=e190]:
        - generic [ref=e191]:
          - generic [ref=e192]: "3"
          - generic [ref=e193]: "4"
        - generic [ref=e194]:
          - text: Issue
          - generic [ref=e195]: s
      - button "Collapse issues badge" [ref=e196]:
        - img [ref=e197]
  - alert [ref=e199]
  - generic [ref=e200]:
    - img [ref=e202]
    - button "Open Tanstack query devtools" [ref=e250] [cursor=pointer]:
      - img [ref=e251]
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
> 71  |   await page.waitForSelector("button[type='submit']:not([disabled])");
      |              ^ Error: page.waitForSelector: Test timeout of 60000ms exceeded.
  72  |   await page.evaluate(() => {
  73  |     (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  74  |   });
  75  |   await page.fill('input[type="email"]', email);
  76  |   await page.fill('input[type="password"]', pass);
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
```