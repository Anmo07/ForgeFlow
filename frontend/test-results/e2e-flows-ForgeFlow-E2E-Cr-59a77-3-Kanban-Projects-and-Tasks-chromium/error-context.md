# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 3: Kanban Projects and Tasks
- Location: tests-e2e/e2e-flows.spec.ts:228:7

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
  - text: e2e_admin_12505@forgeflow.com
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
  154 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
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
> 232 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
      |                                                                              ^ Error: expect(locator).toBeVisible() failed
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
  255 |     }
  256 |     await page.fill('input[placeholder*="OIDC"]', "Task high priority");
  257 |     await page.selectOption('label:has-text("Priority") + select', "high");
  258 |     await page.click("text=Create Task");
  259 | 
  260 |     // Drag-and-drop simulation & verify persisting
  261 |     // (Playwright dragTo handles drag simulation)
  262 |     const taskCard = page.locator("text=Task high priority");
  263 |     const inProgressColumn = page.locator("text=In Progress");
  264 |     await taskCard.dragTo(inProgressColumn);
  265 | 
  266 |     await page.reload();
  267 |     await expect(page.locator('div[class*="w-[320px]"]').filter({ hasText: "In Progress" })).toContainText("Task high priority");
  268 |   });
  269 | 
  270 |   // Flow 4: CRM Deal Pipeline
  271 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  272 |     await page.goto("/login");
  273 |     await submitLoginForm(page, adminEmail, adminPassword);
  274 |     await expect(page).toHaveURL(/.*dashboard/);
  275 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
  276 | 
  277 |     await page.goto("/crm");
  278 |     // Add Client first (required for Lead)
  279 |     await page.click("text=New Client");
  280 |     try {
  281 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  282 |     } catch (e) {
  283 |       await page.click("text=New Client");
  284 |     }
  285 |     await page.fill('input[placeholder*="John Doe"]', "E2E Lead Client");
  286 |     await page.fill('input[type="email"]', "lead_client@invoice.com");
  287 |     await page.click("text=Add Client");
  288 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  289 | 
  290 |     // Add lead
  291 |     await page.click("text=New Lead");
  292 |     try {
  293 |       await page.waitForSelector('text=Add New Lead', { timeout: 2000 });
  294 |     } catch (e) {
  295 |       await page.click("text=New Lead");
  296 |     }
  297 |     await page.selectOption('select[required]', { label: "E2E Lead Client" });
  298 |     await page.fill('input[placeholder*="5000"]', "25000");
  299 |     await page.click("text=Add Lead");
  300 | 
  301 |     // Check pipeline dashboard update
  302 |     await page.goto("/dashboard");
  303 |     await expect(page.locator("text=$25,000")).toBeVisible();
  304 |   });
  305 | 
  306 |   // Flow 5: Org invite and membership
  307 |   test("Flow 5: Invite Members and Roles", async ({ page }) => {
  308 |     await page.goto("/login");
  309 |     await submitLoginForm(page, adminEmail, adminPassword);
  310 |     await expect(page).toHaveURL(/.*dashboard/);
  311 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
  312 | 
  313 |     await page.goto("/settings/members");
  314 |     await page.fill('input[placeholder="user@example.com"]', "invitee_user@forgeflow.com");
  315 |     await page.click("text=Send Invitation");
  316 | 
  317 |     // Assert listed in pending
  318 |     await expect(page.locator("text=invitee_user@forgeflow.com").last()).toBeVisible();
  319 |   });
  320 | });
  321 | 
```