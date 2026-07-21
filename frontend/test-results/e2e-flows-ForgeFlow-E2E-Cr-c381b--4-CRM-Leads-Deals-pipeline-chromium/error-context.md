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
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex items-center justify-end gap-3 pr-16 lg:pr-0">…</div> from <header class="header left-0 top-0 z-40 flex w-full items-center transition-all duration-500 absolute bg-transparent py-4">…</header> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="flex items-center justify-end gap-3 pr-16 lg:pr-0">…</div> from <header class="header left-0 top-0 z-40 flex w-full items-center transition-all duration-500 absolute bg-transparent py-4">…</header> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    55 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="flex items-center justify-end gap-3 pr-16 lg:pr-0">…</div> from <header class="header left-0 top-0 z-40 flex w-full items-center transition-all duration-500 absolute bg-transparent py-4">…</header> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]:
        - link "ForgeFlow" [ref=e7] [cursor=pointer]:
          - /url: /
          - generic [ref=e8]: ForgeFlow
        - generic [ref=e9]:
          - navigation [ref=e11]:
            - list [ref=e12]:
              - listitem [ref=e13]:
                - link "Home" [ref=e14] [cursor=pointer]:
                  - /url: /
              - listitem [ref=e15]:
                - link "Features" [ref=e16] [cursor=pointer]:
                  - /url: /#features
              - listitem [ref=e17]:
                - link "Pricing" [ref=e18] [cursor=pointer]:
                  - /url: /#pricing
              - listitem [ref=e19]:
                - link "About" [ref=e20] [cursor=pointer]:
                  - /url: /#about
              - listitem [ref=e21]:
                - link "Contact" [ref=e22] [cursor=pointer]:
                  - /url: /#contact
          - generic [ref=e23]:
            - link "Sign In" [ref=e24] [cursor=pointer]:
              - /url: /login
            - link "Sign Up" [ref=e25] [cursor=pointer]:
              - /url: /register
            - button "theme toggler" [ref=e27] [cursor=pointer]:
              - img [ref=e28]
    - generic [ref=e31]:
      - generic [ref=e32]:
        - generic [ref=e33]:
          - heading "CRM Hub" [level=1] [ref=e34]
          - paragraph [ref=e36]: Track clients, incoming leads, and pipeline deals.
        - generic [ref=e37]:
          - button "New Client" [ref=e38]:
            - img [ref=e39]
            - text: New Client
          - button "New Lead" [ref=e40]:
            - img [ref=e41]
            - text: New Lead
      - generic [ref=e42]:
        - generic [ref=e43]:
          - generic [ref=e44]:
            - generic [ref=e45]: Active Leads
            - img [ref=e46]
          - generic [ref=e51]: "2"
          - paragraph [ref=e52]: Currently being qualified
        - generic [ref=e53]:
          - generic [ref=e54]:
            - generic [ref=e55]: Pipeline Value
            - img [ref=e56]
          - generic [ref=e58]: $110,000
          - paragraph [ref=e59]: Open deals expectation
        - generic [ref=e60]:
          - generic [ref=e61]:
            - generic [ref=e62]: Closed Won
            - img [ref=e63]
          - generic [ref=e66]: $45,000
          - paragraph [ref=e67]: Converted contract value
        - generic [ref=e68]:
          - generic [ref=e69]:
            - generic [ref=e70]: Conversion Rate
            - img [ref=e71]
          - generic [ref=e75]: 28.4%
          - paragraph [ref=e76]: Lead won conversion ratio
      - generic [ref=e77]:
        - button "Leads Pipeline (2)" [ref=e78]
        - button "Deals Hub (2)" [ref=e79]
        - button "Clients (2)" [ref=e80]
      - generic [ref=e81]:
        - generic [ref=e82]:
          - img [ref=e83]
          - textbox "Search leads..." [ref=e86]
        - combobox [ref=e88]:
          - option "All Stages" [selected]
          - option "New"
          - option "Contacted"
          - option "Qualified"
          - option "Proposal"
          - option "Won"
          - option "Lost"
      - table [ref=e91]:
        - rowgroup [ref=e92]:
          - row "Lead Owner/Client Company Contact Detail Lead Stage Value Source Move Stage" [ref=e93]:
            - columnheader "Lead Owner/Client" [ref=e94]
            - columnheader "Company" [ref=e95]
            - columnheader "Contact Detail" [ref=e96]
            - columnheader "Lead Stage" [ref=e97]
            - columnheader "Value" [ref=e98]
            - columnheader "Source" [ref=e99]
            - columnheader "Move Stage" [ref=e100]
        - rowgroup [ref=e101]:
          - row "No leads matching your search criteria." [ref=e102]:
            - cell "No leads matching your search criteria." [ref=e103]
    - contentinfo [ref=e104]:
      - generic [ref=e106]:
        - generic [ref=e107]:
          - generic [ref=e109]:
            - link "ForgeFlow" [ref=e110] [cursor=pointer]:
              - /url: /
              - generic [ref=e111]: ForgeFlow
            - paragraph [ref=e112]: The unified command center and billing automation engine for modern IT Managed Service Providers.
            - generic [ref=e113]:
              - link "Facebook" [ref=e114] [cursor=pointer]:
                - /url: /
                - img [ref=e115]
              - link "Twitter" [ref=e117] [cursor=pointer]:
                - /url: /
                - img [ref=e118]
              - link "YouTube" [ref=e120] [cursor=pointer]:
                - /url: /
                - img [ref=e121]
              - link "LinkedIn" [ref=e123] [cursor=pointer]:
                - /url: /
                - img [ref=e124]
          - generic [ref=e127]:
            - heading "Useful Links" [level=2] [ref=e128]
            - list [ref=e129]:
              - listitem [ref=e130]:
                - link "Features" [ref=e131] [cursor=pointer]:
                  - /url: /#features
              - listitem [ref=e132]:
                - link "Pricing" [ref=e133] [cursor=pointer]:
                  - /url: /#pricing
              - listitem [ref=e134]:
                - link "About" [ref=e135] [cursor=pointer]:
                  - /url: /#about
          - generic [ref=e137]:
            - heading "Terms" [level=2] [ref=e138]
            - list [ref=e139]:
              - listitem [ref=e140]:
                - link "TOS" [ref=e141] [cursor=pointer]:
                  - /url: /terms
              - listitem [ref=e142]:
                - link "Privacy Policy" [ref=e143] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e144]:
                - link "Refund Policy" [ref=e145] [cursor=pointer]:
                  - /url: /
          - generic [ref=e147]:
            - heading "Support & Help" [level=2] [ref=e148]
            - list [ref=e149]:
              - listitem [ref=e150]:
                - link "Open Support Ticket" [ref=e151] [cursor=pointer]:
                  - /url: /#contact
              - listitem [ref=e152]:
                - link "Terms of Use" [ref=e153] [cursor=pointer]:
                  - /url: /
              - listitem [ref=e154]:
                - link "About" [ref=e155] [cursor=pointer]:
                  - /url: /#about
        - paragraph [ref=e158]: © 2026 ForgeFlow. Built for IT Service Providers.
  - button "Open Next.js Dev Tools" [ref=e164] [cursor=pointer]:
    - img [ref=e165]
  - alert [ref=e168]
  - generic [ref=e169]:
    - img [ref=e171]
    - button "Open Tanstack query devtools" [ref=e219] [cursor=pointer]:
      - img [ref=e220]
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