# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 5: Invite Members and Roles
- Location: tests-e2e/e2e-flows.spec.ts:307:7

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
  - text: e2e_admin_33784@forgeflow.com
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
  232 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
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
> 311 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
      |                                                                              ^ Error: expect(locator).toBeVisible() failed
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