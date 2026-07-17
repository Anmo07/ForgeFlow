# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 3: Kanban Projects and Tasks
- Location: tests-e2e/e2e-flows.spec.ts:220:7

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('div').filter({ has: locator('span').filter({ hasText: /^In Progress$/ }) })
Expected substring: "Task high priority"
Error: strict mode violation: locator('div').filter({ has: locator('span').filter({ hasText: /^In Progress$/ }) }) resolved to 7 elements:
    1) <div class="min-h-screen bg-[image:var(--gradient-app-light)] dark:bg-[image:var(--gradient-app-dark)] transition-colors duration-300">…</div> aka getByText('Projects / 6Search...⌘KTForgeFlowE2E Test Org')
    2) <div class="app-container flex-1 py-6">…</div> aka locator('div').filter({ hasText: 'Back to ProjectsE2E Projects' }).nth(1)
    3) <div class="space-y-6">…</div> aka locator('div').filter({ hasText: 'Back to ProjectsE2E Projects' }).nth(2)
    4) <div class="flex gap-6 overflow-x-auto pb-4 pt-2 -mx-4 px-4 min-h-[550px] scrollbar-thin">…</div> aka getByText('To Do0Drag tasks hereIn')
    5) <div class="flex flex-col w-[320px] shrink-0 min-h-[500px] bg-white/5 dark:bg-black/20 border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] rounded-[var(--radius-glass-xl)] p-4">…</div> aka getByText('In Progress1highTask high')
    6) <div class="glass-clear rounded-[var(--radius-glass-pill)] px-4 py-2 border border-[var(--color-glass-clear-border)] dark:border-[var(--color-glass-dark-clear-border)] flex items-center justify-between mb-4 flex-shrink-0 shadow-[var(--shadow-glass-sm)] dark:shadow-[var(--shadow-glass-dark-sm)]">…</div> aka getByText('In Progress1')
    7) <div class="flex items-center gap-2">…</div> aka locator('div').filter({ hasText: /^In Progress$/ })

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('div').filter({ has: locator('span').filter({ hasText: /^In Progress$/ }) })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]: Projects / 6
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
          - button "E2E Test Org 2315" [expanded] [ref=e29]:
            - generic [ref=e30]: E2E Test Org 2315
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
              - generic [ref=e71]: e2e_admin_69359@forgeflow.com
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
            - generic [ref=e93]: 0 of 1 Tasks Completed
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
              - generic [ref=e119]: "1"
            - generic [ref=e121]:
              - generic [ref=e122]:
                - generic [ref=e123]: high
                - generic [ref=e124]:
                  - button "Edit task" [ref=e125]:
                    - img [ref=e126]
                  - button "Delete task" [ref=e128]:
                    - img [ref=e129]
              - heading "Task high priority" [level=4] [ref=e132]
              - generic [ref=e133]:
                - generic [ref=e134]:
                  - img [ref=e135]
                  - generic [ref=e137]: No due date
                - generic [ref=e138]: Unassigned
          - generic [ref=e139]:
            - generic [ref=e140]:
              - generic [ref=e143]: Done
              - generic [ref=e144]: "0"
            - generic [ref=e146]: Drag tasks here
  - button "Open Next.js Dev Tools" [ref=e152] [cursor=pointer]:
    - img [ref=e153]
  - alert [ref=e156]: E2E Projects Space
  - generic [ref=e157]:
    - img [ref=e159]
    - button "Open Tanstack query devtools" [ref=e207] [cursor=pointer]:
      - img [ref=e208]
```

# Test source

```ts
  159 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  160 |     await page.fill('input[type="email"]', "client@invoice.com");
  161 |     await page.click("text=Add Client");
  162 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  163 | 
  164 |     // Create Invoice
  165 |     await page.goto("/invoices");
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
> 259 |     await expect(page.locator('div').filter({ has: page.locator('span', { hasText: /^In Progress$/ }) })).toContainText("Task high priority");
      |                                                                                                           ^ Error: expect(locator).toContainText(expected) failed
  260 |   });
  261 | 
  262 |   // Flow 4: CRM Deal Pipeline
  263 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  264 |     await page.goto("/login");
  265 |     await submitLoginForm(page, adminEmail, adminPassword);
  266 |     await expect(page).toHaveURL(/.*dashboard/);
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