# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 3: Kanban Projects and Tasks
- Location: tests-e2e/e2e-flows.spec.ts:230:7

# Error details

```
Error: page.goto: net::ERR_ABORTED at http://localhost:3000/projects
Call log:
  - navigating to "http://localhost:3000/projects", waiting until "load"

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
    - img [ref=e32]
    - contentinfo [ref=e34]:
      - generic [ref=e36]:
        - generic [ref=e37]:
          - generic [ref=e39]:
            - link "ForgeFlow" [ref=e40] [cursor=pointer]:
              - /url: /
              - generic [ref=e41]: ForgeFlow
            - paragraph [ref=e42]: The unified command center and billing automation engine for modern IT Managed Service Providers.
            - generic [ref=e43]:
              - link "Facebook" [ref=e44] [cursor=pointer]:
                - /url: /
                - img [ref=e45]
              - link "Twitter" [ref=e47] [cursor=pointer]:
                - /url: /
                - img [ref=e48]
              - link "YouTube" [ref=e50] [cursor=pointer]:
                - /url: /
                - img [ref=e51]
              - link "LinkedIn" [ref=e53] [cursor=pointer]:
                - /url: /
                - img [ref=e54]
          - generic [ref=e57]:
            - heading "Useful Links" [level=2] [ref=e58]
            - list [ref=e59]:
              - listitem [ref=e60]:
                - link "Features" [ref=e61] [cursor=pointer]:
                  - /url: /#features
              - listitem [ref=e62]:
                - link "Pricing" [ref=e63] [cursor=pointer]:
                  - /url: /#pricing
              - listitem [ref=e64]:
                - link "About" [ref=e65] [cursor=pointer]:
                  - /url: /#about
          - generic [ref=e67]:
            - heading "Terms" [level=2] [ref=e68]
            - list [ref=e69]:
              - listitem [ref=e70]:
                - link "TOS" [ref=e71] [cursor=pointer]:
                  - /url: /terms
              - listitem [ref=e72]:
                - link "Privacy Policy" [ref=e73] [cursor=pointer]:
                  - /url: /privacy
              - listitem [ref=e74]:
                - link "Refund Policy" [ref=e75] [cursor=pointer]:
                  - /url: /
          - generic [ref=e77]:
            - heading "Support & Help" [level=2] [ref=e78]
            - list [ref=e79]:
              - listitem [ref=e80]:
                - link "Open Support Ticket" [ref=e81] [cursor=pointer]:
                  - /url: /#contact
              - listitem [ref=e82]:
                - link "Terms of Use" [ref=e83] [cursor=pointer]:
                  - /url: /
              - listitem [ref=e84]:
                - link "About" [ref=e85] [cursor=pointer]:
                  - /url: /#about
        - paragraph [ref=e88]: © 2026 ForgeFlow. Built for IT Service Providers.
  - generic [ref=e93] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e94]:
      - img [ref=e95]
    - generic [ref=e98]:
      - button "Open issues overlay" [ref=e99]:
        - generic [ref=e100]:
          - generic [ref=e101]: "1"
          - generic [ref=e102]: "2"
        - generic [ref=e103]:
          - text: Issue
          - generic [ref=e104]: s
      - button "Collapse issues badge" [ref=e105]:
        - img [ref=e106]
  - alert [ref=e108]
  - generic [ref=e109]:
    - img [ref=e111]
    - button "Open Tanstack query devtools" [ref=e159] [cursor=pointer]:
      - img [ref=e160]
```

# Test source

```ts
  136 |     // Confirm redirected to dashboard
  137 |     await expect(page).toHaveURL(/.*dashboard/);
  138 | 
  139 |     // Logout
  140 |     await page.evaluate(() => {
  141 |       localStorage.clear();
  142 |       document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  143 |       window.location.href = "/login";
  144 |     });
  145 |     await page.waitForURL(/.*login/);
  146 | 
  147 |     // Trigger Account Lockout (5 failed attempts)
  148 |     for (let i = 0; i < 5; i++) {
  149 |       await submitLoginForm(page, adminEmail, "wrong-password");
  150 |     }
  151 | 
  152 |     // Lockout UI/Notification validation
  153 |     await submitLoginForm(page, adminEmail, adminPassword);
  154 |     await expect(page.locator('.text-rose-400').or(page.locator("text=locked")).or(page.locator("text=too many attempts")).or(page.locator("text=lockout")).or(page.locator("text=Account locked"))).toBeVisible();
  155 | 
  156 |     // Flush Redis lockout state so adminEmail is unlocked for subsequent test flows
  157 |     try {
  158 |       execSync("redis-cli flushall");
  159 |     } catch (e) {}
  160 |   });
  161 | 
  162 |   // Flow 2: Invoice Creation and PDF Download
  163 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  164 |     // Bypass lockout by logging in with seed details
  165 |     await page.goto("/login");
  166 |     await submitLoginForm(page, adminEmail, adminPassword);
  167 |     await expect(page).toHaveURL(/.*dashboard/);
  168 | 
  169 |     // Add Client first in CRM
  170 |     await page.goto("/crm");
  171 |     await page.locator('button:has-text("New Client")').first().click();
  172 |     try {
  173 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  174 |     } catch (e) {
  175 |       await page.locator('button:has-text("New Client")').first().click();
  176 |     }
  177 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  178 |     await page.fill('input[type="email"]', "client@invoice.com");
  179 |     await page.locator('button[type="submit"]:has-text("Add Client")').click();
  180 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  181 | 
  182 |     // Create Invoice
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
> 236 |     await page.goto("/projects");
      |                ^ Error: page.goto: net::ERR_ABORTED at http://localhost:3000/projects
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
  319 |     await page.locator('button:has-text("Send Invitation")').click();
  320 | 
  321 |     // Assert listed in pending
  322 |     await expect(page.locator("text=invitee_user@forgeflow.com").last()).toBeVisible();
  323 |   });
  324 | });
  325 | 
```