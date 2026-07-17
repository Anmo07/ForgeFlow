# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 2: Invoice Creation & PDF Generation
- Location: tests-e2e/e2e-flows.spec.ts:140:7

# Error details

```
Error: expect(locator).toBeHidden() failed

Locator:  locator('text=Add New Client')
Expected: hidden
Received: visible
Timeout:  5000ms

Call log:
  - Expect "toBeHidden" with timeout 5000ms
  - waiting for locator('text=Add New Client')
    14 × locator resolved to <h2 class="text-lg font-bold text-foreground">Add New Client</h2>
       - unexpected value "visible"

```

```yaml
- heading "Add New Client" [level=2]
```

# Test source

```ts
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
  74  |   let adminEmail = "";
  75  |   const adminPassword = "SuperPassword123!";
  76  | 
  77  |   test.beforeEach(async ({ page }) => {
  78  |     adminEmail = `e2e_admin_${Math.floor(Math.random() * 100000)}@forgeflow.com`;
  79  | 
  80  |     page.on('console', msg => {
  81  |       console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  82  |     });
  83  |     page.on('pageerror', err => {
  84  |       console.log(`BROWSER RUNTIME ERROR: ${err.message}`);
  85  |     });
  86  | 
  87  |     // Seed an isolated organization for each test case
  88  |     seededData = runSeeding("E2E Test Org", adminEmail, adminPassword);
  89  |     if (seededData.error) {
  90  |       throw new Error(`Seeding failed: ${seededData.error}`);
  91  |     }
  92  |   });
  93  | 
  94  |   test.afterEach(() => {
  95  |     if (seededData && seededData.org_id && seededData.user_id) {
  96  |       try {
  97  |         runTeardown(seededData.org_id, seededData.user_id);
  98  |       } catch (err) {
  99  |         console.error("Cleanup failed:", err);
  100 |       }
  101 |     }
  102 |   });
  103 | 
  104 |   // Flow 1: Full Authentication Lifecycle
  105 |   test("Flow 1: Authentication Lifecycle & Account Lockout", async ({ page }) => {
  106 |     // 1. Go to register page
  107 |     await page.goto("/register");
  108 |     await page.fill('input[type="email"]', `user_${Math.floor(Math.random() * 10000)}@e2e.com`);
  109 |     await page.fill('#reg-password', "SecurePass1!");
  110 |     await page.fill('#reg-name', "E2E Registrant");
  111 |     
  112 |     // Simulate turnstile checked
  113 |     await page.evaluate(() => {
  114 |       (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  115 |     });
  116 | 
  117 |     // We skip actual email verify/MFA TOTP code extraction in client E2E if mock authentication modes are toggled,
  118 |     // but we simulate the authentication flow steps.
  119 |     await page.goto("/login");
  120 |     await submitLoginForm(page, adminEmail, adminPassword);
  121 | 
  122 |     // Confirm redirected to dashboard
  123 |     await expect(page).toHaveURL(/.*dashboard/);
  124 | 
  125 |     // Logout
  126 |     await page.click('button[title="Sign Out"]', { force: true });
  127 |     await expect(page).toHaveURL(/.*(login|\/)$/);
  128 | 
  129 |     // Trigger Account Lockout (5 failed attempts)
  130 |     for (let i = 0; i < 5; i++) {
  131 |       await submitLoginForm(page, adminEmail, "wrong-password");
  132 |     }
  133 | 
  134 |     // Lockout UI/Notification validation
  135 |     await submitLoginForm(page, adminEmail, adminPassword);
  136 |     await expect(page.locator("text=locked").or(page.locator("text=too many attempts")).or(page.locator("text=lockout"))).toBeVisible();
  137 |   });
  138 | 
  139 |   // Flow 2: Invoice Creation and PDF Download
  140 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  141 |     // Bypass lockout by logging in with seed details
  142 |     await page.goto("/login");
  143 |     await submitLoginForm(page, adminEmail, adminPassword);
  144 |     await expect(page).toHaveURL(/.*dashboard/);
  145 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
  146 | 
  147 |     // Navigate to Invoices
  148 |     await page.goto("/invoices");
  149 | 
  150 |     // Add Client first
  151 |     await page.goto("/crm");
  152 |     await page.click("text=New Client");
  153 |     try {
  154 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  155 |     } catch (e) {
  156 |       await page.click("text=New Client");
  157 |     }
  158 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  159 |     await page.fill('input[type="email"]', "client@invoice.com");
  160 |     await page.click("text=Add Client");
> 161 |     await expect(page.locator('text=Add New Client')).toBeHidden();
      |                                                       ^ Error: expect(locator).toBeHidden() failed
  162 | 
  163 |     // Create Invoice
  164 |     await page.goto("/invoices");
  165 |     await page.click("text=Create Invoice");
  166 |     try {
  167 |       await page.waitForSelector('text=Create & Render', { timeout: 2000 });
  168 |     } catch (e) {
  169 |       await page.click("text=Create Invoice");
  170 |     }
  171 |     
  172 |     // Fill Invoice form
  173 |     await page.selectOption("select", { label: "E2E Invoice Client" });
  174 |     await page.fill('input[type="date"]', new Date().toISOString().split("T")[0]);
  175 |     // Set 3 line items
  176 |     await page.fill('input[placeholder="Item description"]', "Item 1");
  177 |     await page.fill('input[placeholder="Qty"]', "2");
  178 |     await page.fill('input[placeholder="Price"]', "50");
  179 | 
  180 |     await page.click("text=Add Line Item");
  181 |     await page.fill('input[placeholder="Item description"] >> nth=1', "Item 2");
  182 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  183 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  184 | 
  185 |     await page.click("text=Add Line Item");
  186 |     await page.fill('input[placeholder="Item description"] >> nth=2', "Item 3");
  187 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  188 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  189 | 
  190 |     await page.fill('input[placeholder="Tax rate"]', "10");
  191 |     await page.fill('textarea[placeholder="Notes"]', "E2E Test Invoice Notes");
  192 |     await page.click('button:has-text("Create & Render")');
  193 | 
  194 |     // Verify it appears in table
  195 |     const totalCell = page.locator("text=$275.00");
  196 |     await expect(totalCell).toBeVisible();
  197 | 
  198 |     // Download PDF (intercept browser download event)
  199 |     const [download] = await Promise.all([
  200 |       page.waitForEvent("download"),
  201 |       page.click('button[title="Download PDF"] >> nth=0')
  202 |     ]);
  203 | 
  204 |     expect(download.suggestedFilename()).toContain(".pdf");
  205 |     const downloadPath = await download.path();
  206 |     const fileBytes = fs.readFileSync(downloadPath!);
  207 |     
  208 |     // Verify magic bytes %PDF
  209 |     const pdfMagicBytes = fileBytes.toString("utf8", 0, 4);
  210 |     expect(pdfMagicBytes).toBe("%PDF");
  211 |   });
  212 | 
  213 |   // Flow 3: Kanban Task Lifecycle
  214 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  215 |     await page.goto("/login");
  216 |     await submitLoginForm(page, adminEmail, adminPassword);
  217 |     await expect(page).toHaveURL(/.*dashboard/);
  218 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
  219 | 
  220 |     // Create project
  221 |     await page.goto("/projects");
  222 |     await page.click("text=New Project");
  223 |     try {
  224 |       await page.waitForSelector('text=Create New Project', { timeout: 2000 });
  225 |     } catch (e) {
  226 |       await page.click("text=New Project");
  227 |     }
  228 |     await page.fill('input[placeholder*="Acme"]', "E2E Projects Space");
  229 |     await page.fill('textarea[placeholder*="Describe"]', "E2E Kanban Lifecycle testing space");
  230 |     await page.click("text=Create Project");
  231 | 
  232 |     // Add tasks
  233 |     await page.click("text=E2E Projects Space");
  234 |     
  235 |     // Add Task 1
  236 |     await page.click("text=Add Task");
  237 |     try {
  238 |       await page.waitForSelector('text=Create Task', { timeout: 2000 });
  239 |     } catch (e) {
  240 |       await page.click("text=Add Task");
  241 |     }
  242 |     await page.fill('input[placeholder*="OIDC"]', "Task high priority");
  243 |     await page.selectOption("select[name='priority']", "high");
  244 |     await page.click("text=Create Task");
  245 | 
  246 |     // Drag-and-drop simulation & verify persisting
  247 |     // (Playwright dragTo handles drag simulation)
  248 |     const taskCard = page.locator("text=Task high priority");
  249 |     const inProgressColumn = page.locator("text=In Progress");
  250 |     await taskCard.dragTo(inProgressColumn);
  251 | 
  252 |     await page.reload();
  253 |     await expect(page.locator('[data-status="in_progress"]')).toContainText("Task high priority");
  254 |   });
  255 | 
  256 |   // Flow 4: CRM Deal Pipeline
  257 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  258 |     await page.goto("/login");
  259 |     await submitLoginForm(page, adminEmail, adminPassword);
  260 |     await expect(page).toHaveURL(/.*dashboard/);
  261 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
```