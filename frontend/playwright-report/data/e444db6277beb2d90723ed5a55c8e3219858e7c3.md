# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 5: Invite Members and Roles
- Location: tests-e2e/e2e-flows.spec.ts:312:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("Send Invitation")')
    - locator resolved to <button type="submit" class="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors">…</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
  - element was detached from the DOM, retrying

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]: Settings / Members
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
            - generic [ref=e52]:
              - img [ref=e53]
              - generic [ref=e58]: CRM
          - link "Invoices" [ref=e59] [cursor=pointer]:
            - /url: /invoices
            - generic [ref=e60]:
              - img [ref=e61]
              - generic [ref=e64]: Invoices
          - link "Org Settings" [ref=e65] [cursor=pointer]:
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
        - generic [ref=e83]:
          - generic [ref=e84]:
            - img [ref=e85]
            - generic [ref=e88]: Organization Settings
          - navigation [ref=e89]:
            - link "Members" [ref=e90] [cursor=pointer]:
              - /url: /settings/members
              - img [ref=e91]
              - generic [ref=e96]: Members
            - link "Roles & Perms" [ref=e97] [cursor=pointer]:
              - /url: /settings/roles
              - img [ref=e98]
              - generic [ref=e100]: Roles & Perms
            - link "API Keys" [ref=e101] [cursor=pointer]:
              - /url: /settings/api-keys
              - img [ref=e102]
              - generic [ref=e106]: API Keys
            - link "Sessions" [ref=e107] [cursor=pointer]:
              - /url: /settings/sessions
              - img [ref=e108]
              - generic [ref=e111]: Sessions
            - link "Audit Logs" [ref=e112] [cursor=pointer]:
              - /url: /settings/logs
              - img [ref=e113]
              - generic [ref=e116]: Audit Logs
            - link "SSO Config" [ref=e117] [cursor=pointer]:
              - /url: /settings/sso
              - img [ref=e118]
              - generic [ref=e127]: SSO Config
        - generic [ref=e129]:
          - img [ref=e130]
          - heading "Select an organization first" [level=3] [ref=e135]
          - paragraph [ref=e136]: Choose a tenant from the dropdown in the header to load members.
  - button "Open Next.js Dev Tools" [ref=e142] [cursor=pointer]:
    - img [ref=e143]
  - alert [ref=e146]
  - generic [ref=e147]:
    - img [ref=e149]
    - button "Open Tanstack query devtools" [ref=e197] [cursor=pointer]:
      - img [ref=e198]
```

# Test source

```ts
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
  283 |     await page.locator('button:has-text("New Client")').first().click();
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
> 319 |     await page.locator('button:has-text("Send Invitation")').click();
      |                                                              ^ Error: locator.click: Test timeout of 30000ms exceeded.
  320 | 
  321 |     // Assert listed in pending
  322 |     await expect(page.locator("text=invitee_user@forgeflow.com").last()).toBeVisible();
  323 |   });
  324 | });
  325 | 
```