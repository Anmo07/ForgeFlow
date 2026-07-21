# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 2: Invoice Creation & PDF Generation
- Location: tests-e2e/e2e-flows.spec.ts:149:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button').filter({ hasText: 'E2E Test Org' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('button').filter({ hasText: 'E2E Test Org' })

```

```yaml
- link "ForgeFlow":
  - /url: /
- heading "Welcome back" [level=1]
- paragraph: Sign in to your encrypted MSP Command Center
- text: Email Address
- textbox "Email Address":
  - /placeholder: name@company.com
  - text: e2e_admin_38701@forgeflow.com
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
- alert
- button "Open Tanstack query devtools":
  - img
```

# Test source

```ts
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
  100 |   test.afterEach(async ({ page }) => {
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
> 154 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
      |                                                                              ^ Error: expect(locator).toBeVisible() failed
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
  201 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  202 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  203 | 
  204 |     await page.fill('label:has-text("Tax Rate") + input', "10");
  205 |     await page.fill('textarea[placeholder*="Notes"]', "E2E Test Invoice Notes");
  206 |     await page.click('button:has-text("Create & Render")');
  207 | 
  208 |     // Verify it appears in table
  209 |     const totalCell = page.locator("table tbody td:has-text('$275.00')");
  210 |     await expect(totalCell).toBeVisible();
  211 | 
  212 |     // Download PDF (intercept browser download event)
  213 |     const [download] = await Promise.all([
  214 |       page.waitForEvent("download"),
  215 |       page.click('button[title="Download PDF"] >> nth=0')
  216 |     ]);
  217 | 
  218 |     expect(download.suggestedFilename()).toContain(".pdf");
  219 |     const downloadPath = await download.path();
  220 |     const fileBytes = fs.readFileSync(downloadPath!);
  221 |     
  222 |     // Verify magic bytes %PDF
  223 |     const pdfMagicBytes = fileBytes.toString("utf8", 0, 4);
  224 |     expect(pdfMagicBytes).toBe("%PDF");
  225 |   });
  226 | 
  227 |   // Flow 3: Kanban Task Lifecycle
  228 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  229 |     await page.goto("/login");
  230 |     await submitLoginForm(page, adminEmail, adminPassword);
  231 |     await expect(page).toHaveURL(/.*dashboard/);
  232 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
  233 | 
  234 |     // Create project
  235 |     await page.goto("/projects");
  236 |     await page.click("text=New Project");
  237 |     try {
  238 |       await page.waitForSelector('text=Create New Project', { timeout: 2000 });
  239 |     } catch (e) {
  240 |       await page.click("text=New Project");
  241 |     }
  242 |     await page.fill('input[placeholder*="Acme"]', "E2E Projects Space");
  243 |     await page.fill('textarea[placeholder*="Describe"]', "E2E Kanban Lifecycle testing space");
  244 |     await page.click("text=Create Project");
  245 | 
  246 |     // Add tasks
  247 |     await page.click("text=E2E Projects Space");
  248 |     
  249 |     // Add Task 1
  250 |     await page.click("text=Add Task");
  251 |     try {
  252 |       await page.waitForSelector('text=Create Task', { timeout: 2000 });
  253 |     } catch (e) {
  254 |       await page.click("text=Add Task");
```