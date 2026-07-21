# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 1: Authentication Lifecycle & Account Lockout
- Location: tests-e2e/e2e-flows.spec.ts:123:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*dashboard/
Received string:  "http://localhost:3000/login?"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × unexpected value "http://localhost:3000/login?"

```

```yaml
- link "ForgeFlow":
  - /url: /
- heading "Welcome back" [level=1]
- paragraph: Sign in to your encrypted MSP Command Center
- button "Sign In with Fingerprint (Requires HTTPS — available in production)" [disabled]
- text: Or Use Credentials Email Address
- textbox "Email Address":
  - /placeholder: name@company.com
- text: Password
- link "Forgot password?":
  - /url: "#"
- textbox "Password":
  - /placeholder: ••••••••
- button
- checkbox "Remember me on this machine (Encrypted Cookie)" [checked]
- text: Remember me on this machine (Encrypted Cookie)
- checkbox "Enable Fingerprint Sensor 2-Step Verification for easy login" [checked]
- text: Enable Fingerprint Sensor 2-Step Verification for easy login
- button "Sign In with Credentials"
- paragraph:
  - text: Don't have an account?
  - link "Sign Up":
    - /url: /register
```

# Test source

```ts
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
  71  |   await page.waitForSelector("#login-email");
  72  |   await page.waitForTimeout(500);
  73  |   await page.evaluate(() => {
  74  |     (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  75  |   });
  76  |   await page.fill('#login-email', email);
  77  |   await page.fill('#login-password', pass);
  78  |   await page.locator('#login-password').press('Enter');
  79  | 
  80  |   if (pass !== "wrong-password") {
  81  |     await page.waitForURL(/.*dashboard/, { timeout: 15000 }).catch(() => null);
  82  |   } else {
  83  |     await page.waitForTimeout(600);
  84  |   }
  85  | }
  86  | 
  87  | test.describe("ForgeFlow E2E Critical Flows", () => {
  88  |   let seededData: any = null;
  89  |   let adminEmail = "";
  90  |   const adminPassword = "SuperPassword123!";
  91  | 
  92  |   test.beforeEach(async ({ page }) => {
  93  |     adminEmail = `e2e_admin_${Math.floor(Math.random() * 100000)}@forgeflow.com`;
  94  | 
  95  |     page.on('console', msg => {
  96  |       console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  97  |     });
  98  |     page.on('pageerror', err => {
  99  |       console.log(`BROWSER RUNTIME ERROR: ${err.message}`);
  100 |     });
  101 | 
  102 |     // Seed an isolated organization for each test case
  103 |     seededData = runSeeding("E2E Test Org", adminEmail, adminPassword);
  104 |     if (seededData.error) {
  105 |       throw new Error(`Seeding failed: ${seededData.error}`);
  106 |     }
  107 |   });
  108 | 
  109 |   test.afterEach(async ({ page }) => {
  110 |     try {
  111 |       await page.evaluate(() => localStorage.clear());
  112 |     } catch (e) {}
  113 |     if (seededData && seededData.org_id && seededData.user_id) {
  114 |       try {
  115 |         runTeardown(seededData.org_id, seededData.user_id);
  116 |       } catch (err) {
  117 |         console.error("Cleanup failed:", err);
  118 |       }
  119 |     }
  120 |   });
  121 | 
  122 |   // Flow 1: Full Authentication Lifecycle
  123 |   test("Flow 1: Authentication Lifecycle & Account Lockout", async ({ page }) => {
  124 |     test.setTimeout(60000);
  125 | 
  126 |     // 1. Go to register page
  127 |     await page.goto("/register");
  128 |     await page.fill('input[type="email"]', `user_${Math.floor(Math.random() * 10000)}@e2e.com`);
  129 |     await page.fill('#reg-password', "SecurePass1!");
  130 |     await page.fill('#reg-name', "E2E Registrant");
  131 |     
  132 |     // Simulate turnstile checked
  133 |     await page.evaluate(() => {
  134 |       (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  135 |     });
  136 | 
  137 |     await page.goto("/login");
  138 |     await submitLoginForm(page, adminEmail, adminPassword);
  139 | 
  140 |     // Confirm redirected to dashboard
> 141 |     await expect(page).toHaveURL(/.*dashboard/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  142 | 
  143 |     // Logout
  144 |     await page.evaluate(() => {
  145 |       localStorage.clear();
  146 |       document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  147 |       window.location.href = "/login";
  148 |     });
  149 |     await page.waitForURL(/.*login/);
  150 | 
  151 |     // Trigger Account Lockout (5 failed attempts)
  152 |     for (let i = 0; i < 5; i++) {
  153 |       await submitLoginForm(page, adminEmail, "wrong-password");
  154 |     }
  155 | 
  156 |     // Lockout UI/Notification validation
  157 |     await submitLoginForm(page, adminEmail, adminPassword);
  158 |     await expect(page.locator('.text-rose-400').or(page.locator("text=locked")).or(page.locator("text=too many attempts")).or(page.locator("text=lockout")).or(page.locator("text=Account locked"))).toBeVisible();
  159 | 
  160 |     // Flush Redis lockout state so adminEmail is unlocked for subsequent test flows
  161 |     try {
  162 |       execSync("redis-cli flushall");
  163 |     } catch (e) {}
  164 |   });
  165 | 
  166 |   // Flow 2: Invoice Creation and PDF Download
  167 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  168 |     // Bypass lockout by logging in with seed details
  169 |     await page.goto("/login");
  170 |     await submitLoginForm(page, adminEmail, adminPassword);
  171 |     await expect(page).toHaveURL(/.*dashboard/);
  172 | 
  173 |     // Add Client first in CRM
  174 |     await page.goto("/crm");
  175 |     await page.locator('button:has-text("New Client")').first().click({ force: true });
  176 |     try {
  177 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  178 |     } catch (e) {
  179 |       await page.locator('button:has-text("New Client")').first().click({ force: true });
  180 |     }
  181 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  182 |     await page.fill('input[type="email"]', "client@invoice.com");
  183 |     await page.locator('button[type="submit"]:has-text("Add Client")').click({ force: true });
  184 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  185 | 
  186 |     // Create Invoice
  187 |     await page.goto("/invoices");
  188 |     await page.locator('button:has-text("Create Invoice")').first().click({ force: true });
  189 |     try {
  190 |       await page.waitForSelector('text=Create & Render', { timeout: 2000 });
  191 |     } catch (e) {
  192 |       await page.locator('button:has-text("Create Invoice")').first().click({ force: true });
  193 |     }
  194 |     
  195 |     // Fill Invoice form
  196 |     const clientSelector = 'label:has-text("Client Organization") + select option:has-text("E2E Invoice Client")';
  197 |     await page.waitForSelector(clientSelector, { state: "attached" });
  198 |     const clientOptionVal = await page.locator(clientSelector).getAttribute("value");
  199 |     await page.selectOption('label:has-text("Client Organization") + select', clientOptionVal || "");
  200 |     const today = new Date().toISOString().split("T")[0];
  201 |     await page.fill('label:has-text("Issue Date") + input', today);
  202 |     await page.fill('label:has-text("Due Date") + input', today);
  203 |     // Set 3 line items
  204 |     await page.fill('input[placeholder*="product or service"]', "Item 1");
  205 |     await page.fill('input[placeholder="Qty"]', "2");
  206 |     await page.fill('input[placeholder="Price"]', "50");
  207 | 
  208 |     await page.click("text=Add Item", { force: true });
  209 |     await page.fill('input[placeholder*="product or service"] >> nth=1', "Item 2");
  210 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  211 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  212 | 
  213 |     await page.click("text=Add Item", { force: true });
  214 |     await page.fill('input[placeholder*="product or service"] >> nth=2', "Item 3");
  215 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  216 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  217 | 
  218 |     await page.fill('label:has-text("Tax Rate") + input', "10");
  219 |     await page.fill('textarea[placeholder*="Notes"]', "E2E Test Invoice Notes");
  220 |     await page.click('button:has-text("Create & Render")', { force: true });
  221 | 
  222 |     // Verify it appears in table
  223 |     const totalCell = page.locator("table tbody td:has-text('$275.00')");
  224 |     await expect(totalCell).toBeVisible();
  225 | 
  226 |     // Verify PDF download button exists & API generates PDF
  227 |     const pdfBtn = page.locator('button[title="Download PDF"]').first();
  228 |     await expect(pdfBtn).toBeVisible();
  229 |     const pdfResponse = await page.request.get(`/api/invoices/1/pdf`);
  230 |     expect([200, 307, 302, 404]).toContain(pdfResponse.status());
  231 |   });
  232 | 
  233 |   // Flow 3: Kanban Task Lifecycle
  234 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  235 |     await page.goto("/login");
  236 |     await submitLoginForm(page, adminEmail, adminPassword);
  237 |     await expect(page).toHaveURL(/.*dashboard/);
  238 | 
  239 |     // Create project
  240 |     await page.goto("/projects");
  241 |     await page.locator('button:has-text("New Project")').first().click({ force: true });
```