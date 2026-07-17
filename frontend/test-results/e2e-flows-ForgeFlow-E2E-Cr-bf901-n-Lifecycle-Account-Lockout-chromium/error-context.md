# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 1: Authentication Lifecycle & Account Lockout
- Location: tests-e2e/e2e-flows.spec.ts:103:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=locked').or(locator('text=too many attempts')).or(locator('text=lockout'))
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=locked').or(locator('text=too many attempts')).or(locator('text=lockout'))

```

```yaml
- link "ForgeFlow":
  - /url: /
- heading "Welcome back" [level=1]
- paragraph: Log in to your ForgeFlow account
- text: Email Address
- textbox "Email Address":
  - /placeholder: name@company.com
  - text: e2e_admin_40643@forgeflow.com
- text: Password
- link "Forgot password?":
  - /url: "#"
- textbox "Password":
  - /placeholder: ••••••••
  - text: SuperPassword123!
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
  34  |   const result = execSync(
  35  |     `"${pythonPath}" "${scriptPath}" "${orgName}" "${email}" "${pass}"`,
  36  |     { encoding: "utf8", env: getEnvFromRoot(), cwd: backendPath }
  37  |   );
  38  |   const lines = result.split("\n");
  39  |   for (const line of lines) {
  40  |     const trimmed = line.trim();
  41  |     if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
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
  124 |     await page.click('button[title="Sign Out"]');
  125 |     await expect(page).toHaveURL(/.*(login|\/)$/);
  126 | 
  127 |     // Trigger Account Lockout (5 failed attempts)
  128 |     for (let i = 0; i < 5; i++) {
  129 |       await submitLoginForm(page, adminEmail, "wrong-password");
  130 |     }
  131 | 
  132 |     // Lockout UI/Notification validation
  133 |     await submitLoginForm(page, adminEmail, adminPassword);
> 134 |     await expect(page.locator("text=locked").or(page.locator("text=too many attempts")).or(page.locator("text=lockout"))).toBeVisible();
      |                                                                                                                           ^ Error: expect(locator).toBeVisible() failed
  135 |   });
  136 | 
  137 |   // Flow 2: Invoice Creation and PDF Download
  138 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  139 |     // Bypass lockout by logging in with seed details
  140 |     await page.goto("/login");
  141 |     await submitLoginForm(page, adminEmail, adminPassword);
  142 |     await expect(page).toHaveURL(/.*dashboard/);
  143 | 
  144 |     // Navigate to Invoices
  145 |     await page.goto("/invoices");
  146 | 
  147 |     // Add Client first
  148 |     await page.goto("/crm");
  149 |     await page.click("text=New Client");
  150 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  151 |     await page.fill('input[type="email"]', "client@invoice.com");
  152 |     await page.click("text=Add Client");
  153 | 
  154 |     // Create Invoice
  155 |     await page.goto("/invoices");
  156 |     await page.click("text=Create Invoice");
  157 |     
  158 |     // Fill Invoice form
  159 |     await page.selectOption("select", { label: "E2E Invoice Client" });
  160 |     await page.fill('input[type="date"]', new Date().toISOString().split("T")[0]);
  161 |     // Set 3 line items
  162 |     await page.fill('input[placeholder="Item description"]', "Item 1");
  163 |     await page.fill('input[placeholder="Qty"]', "2");
  164 |     await page.fill('input[placeholder="Price"]', "50");
  165 | 
  166 |     await page.click("text=Add Line Item");
  167 |     await page.fill('input[placeholder="Item description"] >> nth=1', "Item 2");
  168 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  169 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  170 | 
  171 |     await page.click("text=Add Line Item");
  172 |     await page.fill('input[placeholder="Item description"] >> nth=2', "Item 3");
  173 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  174 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  175 | 
  176 |     await page.fill('input[placeholder="Tax rate"]', "10");
  177 |     await page.fill('textarea[placeholder="Notes"]', "E2E Test Invoice Notes");
  178 |     await page.click('button:has-text("Create & Render")');
  179 | 
  180 |     // Verify it appears in table
  181 |     const totalCell = page.locator("text=$275.00");
  182 |     await expect(totalCell).toBeVisible();
  183 | 
  184 |     // Download PDF (intercept browser download event)
  185 |     const [download] = await Promise.all([
  186 |       page.waitForEvent("download"),
  187 |       page.click('button[title="Download PDF"] >> nth=0')
  188 |     ]);
  189 | 
  190 |     expect(download.suggestedFilename()).toContain(".pdf");
  191 |     const downloadPath = await download.path();
  192 |     const fileBytes = fs.readFileSync(downloadPath!);
  193 |     
  194 |     // Verify magic bytes %PDF
  195 |     const pdfMagicBytes = fileBytes.toString("utf8", 0, 4);
  196 |     expect(pdfMagicBytes).toBe("%PDF");
  197 |   });
  198 | 
  199 |   // Flow 3: Kanban Task Lifecycle
  200 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  201 |     await page.goto("/login");
  202 |     await submitLoginForm(page, adminEmail, adminPassword);
  203 |     await expect(page).toHaveURL(/.*dashboard/);
  204 | 
  205 |     // Create project
  206 |     await page.goto("/projects");
  207 |     await page.click("text=New Project");
  208 |     await page.fill('input[placeholder="Project Name"]', "E2E Projects Space");
  209 |     await page.fill('textarea[placeholder="Description"]', "E2E Kanban Lifecycle testing space");
  210 |     await page.click("text=Create Project");
  211 | 
  212 |     // Add tasks
  213 |     await page.click("text=E2E Projects Space");
  214 |     
  215 |     // Add Task 1
  216 |     await page.click("text=Add Task");
  217 |     await page.fill('input[placeholder="Task Title"]', "Task high priority");
  218 |     await page.selectOption("select[name='priority']", "high");
  219 |     await page.click("text=Create Task");
  220 | 
  221 |     // Drag-and-drop simulation & verify persisting
  222 |     // (Playwright dragTo handles drag simulation)
  223 |     const taskCard = page.locator("text=Task high priority");
  224 |     const inProgressColumn = page.locator("text=In Progress");
  225 |     await taskCard.dragTo(inProgressColumn);
  226 | 
  227 |     await page.reload();
  228 |     await expect(page.locator('[data-status="in_progress"]')).toContainText("Task high priority");
  229 |   });
  230 | 
  231 |   // Flow 4: CRM Deal Pipeline
  232 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  233 |     await page.goto("/login");
  234 |     await submitLoginForm(page, adminEmail, adminPassword);
```