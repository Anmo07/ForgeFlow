# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 2: Invoice Creation & PDF Generation
- Location: tests-e2e/e2e-flows.spec.ts:162:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*dashboard/
Received string:  "http://localhost:3000/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × unexpected value "http://localhost:3000/login"

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
  - text: e2e_admin_29138@forgeflow.com
- text: Password
- link "Forgot password?":
  - /url: "#"
- textbox "Password":
  - /placeholder: ••••••••
  - text: SuperPassword123!
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
  66  |   );
  67  | }
  68  | 
  69  | async function submitLoginForm(page: any, email: string, pass: string) {
  70  |   await page.waitForSelector("form");
  71  |   await page.evaluate(() => {
  72  |     (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  73  |   });
  74  |   await page.fill('input[type="email"]', email);
  75  |   await page.fill('input[type="password"]', pass);
  76  |   await page.click('button[type="submit"]');
  77  |   if (pass !== "wrong-password") {
  78  |     await page.waitForURL(/.*dashboard/, { timeout: 10000 }).catch(() => null);
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
  142 |     });
  143 |     await page.goto("/login");
  144 |     await expect(page).toHaveURL(/.*login$/);
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
> 166 |     await expect(page).toHaveURL(/.*dashboard/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
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
  177 |     await page.fill('input[type="email"]', "client@invoice.com");
  178 |     await page.locator('button[type="submit"]:has-text("Add Client")').click();
  179 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  180 | 
  181 |     // Create Invoice
  182 |     await page.goto("/invoices");
  183 |     await page.locator('button:has-text("Create Invoice")').first().click();
  184 |     try {
  185 |       await page.waitForSelector('text=Create & Render', { timeout: 2000 });
  186 |     } catch (e) {
  187 |       await page.locator('button:has-text("Create Invoice")').first().click();
  188 |     }
  189 |     
  190 |     // Fill Invoice form
  191 |     const clientSelector = 'label:has-text("Client Organization") + select option:has-text("E2E Invoice Client")';
  192 |     await page.waitForSelector(clientSelector, { state: "attached" });
  193 |     const clientOptionVal = await page.locator(clientSelector).getAttribute("value");
  194 |     await page.selectOption('label:has-text("Client Organization") + select', clientOptionVal || "");
  195 |     const today = new Date().toISOString().split("T")[0];
  196 |     await page.fill('label:has-text("Issue Date") + input', today);
  197 |     await page.fill('label:has-text("Due Date") + input', today);
  198 |     // Set 3 line items
  199 |     await page.fill('input[placeholder*="product or service"]', "Item 1");
  200 |     await page.fill('input[placeholder="Qty"]', "2");
  201 |     await page.fill('input[placeholder="Price"]', "50");
  202 | 
  203 |     await page.click("text=Add Item");
  204 |     await page.fill('input[placeholder*="product or service"] >> nth=1', "Item 2");
  205 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  206 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  207 | 
  208 |     await page.click("text=Add Item");
  209 |     await page.fill('input[placeholder*="product or service"] >> nth=2', "Item 3");
  210 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  211 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  212 | 
  213 |     await page.fill('label:has-text("Tax Rate") + input', "10");
  214 |     await page.fill('textarea[placeholder*="Notes"]', "E2E Test Invoice Notes");
  215 |     await page.click('button:has-text("Create & Render")');
  216 | 
  217 |     // Verify it appears in table
  218 |     const totalCell = page.locator("table tbody td:has-text('$275.00')");
  219 |     await expect(totalCell).toBeVisible();
  220 | 
  221 |     // Verify PDF download button exists & API generates PDF
  222 |     const pdfBtn = page.locator('button[title="Download PDF"]').first();
  223 |     await expect(pdfBtn).toBeVisible();
  224 |     const pdfResponse = await page.request.get(`/api/invoices/1/pdf`);
  225 |     expect([200, 307, 302, 404]).toContain(pdfResponse.status());
  226 |   });
  227 | 
  228 |   // Flow 3: Kanban Task Lifecycle
  229 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  230 |     await page.goto("/login");
  231 |     await submitLoginForm(page, adminEmail, adminPassword);
  232 |     await expect(page).toHaveURL(/.*dashboard/);
  233 | 
  234 |     // Create project
  235 |     await page.goto("/projects");
  236 |     await page.locator('button:has-text("New Project")').first().click();
  237 |     try {
  238 |       await page.waitForSelector('text=Create New Project', { timeout: 2000 });
  239 |     } catch (e) {
  240 |       await page.locator('button:has-text("New Project")').first().click();
  241 |     }
  242 |     await page.fill('input[placeholder*="Acme"]', "E2E Projects Space");
  243 |     await page.fill('textarea[placeholder*="Describe"]', "E2E Kanban Lifecycle testing space");
  244 |     await page.locator('button[type="submit"]:has-text("Create Project")').click();
  245 |     await expect(page.locator('text=Create New Project')).toBeHidden();
  246 | 
  247 |     // Add tasks
  248 |     const projCard = page.locator('text="E2E Projects Space"').first();
  249 |     await expect(projCard).toBeVisible({ timeout: 10000 });
  250 |     await projCard.click();
  251 |     await page.waitForURL(/.*projects\/.*/);
  252 |     
  253 |     // Add Task 1
  254 |     await page.locator('button:has-text("Add Task")').first().click();
  255 |     try {
  256 |       await page.waitForSelector('text=Create Task', { timeout: 2000 });
  257 |     } catch (e) {
  258 |       await page.locator('button:has-text("Add Task")').first().click();
  259 |     }
  260 |     await page.fill('input[placeholder*="OIDC"]', "Task high priority");
  261 |     await page.selectOption('label:has-text("Priority") + select', "high");
  262 |     await page.locator('button[type="submit"]:has-text("Create Task")').click();
  263 |     await expect(page.locator('text=Create Task')).toBeHidden();
  264 | 
  265 |     // Drag-and-drop simulation & verify persisting
  266 |     const taskCard = page.locator("text=Task high priority");
```