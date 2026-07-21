# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 4: CRM Leads & Deals pipeline
- Location: tests-e2e/e2e-flows.spec.ts:276:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("New Client")').first()
    - locator resolved to <button class="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card hover:bg-muted text-foreground px-4 py-2.5 text-sm font-semibold transition-colors duration-200">…</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
  - element was detached from the DOM, retrying

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
        - button "User profile menu" [ref=e23] [cursor=pointer]:
          - generic [ref=e24]: W
          - img [ref=e25]
    - complementary [ref=e27]:
      - generic [ref=e28]:
        - generic [ref=e29]:
          - link "ForgeFlow" [ref=e30] [cursor=pointer]:
            - /url: /dashboard
          - button "Select Tenant" [expanded] [ref=e33]:
            - generic [ref=e34]: Select Tenant
            - img [ref=e35]
        - navigation [ref=e37]:
          - link "Dashboard" [ref=e38] [cursor=pointer]:
            - /url: /dashboard
            - generic [ref=e39]:
              - img [ref=e40]
              - generic [ref=e45]: Dashboard
          - link "Projects" [ref=e46] [cursor=pointer]:
            - /url: /projects
            - generic [ref=e47]:
              - img [ref=e48]
              - generic [ref=e50]: Projects
          - link "CRM" [ref=e51] [cursor=pointer]:
            - /url: /crm
            - generic [ref=e53]:
              - img [ref=e54]
              - generic [ref=e59]: CRM
          - link "Invoices" [ref=e60] [cursor=pointer]:
            - /url: /invoices
            - generic [ref=e61]:
              - img [ref=e62]
              - generic [ref=e65]: Invoices
          - link "Org Settings" [ref=e66] [cursor=pointer]:
            - /url: /settings/members
            - generic [ref=e67]:
              - img [ref=e68]
              - generic [ref=e69]: Org Settings
        - generic [ref=e70]:
          - generic [ref=e71]:
            - generic [ref=e72]: W
            - generic [ref=e73]:
              - generic [ref=e74]: Workspace Owner
              - generic [ref=e75]: user@company.com
          - button "Sign Out" [ref=e76]:
            - img [ref=e77]
    - main [ref=e80]:
      - generic [ref=e82]:
        - img [ref=e83]
        - heading "Select an organization" [level=3] [ref=e88]
        - paragraph [ref=e89]: Please select or create an organization from the workspace switcher in the header to view and manage CRM entries.
  - button "Open Next.js Dev Tools" [ref=e95] [cursor=pointer]:
    - img [ref=e96]
  - alert [ref=e99]
  - generic [ref=e100]:
    - img [ref=e102]
    - button "Open Tanstack query devtools" [ref=e150] [cursor=pointer]:
      - img [ref=e151]
```

# Test source

```ts
  183 |     await page.goto("/invoices");
  184 |     await page.locator('button:has-text("Create Invoice")').first().click();
  185 |     try {
  186 |       await page.waitForSelector('text=Create & Render', { timeout: 2000 });
  187 |     } catch (e) {
  188 |       await page.locator('button:has-text("Create Invoice")').first().click();
  189 |     }
  190 |     
  191 |     // Fill Invoice form
  192 |     const clientSelector = 'label:has-text("Client Organization") + select option:has-text("E2E Invoice Client")';
  193 |     await page.waitForSelector(clientSelector, { state: "attached" });
  194 |     const clientOptionVal = await page.locator(clientSelector).getAttribute("value");
  195 |     await page.selectOption('label:has-text("Client Organization") + select', clientOptionVal || "");
  196 |     const today = new Date().toISOString().split("T")[0];
  197 |     await page.fill('label:has-text("Issue Date") + input', today);
  198 |     await page.fill('label:has-text("Due Date") + input', today);
  199 |     // Set 3 line items
  200 |     await page.fill('input[placeholder*="product or service"]', "Item 1");
  201 |     await page.fill('input[placeholder="Qty"]', "2");
  202 |     await page.fill('input[placeholder="Price"]', "50");
  203 | 
  204 |     await page.click("text=Add Item");
  205 |     await page.fill('input[placeholder*="product or service"] >> nth=1', "Item 2");
  206 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  207 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  208 | 
  209 |     await page.click("text=Add Item");
  210 |     await page.fill('input[placeholder*="product or service"] >> nth=2', "Item 3");
  211 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  212 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  213 | 
  214 |     await page.fill('label:has-text("Tax Rate") + input', "10");
  215 |     await page.fill('textarea[placeholder*="Notes"]', "E2E Test Invoice Notes");
  216 |     await page.click('button:has-text("Create & Render")');
  217 | 
  218 |     // Verify it appears in table
  219 |     const totalCell = page.locator("table tbody td:has-text('$275.00')");
  220 |     await expect(totalCell).toBeVisible();
  221 | 
  222 |     // Verify PDF download button exists & API generates PDF
  223 |     const pdfBtn = page.locator('button[title="Download PDF"]').first();
  224 |     await expect(pdfBtn).toBeVisible();
  225 |     const pdfResponse = await page.request.get(`/api/invoices/1/pdf`);
  226 |     expect([200, 307, 302, 404]).toContain(pdfResponse.status());
  227 |   });
  228 | 
  229 |   // Flow 3: Kanban Task Lifecycle
  230 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  231 |     await page.goto("/login");
  232 |     await submitLoginForm(page, adminEmail, adminPassword);
  233 |     await expect(page).toHaveURL(/.*dashboard/);
  234 | 
  235 |     // Create project
  236 |     await page.goto("/projects");
  237 |     await page.locator('button:has-text("New Project")').first().click();
  238 |     try {
  239 |       await page.waitForSelector('text=Create New Project', { timeout: 2000 });
  240 |     } catch (e) {
  241 |       await page.locator('button:has-text("New Project")').first().click();
  242 |     }
  243 |     await page.fill('input[placeholder*="Acme"]', "E2E Projects Space");
  244 |     await page.fill('textarea[placeholder*="Describe"]', "E2E Kanban Lifecycle testing space");
  245 |     await page.locator('button[type="submit"]:has-text("Create Project")').click();
  246 |     await expect(page.locator('text=Create New Project')).toBeHidden();
  247 | 
  248 |     // Add tasks
  249 |     const projCard = page.locator('text="E2E Projects Space"').first();
  250 |     await expect(projCard).toBeVisible({ timeout: 10000 });
  251 |     await projCard.click();
  252 |     await page.waitForURL(/.*projects\/.*/);
  253 |     
  254 |     // Add Task 1
  255 |     await page.locator('button:has-text("Add Task")').first().click();
  256 |     try {
  257 |       await page.waitForSelector('text=Create Task', { timeout: 2000 });
  258 |     } catch (e) {
  259 |       await page.locator('button:has-text("Add Task")').first().click();
  260 |     }
  261 |     await page.fill('input[placeholder*="OIDC"]', "Task high priority");
  262 |     await page.selectOption('label:has-text("Priority") + select', "high");
  263 |     await page.locator('button[type="submit"]:has-text("Create Task")').click();
  264 |     await expect(page.locator('text=Create Task')).toBeHidden();
  265 | 
  266 |     // Drag-and-drop simulation & verify persisting
  267 |     const taskCard = page.locator("text=Task high priority");
  268 |     const inProgressColumn = page.locator("text=In Progress");
  269 |     await taskCard.dragTo(inProgressColumn);
  270 | 
  271 |     await page.reload();
  272 |     await expect(page.locator('div[class*="w-[280px]"], div[class*="w-[320px]"]').filter({ hasText: "In Progress" })).toContainText("Task high priority");
  273 |   });
  274 | 
  275 |   // Flow 4: CRM Deal Pipeline
  276 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  277 |     await page.goto("/login");
  278 |     await submitLoginForm(page, adminEmail, adminPassword);
  279 |     await expect(page).toHaveURL(/.*dashboard/);
  280 | 
  281 |     await page.goto("/crm");
  282 |     // Add Client first (required for Lead)
> 283 |     await page.locator('button:has-text("New Client")').first().click();
      |                                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
  284 |     try {
  285 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  286 |     } catch (e) {
  287 |       await page.locator('button:has-text("New Client")').first().click();
  288 |     }
  289 |     await page.fill('input[placeholder*="John Doe"]', "E2E Lead Client");
  290 |     await page.fill('input[type="email"]', "lead_client@invoice.com");
  291 |     await page.locator('button[type="submit"]:has-text("Add Client")').click();
  292 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  293 | 
  294 |     // Add lead
  295 |     await page.locator('button:has-text("New Lead")').first().click();
  296 |     try {
  297 |       await page.waitForSelector('text=Add New Lead', { timeout: 2000 });
  298 |     } catch (e) {
  299 |       await page.locator('button:has-text("New Lead")').first().click();
  300 |     }
  301 |     await page.selectOption('select[required]', { index: 1 });
  302 |     await page.fill('input[placeholder*="5000"]', "25000");
  303 |     await page.locator('button[type="submit"]:has-text("Add Lead")').click();
  304 |     await expect(page.locator('text=Add New Lead')).toBeHidden();
  305 | 
  306 |     // Check CRM list or pipeline dashboard update
  307 |     await page.goto("/crm");
  308 |     await expect(page.locator("text=25,000").or(page.locator("text=$25,000")).or(page.locator("text=25000"))).toBeVisible();
  309 |   });
  310 | 
  311 |   // Flow 5: Org invite and membership
  312 |   test("Flow 5: Invite Members and Roles", async ({ page }) => {
  313 |     await page.goto("/login");
  314 |     await submitLoginForm(page, adminEmail, adminPassword);
  315 |     await expect(page).toHaveURL(/.*dashboard/);
  316 | 
  317 |     await page.goto("/settings/members");
  318 |     await page.fill('input[placeholder="user@example.com"]', "invitee_user@forgeflow.com");
  319 |     await page.locator('button:has-text("Send Invitation")').click();
  320 | 
  321 |     // Assert listed in pending
  322 |     await expect(page.locator("text=invitee_user@forgeflow.com").last()).toBeVisible();
  323 |   });
  324 | });
  325 | 
```