# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 3: Kanban Projects and Tasks
- Location: tests-e2e/e2e-flows.spec.ts:217:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*dashboard/
Received string:  "http://localhost:3000/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    4 × unexpected value "http://localhost:3000/login?"
    8 × unexpected value "http://localhost:3000/login"

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
  161 |     await expect(page.locator('text=Add New Client')).toBeHidden();
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
  173 |     const clientSelector = 'label:has-text("Client Organization") + select option:has-text("E2E Invoice Client")';
  174 |     await page.waitForSelector(clientSelector, { state: "attached" });
  175 |     const clientOptionVal = await page.locator(clientSelector).getAttribute("value");
  176 |     await page.selectOption('label:has-text("Client Organization") + select', clientOptionVal || "");
  177 |     await page.fill('input[type="date"]', new Date().toISOString().split("T")[0]);
  178 |     // Set 3 line items
  179 |     await page.fill('input[placeholder="Item description"]', "Item 1");
  180 |     await page.fill('input[placeholder="Qty"]', "2");
  181 |     await page.fill('input[placeholder="Price"]', "50");
  182 | 
  183 |     await page.click("text=Add Line Item");
  184 |     await page.fill('input[placeholder="Item description"] >> nth=1', "Item 2");
  185 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  186 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  187 | 
  188 |     await page.click("text=Add Line Item");
  189 |     await page.fill('input[placeholder="Item description"] >> nth=2', "Item 3");
  190 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  191 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  192 | 
  193 |     await page.fill('input[placeholder="Tax rate"]', "10");
  194 |     await page.fill('textarea[placeholder="Notes"]', "E2E Test Invoice Notes");
  195 |     await page.click('button:has-text("Create & Render")');
  196 | 
  197 |     // Verify it appears in table
  198 |     const totalCell = page.locator("text=$275.00");
  199 |     await expect(totalCell).toBeVisible();
  200 | 
  201 |     // Download PDF (intercept browser download event)
  202 |     const [download] = await Promise.all([
  203 |       page.waitForEvent("download"),
  204 |       page.click('button[title="Download PDF"] >> nth=0')
  205 |     ]);
  206 | 
  207 |     expect(download.suggestedFilename()).toContain(".pdf");
  208 |     const downloadPath = await download.path();
  209 |     const fileBytes = fs.readFileSync(downloadPath!);
  210 |     
  211 |     // Verify magic bytes %PDF
  212 |     const pdfMagicBytes = fileBytes.toString("utf8", 0, 4);
  213 |     expect(pdfMagicBytes).toBe("%PDF");
  214 |   });
  215 | 
  216 |   // Flow 3: Kanban Task Lifecycle
  217 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  218 |     await page.goto("/login");
  219 |     await submitLoginForm(page, adminEmail, adminPassword);
> 220 |     await expect(page).toHaveURL(/.*dashboard/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  221 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
  222 | 
  223 |     // Create project
  224 |     await page.goto("/projects");
  225 |     await page.click("text=New Project");
  226 |     try {
  227 |       await page.waitForSelector('text=Create New Project', { timeout: 2000 });
  228 |     } catch (e) {
  229 |       await page.click("text=New Project");
  230 |     }
  231 |     await page.fill('input[placeholder*="Acme"]', "E2E Projects Space");
  232 |     await page.fill('textarea[placeholder*="Describe"]', "E2E Kanban Lifecycle testing space");
  233 |     await page.click("text=Create Project");
  234 | 
  235 |     // Add tasks
  236 |     await page.click("text=E2E Projects Space");
  237 |     
  238 |     // Add Task 1
  239 |     await page.click("text=Add Task");
  240 |     try {
  241 |       await page.waitForSelector('text=Create Task', { timeout: 2000 });
  242 |     } catch (e) {
  243 |       await page.click("text=Add Task");
  244 |     }
  245 |     await page.fill('input[placeholder*="OIDC"]', "Task high priority");
  246 |     await page.selectOption('label:has-text("Priority") + select', "high");
  247 |     await page.click("text=Create Task");
  248 | 
  249 |     // Drag-and-drop simulation & verify persisting
  250 |     // (Playwright dragTo handles drag simulation)
  251 |     const taskCard = page.locator("text=Task high priority");
  252 |     const inProgressColumn = page.locator("text=In Progress");
  253 |     await taskCard.dragTo(inProgressColumn);
  254 | 
  255 |     await page.reload();
  256 |     await expect(page.locator('[data-status="in_progress"]')).toContainText("Task high priority");
  257 |   });
  258 | 
  259 |   // Flow 4: CRM Deal Pipeline
  260 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  261 |     await page.goto("/login");
  262 |     await submitLoginForm(page, adminEmail, adminPassword);
  263 |     await expect(page).toHaveURL(/.*dashboard/);
  264 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
  265 | 
  266 |     await page.goto("/crm");
  267 |     // Add Client first (required for Lead)
  268 |     await page.click("text=New Client");
  269 |     try {
  270 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  271 |     } catch (e) {
  272 |       await page.click("text=New Client");
  273 |     }
  274 |     await page.fill('input[placeholder*="John Doe"]', "E2E Lead Client");
  275 |     await page.fill('input[type="email"]', "lead_client@invoice.com");
  276 |     await page.click("text=Add Client");
  277 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  278 | 
  279 |     // Add lead
  280 |     await page.click("text=New Lead");
  281 |     try {
  282 |       await page.waitForSelector('text=Add New Lead', { timeout: 2000 });
  283 |     } catch (e) {
  284 |       await page.click("text=New Lead");
  285 |     }
  286 |     await page.selectOption('select[required]', { label: "E2E Lead Client" });
  287 |     await page.fill('input[placeholder*="5000"]', "25000");
  288 |     await page.click("text=Add Lead");
  289 | 
  290 |     // Check pipeline dashboard update
  291 |     await page.goto("/dashboard");
  292 |     await expect(page.locator("text=$25,000")).toBeVisible();
  293 |   });
  294 | 
  295 |   // Flow 5: Org invite and membership
  296 |   test("Flow 5: Invite Members and Roles", async ({ page }) => {
  297 |     await page.goto("/login");
  298 |     await submitLoginForm(page, adminEmail, adminPassword);
  299 |     await expect(page).toHaveURL(/.*dashboard/);
  300 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
  301 | 
  302 |     await page.goto("/settings/members");
  303 |     await page.fill('input[placeholder="user@example.com"]', "invitee_user@forgeflow.com");
  304 |     await page.click("text=Send Invitation");
  305 | 
  306 |     // Assert listed in pending
  307 |     await expect(page.locator("text=invitee_user@forgeflow.com").last()).toBeVisible();
  308 |   });
  309 | });
  310 | 
```