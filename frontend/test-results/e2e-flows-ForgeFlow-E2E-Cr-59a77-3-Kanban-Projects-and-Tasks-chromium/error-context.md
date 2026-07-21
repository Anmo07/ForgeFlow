# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 3: Kanban Projects and Tasks
- Location: tests-e2e/e2e-flows.spec.ts:263:7

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
```

# Test source

```ts
  166 |     await page.goto("/login");
  167 |     await submitLoginForm(page, adminEmail, adminPassword);
  168 | 
  169 |     // Confirm redirected to dashboard
  170 |     await expect(page).toHaveURL(/.*dashboard/);
  171 | 
  172 |     // Logout
  173 |     await page.evaluate(() => {
  174 |       localStorage.clear();
  175 |       document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  176 |       window.location.href = "/login";
  177 |     });
  178 |     await page.waitForURL(/.*login/);
  179 | 
  180 |     // Trigger Account Lockout (5 failed attempts)
  181 |     for (let i = 0; i < 5; i++) {
  182 |       await submitLoginForm(page, adminEmail, "wrong-password");
  183 |     }
  184 | 
  185 |     // Lockout UI/Notification validation
  186 |     await submitLoginForm(page, adminEmail, adminPassword);
  187 |     await expect(page.locator('.text-rose-400').or(page.locator("text=locked")).or(page.locator("text=too many attempts")).or(page.locator("text=lockout")).or(page.locator("text=Account locked"))).toBeVisible();
  188 | 
  189 |     // Flush Redis lockout state so adminEmail is unlocked for subsequent test flows
  190 |     try {
  191 |       execSync("redis-cli flushall");
  192 |     } catch (e) {}
  193 |   });
  194 | 
  195 |   // Flow 2: Invoice Creation and PDF Download
  196 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  197 |     // Bypass lockout by logging in with seed details
  198 |     await page.goto("/login");
  199 |     await submitLoginForm(page, adminEmail, adminPassword);
  200 |     await expect(page).toHaveURL(/.*dashboard/);
  201 | 
  202 |     // Add Client first in CRM
  203 |     await page.goto("/crm");
  204 |     await page.locator('button:has-text("New Client")').first().click({ force: true });
  205 |     try {
  206 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  207 |     } catch (e) {
  208 |       await page.locator('button:has-text("New Client")').first().click({ force: true });
  209 |     }
  210 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  211 |     await page.fill('input[type="email"]', "client@invoice.com");
  212 |     await page.locator('button[type="submit"]:has-text("Add Client")').click({ force: true });
  213 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  214 | 
  215 |     // Create Invoice
  216 |     await page.goto("/invoices");
  217 |     await page.locator('button:has-text("Create Invoice")').first().click({ force: true });
  218 |     try {
  219 |       await page.waitForSelector('text=Create & Render', { timeout: 2000 });
  220 |     } catch (e) {
  221 |       await page.locator('button:has-text("Create Invoice")').first().click({ force: true });
  222 |     }
  223 |     
  224 |     // Fill Invoice form
  225 |     const clientSelector = 'label:has-text("Client Organization") + select option:has-text("E2E Invoice Client")';
  226 |     await page.waitForSelector(clientSelector, { state: "attached" });
  227 |     const clientOptionVal = await page.locator(clientSelector).getAttribute("value");
  228 |     await page.selectOption('label:has-text("Client Organization") + select', clientOptionVal || "");
  229 |     const today = new Date().toISOString().split("T")[0];
  230 |     await page.fill('label:has-text("Issue Date") + input', today);
  231 |     await page.fill('label:has-text("Due Date") + input', today);
  232 |     // Set 3 line items
  233 |     await page.fill('input[placeholder*="product or service"]', "Item 1");
  234 |     await page.fill('input[placeholder="Qty"]', "2");
  235 |     await page.fill('input[placeholder="Price"]', "50");
  236 | 
  237 |     await page.click("text=Add Item", { force: true });
  238 |     await page.fill('input[placeholder*="product or service"] >> nth=1', "Item 2");
  239 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  240 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  241 | 
  242 |     await page.click("text=Add Item", { force: true });
  243 |     await page.fill('input[placeholder*="product or service"] >> nth=2', "Item 3");
  244 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  245 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  246 | 
  247 |     await page.fill('label:has-text("Tax Rate") + input', "10");
  248 |     await page.fill('textarea[placeholder*="Notes"]', "E2E Test Invoice Notes");
  249 |     await page.click('button:has-text("Create & Render")', { force: true });
  250 | 
  251 |     // Verify it appears in table
  252 |     const totalCell = page.locator("table tbody td:has-text('$275.00')");
  253 |     await expect(totalCell).toBeVisible();
  254 | 
  255 |     // Verify PDF download button exists & API generates PDF
  256 |     const pdfBtn = page.locator('button[title="Download PDF"]').first();
  257 |     await expect(pdfBtn).toBeVisible();
  258 |     const pdfResponse = await page.request.get(`/api/invoices/1/pdf`);
  259 |     expect([200, 307, 302, 404]).toContain(pdfResponse.status());
  260 |   });
  261 | 
  262 |   // Flow 3: Kanban Task Lifecycle
  263 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  264 |     await page.goto("/login");
  265 |     await submitLoginForm(page, adminEmail, adminPassword);
> 266 |     await expect(page).toHaveURL(/.*dashboard/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  267 | 
  268 |     // Create project
  269 |     await page.goto("/projects");
  270 |     await page.locator('button:has-text("New Project")').first().click({ force: true });
  271 |     try {
  272 |       await page.waitForSelector('text=Create New Project', { timeout: 2000 });
  273 |     } catch (e) {
  274 |       await page.locator('button:has-text("New Project")').first().click({ force: true });
  275 |     }
  276 |     await page.fill('input[placeholder*="Acme"]', "E2E Projects Space");
  277 |     await page.fill('textarea[placeholder*="Describe"]', "E2E Kanban Lifecycle testing space");
  278 |     await page.locator('button[type="submit"]:has-text("Create Project")').click({ force: true });
  279 |     await expect(page.locator('text=Create New Project')).toBeHidden();
  280 | 
  281 |     // Add tasks
  282 |     const projCard = page.locator('text="E2E Projects Space"').first();
  283 |     await expect(projCard).toBeVisible({ timeout: 10000 });
  284 |     await projCard.click({ force: true });
  285 |     await page.waitForURL(/.*projects\/.*/);
  286 |     
  287 |     // Add Task 1
  288 |     await page.locator('button:has-text("Add Task")').first().click({ force: true });
  289 |     try {
  290 |       await page.waitForSelector('text=Create Task', { timeout: 2000 });
  291 |     } catch (e) {
  292 |       await page.locator('button:has-text("Add Task")').first().click({ force: true });
  293 |     }
  294 |     await page.fill('input[placeholder*="OIDC"]', "Task high priority");
  295 |     await page.selectOption('label:has-text("Priority") + select', "high");
  296 |     await page.locator('button[type="submit"]:has-text("Create Task")').click({ force: true });
  297 |     await expect(page.locator('text=Create Task')).toBeHidden();
  298 | 
  299 |     // Drag-and-drop simulation & verify persisting
  300 |     const taskCard = page.locator("text=Task high priority");
  301 |     const inProgressColumn = page.locator("text=In Progress");
  302 |     await taskCard.dragTo(inProgressColumn);
  303 | 
  304 |     await page.reload();
  305 |     await expect(page.locator('div[class*="w-[280px]"], div[class*="w-[320px]"]').filter({ hasText: "In Progress" })).toContainText("Task high priority");
  306 |   });
  307 | 
  308 |   // Flow 4: CRM Deal Pipeline
  309 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  310 |     await page.goto("/login");
  311 |     await submitLoginForm(page, adminEmail, adminPassword);
  312 |     await expect(page).toHaveURL(/.*dashboard/);
  313 | 
  314 |     await page.goto("/crm");
  315 |     // Add Client first (required for Lead)
  316 |     await page.locator('button:has-text("New Client")').first().click({ force: true });
  317 |     try {
  318 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  319 |     } catch (e) {
  320 |       await page.locator('button:has-text("New Client")').first().click({ force: true });
  321 |     }
  322 |     await page.fill('input[placeholder*="John Doe"]', "E2E Lead Client");
  323 |     await page.fill('input[type="email"]', "lead_client@invoice.com");
  324 |     await page.locator('button[type="submit"]:has-text("Add Client")').click({ force: true });
  325 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  326 | 
  327 |     // Add lead
  328 |     await page.locator('button:has-text("New Lead")').first().click({ force: true });
  329 |     try {
  330 |       await page.waitForSelector('text=Add New Lead', { timeout: 2000 });
  331 |     } catch (e) {
  332 |       await page.locator('button:has-text("New Lead")').first().click({ force: true });
  333 |     }
  334 |     await page.selectOption('select[required]', { index: 1 });
  335 |     await page.fill('input[placeholder*="5000"]', "25000");
  336 |     await page.locator('button[type="submit"]:has-text("Add Lead")').click({ force: true });
  337 |     await expect(page.locator('text=Add New Lead')).toBeHidden();
  338 | 
  339 |     // Check CRM list or pipeline dashboard update
  340 |     await page.goto("/crm");
  341 |     await expect(page.locator("text=25,000").or(page.locator("text=$25,000")).or(page.locator("text=25000"))).toBeVisible();
  342 |   });
  343 | 
  344 |   // Flow 5: Org invite and membership
  345 |   test("Flow 5: Invite Members and Roles", async ({ page }) => {
  346 |     await page.goto("/login");
  347 |     await submitLoginForm(page, adminEmail, adminPassword);
  348 |     await expect(page).toHaveURL(/.*dashboard/);
  349 | 
  350 |     await page.goto("/settings/members");
  351 |     await page.fill('input[placeholder="user@example.com"]', "invitee_user@forgeflow.com");
  352 |     await page.locator('button:has-text("Send Invitation")').click({ force: true });
  353 | 
  354 |     // Assert listed in pending
  355 |     await expect(page.locator("text=invitee_user@forgeflow.com").last()).toBeVisible();
  356 |   });
  357 | });
  358 | 
```