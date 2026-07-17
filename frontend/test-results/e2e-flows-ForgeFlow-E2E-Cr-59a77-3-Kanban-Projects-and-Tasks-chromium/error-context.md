# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 3: Kanban Projects and Tasks
- Location: tests-e2e/e2e-flows.spec.ts:193:7

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
          - button "E2E Test Org 9323" [expanded] [ref=e29]:
            - generic [ref=e30]: E2E Test Org 9323
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
              - generic [ref=e71]: e2e_admin_2017@forgeflow.com
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
  101 |     await page.fill('#reg-name', "E2E Registrant");
  102 |     
  103 |     // Simulate turnstile checked
  104 |     await page.evaluate(() => {
  105 |       (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  106 |     });
  107 | 
  108 |     // We skip actual email verify/MFA TOTP code extraction in client E2E if mock authentication modes are toggled,
  109 |     // but we simulate the authentication flow steps.
  110 |     await page.goto("/login");
  111 |     await submitLoginForm(page, adminEmail, adminPassword);
  112 | 
  113 |     // Confirm redirected to dashboard
  114 |     await expect(page).toHaveURL(/.*dashboard/);
  115 | 
  116 |     // Logout
  117 |     await page.click('button[title="Sign Out"]');
  118 |     await expect(page).toHaveURL(/.*login/);
  119 | 
  120 |     // Trigger Account Lockout (5 failed attempts)
  121 |     for (let i = 0; i < 5; i++) {
  122 |       await submitLoginForm(page, adminEmail, "wrong-password");
  123 |     }
  124 | 
  125 |     // Lockout UI/Notification validation
  126 |     await submitLoginForm(page, adminEmail, adminPassword);
  127 |     await expect(page.locator("text=locked").or(page.locator("text=too many attempts")).or(page.locator("text=lockout"))).toBeVisible();
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
  145 |     await page.click("text=Add Client");
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
> 201 |     await page.fill('input[placeholder="Project Name"]', "E2E Projects Space");
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
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
  259 |     await expect(page.locator("text=invitee_user@forgeflow.com")).toBeVisible();
  260 |   });
  261 | });
  262 | 
```