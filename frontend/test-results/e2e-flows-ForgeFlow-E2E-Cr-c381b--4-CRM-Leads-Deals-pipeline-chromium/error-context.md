# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 4: CRM Leads & Deals pipeline
- Location: tests-e2e/e2e-flows.spec.ts:263:7

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
  166 |     await page.click("text=Create Invoice");
  167 |     try {
  168 |       await page.waitForSelector('text=Create & Render', { timeout: 2000 });
  169 |     } catch (e) {
  170 |       await page.click("text=Create Invoice");
  171 |     }
  172 |     
  173 |     // Fill Invoice form
  174 |     const clientSelector = 'label:has-text("Client Organization") + select option:has-text("E2E Invoice Client")';
  175 |     await page.waitForSelector(clientSelector, { state: "attached" });
  176 |     const clientOptionVal = await page.locator(clientSelector).getAttribute("value");
  177 |     await page.selectOption('label:has-text("Client Organization") + select', clientOptionVal || "");
  178 |     const today = new Date().toISOString().split("T")[0];
  179 |     await page.fill('label:has-text("Issue Date") + input', today);
  180 |     await page.fill('label:has-text("Due Date") + input', today);
  181 |     // Set 3 line items
  182 |     await page.fill('input[placeholder*="product or service"]', "Item 1");
  183 |     await page.fill('input[placeholder="Qty"]', "2");
  184 |     await page.fill('input[placeholder="Price"]', "50");
  185 | 
  186 |     await page.click("text=Add Item");
  187 |     await page.fill('input[placeholder*="product or service"] >> nth=1', "Item 2");
  188 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  189 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  190 | 
  191 |     await page.click("text=Add Item");
  192 |     await page.fill('input[placeholder*="product or service"] >> nth=2', "Item 3");
  193 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  194 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  195 | 
  196 |     await page.fill('label:has-text("Tax Rate") + input', "10");
  197 |     await page.fill('textarea[placeholder*="Notes"]', "E2E Test Invoice Notes");
  198 |     await page.click('button:has-text("Create & Render")');
  199 | 
  200 |     // Verify it appears in table
  201 |     const totalCell = page.locator("table tbody td:has-text('$275.00')");
  202 |     await expect(totalCell).toBeVisible();
  203 | 
  204 |     // Download PDF (intercept browser download event)
  205 |     const [download] = await Promise.all([
  206 |       page.waitForEvent("download"),
  207 |       page.click('button[title="Download PDF"] >> nth=0')
  208 |     ]);
  209 | 
  210 |     expect(download.suggestedFilename()).toContain(".pdf");
  211 |     const downloadPath = await download.path();
  212 |     const fileBytes = fs.readFileSync(downloadPath!);
  213 |     
  214 |     // Verify magic bytes %PDF
  215 |     const pdfMagicBytes = fileBytes.toString("utf8", 0, 4);
  216 |     expect(pdfMagicBytes).toBe("%PDF");
  217 |   });
  218 | 
  219 |   // Flow 3: Kanban Task Lifecycle
  220 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  221 |     await page.goto("/login");
  222 |     await submitLoginForm(page, adminEmail, adminPassword);
  223 |     await expect(page).toHaveURL(/.*dashboard/);
  224 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
  225 | 
  226 |     // Create project
  227 |     await page.goto("/projects");
  228 |     await page.click("text=New Project");
  229 |     try {
  230 |       await page.waitForSelector('text=Create New Project', { timeout: 2000 });
  231 |     } catch (e) {
  232 |       await page.click("text=New Project");
  233 |     }
  234 |     await page.fill('input[placeholder*="Acme"]', "E2E Projects Space");
  235 |     await page.fill('textarea[placeholder*="Describe"]', "E2E Kanban Lifecycle testing space");
  236 |     await page.click("text=Create Project");
  237 | 
  238 |     // Add tasks
  239 |     await page.click("text=E2E Projects Space");
  240 |     
  241 |     // Add Task 1
  242 |     await page.click("text=Add Task");
  243 |     try {
  244 |       await page.waitForSelector('text=Create Task', { timeout: 2000 });
  245 |     } catch (e) {
  246 |       await page.click("text=Add Task");
  247 |     }
  248 |     await page.fill('input[placeholder*="OIDC"]', "Task high priority");
  249 |     await page.selectOption('label:has-text("Priority") + select', "high");
  250 |     await page.click("text=Create Task");
  251 | 
  252 |     // Drag-and-drop simulation & verify persisting
  253 |     // (Playwright dragTo handles drag simulation)
  254 |     const taskCard = page.locator("text=Task high priority");
  255 |     const inProgressColumn = page.locator("text=In Progress");
  256 |     await taskCard.dragTo(inProgressColumn);
  257 | 
  258 |     await page.reload();
  259 |     await expect(page.locator('div').filter({ has: page.locator('span', { hasText: /^In Progress$/ }) })).toContainText("Task high priority");
  260 |   });
  261 | 
  262 |   // Flow 4: CRM Deal Pipeline
  263 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  264 |     await page.goto("/login");
  265 |     await submitLoginForm(page, adminEmail, adminPassword);
> 266 |     await expect(page).toHaveURL(/.*dashboard/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  267 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
  268 | 
  269 |     await page.goto("/crm");
  270 |     // Add Client first (required for Lead)
  271 |     await page.click("text=New Client");
  272 |     try {
  273 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  274 |     } catch (e) {
  275 |       await page.click("text=New Client");
  276 |     }
  277 |     await page.fill('input[placeholder*="John Doe"]', "E2E Lead Client");
  278 |     await page.fill('input[type="email"]', "lead_client@invoice.com");
  279 |     await page.click("text=Add Client");
  280 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  281 | 
  282 |     // Add lead
  283 |     await page.click("text=New Lead");
  284 |     try {
  285 |       await page.waitForSelector('text=Add New Lead', { timeout: 2000 });
  286 |     } catch (e) {
  287 |       await page.click("text=New Lead");
  288 |     }
  289 |     await page.selectOption('select[required]', { label: "E2E Lead Client" });
  290 |     await page.fill('input[placeholder*="5000"]', "25000");
  291 |     await page.click("text=Add Lead");
  292 | 
  293 |     // Check pipeline dashboard update
  294 |     await page.goto("/dashboard");
  295 |     await expect(page.locator("text=$25,000")).toBeVisible();
  296 |   });
  297 | 
  298 |   // Flow 5: Org invite and membership
  299 |   test("Flow 5: Invite Members and Roles", async ({ page }) => {
  300 |     await page.goto("/login");
  301 |     await submitLoginForm(page, adminEmail, adminPassword);
  302 |     await expect(page).toHaveURL(/.*dashboard/);
  303 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
  304 | 
  305 |     await page.goto("/settings/members");
  306 |     await page.fill('input[placeholder="user@example.com"]', "invitee_user@forgeflow.com");
  307 |     await page.click("text=Send Invitation");
  308 | 
  309 |     // Assert listed in pending
  310 |     await expect(page.locator("text=invitee_user@forgeflow.com").last()).toBeVisible();
  311 |   });
  312 | });
  313 | 
```