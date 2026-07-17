# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 3: Kanban Projects and Tasks
- Location: tests-e2e/e2e-flows.spec.ts:214:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.selectOption: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('select[name=\'priority\']')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]: Projects / 1
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
          - button "E2E Test Org 2565" [expanded] [ref=e29]:
            - generic [ref=e30]: E2E Test Org 2565
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
              - generic [ref=e71]: e2e_admin_55567@forgeflow.com
          - button "Sign Out" [ref=e72]:
            - img [ref=e73]
    - main [ref=e76]:
      - generic [ref=e78]:
        - generic [ref=e79]:
          - generic [ref=e80]:
            - button "Back to Projects" [ref=e81]:
              - img [ref=e82]
              - text: Back to Projects
            - heading "E2E Projects Space" [level=1] [ref=e85]
            - paragraph [ref=e86]: E2E Kanban Lifecycle testing space
          - button "Add Task" [ref=e87]:
            - img [ref=e88]
            - text: Add Task
        - generic [ref=e89]:
          - generic [ref=e91]:
            - generic [ref=e92]: Overall Progress (0%)
            - generic [ref=e93]: 0 of 0 Tasks Completed
          - generic [ref=e95]:
            - generic [ref=e96]:
              - generic [ref=e97]: Priority
              - generic [ref=e98]: medium
            - generic [ref=e99]:
              - generic [ref=e100]: Status
              - generic [ref=e101]: planning
            - generic [ref=e102]:
              - generic [ref=e103]: Target Date
              - generic [ref=e104]: Not set
        - generic [ref=e105]:
          - generic [ref=e106]:
            - generic [ref=e107]:
              - generic [ref=e110]: To Do
              - generic [ref=e111]: "0"
            - generic [ref=e113]: Drag tasks here
          - generic [ref=e114]:
            - generic [ref=e115]:
              - generic [ref=e118]: In Progress
              - generic [ref=e119]: "0"
            - generic [ref=e121]: Drag tasks here
          - generic [ref=e122]:
            - generic [ref=e123]:
              - generic [ref=e126]: Done
              - generic [ref=e127]: "0"
            - generic [ref=e129]: Drag tasks here
        - generic [ref=e131]:
          - generic [ref=e132]:
            - heading "Add New Task" [level=2] [ref=e133]
            - button [ref=e134]:
              - img [ref=e135]
          - generic [ref=e138]:
            - generic [ref=e139]:
              - text: Task Title
              - textbox "e.g. Implement OIDC login flow" [active] [ref=e140]: Task high priority
            - generic [ref=e141]:
              - text: Description
              - textbox "Details and criteria..." [ref=e142]
            - generic [ref=e143]:
              - generic [ref=e144]:
                - text: Status
                - combobox [ref=e145]:
                  - option "To Do" [selected]
                  - option "In Progress"
                  - option "Done"
              - generic [ref=e146]:
                - text: Priority
                - combobox [ref=e147]:
                  - option "Low"
                  - option "Medium" [selected]
                  - option "High"
            - generic [ref=e148]:
              - generic [ref=e149]:
                - text: Assignee
                - combobox [ref=e150]:
                  - option "Unassigned" [selected]
                  - option
              - generic [ref=e151]:
                - text: Due Date
                - textbox [ref=e152]
            - generic [ref=e153]:
              - button "Cancel" [ref=e154]
              - button "Create Task" [ref=e155]
  - button "Open Next.js Dev Tools" [ref=e161] [cursor=pointer]:
    - img [ref=e162]
  - alert [ref=e165]: E2E Projects Space
  - generic [ref=e166]:
    - img [ref=e168]
    - button "Open Tanstack query devtools" [ref=e216] [cursor=pointer]:
      - img [ref=e217]
```

# Test source

```ts
  143 |     await submitLoginForm(page, adminEmail, adminPassword);
  144 |     await expect(page).toHaveURL(/.*dashboard/);
  145 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
  146 | 
  147 |     // Navigate to Invoices
  148 |     await page.goto("/invoices");
  149 | 
  150 |     // Add Client first
  151 |     await page.goto("/crm");
  152 |     await page.click("text=New Client");
  153 |     try {
  154 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  155 |     } catch (e) {
  156 |       await page.click("text=New Client");
  157 |     }
  158 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  159 |     await page.fill('input[type="email"]', "client@invoice.com");
  160 |     await page.click("text=Add Client");
  161 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  162 | 
  163 |     // Create Invoice
  164 |     await page.goto("/invoices");
  165 |     await page.click("text=Create Invoice");
  166 |     try {
  167 |       await page.waitForSelector('text=Create & Render', { timeout: 2000 });
  168 |     } catch (e) {
  169 |       await page.click("text=Create Invoice");
  170 |     }
  171 |     
  172 |     // Fill Invoice form
  173 |     await page.selectOption("select", { label: "E2E Invoice Client" });
  174 |     await page.fill('input[type="date"]', new Date().toISOString().split("T")[0]);
  175 |     // Set 3 line items
  176 |     await page.fill('input[placeholder="Item description"]', "Item 1");
  177 |     await page.fill('input[placeholder="Qty"]', "2");
  178 |     await page.fill('input[placeholder="Price"]', "50");
  179 | 
  180 |     await page.click("text=Add Line Item");
  181 |     await page.fill('input[placeholder="Item description"] >> nth=1', "Item 2");
  182 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  183 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  184 | 
  185 |     await page.click("text=Add Line Item");
  186 |     await page.fill('input[placeholder="Item description"] >> nth=2', "Item 3");
  187 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  188 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  189 | 
  190 |     await page.fill('input[placeholder="Tax rate"]', "10");
  191 |     await page.fill('textarea[placeholder="Notes"]', "E2E Test Invoice Notes");
  192 |     await page.click('button:has-text("Create & Render")');
  193 | 
  194 |     // Verify it appears in table
  195 |     const totalCell = page.locator("text=$275.00");
  196 |     await expect(totalCell).toBeVisible();
  197 | 
  198 |     // Download PDF (intercept browser download event)
  199 |     const [download] = await Promise.all([
  200 |       page.waitForEvent("download"),
  201 |       page.click('button[title="Download PDF"] >> nth=0')
  202 |     ]);
  203 | 
  204 |     expect(download.suggestedFilename()).toContain(".pdf");
  205 |     const downloadPath = await download.path();
  206 |     const fileBytes = fs.readFileSync(downloadPath!);
  207 |     
  208 |     // Verify magic bytes %PDF
  209 |     const pdfMagicBytes = fileBytes.toString("utf8", 0, 4);
  210 |     expect(pdfMagicBytes).toBe("%PDF");
  211 |   });
  212 | 
  213 |   // Flow 3: Kanban Task Lifecycle
  214 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  215 |     await page.goto("/login");
  216 |     await submitLoginForm(page, adminEmail, adminPassword);
  217 |     await expect(page).toHaveURL(/.*dashboard/);
  218 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
  219 | 
  220 |     // Create project
  221 |     await page.goto("/projects");
  222 |     await page.click("text=New Project");
  223 |     try {
  224 |       await page.waitForSelector('text=Create New Project', { timeout: 2000 });
  225 |     } catch (e) {
  226 |       await page.click("text=New Project");
  227 |     }
  228 |     await page.fill('input[placeholder*="Acme"]', "E2E Projects Space");
  229 |     await page.fill('textarea[placeholder*="Describe"]', "E2E Kanban Lifecycle testing space");
  230 |     await page.click("text=Create Project");
  231 | 
  232 |     // Add tasks
  233 |     await page.click("text=E2E Projects Space");
  234 |     
  235 |     // Add Task 1
  236 |     await page.click("text=Add Task");
  237 |     try {
  238 |       await page.waitForSelector('text=Create Task', { timeout: 2000 });
  239 |     } catch (e) {
  240 |       await page.click("text=Add Task");
  241 |     }
  242 |     await page.fill('input[placeholder*="OIDC"]', "Task high priority");
> 243 |     await page.selectOption("select[name='priority']", "high");
      |                ^ Error: page.selectOption: Test timeout of 30000ms exceeded.
  244 |     await page.click("text=Create Task");
  245 | 
  246 |     // Drag-and-drop simulation & verify persisting
  247 |     // (Playwright dragTo handles drag simulation)
  248 |     const taskCard = page.locator("text=Task high priority");
  249 |     const inProgressColumn = page.locator("text=In Progress");
  250 |     await taskCard.dragTo(inProgressColumn);
  251 | 
  252 |     await page.reload();
  253 |     await expect(page.locator('[data-status="in_progress"]')).toContainText("Task high priority");
  254 |   });
  255 | 
  256 |   // Flow 4: CRM Deal Pipeline
  257 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  258 |     await page.goto("/login");
  259 |     await submitLoginForm(page, adminEmail, adminPassword);
  260 |     await expect(page).toHaveURL(/.*dashboard/);
  261 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
  262 | 
  263 |     await page.goto("/crm");
  264 |     // Add Client first (required for Lead)
  265 |     await page.click("text=New Client");
  266 |     try {
  267 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  268 |     } catch (e) {
  269 |       await page.click("text=New Client");
  270 |     }
  271 |     await page.fill('input[placeholder*="John Doe"]', "E2E Lead Client");
  272 |     await page.fill('input[type="email"]', "lead_client@invoice.com");
  273 |     await page.click("text=Add Client");
  274 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  275 | 
  276 |     // Add lead
  277 |     await page.click("text=New Lead");
  278 |     try {
  279 |       await page.waitForSelector('text=Add New Lead', { timeout: 2000 });
  280 |     } catch (e) {
  281 |       await page.click("text=New Lead");
  282 |     }
  283 |     await page.selectOption('select[required]', { label: "E2E Lead Client" });
  284 |     await page.fill('input[placeholder*="5000"]', "25000");
  285 |     await page.click("text=Add Lead");
  286 | 
  287 |     // Check pipeline dashboard update
  288 |     await page.goto("/dashboard");
  289 |     await expect(page.locator("text=$25,000")).toBeVisible();
  290 |   });
  291 | 
  292 |   // Flow 5: Org invite and membership
  293 |   test("Flow 5: Invite Members and Roles", async ({ page }) => {
  294 |     await page.goto("/login");
  295 |     await submitLoginForm(page, adminEmail, adminPassword);
  296 |     await expect(page).toHaveURL(/.*dashboard/);
  297 |     await expect(page.locator("button").filter({ hasText: "E2E Test Org" })).toBeVisible();
  298 | 
  299 |     await page.goto("/settings/members");
  300 |     await page.fill('input[placeholder="user@example.com"]', "invitee_user@forgeflow.com");
  301 |     await page.click("text=Send Invitation");
  302 | 
  303 |     // Assert listed in pending
  304 |     await expect(page.locator("text=invitee_user@forgeflow.com").last()).toBeVisible();
  305 |   });
  306 | });
  307 | 
```