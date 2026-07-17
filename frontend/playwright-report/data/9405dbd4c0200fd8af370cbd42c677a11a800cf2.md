# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 4: CRM Leads & Deals pipeline
- Location: tests-e2e/e2e-flows.spec.ts:232:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=New Lead')
    - locator resolved to <button class="inline-flex items-center gap-1.5 rounded-lg bg-primary hover:opacity-90 text-primary-foreground px-4 py-2.5 text-sm font-semibold shadow transition-colors duration-200">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">…</div> intercepts pointer events
    - retrying click action
      - waiting 100ms
    36 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">…</div> intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]: CRM
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
          - button "E2E Test Org 1835" [expanded] [ref=e29]:
            - generic [ref=e30]: E2E Test Org 1835
            - img [ref=e31]
        - navigation [ref=e33]:
          - link "Dashboard" [ref=e34] [cursor=pointer]:
            - /url: /dashboard
            - generic [ref=e35]:
              - img [ref=e36]
              - generic [ref=e41]: Dashboard
          - link "Projects" [ref=e42] [cursor=pointer]:
            - /url: /projects
            - generic [ref=e43]:
              - img [ref=e44]
              - generic [ref=e46]: Projects
          - link "CRM" [ref=e47] [cursor=pointer]:
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
              - generic [ref=e71]: e2e_admin_31420@forgeflow.com
          - button "Sign Out" [ref=e72]:
            - img [ref=e73]
    - main [ref=e76]:
      - generic [ref=e78]:
        - generic [ref=e79]:
          - generic [ref=e80]:
            - heading "CRM Hub" [level=1] [ref=e81]
            - paragraph [ref=e83]: Track clients, incoming leads, and pipeline deals.
          - generic [ref=e84]:
            - button "New Client" [ref=e85]:
              - img [ref=e86]
              - text: New Client
            - button "New Lead" [ref=e87]:
              - img [ref=e88]
              - text: New Lead
        - generic [ref=e89]:
          - generic [ref=e90]:
            - generic [ref=e91]:
              - generic [ref=e92]: Active Leads
              - img [ref=e93]
            - generic [ref=e98]: "0"
            - paragraph [ref=e99]: Currently being qualified
          - generic [ref=e100]:
            - generic [ref=e101]:
              - generic [ref=e102]: Pipeline Value
              - img [ref=e103]
            - generic [ref=e105]: $0
            - paragraph [ref=e106]: Open deals expectation
          - generic [ref=e107]:
            - generic [ref=e108]:
              - generic [ref=e109]: Closed Won
              - img [ref=e110]
            - generic [ref=e113]: $0
            - paragraph [ref=e114]: Converted contract value
          - generic [ref=e115]:
            - generic [ref=e116]:
              - generic [ref=e117]: Conversion Rate
              - img [ref=e118]
            - generic [ref=e122]: 0%
            - paragraph [ref=e123]: Lead won conversion ratio
        - generic [ref=e124]:
          - button "Leads Pipeline (0)" [ref=e125]
          - button "Deals Hub (0)" [ref=e126]
          - button "Clients (0)" [ref=e127]
        - generic [ref=e128]:
          - generic [ref=e129]:
            - img [ref=e130]
            - textbox "Search leads..." [ref=e133]
          - combobox [ref=e135]:
            - option "All Stages" [selected]
            - option "New"
            - option "Contacted"
            - option "Qualified"
            - option "Proposal"
            - option "Won"
            - option "Lost"
        - generic [ref=e136]:
          - img [ref=e137]
          - generic [ref=e139]: "Missing required permission: 'client:create'"
        - table [ref=e142]:
          - rowgroup [ref=e143]:
            - row "Lead Owner/Client Company Contact Detail Lead Stage Value Source Move Stage" [ref=e144]:
              - columnheader "Lead Owner/Client" [ref=e145]
              - columnheader "Company" [ref=e146]
              - columnheader "Contact Detail" [ref=e147]
              - columnheader "Lead Stage" [ref=e148]
              - columnheader "Value" [ref=e149]
              - columnheader "Source" [ref=e150]
              - columnheader "Move Stage" [ref=e151]
          - rowgroup [ref=e152]:
            - row "No leads matching your search criteria." [ref=e153]:
              - cell "No leads matching your search criteria." [ref=e154]
        - generic [ref=e156]:
          - generic [ref=e157]:
            - heading "Add New Client" [level=2] [ref=e158]
            - button [ref=e159]:
              - img [ref=e160]
          - generic [ref=e163]:
            - generic [ref=e164]:
              - text: Client Name
              - textbox "e.g. John Doe" [ref=e165]: E2E Lead Client
            - generic [ref=e166]:
              - text: Email
              - textbox "john@example.com" [ref=e167]: lead_client@invoice.com
            - generic [ref=e168]:
              - text: Phone
              - textbox "555-123-4567" [ref=e169]
            - generic [ref=e170]:
              - text: Company Name
              - textbox "e.g. Acme Corp" [ref=e171]
            - generic [ref=e172]:
              - button "Cancel" [ref=e173]
              - button "Add Client" [ref=e174]
  - button "Open Next.js Dev Tools" [ref=e180] [cursor=pointer]:
    - img [ref=e181]
  - alert [ref=e184]: CRM Hub
  - generic [ref=e185]:
    - img [ref=e187]
    - button "Open Tanstack query devtools" [ref=e235] [cursor=pointer]:
      - img [ref=e236]
```

# Test source

```ts
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
> 245 |     await page.click("text=New Lead");
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
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