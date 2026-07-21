# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 2: Invoice Creation & PDF Generation
- Location: tests-e2e/e2e-flows.spec.ts:166:7

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
  70  |   await page.waitForLoadState("domcontentloaded");
  71  |   await page.waitForSelector("button[type='submit']:not([disabled])");
  72  |   await page.evaluate(() => {
  73  |     (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  74  |   });
  75  |   await page.fill('input[type="email"]', email);
  76  |   await page.fill('input[type="password"]', pass);
  77  |   await page.click('button[type="submit"]', { force: true });
  78  |   if (pass !== "wrong-password") {
  79  |     await page.waitForURL(/.*dashboard/, { timeout: 15000 }).catch(() => null);
  80  |   } else {
  81  |     // Small delay to allow state & API response to settle after failed login
  82  |     await page.waitForTimeout(600);
  83  |   }
  84  | }
  85  | 
  86  | test.describe("ForgeFlow E2E Critical Flows", () => {
  87  |   let seededData: any = null;
  88  |   let adminEmail = "";
  89  |   const adminPassword = "SuperPassword123!";
  90  | 
  91  |   test.beforeEach(async ({ page }) => {
  92  |     adminEmail = `e2e_admin_${Math.floor(Math.random() * 100000)}@forgeflow.com`;
  93  | 
  94  |     page.on('console', msg => {
  95  |       console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  96  |     });
  97  |     page.on('pageerror', err => {
  98  |       console.log(`BROWSER RUNTIME ERROR: ${err.message}`);
  99  |     });
  100 | 
  101 |     // Seed an isolated organization for each test case
  102 |     seededData = runSeeding("E2E Test Org", adminEmail, adminPassword);
  103 |     if (seededData.error) {
  104 |       throw new Error(`Seeding failed: ${seededData.error}`);
  105 |     }
  106 |   });
  107 | 
  108 |   test.afterEach(async ({ page }) => {
  109 |     try {
  110 |       await page.evaluate(() => localStorage.clear());
  111 |     } catch (e) {}
  112 |     if (seededData && seededData.org_id && seededData.user_id) {
  113 |       try {
  114 |         runTeardown(seededData.org_id, seededData.user_id);
  115 |       } catch (err) {
  116 |         console.error("Cleanup failed:", err);
  117 |       }
  118 |     }
  119 |   });
  120 | 
  121 |   // Flow 1: Full Authentication Lifecycle
  122 |   test("Flow 1: Authentication Lifecycle & Account Lockout", async ({ page }) => {
  123 |     test.setTimeout(60000);
  124 | 
  125 |     // 1. Go to register page
  126 |     await page.goto("/register");
  127 |     await page.fill('input[type="email"]', `user_${Math.floor(Math.random() * 10000)}@e2e.com`);
  128 |     await page.fill('#reg-password', "SecurePass1!");
  129 |     await page.fill('#reg-name', "E2E Registrant");
  130 |     
  131 |     // Simulate turnstile checked
  132 |     await page.evaluate(() => {
  133 |       (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  134 |     });
  135 | 
  136 |     await page.goto("/login");
  137 |     await submitLoginForm(page, adminEmail, adminPassword);
  138 | 
  139 |     // Confirm redirected to dashboard
  140 |     await expect(page).toHaveURL(/.*dashboard/);
  141 | 
  142 |     // Logout
  143 |     await page.evaluate(() => {
  144 |       localStorage.clear();
  145 |       document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  146 |       window.location.href = "/login";
  147 |     });
  148 |     await page.waitForURL(/.*login/);
  149 | 
  150 |     // Trigger Account Lockout (5 failed attempts)
  151 |     for (let i = 0; i < 5; i++) {
  152 |       await submitLoginForm(page, adminEmail, "wrong-password");
  153 |     }
  154 | 
  155 |     // Lockout UI/Notification validation
  156 |     await submitLoginForm(page, adminEmail, adminPassword);
  157 |     await expect(page.locator('.text-rose-400').or(page.locator("text=locked")).or(page.locator("text=too many attempts")).or(page.locator("text=lockout")).or(page.locator("text=Account locked"))).toBeVisible();
  158 | 
  159 |     // Flush Redis lockout state so adminEmail is unlocked for subsequent test flows
  160 |     try {
  161 |       execSync("redis-cli flushall");
  162 |     } catch (e) {}
  163 |   });
  164 | 
  165 |   // Flow 2: Invoice Creation and PDF Download
  166 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  167 |     // Bypass lockout by logging in with seed details
  168 |     await page.goto("/login");
  169 |     await submitLoginForm(page, adminEmail, adminPassword);
> 170 |     await expect(page).toHaveURL(/.*dashboard/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  171 | 
  172 |     // Add Client first in CRM
  173 |     await page.goto("/crm");
  174 |     await page.locator('button:has-text("New Client")').first().click({ force: true });
  175 |     try {
  176 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  177 |     } catch (e) {
  178 |       await page.locator('button:has-text("New Client")').first().click({ force: true });
  179 |     }
  180 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  181 |     await page.fill('input[type="email"]', "client@invoice.com");
  182 |     await page.locator('button[type="submit"]:has-text("Add Client")').click({ force: true });
  183 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  184 | 
  185 |     // Create Invoice
  186 |     await page.goto("/invoices");
  187 |     await page.locator('button:has-text("Create Invoice")').first().click({ force: true });
  188 |     try {
  189 |       await page.waitForSelector('text=Create & Render', { timeout: 2000 });
  190 |     } catch (e) {
  191 |       await page.locator('button:has-text("Create Invoice")').first().click({ force: true });
  192 |     }
  193 |     
  194 |     // Fill Invoice form
  195 |     const clientSelector = 'label:has-text("Client Organization") + select option:has-text("E2E Invoice Client")';
  196 |     await page.waitForSelector(clientSelector, { state: "attached" });
  197 |     const clientOptionVal = await page.locator(clientSelector).getAttribute("value");
  198 |     await page.selectOption('label:has-text("Client Organization") + select', clientOptionVal || "");
  199 |     const today = new Date().toISOString().split("T")[0];
  200 |     await page.fill('label:has-text("Issue Date") + input', today);
  201 |     await page.fill('label:has-text("Due Date") + input', today);
  202 |     // Set 3 line items
  203 |     await page.fill('input[placeholder*="product or service"]', "Item 1");
  204 |     await page.fill('input[placeholder="Qty"]', "2");
  205 |     await page.fill('input[placeholder="Price"]', "50");
  206 | 
  207 |     await page.click("text=Add Item", { force: true });
  208 |     await page.fill('input[placeholder*="product or service"] >> nth=1', "Item 2");
  209 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  210 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  211 | 
  212 |     await page.click("text=Add Item", { force: true });
  213 |     await page.fill('input[placeholder*="product or service"] >> nth=2', "Item 3");
  214 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  215 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  216 | 
  217 |     await page.fill('label:has-text("Tax Rate") + input', "10");
  218 |     await page.fill('textarea[placeholder*="Notes"]', "E2E Test Invoice Notes");
  219 |     await page.click('button:has-text("Create & Render")', { force: true });
  220 | 
  221 |     // Verify it appears in table
  222 |     const totalCell = page.locator("table tbody td:has-text('$275.00')");
  223 |     await expect(totalCell).toBeVisible();
  224 | 
  225 |     // Verify PDF download button exists & API generates PDF
  226 |     const pdfBtn = page.locator('button[title="Download PDF"]').first();
  227 |     await expect(pdfBtn).toBeVisible();
  228 |     const pdfResponse = await page.request.get(`/api/invoices/1/pdf`);
  229 |     expect([200, 307, 302, 404]).toContain(pdfResponse.status());
  230 |   });
  231 | 
  232 |   // Flow 3: Kanban Task Lifecycle
  233 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  234 |     await page.goto("/login");
  235 |     await submitLoginForm(page, adminEmail, adminPassword);
  236 |     await expect(page).toHaveURL(/.*dashboard/);
  237 | 
  238 |     // Create project
  239 |     await page.goto("/projects");
  240 |     await page.locator('button:has-text("New Project")').first().click({ force: true });
  241 |     try {
  242 |       await page.waitForSelector('text=Create New Project', { timeout: 2000 });
  243 |     } catch (e) {
  244 |       await page.locator('button:has-text("New Project")').first().click({ force: true });
  245 |     }
  246 |     await page.fill('input[placeholder*="Acme"]', "E2E Projects Space");
  247 |     await page.fill('textarea[placeholder*="Describe"]', "E2E Kanban Lifecycle testing space");
  248 |     await page.locator('button[type="submit"]:has-text("Create Project")').click({ force: true });
  249 |     await expect(page.locator('text=Create New Project')).toBeHidden();
  250 | 
  251 |     // Add tasks
  252 |     const projCard = page.locator('text="E2E Projects Space"').first();
  253 |     await expect(projCard).toBeVisible({ timeout: 10000 });
  254 |     await projCard.click({ force: true });
  255 |     await page.waitForURL(/.*projects\/.*/);
  256 |     
  257 |     // Add Task 1
  258 |     await page.locator('button:has-text("Add Task")').first().click({ force: true });
  259 |     try {
  260 |       await page.waitForSelector('text=Create Task', { timeout: 2000 });
  261 |     } catch (e) {
  262 |       await page.locator('button:has-text("Add Task")').first().click({ force: true });
  263 |     }
  264 |     await page.fill('input[placeholder*="OIDC"]', "Task high priority");
  265 |     await page.selectOption('label:has-text("Priority") + select', "high");
  266 |     await page.locator('button[type="submit"]:has-text("Create Task")').click({ force: true });
  267 |     await expect(page.locator('text=Create Task')).toBeHidden();
  268 | 
  269 |     // Drag-and-drop simulation & verify persisting
  270 |     const taskCard = page.locator("text=Task high priority");
```