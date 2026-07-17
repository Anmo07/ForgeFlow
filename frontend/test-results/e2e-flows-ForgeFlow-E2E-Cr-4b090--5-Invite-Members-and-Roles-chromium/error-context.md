# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 5: Invite Members and Roles
- Location: tests-e2e/e2e-flows.spec.ts:288:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=invitee_user@forgeflow.com')
Expected: visible
Error: strict mode violation: locator('text=invitee_user@forgeflow.com') resolved to 2 elements:
    1) <div class="px-4 py-2 text-xs rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-500">Successfully invited invitee_user@forgeflow.com!</div> aka getByText('Successfully invited')
    2) <div class="text-xs text-muted-foreground">invitee_user@forgeflow.com</div> aka getByText('invitee_user@forgeflow.com', { exact: true })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=invitee_user@forgeflow.com')

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
        - generic [ref=e22]: T
    - complementary [ref=e23]:
      - generic [ref=e24]:
        - generic [ref=e25]:
          - link "ForgeFlow" [ref=e26] [cursor=pointer]:
            - /url: /dashboard
          - button "E2E Test Org 4049" [expanded] [ref=e29]:
            - generic [ref=e30]: E2E Test Org 4049
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
            - generic [ref=e48]:
              - img [ref=e49]
              - generic [ref=e54]: CRM
          - link "Invoices" [ref=e55] [cursor=pointer]:
            - /url: /invoices
            - generic [ref=e56]:
              - img [ref=e57]
              - generic [ref=e60]: Invoices
          - link "Org Settings" [ref=e61] [cursor=pointer]:
            - /url: /settings/members
            - generic [ref=e63]:
              - img [ref=e64]
              - generic [ref=e65]: Org Settings
        - generic [ref=e66]:
          - generic [ref=e67]:
            - generic [ref=e68]: T
            - generic [ref=e69]:
              - generic [ref=e70]: Test Admin
              - generic [ref=e71]: e2e_admin_82246@forgeflow.com
          - button "Sign Out" [ref=e72]:
            - img [ref=e73]
    - main [ref=e76]:
      - generic [ref=e78]:
        - generic [ref=e79]:
          - generic [ref=e80]:
            - img [ref=e81]
            - generic [ref=e84]: Organization Settings
          - navigation [ref=e85]:
            - link "Members" [ref=e86] [cursor=pointer]:
              - /url: /settings/members
              - img [ref=e87]
              - generic [ref=e92]: Members
            - link "Roles & Perms" [ref=e93] [cursor=pointer]:
              - /url: /settings/roles
              - img [ref=e94]
              - generic [ref=e96]: Roles & Perms
            - link "API Keys" [ref=e97] [cursor=pointer]:
              - /url: /settings/api-keys
              - img [ref=e98]
              - generic [ref=e102]: API Keys
            - link "Sessions" [ref=e103] [cursor=pointer]:
              - /url: /settings/sessions
              - img [ref=e104]
              - generic [ref=e107]: Sessions
            - link "Audit Logs" [ref=e108] [cursor=pointer]:
              - /url: /settings/logs
              - img [ref=e109]
              - generic [ref=e112]: Audit Logs
            - link "SSO Config" [ref=e113] [cursor=pointer]:
              - /url: /settings/sso
              - img [ref=e114]
              - generic [ref=e123]: SSO Config
        - generic [ref=e125]:
          - generic [ref=e126]:
            - heading "Members & Invitations" [level=2] [ref=e127]
            - paragraph [ref=e128]: Manage user invitations, access levels, and active memberships for E2E Test Org 4049.
          - generic [ref=e129]:
            - generic [ref=e130]:
              - generic [ref=e131]: Email Address
              - generic [ref=e132]:
                - img [ref=e133]
                - textbox "user@example.com" [ref=e136]
            - generic [ref=e137]:
              - generic [ref=e138]: Role Type
              - combobox [ref=e139]:
                - option "Admin"
                - option "Manager"
                - option "Member" [selected]
                - option "Client"
                - option "Viewer"
            - button "Send Invitation" [active] [ref=e140]:
              - img [ref=e141]
              - generic [ref=e144]: Send Invitation
          - generic [ref=e145]: Successfully invited invitee_user@forgeflow.com!
          - table [ref=e147]:
            - rowgroup [ref=e148]:
              - row "User Role Status Joined Actions" [ref=e149]:
                - columnheader "User" [ref=e150]
                - columnheader "Role" [ref=e151]
                - columnheader "Status" [ref=e152]
                - columnheader "Joined" [ref=e153]
                - columnheader "Actions" [ref=e154]
            - rowgroup [ref=e155]:
              - row "Test Admin e2e_admin_82246@forgeflow.com Owner active 7/17/2026" [ref=e156]:
                - cell "Test Admin e2e_admin_82246@forgeflow.com" [ref=e157]:
                  - generic [ref=e158]: Test Admin
                  - generic [ref=e159]: e2e_admin_82246@forgeflow.com
                - cell "Owner" [ref=e160]:
                  - combobox [ref=e161]:
                    - option "Owner" [selected]
                    - option "Admin"
                    - option "Manager"
                    - option "Member"
                    - option "Client"
                    - option "Viewer"
                - cell "active" [ref=e162]:
                  - generic [ref=e163]: active
                - cell "7/17/2026" [ref=e164]
                - cell [ref=e165]:
                  - button "Remove Member" [ref=e166]:
                    - img [ref=e167]
              - row "invitee_user invitee_user@forgeflow.com Member invited 7/17/2026" [ref=e170]:
                - cell "invitee_user invitee_user@forgeflow.com" [ref=e171]:
                  - generic [ref=e172]: invitee_user
                  - generic [ref=e173]: invitee_user@forgeflow.com
                - cell "Member" [ref=e174]:
                  - combobox [ref=e175]:
                    - option "Owner"
                    - option "Admin"
                    - option "Manager"
                    - option "Member" [selected]
                    - option "Client"
                    - option "Viewer"
                - cell "invited" [ref=e176]:
                  - generic [ref=e177]: invited
                - cell "7/17/2026" [ref=e178]
                - cell [ref=e179]:
                  - button "Remove Member" [ref=e180]:
                    - img [ref=e181]
  - button "Open Next.js Dev Tools" [ref=e189] [cursor=pointer]:
    - img [ref=e190]
  - alert [ref=e193]
  - generic [ref=e194]:
    - img [ref=e196]
    - button "Open Tanstack query devtools" [ref=e244] [cursor=pointer]:
      - img [ref=e245]
```

# Test source

```ts
  198 |       page.click('button[title="Download PDF"] >> nth=0')
  199 |     ]);
  200 | 
  201 |     expect(download.suggestedFilename()).toContain(".pdf");
  202 |     const downloadPath = await download.path();
  203 |     const fileBytes = fs.readFileSync(downloadPath!);
  204 |     
  205 |     // Verify magic bytes %PDF
  206 |     const pdfMagicBytes = fileBytes.toString("utf8", 0, 4);
  207 |     expect(pdfMagicBytes).toBe("%PDF");
  208 |   });
  209 | 
  210 |   // Flow 3: Kanban Task Lifecycle
  211 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  212 |     await page.goto("/login");
  213 |     await submitLoginForm(page, adminEmail, adminPassword);
  214 |     await expect(page).toHaveURL(/.*dashboard/);
  215 | 
  216 |     // Create project
  217 |     await page.goto("/projects");
  218 |     await page.click("text=New Project");
  219 |     try {
  220 |       await page.waitForSelector('text=Create New Project', { timeout: 2000 });
  221 |     } catch (e) {
  222 |       await page.click("text=New Project");
  223 |     }
  224 |     await page.fill('input[placeholder="Project Name"]', "E2E Projects Space");
  225 |     await page.fill('textarea[placeholder="Description"]', "E2E Kanban Lifecycle testing space");
  226 |     await page.click("text=Create Project");
  227 | 
  228 |     // Add tasks
  229 |     await page.click("text=E2E Projects Space");
  230 |     
  231 |     // Add Task 1
  232 |     await page.click("text=Add Task");
  233 |     try {
  234 |       await page.waitForSelector('text=Create Task', { timeout: 2000 });
  235 |     } catch (e) {
  236 |       await page.click("text=Add Task");
  237 |     }
  238 |     await page.fill('input[placeholder="Task Title"]', "Task high priority");
  239 |     await page.selectOption("select[name='priority']", "high");
  240 |     await page.click("text=Create Task");
  241 | 
  242 |     // Drag-and-drop simulation & verify persisting
  243 |     // (Playwright dragTo handles drag simulation)
  244 |     const taskCard = page.locator("text=Task high priority");
  245 |     const inProgressColumn = page.locator("text=In Progress");
  246 |     await taskCard.dragTo(inProgressColumn);
  247 | 
  248 |     await page.reload();
  249 |     await expect(page.locator('[data-status="in_progress"]')).toContainText("Task high priority");
  250 |   });
  251 | 
  252 |   // Flow 4: CRM Deal Pipeline
  253 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  254 |     await page.goto("/login");
  255 |     await submitLoginForm(page, adminEmail, adminPassword);
  256 |     await expect(page).toHaveURL(/.*dashboard/);
  257 | 
  258 |     await page.goto("/crm");
  259 |     // Add Client first (required for Lead)
  260 |     await page.click("text=New Client");
  261 |     try {
  262 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  263 |     } catch (e) {
  264 |       await page.click("text=New Client");
  265 |     }
  266 |     await page.fill('input[placeholder*="John Doe"]', "E2E Lead Client");
  267 |     await page.fill('input[type="email"]', "lead_client@invoice.com");
  268 |     await page.click("text=Add Client");
  269 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  270 | 
  271 |     // Add lead
  272 |     await page.click("text=New Lead");
  273 |     try {
  274 |       await page.waitForSelector('text=Add New Lead', { timeout: 2000 });
  275 |     } catch (e) {
  276 |       await page.click("text=New Lead");
  277 |     }
  278 |     await page.selectOption('select[required]', { label: "E2E Lead Client" });
  279 |     await page.fill('input[placeholder*="5000"]', "25000");
  280 |     await page.click("text=Add Lead");
  281 | 
  282 |     // Check pipeline dashboard update
  283 |     await page.goto("/dashboard");
  284 |     await expect(page.locator("text=$25,000")).toBeVisible();
  285 |   });
  286 | 
  287 |   // Flow 5: Org invite and membership
  288 |   test("Flow 5: Invite Members and Roles", async ({ page }) => {
  289 |     await page.goto("/login");
  290 |     await submitLoginForm(page, adminEmail, adminPassword);
  291 |     await expect(page).toHaveURL(/.*dashboard/);
  292 | 
  293 |     await page.goto("/settings/members");
  294 |     await page.fill('input[placeholder="user@example.com"]', "invitee_user@forgeflow.com");
  295 |     await page.click("text=Send Invitation");
  296 | 
  297 |     // Assert listed in pending
> 298 |     await expect(page.locator("text=invitee_user@forgeflow.com")).toBeVisible();
      |                                                                   ^ Error: expect(locator).toBeVisible() failed
  299 |   });
  300 | });
  301 | 
```