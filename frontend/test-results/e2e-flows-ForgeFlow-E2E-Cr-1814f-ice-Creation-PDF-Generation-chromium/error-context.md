# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 2: Invoice Creation & PDF Generation
- Location: tests-e2e/e2e-flows.spec.ts:131:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*dashboard/
Received string:  "http://localhost:3000/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    6 × unexpected value "http://localhost:3000/login?"
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
  77  |   test.beforeEach(() => {
  78  |     // Seed an isolated organization for each test case
  79  |     seededData = runSeeding("E2E Test Org", adminEmail, adminPassword);
  80  |     if (seededData.error) {
  81  |       throw new Error(`Seeding failed: ${seededData.error}`);
  82  |     }
  83  |   });
  84  | 
  85  |   test.afterEach(() => {
  86  |     if (seededData && seededData.org_id && seededData.user_id) {
  87  |       try {
  88  |         runTeardown(seededData.org_id, seededData.user_id);
  89  |       } catch (err) {
  90  |         console.error("Cleanup failed:", err);
  91  |       }
  92  |     }
  93  |   });
  94  | 
  95  |   // Flow 1: Full Authentication Lifecycle
  96  |   test("Flow 1: Authentication Lifecycle & Account Lockout", async ({ page }) => {
  97  |     // 1. Go to register page
  98  |     await page.goto("/register");
  99  |     await page.fill('input[type="email"]', `user_${Math.floor(Math.random() * 10000)}@e2e.com`);
  100 |     await page.fill('#reg-password', "SecurePass1!");
  101 |     await page.fill('#reg-name', "E2E Registrant");
  102 |     
  103 |     // Simulate turnstile checked
  104 |     await page.evaluate(() => {
  105 |       (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  106 |     });
  107 | 
  108 |     // We skip actual email verify/MFA TOTP code extraction in client E2E if mock authentication modes are toggled,
  109 |     // but we simulate the authentication flow steps.
  110 |     await page.goto("/login");
  111 |     await submitLoginForm(page, adminEmail, adminPassword);
  112 | 
  113 |     // Confirm redirected to dashboard
  114 |     await expect(page).toHaveURL(/.*dashboard/);
  115 | 
  116 |     // Logout
  117 |     await page.click('button[title="Sign Out"]');
  118 |     await expect(page).toHaveURL(/.*login/);
  119 | 
  120 |     // Trigger Account Lockout (5 failed attempts)
  121 |     for (let i = 0; i < 5; i++) {
  122 |       await submitLoginForm(page, adminEmail, "wrong-password");
  123 |     }
  124 | 
  125 |     // Lockout UI/Notification validation
  126 |     await submitLoginForm(page, adminEmail, adminPassword);
  127 |     await expect(page.locator("text=locked").or(page.locator("text=too many attempts")).or(page.locator("text=lockout"))).toBeVisible();
  128 |   });
  129 | 
  130 |   // Flow 2: Invoice Creation and PDF Download
  131 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  132 |     // Bypass lockout by logging in with seed details
  133 |     await page.goto("/login");
  134 |     await submitLoginForm(page, adminEmail, adminPassword);
> 135 |     await expect(page).toHaveURL(/.*dashboard/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  136 | 
  137 |     // Navigate to Invoices
  138 |     await page.goto("/invoices");
  139 | 
  140 |     // Add Client first
  141 |     await page.goto("/crm");
  142 |     await page.click("text=New Client");
  143 |     await page.fill('input[placeholder*="Client Name"]', "E2E Invoice Client");
  144 |     await page.fill('input[type="email"]', "client@invoice.com");
  145 |     await page.click("text=Save");
  146 | 
  147 |     // Create Invoice
  148 |     await page.goto("/invoices");
  149 |     await page.click("text=Create Invoice");
  150 |     
  151 |     // Fill Invoice form
  152 |     await page.selectOption("select", { label: "E2E Invoice Client" });
  153 |     await page.fill('input[type="date"]', new Date().toISOString().split("T")[0]);
  154 |     // Set 3 line items
  155 |     await page.fill('input[placeholder="Item description"]', "Item 1");
  156 |     await page.fill('input[placeholder="Qty"]', "2");
  157 |     await page.fill('input[placeholder="Price"]', "50");
  158 | 
  159 |     await page.click("text=Add Line Item");
  160 |     await page.fill('input[placeholder="Item description"] >> nth=1', "Item 2");
  161 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  162 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  163 | 
  164 |     await page.click("text=Add Line Item");
  165 |     await page.fill('input[placeholder="Item description"] >> nth=2', "Item 3");
  166 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  167 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  168 | 
  169 |     await page.fill('input[placeholder="Tax rate"]', "10");
  170 |     await page.fill('textarea[placeholder="Notes"]', "E2E Test Invoice Notes");
  171 |     await page.click('button:has-text("Create")');
  172 | 
  173 |     // Verify it appears in table
  174 |     const totalCell = page.locator("text=$275.00");
  175 |     await expect(totalCell).toBeVisible();
  176 | 
  177 |     // Download PDF (intercept browser download event)
  178 |     const [download] = await Promise.all([
  179 |       page.waitForEvent("download"),
  180 |       page.click('button[title="Download PDF"] >> nth=0')
  181 |     ]);
  182 | 
  183 |     expect(download.suggestedFilename()).toContain(".pdf");
  184 |     const downloadPath = await download.path();
  185 |     const fileBytes = fs.readFileSync(downloadPath!);
  186 |     
  187 |     // Verify magic bytes %PDF
  188 |     const pdfMagicBytes = fileBytes.toString("utf8", 0, 4);
  189 |     expect(pdfMagicBytes).toBe("%PDF");
  190 |   });
  191 | 
  192 |   // Flow 3: Kanban Task Lifecycle
  193 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  194 |     await page.goto("/login");
  195 |     await submitLoginForm(page, adminEmail, adminPassword);
  196 | 
  197 |     // Create project
  198 |     await page.goto("/projects");
  199 |     await page.click("text=Create Project");
  200 |     await page.fill('input[placeholder="Project Name"]', "E2E Projects Space");
  201 |     await page.fill('textarea[placeholder="Description"]', "E2E Kanban Lifecycle testing space");
  202 |     await page.click("text=Create");
  203 | 
  204 |     // Add tasks
  205 |     await page.click("text=E2E Projects Space");
  206 |     
  207 |     // Add Task 1
  208 |     await page.click("text=Add Task");
  209 |     await page.fill('input[placeholder="Task Title"]', "Task high priority");
  210 |     await page.selectOption("select[name='priority']", "high");
  211 |     await page.click("text=Create");
  212 | 
  213 |     // Drag-and-drop simulation & verify persisting
  214 |     // (Playwright dragTo handles drag simulation)
  215 |     const taskCard = page.locator("text=Task high priority");
  216 |     const inProgressColumn = page.locator("text=In Progress");
  217 |     await taskCard.dragTo(inProgressColumn);
  218 | 
  219 |     await page.reload();
  220 |     await expect(page.locator('[data-status="in_progress"]')).toContainText("Task high priority");
  221 |   });
  222 | 
  223 |   // Flow 4: CRM Deal Pipeline
  224 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  225 |     await page.goto("/login");
  226 |     await submitLoginForm(page, adminEmail, adminPassword);
  227 | 
  228 |     await page.goto("/crm");
  229 |     // Add lead
  230 |     await page.click("text=New Lead");
  231 |     await page.fill('input[placeholder="Lead Title"]', "Enterprise Deal Lead");
  232 |     await page.fill('input[placeholder="Value"]', "25000");
  233 |     await page.click("text=Save");
  234 | 
  235 |     // Check pipeline dashboard update
```