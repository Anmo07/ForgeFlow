# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 5: Invite Members and Roles
- Location: tests-e2e/e2e-flows.spec.ts:256:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=invitee_user@forgeflow.com')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=invitee_user@forgeflow.com')

```

```yaml
- banner:
  - text: Settings / Members
  - button "Search... ⌘K"
  - button "Toggle theme"
  - button "Notifications"
  - text: T
- complementary:
  - link "ForgeFlow":
    - /url: /dashboard
  - button "E2E Test Org 5669" [expanded]
  - navigation:
    - link "Dashboard":
      - /url: /dashboard
    - link "Projects":
      - /url: /projects
    - link "CRM":
      - /url: /crm
    - link "Invoices":
      - /url: /invoices
    - link "Org Settings":
      - /url: /settings/members
  - text: T Test Admin e2e_admin_92608@forgeflow.com
  - button "Sign Out"
- main:
  - text: Organization Settings
  - navigation:
    - link "Members":
      - /url: /settings/members
    - link "Roles & Perms":
      - /url: /settings/roles
    - link "API Keys":
      - /url: /settings/api-keys
    - link "Sessions":
      - /url: /settings/sessions
    - link "Audit Logs":
      - /url: /settings/logs
    - link "SSO Config":
      - /url: /settings/sso
  - heading "Members & Invitations" [level=2]
  - paragraph: Manage user invitations, access levels, and active memberships for E2E Test Org 5669.
  - text: Email Address
  - textbox "user@example.com": invitee_user@forgeflow.com
  - text: Role Type
  - combobox:
    - option "Admin"
    - option "Manager"
    - option "Member" [selected]
    - option "Client"
    - option "Viewer"
  - button "Send Invitation"
  - text: Network error occurred.
  - paragraph: No members found. Send an invitation above to start building your team.
- alert
- button "Open Tanstack query devtools":
  - img
```

# Test source

```ts
  166 |     await page.click("text=Add Line Item");
  167 |     await page.fill('input[placeholder="Item description"] >> nth=1', "Item 2");
  168 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  169 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  170 | 
  171 |     await page.click("text=Add Line Item");
  172 |     await page.fill('input[placeholder="Item description"] >> nth=2', "Item 3");
  173 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  174 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  175 | 
  176 |     await page.fill('input[placeholder="Tax rate"]', "10");
  177 |     await page.fill('textarea[placeholder="Notes"]', "E2E Test Invoice Notes");
  178 |     await page.click('button:has-text("Create & Render")');
  179 | 
  180 |     // Verify it appears in table
  181 |     const totalCell = page.locator("text=$275.00");
  182 |     await expect(totalCell).toBeVisible();
  183 | 
  184 |     // Download PDF (intercept browser download event)
  185 |     const [download] = await Promise.all([
  186 |       page.waitForEvent("download"),
  187 |       page.click('button[title="Download PDF"] >> nth=0')
  188 |     ]);
  189 | 
  190 |     expect(download.suggestedFilename()).toContain(".pdf");
  191 |     const downloadPath = await download.path();
  192 |     const fileBytes = fs.readFileSync(downloadPath!);
  193 |     
  194 |     // Verify magic bytes %PDF
  195 |     const pdfMagicBytes = fileBytes.toString("utf8", 0, 4);
  196 |     expect(pdfMagicBytes).toBe("%PDF");
  197 |   });
  198 | 
  199 |   // Flow 3: Kanban Task Lifecycle
  200 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  201 |     await page.goto("/login");
  202 |     await submitLoginForm(page, adminEmail, adminPassword);
  203 |     await expect(page).toHaveURL(/.*dashboard/);
  204 | 
  205 |     // Create project
  206 |     await page.goto("/projects");
  207 |     await page.click("text=New Project");
  208 |     await page.fill('input[placeholder="Project Name"]', "E2E Projects Space");
  209 |     await page.fill('textarea[placeholder="Description"]', "E2E Kanban Lifecycle testing space");
  210 |     await page.click("text=Create Project");
  211 | 
  212 |     // Add tasks
  213 |     await page.click("text=E2E Projects Space");
  214 |     
  215 |     // Add Task 1
  216 |     await page.click("text=Add Task");
  217 |     await page.fill('input[placeholder="Task Title"]', "Task high priority");
  218 |     await page.selectOption("select[name='priority']", "high");
  219 |     await page.click("text=Create Task");
  220 | 
  221 |     // Drag-and-drop simulation & verify persisting
  222 |     // (Playwright dragTo handles drag simulation)
  223 |     const taskCard = page.locator("text=Task high priority");
  224 |     const inProgressColumn = page.locator("text=In Progress");
  225 |     await taskCard.dragTo(inProgressColumn);
  226 | 
  227 |     await page.reload();
  228 |     await expect(page.locator('[data-status="in_progress"]')).toContainText("Task high priority");
  229 |   });
  230 | 
  231 |   // Flow 4: CRM Deal Pipeline
  232 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  233 |     await page.goto("/login");
  234 |     await submitLoginForm(page, adminEmail, adminPassword);
  235 |     await expect(page).toHaveURL(/.*dashboard/);
  236 | 
  237 |     await page.goto("/crm");
  238 |     // Add Client first (required for Lead)
  239 |     await page.click("text=New Client");
  240 |     await page.fill('input[placeholder*="John Doe"]', "E2E Lead Client");
  241 |     await page.fill('input[type="email"]', "lead_client@invoice.com");
  242 |     await page.click("text=Add Client");
  243 | 
  244 |     // Add lead
  245 |     await page.click("text=New Lead");
  246 |     await page.selectOption('select[required]', { label: "E2E Lead Client" });
  247 |     await page.fill('input[placeholder*="5000"]', "25000");
  248 |     await page.click("text=Add Lead");
  249 | 
  250 |     // Check pipeline dashboard update
  251 |     await page.goto("/dashboard");
  252 |     await expect(page.locator("text=$25,000")).toBeVisible();
  253 |   });
  254 | 
  255 |   // Flow 5: Org invite and membership
  256 |   test("Flow 5: Invite Members and Roles", async ({ page }) => {
  257 |     await page.goto("/login");
  258 |     await submitLoginForm(page, adminEmail, adminPassword);
  259 |     await expect(page).toHaveURL(/.*dashboard/);
  260 | 
  261 |     await page.goto("/settings/members");
  262 |     await page.fill('input[placeholder="user@example.com"]', "invitee_user@forgeflow.com");
  263 |     await page.click("text=Send Invitation");
  264 | 
  265 |     // Assert listed in pending
> 266 |     await expect(page.locator("text=invitee_user@forgeflow.com")).toBeVisible();
      |                                                                   ^ Error: expect(locator).toBeVisible() failed
  267 |   });
  268 | });
  269 | 
```