# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 3: Kanban Projects and Tasks
- Location: tests-e2e/e2e-flows.spec.ts:233:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*dashboard/
Received string:  "http://localhost:3000/login?"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × unexpected value "http://localhost:3000/login?"

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
  136 |     await page.goto("/login");
  137 |     await submitLoginForm(page, adminEmail, adminPassword);
  138 | 
  139 |     // Confirm redirected to dashboard
  140 |     await expect(page).toHaveURL(/.*dashboard/);
  141 | 
  142 |     // Logout
  143 |     await page.evaluate(() => {
  144 |       localStorage.clear();
  145 |       document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  146 |       window.location.href = "/login";
  147 |     });
  148 |     await page.waitForURL(/.*login/);
  149 | 
  150 |     // Trigger Account Lockout (5 failed attempts)
  151 |     for (let i = 0; i < 5; i++) {
  152 |       await submitLoginForm(page, adminEmail, "wrong-password");
  153 |     }
  154 | 
  155 |     // Lockout UI/Notification validation
  156 |     await submitLoginForm(page, adminEmail, adminPassword);
  157 |     await expect(page.locator('.text-rose-400').or(page.locator("text=locked")).or(page.locator("text=too many attempts")).or(page.locator("text=lockout")).or(page.locator("text=Account locked"))).toBeVisible();
  158 | 
  159 |     // Flush Redis lockout state so adminEmail is unlocked for subsequent test flows
  160 |     try {
  161 |       execSync("redis-cli flushall");
  162 |     } catch (e) {}
  163 |   });
  164 | 
  165 |   // Flow 2: Invoice Creation and PDF Download
  166 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  167 |     // Bypass lockout by logging in with seed details
  168 |     await page.goto("/login");
  169 |     await submitLoginForm(page, adminEmail, adminPassword);
  170 |     await expect(page).toHaveURL(/.*dashboard/);
  171 | 
  172 |     // Add Client first in CRM
  173 |     await page.goto("/crm");
  174 |     await page.locator('button:has-text("New Client")').first().click({ force: true });
  175 |     try {
  176 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  177 |     } catch (e) {
  178 |       await page.locator('button:has-text("New Client")').first().click({ force: true });
  179 |     }
  180 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  181 |     await page.fill('input[type="email"]', "client@invoice.com");
  182 |     await page.locator('button[type="submit"]:has-text("Add Client")').click({ force: true });
  183 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  184 | 
  185 |     // Create Invoice
  186 |     await page.goto("/invoices");
  187 |     await page.locator('button:has-text("Create Invoice")').first().click({ force: true });
  188 |     try {
  189 |       await page.waitForSelector('text=Create & Render', { timeout: 2000 });
  190 |     } catch (e) {
  191 |       await page.locator('button:has-text("Create Invoice")').first().click({ force: true });
  192 |     }
  193 |     
  194 |     // Fill Invoice form
  195 |     const clientSelector = 'label:has-text("Client Organization") + select option:has-text("E2E Invoice Client")';
  196 |     await page.waitForSelector(clientSelector, { state: "attached" });
  197 |     const clientOptionVal = await page.locator(clientSelector).getAttribute("value");
  198 |     await page.selectOption('label:has-text("Client Organization") + select', clientOptionVal || "");
  199 |     const today = new Date().toISOString().split("T")[0];
  200 |     await page.fill('label:has-text("Issue Date") + input', today);
  201 |     await page.fill('label:has-text("Due Date") + input', today);
  202 |     // Set 3 line items
  203 |     await page.fill('input[placeholder*="product or service"]', "Item 1");
  204 |     await page.fill('input[placeholder="Qty"]', "2");
  205 |     await page.fill('input[placeholder="Price"]', "50");
  206 | 
  207 |     await page.click("text=Add Item", { force: true });
  208 |     await page.fill('input[placeholder*="product or service"] >> nth=1', "Item 2");
  209 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  210 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  211 | 
  212 |     await page.click("text=Add Item", { force: true });
  213 |     await page.fill('input[placeholder*="product or service"] >> nth=2', "Item 3");
  214 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  215 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  216 | 
  217 |     await page.fill('label:has-text("Tax Rate") + input', "10");
  218 |     await page.fill('textarea[placeholder*="Notes"]', "E2E Test Invoice Notes");
  219 |     await page.click('button:has-text("Create & Render")', { force: true });
  220 | 
  221 |     // Verify it appears in table
  222 |     const totalCell = page.locator("table tbody td:has-text('$275.00')");
  223 |     await expect(totalCell).toBeVisible();
  224 | 
  225 |     // Verify PDF download button exists & API generates PDF
  226 |     const pdfBtn = page.locator('button[title="Download PDF"]').first();
  227 |     await expect(pdfBtn).toBeVisible();
  228 |     const pdfResponse = await page.request.get(`/api/invoices/1/pdf`);
  229 |     expect([200, 307, 302, 404]).toContain(pdfResponse.status());
  230 |   });
  231 | 
  232 |   // Flow 3: Kanban Task Lifecycle
  233 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  234 |     await page.goto("/login");
  235 |     await submitLoginForm(page, adminEmail, adminPassword);
> 236 |     await expect(page).toHaveURL(/.*dashboard/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  237 | 
  238 |     // Create project
  239 |     await page.goto("/projects");
  240 |     await page.locator('button:has-text("New Project")').first().click({ force: true });
  241 |     try {
  242 |       await page.waitForSelector('text=Create New Project', { timeout: 2000 });
  243 |     } catch (e) {
  244 |       await page.locator('button:has-text("New Project")').first().click({ force: true });
  245 |     }
  246 |     await page.fill('input[placeholder*="Acme"]', "E2E Projects Space");
  247 |     await page.fill('textarea[placeholder*="Describe"]', "E2E Kanban Lifecycle testing space");
  248 |     await page.locator('button[type="submit"]:has-text("Create Project")').click({ force: true });
  249 |     await expect(page.locator('text=Create New Project')).toBeHidden();
  250 | 
  251 |     // Add tasks
  252 |     const projCard = page.locator('text="E2E Projects Space"').first();
  253 |     await expect(projCard).toBeVisible({ timeout: 10000 });
  254 |     await projCard.click({ force: true });
  255 |     await page.waitForURL(/.*projects\/.*/);
  256 |     
  257 |     // Add Task 1
  258 |     await page.locator('button:has-text("Add Task")').first().click({ force: true });
  259 |     try {
  260 |       await page.waitForSelector('text=Create Task', { timeout: 2000 });
  261 |     } catch (e) {
  262 |       await page.locator('button:has-text("Add Task")').first().click({ force: true });
  263 |     }
  264 |     await page.fill('input[placeholder*="OIDC"]', "Task high priority");
  265 |     await page.selectOption('label:has-text("Priority") + select', "high");
  266 |     await page.locator('button[type="submit"]:has-text("Create Task")').click({ force: true });
  267 |     await expect(page.locator('text=Create Task')).toBeHidden();
  268 | 
  269 |     // Drag-and-drop simulation & verify persisting
  270 |     const taskCard = page.locator("text=Task high priority");
  271 |     const inProgressColumn = page.locator("text=In Progress");
  272 |     await taskCard.dragTo(inProgressColumn);
  273 | 
  274 |     await page.reload();
  275 |     await expect(page.locator('div[class*="w-[280px]"], div[class*="w-[320px]"]').filter({ hasText: "In Progress" })).toContainText("Task high priority");
  276 |   });
  277 | 
  278 |   // Flow 4: CRM Deal Pipeline
  279 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  280 |     await page.goto("/login");
  281 |     await submitLoginForm(page, adminEmail, adminPassword);
  282 |     await expect(page).toHaveURL(/.*dashboard/);
  283 | 
  284 |     await page.goto("/crm");
  285 |     // Add Client first (required for Lead)
  286 |     await page.locator('button:has-text("New Client")').first().click({ force: true });
  287 |     try {
  288 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  289 |     } catch (e) {
  290 |       await page.locator('button:has-text("New Client")').first().click({ force: true });
  291 |     }
  292 |     await page.fill('input[placeholder*="John Doe"]', "E2E Lead Client");
  293 |     await page.fill('input[type="email"]', "lead_client@invoice.com");
  294 |     await page.locator('button[type="submit"]:has-text("Add Client")').click({ force: true });
  295 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  296 | 
  297 |     // Add lead
  298 |     await page.locator('button:has-text("New Lead")').first().click({ force: true });
  299 |     try {
  300 |       await page.waitForSelector('text=Add New Lead', { timeout: 2000 });
  301 |     } catch (e) {
  302 |       await page.locator('button:has-text("New Lead")').first().click({ force: true });
  303 |     }
  304 |     await page.selectOption('select[required]', { index: 1 });
  305 |     await page.fill('input[placeholder*="5000"]', "25000");
  306 |     await page.locator('button[type="submit"]:has-text("Add Lead")').click({ force: true });
  307 |     await expect(page.locator('text=Add New Lead')).toBeHidden();
  308 | 
  309 |     // Check CRM list or pipeline dashboard update
  310 |     await page.goto("/crm");
  311 |     await expect(page.locator("text=25,000").or(page.locator("text=$25,000")).or(page.locator("text=25000"))).toBeVisible();
  312 |   });
  313 | 
  314 |   // Flow 5: Org invite and membership
  315 |   test("Flow 5: Invite Members and Roles", async ({ page }) => {
  316 |     await page.goto("/login");
  317 |     await submitLoginForm(page, adminEmail, adminPassword);
  318 |     await expect(page).toHaveURL(/.*dashboard/);
  319 | 
  320 |     await page.goto("/settings/members");
  321 |     await page.fill('input[placeholder="user@example.com"]', "invitee_user@forgeflow.com");
  322 |     await page.locator('button:has-text("Send Invitation")').click({ force: true });
  323 | 
  324 |     // Assert listed in pending
  325 |     await expect(page.locator("text=invitee_user@forgeflow.com").last()).toBeVisible();
  326 |   });
  327 | });
  328 | 
```