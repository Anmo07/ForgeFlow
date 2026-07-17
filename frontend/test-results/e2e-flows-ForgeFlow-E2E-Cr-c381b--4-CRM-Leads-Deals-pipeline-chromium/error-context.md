# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 4: CRM Leads & Deals pipeline
- Location: tests-e2e/e2e-flows.spec.ts:225:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*dashboard/
Received string:  "http://localhost:3000/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    11 × unexpected value "http://localhost:3000/login?"
    - unexpected value "http://localhost:3000/login"

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
```

# Test source

```ts
  128 |   });
  129 | 
  130 |   // Flow 2: Invoice Creation and PDF Download
  131 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  132 |     // Bypass lockout by logging in with seed details
  133 |     await page.goto("/login");
  134 |     await submitLoginForm(page, adminEmail, adminPassword);
  135 |     await expect(page).toHaveURL(/.*dashboard/);
  136 | 
  137 |     // Navigate to Invoices
  138 |     await page.goto("/invoices");
  139 | 
  140 |     // Add Client first
  141 |     await page.goto("/crm");
  142 |     await page.click("text=New Client");
  143 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
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
  196 |     await expect(page).toHaveURL(/.*dashboard/);
  197 | 
  198 |     // Create project
  199 |     await page.goto("/projects");
  200 |     await page.click("text=Create Project");
  201 |     await page.fill('input[placeholder="Project Name"]', "E2E Projects Space");
  202 |     await page.fill('textarea[placeholder="Description"]', "E2E Kanban Lifecycle testing space");
  203 |     await page.click("text=Create");
  204 | 
  205 |     // Add tasks
  206 |     await page.click("text=E2E Projects Space");
  207 |     
  208 |     // Add Task 1
  209 |     await page.click("text=Add Task");
  210 |     await page.fill('input[placeholder="Task Title"]', "Task high priority");
  211 |     await page.selectOption("select[name='priority']", "high");
  212 |     await page.click("text=Create");
  213 | 
  214 |     // Drag-and-drop simulation & verify persisting
  215 |     // (Playwright dragTo handles drag simulation)
  216 |     const taskCard = page.locator("text=Task high priority");
  217 |     const inProgressColumn = page.locator("text=In Progress");
  218 |     await taskCard.dragTo(inProgressColumn);
  219 | 
  220 |     await page.reload();
  221 |     await expect(page.locator('[data-status="in_progress"]')).toContainText("Task high priority");
  222 |   });
  223 | 
  224 |   // Flow 4: CRM Deal Pipeline
  225 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  226 |     await page.goto("/login");
  227 |     await submitLoginForm(page, adminEmail, adminPassword);
> 228 |     await expect(page).toHaveURL(/.*dashboard/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  229 | 
  230 |     await page.goto("/crm");
  231 |     // Add lead
  232 |     await page.click("text=New Lead");
  233 |     await page.fill('input[placeholder="Lead Title"]', "Enterprise Deal Lead");
  234 |     await page.fill('input[placeholder="Value"]', "25000");
  235 |     await page.click("text=Save");
  236 | 
  237 |     // Check pipeline dashboard update
  238 |     await page.goto("/dashboard");
  239 |     await expect(page.locator("text=$25,000")).toBeVisible();
  240 |   });
  241 | 
  242 |   // Flow 5: Org invite and membership
  243 |   test("Flow 5: Invite Members and Roles", async ({ page }) => {
  244 |     await page.goto("/login");
  245 |     await submitLoginForm(page, adminEmail, adminPassword);
  246 |     await expect(page).toHaveURL(/.*dashboard/);
  247 | 
  248 |     await page.goto("/settings");
  249 |     await page.click("text=Members");
  250 |     await page.click("text=Invite Member");
  251 |     await page.fill('input[placeholder="Email"]', "invitee_user@forgeflow.com");
  252 |     await page.click("text=Send Invitation");
  253 | 
  254 |     // Assert listed in pending
  255 |     await expect(page.locator("text=invitee_user@forgeflow.com")).toBeVisible();
  256 |   });
  257 | });
  258 | 
```