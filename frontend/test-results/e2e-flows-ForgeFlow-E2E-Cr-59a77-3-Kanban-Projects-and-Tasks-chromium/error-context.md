# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 3: Kanban Projects and Tasks
- Location: tests-e2e/e2e-flows.spec.ts:200:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[placeholder="Project Name"]')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]: Projects
      - generic [ref=e6]:
        - button "Search... ⌘K" [ref=e7]:
          - generic [ref=e8]:
            - img [ref=e9]
            - generic [ref=e12]: Search...
          - generic [ref=e13]: ⌘K
        - button "Toggle theme" [ref=e14]:
          - img [ref=e15]
        - button "Notifications" [ref=e17]:
          - img [ref=e18]
        - generic [ref=e22]: T
    - complementary [ref=e23]:
      - generic [ref=e24]:
        - generic [ref=e25]:
          - link "ForgeFlow" [ref=e26] [cursor=pointer]:
            - /url: /dashboard
          - button "E2E Test Org 1721" [expanded] [ref=e29]:
            - generic [ref=e30]: E2E Test Org 1721
            - img [ref=e31]
        - navigation [ref=e33]:
          - link "Dashboard" [ref=e34] [cursor=pointer]:
            - /url: /dashboard
            - generic [ref=e35]:
              - img [ref=e36]
              - generic [ref=e41]: Dashboard
          - link "Projects" [ref=e42] [cursor=pointer]:
            - /url: /projects
            - generic [ref=e44]:
              - img [ref=e45]
              - generic [ref=e47]: Projects
          - link "CRM" [ref=e48] [cursor=pointer]:
            - /url: /crm
            - generic [ref=e49]:
              - img [ref=e50]
              - generic [ref=e55]: CRM
          - link "Invoices" [ref=e56] [cursor=pointer]:
            - /url: /invoices
            - generic [ref=e57]:
              - img [ref=e58]
              - generic [ref=e61]: Invoices
          - link "Org Settings" [ref=e62] [cursor=pointer]:
            - /url: /settings/members
            - generic [ref=e63]:
              - img [ref=e64]
              - generic [ref=e65]: Org Settings
        - generic [ref=e66]:
          - generic [ref=e67]:
            - generic [ref=e68]: T
            - generic [ref=e69]:
              - generic [ref=e70]: Test Admin
              - generic [ref=e71]: e2e_admin_5747@forgeflow.com
          - button "Sign Out" [ref=e72]:
            - img [ref=e73]
    - main [ref=e76]:
      - generic [ref=e78]:
        - generic [ref=e79]:
          - generic [ref=e80]:
            - heading "Projects" [level=1] [ref=e81]
            - paragraph [ref=e82]: Manage workspaces, tasks, and delivery schedules.
          - button "New Project" [active] [ref=e83]:
            - img [ref=e84]
            - text: New Project
        - generic [ref=e85]:
          - generic [ref=e86]:
            - generic [ref=e87]:
              - generic [ref=e88]: Total Projects
              - img [ref=e89]
            - generic [ref=e91]: "0"
            - paragraph [ref=e92]: Across this workspace
          - generic [ref=e93]:
            - generic [ref=e94]:
              - generic [ref=e95]: In Progress
              - img [ref=e96]
            - generic [ref=e99]: "0"
            - paragraph [ref=e100]: Active execution phase
          - generic [ref=e101]:
            - generic [ref=e102]:
              - generic [ref=e103]: Completed
              - img [ref=e104]
            - generic [ref=e107]: "0"
            - paragraph [ref=e108]: Delivered successfully
          - generic [ref=e109]:
            - generic [ref=e110]:
              - generic [ref=e111]: Delayed
              - img [ref=e112]
            - generic [ref=e114]: "0"
            - paragraph [ref=e115]: Requires focus
        - generic [ref=e116]:
          - generic [ref=e117]:
            - img [ref=e118]
            - textbox "Search projects..." [ref=e121]
          - generic [ref=e122]:
            - img [ref=e123]
            - combobox [ref=e124]:
              - option "All Statuses" [selected]
              - option "Planning"
              - option "In Progress"
              - option "Completed"
              - option "Delayed"
              - option "Archived"
        - generic [ref=e125]:
          - img [ref=e126]
          - paragraph [ref=e128]: No projects found. Create a project to start tracking work.
        - generic [ref=e131]:
          - generic [ref=e132]:
            - heading "Create New Project" [level=2] [ref=e133]
            - button [ref=e134]:
              - img [ref=e135]
          - generic [ref=e138]:
            - generic [ref=e139]:
              - text: Project Name
              - textbox "e.g. Acme App Launch" [ref=e140]
            - generic [ref=e141]:
              - text: Description
              - textbox "Describe the project goal..." [ref=e142]
            - generic [ref=e143]:
              - generic [ref=e144]:
                - text: Initial Status
                - combobox [ref=e145]:
                  - option "Planning" [selected]
                  - option "In Progress"
                  - option "Completed"
                  - option "Delayed"
              - generic [ref=e146]:
                - text: Priority
                - combobox [ref=e147]:
                  - option "Low"
                  - option "Medium" [selected]
                  - option "High"
                  - option "Critical"
            - generic [ref=e148]:
              - text: Due Date
              - textbox [ref=e149]
            - generic [ref=e150]:
              - button "Cancel" [ref=e151]
              - button "Create Project" [ref=e152]
  - button "Open Next.js Dev Tools" [ref=e158] [cursor=pointer]:
    - img [ref=e159]
  - alert [ref=e162]: Projects
  - generic [ref=e163]:
    - img [ref=e165]
    - button "Open Tanstack query devtools" [ref=e213] [cursor=pointer]:
      - img [ref=e214]
```

# Test source

```ts
  108 |     await page.fill('#reg-name', "E2E Registrant");
  109 |     
  110 |     // Simulate turnstile checked
  111 |     await page.evaluate(() => {
  112 |       (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  113 |     });
  114 | 
  115 |     // We skip actual email verify/MFA TOTP code extraction in client E2E if mock authentication modes are toggled,
  116 |     // but we simulate the authentication flow steps.
  117 |     await page.goto("/login");
  118 |     await submitLoginForm(page, adminEmail, adminPassword);
  119 | 
  120 |     // Confirm redirected to dashboard
  121 |     await expect(page).toHaveURL(/.*dashboard/);
  122 | 
  123 |     // Logout
  124 |     await page.click('button[title="Sign Out"]');
  125 |     await expect(page).toHaveURL(/.*(login|\/)$/);
  126 | 
  127 |     // Trigger Account Lockout (5 failed attempts)
  128 |     for (let i = 0; i < 5; i++) {
  129 |       await submitLoginForm(page, adminEmail, "wrong-password");
  130 |     }
  131 | 
  132 |     // Lockout UI/Notification validation
  133 |     await submitLoginForm(page, adminEmail, adminPassword);
  134 |     await expect(page.locator("text=locked").or(page.locator("text=too many attempts")).or(page.locator("text=lockout"))).toBeVisible();
  135 |   });
  136 | 
  137 |   // Flow 2: Invoice Creation and PDF Download
  138 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  139 |     // Bypass lockout by logging in with seed details
  140 |     await page.goto("/login");
  141 |     await submitLoginForm(page, adminEmail, adminPassword);
  142 |     await expect(page).toHaveURL(/.*dashboard/);
  143 | 
  144 |     // Navigate to Invoices
  145 |     await page.goto("/invoices");
  146 | 
  147 |     // Add Client first
  148 |     await page.goto("/crm");
  149 |     await page.click("text=New Client");
  150 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  151 |     await page.fill('input[type="email"]', "client@invoice.com");
  152 |     await page.click("text=Add Client");
  153 | 
  154 |     // Create Invoice
  155 |     await page.goto("/invoices");
  156 |     await page.click("text=Create Invoice");
  157 |     
  158 |     // Fill Invoice form
  159 |     await page.selectOption("select", { label: "E2E Invoice Client" });
  160 |     await page.fill('input[type="date"]', new Date().toISOString().split("T")[0]);
  161 |     // Set 3 line items
  162 |     await page.fill('input[placeholder="Item description"]', "Item 1");
  163 |     await page.fill('input[placeholder="Qty"]', "2");
  164 |     await page.fill('input[placeholder="Price"]', "50");
  165 | 
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
> 208 |     await page.fill('input[placeholder="Project Name"]', "E2E Projects Space");
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
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
  266 |     await expect(page.locator("text=invitee_user@forgeflow.com")).toBeVisible();
  267 |   });
  268 | });
  269 | 
```