# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 2: Invoice Creation & PDF Generation
- Location: tests-e2e/e2e-flows.spec.ts:138:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*dashboard/
Received string:  "http://localhost:3000/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    5 × unexpected value "http://localhost:3000/login?"
    3 × unexpected value "http://localhost:3000/login"

```

```yaml
- link "ForgeFlow":
  - /url: /
- heading "Welcome back" [level=1]
- paragraph: Log in to your ForgeFlow account
- text: Email Address
- textbox "Email Address":
  - /placeholder: name@company.com
- text: Password
- link "Forgot password?":
  - /url: "#"
- textbox "Password":
  - /placeholder: ••••••••
- button
- button "Sign In"
- text: Or continue with
- link "Sign In with Google":
  - /url: /api/auth/sso/google/init
  - img
  - text: Sign In with Google
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
  42  |       try {
  43  |         return JSON.parse(trimmed);
  44  |       } catch (e) {
  45  |         // ignore and continue
  46  |       }
  47  |     }
  48  |   }
  49  |   throw new Error(`Failed to find JSON output in seeding result: ${result}`);
  50  | }
  51  | 
  52  | function runTeardown(orgId: number, userId: number) {
  53  |   const pythonPath = path.resolve(__dirname, "../../backend/.venv/bin/python");
  54  |   const scriptPath = path.resolve(__dirname, "../../backend/scripts/teardown_test_org.py");
  55  |   const backendPath = path.resolve(__dirname, "../../backend");
  56  |   execSync(
  57  |     `"${pythonPath}" "${scriptPath}" ${orgId} ${userId}`,
  58  |     { env: getEnvFromRoot(), cwd: backendPath }
  59  |   );
  60  | }
  61  | 
  62  | async function submitLoginForm(page: any, email: string, pass: string) {
  63  |   await page.waitForSelector("form");
  64  |   await page.evaluate(() => {
  65  |     (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  66  |   });
  67  |   await page.fill('input[type="email"]', email);
  68  |   await page.fill('input[type="password"]', pass);
  69  |   await page.click('button[type="submit"]');
  70  | }
  71  | 
  72  | test.describe("ForgeFlow E2E Critical Flows", () => {
  73  |   let seededData: any = null;
  74  |   const adminEmail = `e2e_admin_${Math.floor(Math.random() * 100000)}@forgeflow.com`;
  75  |   const adminPassword = "SuperPassword123!";
  76  | 
  77  |   test.beforeEach(async ({ page }) => {
  78  |     page.on('console', msg => {
  79  |       console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  80  |     });
  81  |     page.on('pageerror', err => {
  82  |       console.log(`BROWSER RUNTIME ERROR: ${err.message}`);
  83  |     });
  84  | 
  85  |     // Seed an isolated organization for each test case
  86  |     seededData = runSeeding("E2E Test Org", adminEmail, adminPassword);
  87  |     if (seededData.error) {
  88  |       throw new Error(`Seeding failed: ${seededData.error}`);
  89  |     }
  90  |   });
  91  | 
  92  |   test.afterEach(() => {
  93  |     if (seededData && seededData.org_id && seededData.user_id) {
  94  |       try {
  95  |         runTeardown(seededData.org_id, seededData.user_id);
  96  |       } catch (err) {
  97  |         console.error("Cleanup failed:", err);
  98  |       }
  99  |     }
  100 |   });
  101 | 
  102 |   // Flow 1: Full Authentication Lifecycle
  103 |   test("Flow 1: Authentication Lifecycle & Account Lockout", async ({ page }) => {
  104 |     // 1. Go to register page
  105 |     await page.goto("/register");
  106 |     await page.fill('input[type="email"]', `user_${Math.floor(Math.random() * 10000)}@e2e.com`);
  107 |     await page.fill('#reg-password', "SecurePass1!");
  108 |     await page.fill('#reg-name', "E2E Registrant");
  109 |     
  110 |     // Simulate turnstile checked
  111 |     await page.evaluate(() => {
  112 |       (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  113 |     });
  114 | 
  115 |     // We skip actual email verify/MFA TOTP code extraction in client E2E if mock authentication modes are toggled,
  116 |     // but we simulate the authentication flow steps.
  117 |     await page.goto("/login");
  118 |     await submitLoginForm(page, adminEmail, adminPassword);
  119 | 
  120 |     // Confirm redirected to dashboard
  121 |     await expect(page).toHaveURL(/.*dashboard/);
  122 | 
  123 |     // Logout
  124 |     await page.click('button[title="Sign Out"]', { force: true });
  125 |     await expect(page).toHaveURL(/.*(login|\/)$/);
  126 | 
  127 |     // Trigger Account Lockout (5 failed attempts)
  128 |     for (let i = 0; i < 5; i++) {
  129 |       await submitLoginForm(page, adminEmail, "wrong-password");
  130 |     }
  131 | 
  132 |     // Lockout UI/Notification validation
  133 |     await submitLoginForm(page, adminEmail, adminPassword);
  134 |     await expect(page.locator("text=locked").or(page.locator("text=too many attempts")).or(page.locator("text=lockout"))).toBeVisible();
  135 |   });
  136 | 
  137 |   // Flow 2: Invoice Creation and PDF Download
  138 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  139 |     // Bypass lockout by logging in with seed details
  140 |     await page.goto("/login");
  141 |     await submitLoginForm(page, adminEmail, adminPassword);
> 142 |     await expect(page).toHaveURL(/.*dashboard/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  143 | 
  144 |     // Navigate to Invoices
  145 |     await page.goto("/invoices");
  146 | 
  147 |     // Add Client first
  148 |     await page.goto("/crm");
  149 |     await page.click("text=New Client");
  150 |     try {
  151 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  152 |     } catch (e) {
  153 |       await page.click("text=New Client");
  154 |     }
  155 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  156 |     await page.fill('input[type="email"]', "client@invoice.com");
  157 |     await page.click("text=Add Client");
  158 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  159 | 
  160 |     // Create Invoice
  161 |     await page.goto("/invoices");
  162 |     await page.click("text=Create Invoice");
  163 |     try {
  164 |       await page.waitForSelector('text=Create & Render', { timeout: 2000 });
  165 |     } catch (e) {
  166 |       await page.click("text=Create Invoice");
  167 |     }
  168 |     
  169 |     // Fill Invoice form
  170 |     await page.selectOption("select", { label: "E2E Invoice Client" });
  171 |     await page.fill('input[type="date"]', new Date().toISOString().split("T")[0]);
  172 |     // Set 3 line items
  173 |     await page.fill('input[placeholder="Item description"]', "Item 1");
  174 |     await page.fill('input[placeholder="Qty"]', "2");
  175 |     await page.fill('input[placeholder="Price"]', "50");
  176 | 
  177 |     await page.click("text=Add Line Item");
  178 |     await page.fill('input[placeholder="Item description"] >> nth=1', "Item 2");
  179 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  180 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  181 | 
  182 |     await page.click("text=Add Line Item");
  183 |     await page.fill('input[placeholder="Item description"] >> nth=2', "Item 3");
  184 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  185 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  186 | 
  187 |     await page.fill('input[placeholder="Tax rate"]', "10");
  188 |     await page.fill('textarea[placeholder="Notes"]', "E2E Test Invoice Notes");
  189 |     await page.click('button:has-text("Create & Render")');
  190 | 
  191 |     // Verify it appears in table
  192 |     const totalCell = page.locator("text=$275.00");
  193 |     await expect(totalCell).toBeVisible();
  194 | 
  195 |     // Download PDF (intercept browser download event)
  196 |     const [download] = await Promise.all([
  197 |       page.waitForEvent("download"),
  198 |       page.click('button[title="Download PDF"] >> nth=0')
  199 |     ]);
  200 | 
  201 |     expect(download.suggestedFilename()).toContain(".pdf");
  202 |     const downloadPath = await download.path();
  203 |     const fileBytes = fs.readFileSync(downloadPath!);
  204 |     
  205 |     // Verify magic bytes %PDF
  206 |     const pdfMagicBytes = fileBytes.toString("utf8", 0, 4);
  207 |     expect(pdfMagicBytes).toBe("%PDF");
  208 |   });
  209 | 
  210 |   // Flow 3: Kanban Task Lifecycle
  211 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  212 |     await page.goto("/login");
  213 |     await submitLoginForm(page, adminEmail, adminPassword);
  214 |     await expect(page).toHaveURL(/.*dashboard/);
  215 | 
  216 |     // Create project
  217 |     await page.goto("/projects");
  218 |     await page.click("text=New Project");
  219 |     try {
  220 |       await page.waitForSelector('text=Create New Project', { timeout: 2000 });
  221 |     } catch (e) {
  222 |       await page.click("text=New Project");
  223 |     }
  224 |     await page.fill('input[placeholder="Project Name"]', "E2E Projects Space");
  225 |     await page.fill('textarea[placeholder="Description"]', "E2E Kanban Lifecycle testing space");
  226 |     await page.click("text=Create Project");
  227 | 
  228 |     // Add tasks
  229 |     await page.click("text=E2E Projects Space");
  230 |     
  231 |     // Add Task 1
  232 |     await page.click("text=Add Task");
  233 |     try {
  234 |       await page.waitForSelector('text=Create Task', { timeout: 2000 });
  235 |     } catch (e) {
  236 |       await page.click("text=Add Task");
  237 |     }
  238 |     await page.fill('input[placeholder="Task Title"]', "Task high priority");
  239 |     await page.selectOption("select[name='priority']", "high");
  240 |     await page.click("text=Create Task");
  241 | 
  242 |     // Drag-and-drop simulation & verify persisting
```