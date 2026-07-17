# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 5: Invite Members and Roles
- Location: tests-e2e/e2e-flows.spec.ts:249:7

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
  - button "E2E Test Org 4660" [expanded]
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
  - text: T Test Admin e2e_admin_65390@forgeflow.com
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
  - paragraph: Manage user invitations, access levels, and active memberships for E2E Test Org 4660.
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
  171 |     await page.click('button:has-text("Create & Render")');
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
  200 |     await page.click("text=New Project");
  201 |     await page.fill('input[placeholder="Project Name"]', "E2E Projects Space");
  202 |     await page.fill('textarea[placeholder="Description"]', "E2E Kanban Lifecycle testing space");
  203 |     await page.click("text=Create Project");
  204 | 
  205 |     // Add tasks
  206 |     await page.click("text=E2E Projects Space");
  207 |     
  208 |     // Add Task 1
  209 |     await page.click("text=Add Task");
  210 |     await page.fill('input[placeholder="Task Title"]', "Task high priority");
  211 |     await page.selectOption("select[name='priority']", "high");
  212 |     await page.click("text=Create Task");
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
  228 |     await expect(page).toHaveURL(/.*dashboard/);
  229 | 
  230 |     await page.goto("/crm");
  231 |     // Add Client first (required for Lead)
  232 |     await page.click("text=New Client");
  233 |     await page.fill('input[placeholder*="John Doe"]', "E2E Lead Client");
  234 |     await page.fill('input[type="email"]', "lead_client@invoice.com");
  235 |     await page.click("text=Add Client");
  236 | 
  237 |     // Add lead
  238 |     await page.click("text=New Lead");
  239 |     await page.selectOption('select[required]', { label: "E2E Lead Client" });
  240 |     await page.fill('input[placeholder*="5000"]', "25000");
  241 |     await page.click("text=Add Lead");
  242 | 
  243 |     // Check pipeline dashboard update
  244 |     await page.goto("/dashboard");
  245 |     await expect(page.locator("text=$25,000")).toBeVisible();
  246 |   });
  247 | 
  248 |   // Flow 5: Org invite and membership
  249 |   test("Flow 5: Invite Members and Roles", async ({ page }) => {
  250 |     await page.goto("/login");
  251 |     await submitLoginForm(page, adminEmail, adminPassword);
  252 |     await expect(page).toHaveURL(/.*dashboard/);
  253 | 
  254 |     await page.goto("/settings/members");
  255 |     await page.fill('input[placeholder="user@example.com"]', "invitee_user@forgeflow.com");
  256 |     await page.click("text=Send Invitation");
  257 | 
  258 |     // Assert listed in pending
> 259 |     await expect(page.locator("text=invitee_user@forgeflow.com")).toBeVisible();
      |                                                                   ^ Error: expect(locator).toBeVisible() failed
  260 |   });
  261 | });
  262 | 
```