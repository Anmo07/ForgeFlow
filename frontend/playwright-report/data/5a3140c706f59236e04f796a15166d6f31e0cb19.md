# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 2: Invoice Creation & PDF Generation
- Location: tests-e2e/e2e-flows.spec.ts:132:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
Call log:
  - navigating to "http://localhost:3000/login", waiting until "load"

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
  62  | test.describe("ForgeFlow E2E Critical Flows", () => {
  63  |   let seededData: any = null;
  64  |   const adminEmail = `e2e_admin_${Math.floor(Math.random() * 100000)}@forgeflow.local`;
  65  |   const adminPassword = "SuperPassword123!";
  66  | 
  67  |   test.beforeEach(() => {
  68  |     // Seed an isolated organization for each test case
  69  |     seededData = runSeeding("E2E Test Org", adminEmail, adminPassword);
  70  |     if (seededData.error) {
  71  |       throw new Error(`Seeding failed: ${seededData.error}`);
  72  |     }
  73  |   });
  74  | 
  75  |   test.afterEach(() => {
  76  |     if (seededData && seededData.org_id && seededData.user_id) {
  77  |       try {
  78  |         runTeardown(seededData.org_id, seededData.user_id);
  79  |       } catch (err) {
  80  |         console.error("Cleanup failed:", err);
  81  |       }
  82  |     }
  83  |   });
  84  | 
  85  |   // Flow 1: Full Authentication Lifecycle
  86  |   test("Flow 1: Authentication Lifecycle & Account Lockout", async ({ page }) => {
  87  |     // 1. Go to register page
  88  |     await page.goto("/register");
  89  |     await page.fill('input[type="email"]', `user_${Math.floor(Math.random() * 10000)}@e2e.local`);
  90  |     await page.fill('input[placeholder*="Password"]', "SecurePass1!");
  91  |     await page.fill('input[placeholder*="Full Name"]', "E2E Registrant");
  92  |     
  93  |     // Simulate turnstile checked
  94  |     await page.evaluate(() => {
  95  |       // Mock turnstile token insertion if present
  96  |       const input = document.createElement("input");
  97  |       input.type = "hidden";
  98  |       input.name = "cf-turnstile-response";
  99  |       input.value = "mocked-turnstile-response-token";
  100 |       document.querySelector("form")?.appendChild(input);
  101 |     });
  102 | 
  103 |     // We skip actual email verify/MFA TOTP code extraction in client E2E if mock authentication modes are toggled,
  104 |     // but we simulate the authentication flow steps.
  105 |     await page.goto("/login");
  106 |     await page.fill('input[type="email"]', adminEmail);
  107 |     await page.fill('input[type="password"]', adminPassword);
  108 |     await page.click('button[type="submit"]');
  109 | 
  110 |     // Confirm redirected to dashboard
  111 |     await expect(page).toHaveURL(/.*dashboard/);
  112 | 
  113 |     // Logout
  114 |     await page.click('button[title="Sign Out"]');
  115 |     await expect(page).toHaveURL(/.*login/);
  116 | 
  117 |     // Trigger Account Lockout (5 failed attempts)
  118 |     for (let i = 0; i < 5; i++) {
  119 |       await page.fill('input[type="email"]', adminEmail);
  120 |       await page.fill('input[type="password"]', "wrong-password");
  121 |       await page.click('button[type="submit"]');
  122 |     }
  123 | 
  124 |     // Lockout UI/Notification validation
  125 |     await page.fill('input[type="email"]', adminEmail);
  126 |     await page.fill('input[type="password"]', adminPassword);
  127 |     await page.click('button[type="submit"]');
  128 |     await expect(page.locator("text=locked").or(page.locator("text=too many attempts")).or(page.locator("text=lockout"))).toBeVisible();
  129 |   });
  130 | 
  131 |   // Flow 2: Invoice Creation and PDF Download
  132 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  133 |     // Bypass lockout by logging in with seed details
> 134 |     await page.goto("/login");
      |                ^ Error: page.goto: net::ERR_ABORTED; maybe frame was detached?
  135 |     await page.fill('input[type="email"]', adminEmail);
  136 |     await page.fill('input[type="password"]', adminPassword);
  137 |     await page.click('button[type="submit"]');
  138 |     await expect(page).toHaveURL(/.*dashboard/);
  139 | 
  140 |     // Navigate to Invoices
  141 |     await page.goto("/invoices");
  142 | 
  143 |     // Add Client first
  144 |     await page.goto("/crm");
  145 |     await page.click("text=New Client");
  146 |     await page.fill('input[placeholder*="Client Name"]', "E2E Invoice Client");
  147 |     await page.fill('input[type="email"]', "client@invoice.local");
  148 |     await page.click("text=Save");
  149 | 
  150 |     // Create Invoice
  151 |     await page.goto("/invoices");
  152 |     await page.click("text=Create Invoice");
  153 |     
  154 |     // Fill Invoice form
  155 |     await page.selectOption("select", { label: "E2E Invoice Client" });
  156 |     await page.fill('input[type="date"]', new Date().toISOString().split("T")[0]);
  157 |     // Set 3 line items
  158 |     await page.fill('input[placeholder="Item description"]', "Item 1");
  159 |     await page.fill('input[placeholder="Qty"]', "2");
  160 |     await page.fill('input[placeholder="Price"]', "50");
  161 | 
  162 |     await page.click("text=Add Line Item");
  163 |     await page.fill('input[placeholder="Item description"] >> nth=1', "Item 2");
  164 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  165 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  166 | 
  167 |     await page.click("text=Add Line Item");
  168 |     await page.fill('input[placeholder="Item description"] >> nth=2', "Item 3");
  169 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  170 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  171 | 
  172 |     await page.fill('input[placeholder="Tax rate"]', "10");
  173 |     await page.fill('textarea[placeholder="Notes"]', "E2E Test Invoice Notes");
  174 |     await page.click('button:has-text("Create")');
  175 | 
  176 |     // Verify it appears in table
  177 |     const totalCell = page.locator("text=$275.00");
  178 |     await expect(totalCell).toBeVisible();
  179 | 
  180 |     // Download PDF (intercept browser download event)
  181 |     const [download] = await Promise.all([
  182 |       page.waitForEvent("download"),
  183 |       page.click('button[title="Download PDF"] >> nth=0')
  184 |     ]);
  185 | 
  186 |     expect(download.suggestedFilename()).toContain(".pdf");
  187 |     const downloadPath = await download.path();
  188 |     const fileBytes = fs.readFileSync(downloadPath!);
  189 |     
  190 |     // Verify magic bytes %PDF
  191 |     const pdfMagicBytes = fileBytes.toString("utf8", 0, 4);
  192 |     expect(pdfMagicBytes).toBe("%PDF");
  193 |   });
  194 | 
  195 |   // Flow 3: Kanban Task Lifecycle
  196 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  197 |     await page.goto("/login");
  198 |     await page.fill('input[type="email"]', adminEmail);
  199 |     await page.fill('input[type="password"]', adminPassword);
  200 |     await page.click('button[type="submit"]');
  201 | 
  202 |     // Create project
  203 |     await page.goto("/projects");
  204 |     await page.click("text=Create Project");
  205 |     await page.fill('input[placeholder="Project Name"]', "E2E Projects Space");
  206 |     await page.fill('textarea[placeholder="Description"]', "E2E Kanban Lifecycle testing space");
  207 |     await page.click("text=Create");
  208 | 
  209 |     // Add tasks
  210 |     await page.click("text=E2E Projects Space");
  211 |     
  212 |     // Add Task 1
  213 |     await page.click("text=Add Task");
  214 |     await page.fill('input[placeholder="Task Title"]', "Task high priority");
  215 |     await page.selectOption("select[name='priority']", "high");
  216 |     await page.click("text=Create");
  217 | 
  218 |     // Drag-and-drop simulation & verify persisting
  219 |     // (Playwright dragTo handles drag simulation)
  220 |     const taskCard = page.locator("text=Task high priority");
  221 |     const inProgressColumn = page.locator("text=In Progress");
  222 |     await taskCard.dragTo(inProgressColumn);
  223 | 
  224 |     await page.reload();
  225 |     await expect(page.locator('[data-status="in_progress"]')).toContainText("Task high priority");
  226 |   });
  227 | 
  228 |   // Flow 4: CRM Deal Pipeline
  229 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  230 |     await page.goto("/login");
  231 |     await page.fill('input[type="email"]', adminEmail);
  232 |     await page.fill('input[type="password"]', adminPassword);
  233 |     await page.click('button[type="submit"]');
  234 | 
```