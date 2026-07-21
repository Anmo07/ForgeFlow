# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 3: Kanban Projects and Tasks
- Location: tests-e2e/e2e-flows.spec.ts:285:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("New Project")').first()

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e5]:
      - link "ForgeFlow" [ref=e7] [cursor=pointer]:
        - /url: /
        - generic [ref=e8]: ForgeFlow
      - generic [ref=e9]:
        - generic [ref=e10]:
          - button "Mobile Menu" [ref=e11]
          - navigation [ref=e12]:
            - list [ref=e13]:
              - listitem [ref=e14]:
                - link "Home" [ref=e15] [cursor=pointer]:
                  - /url: /
              - listitem [ref=e16]:
                - link "Features" [ref=e17] [cursor=pointer]:
                  - /url: /#features
              - listitem [ref=e18]:
                - link "Pricing" [ref=e19] [cursor=pointer]:
                  - /url: /#pricing
              - listitem [ref=e20]:
                - link "About" [ref=e21] [cursor=pointer]:
                  - /url: /#about
              - listitem [ref=e22]:
                - link "Contact" [ref=e23] [cursor=pointer]:
                  - /url: /#contact
        - generic [ref=e24]:
          - link "Sign In" [ref=e25] [cursor=pointer]:
            - /url: /login
          - link "Sign Up" [ref=e26] [cursor=pointer]:
            - /url: /register
          - button "theme toggler" [ref=e28]:
            - img
            - img
  - generic [ref=e32]:
    - img [ref=e33]
    - heading "Select an organization" [level=3] [ref=e35]
    - paragraph [ref=e36]: Please select or create an organization from the workspace switcher in the header to view and manage projects.
  - contentinfo [ref=e37]:
    - generic [ref=e38]:
      - generic [ref=e39]:
        - generic [ref=e41]:
          - link "ForgeFlow" [ref=e42] [cursor=pointer]:
            - /url: /
            - generic [ref=e43]: ForgeFlow
          - paragraph [ref=e44]: The unified command center and billing automation engine for modern IT Managed Service Providers.
          - generic [ref=e45]:
            - link "Facebook" [ref=e46] [cursor=pointer]:
              - /url: /
              - img [ref=e47]
            - link "Twitter" [ref=e49] [cursor=pointer]:
              - /url: /
              - img [ref=e50]
            - link "YouTube" [ref=e52] [cursor=pointer]:
              - /url: /
              - img [ref=e53]
            - link "LinkedIn" [ref=e55] [cursor=pointer]:
              - /url: /
              - img [ref=e56]
        - generic [ref=e59]:
          - heading "Useful Links" [level=2] [ref=e60]
          - list [ref=e61]:
            - listitem [ref=e62]:
              - link "Features" [ref=e63] [cursor=pointer]:
                - /url: /#features
            - listitem [ref=e64]:
              - link "Pricing" [ref=e65] [cursor=pointer]:
                - /url: /#pricing
            - listitem [ref=e66]:
              - link "About" [ref=e67] [cursor=pointer]:
                - /url: /#about
        - generic [ref=e69]:
          - heading "Terms" [level=2] [ref=e70]
          - list [ref=e71]:
            - listitem [ref=e72]:
              - link "TOS" [ref=e73] [cursor=pointer]:
                - /url: /terms
            - listitem [ref=e74]:
              - link "Privacy Policy" [ref=e75] [cursor=pointer]:
                - /url: /privacy
            - listitem [ref=e76]:
              - link "Refund Policy" [ref=e77] [cursor=pointer]:
                - /url: /
        - generic [ref=e79]:
          - heading "Support & Help" [level=2] [ref=e80]
          - list [ref=e81]:
            - listitem [ref=e82]:
              - link "Open Support Ticket" [ref=e83] [cursor=pointer]:
                - /url: /#contact
            - listitem [ref=e84]:
              - link "Terms of Use" [ref=e85] [cursor=pointer]:
                - /url: /
            - listitem [ref=e86]:
              - link "About" [ref=e87] [cursor=pointer]:
                - /url: /#about
      - paragraph [ref=e89]: © 2026 ForgeFlow. Built for IT Service Providers.
```

# Test source

```ts
  192 |     await expect(page).toHaveURL(/.*dashboard/);
  193 | 
  194 |     // Logout
  195 |     await page.evaluate(() => {
  196 |       localStorage.clear();
  197 |       document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  198 |       window.location.href = "/login";
  199 |     });
  200 |     await page.waitForURL(/.*login/);
  201 | 
  202 |     // Trigger Account Lockout (5 failed attempts)
  203 |     for (let i = 0; i < 5; i++) {
  204 |       await submitLoginForm(page, adminEmail, "wrong-password");
  205 |     }
  206 | 
  207 |     // Lockout UI/Notification validation
  208 |     await submitLoginForm(page, adminEmail, adminPassword);
  209 |     await expect(page.locator('.text-rose-400').or(page.locator("text=locked")).or(page.locator("text=too many attempts")).or(page.locator("text=lockout")).or(page.locator("text=Account locked"))).toBeVisible();
  210 | 
  211 |     // Flush Redis lockout state so adminEmail is unlocked for subsequent test flows
  212 |     try {
  213 |       execSync("redis-cli flushall");
  214 |     } catch (e) {}
  215 |   });
  216 | 
  217 |   // Flow 2: Invoice Creation and PDF Download
  218 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  219 |     // Bypass lockout by logging in with seed details
  220 |     await page.goto("/login");
  221 |     await submitLoginForm(page, adminEmail, adminPassword);
  222 |     await expect(page).toHaveURL(/.*dashboard/);
  223 | 
  224 |     // Add Client first in CRM
  225 |     await page.goto("/crm");
  226 |     await page.locator('button:has-text("New Client")').first().click({ force: true });
  227 |     try {
  228 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  229 |     } catch (e) {
  230 |       await page.locator('button:has-text("New Client")').first().click({ force: true });
  231 |     }
  232 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  233 |     await page.fill('input[type="email"]', "client@invoice.com");
  234 |     await page.locator('button[type="submit"]:has-text("Add Client")').click({ force: true });
  235 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  236 | 
  237 |     // Create Invoice
  238 |     await page.goto("/invoices");
  239 |     await page.locator('button:has-text("Create Invoice")').first().click({ force: true });
  240 |     try {
  241 |       await page.waitForSelector('text=Create & Render', { timeout: 2000 });
  242 |     } catch (e) {
  243 |       await page.locator('button:has-text("Create Invoice")').first().click({ force: true });
  244 |     }
  245 |     
  246 |     // Fill Invoice form
  247 |     const clientSelector = 'label:has-text("Client Organization") + select option:has-text("E2E Invoice Client")';
  248 |     await page.waitForSelector(clientSelector, { state: "attached" });
  249 |     const clientOptionVal = await page.locator(clientSelector).getAttribute("value");
  250 |     await page.selectOption('label:has-text("Client Organization") + select', clientOptionVal || "");
  251 |     const today = new Date().toISOString().split("T")[0];
  252 |     await page.fill('label:has-text("Issue Date") + input', today);
  253 |     await page.fill('label:has-text("Due Date") + input', today);
  254 |     // Set 3 line items
  255 |     await page.fill('input[placeholder*="product or service"]', "Item 1");
  256 |     await page.fill('input[placeholder="Qty"]', "2");
  257 |     await page.fill('input[placeholder="Price"]', "50");
  258 | 
  259 |     await page.click("text=Add Item", { force: true });
  260 |     await page.fill('input[placeholder*="product or service"] >> nth=1', "Item 2");
  261 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  262 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  263 | 
  264 |     await page.click("text=Add Item", { force: true });
  265 |     await page.fill('input[placeholder*="product or service"] >> nth=2', "Item 3");
  266 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  267 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  268 | 
  269 |     await page.fill('label:has-text("Tax Rate") + input', "10");
  270 |     await page.fill('textarea[placeholder*="Notes"]', "E2E Test Invoice Notes");
  271 |     await page.click('button:has-text("Create & Render")', { force: true });
  272 | 
  273 |     // Verify it appears in table
  274 |     const totalCell = page.locator("table tbody td:has-text('$275.00')");
  275 |     await expect(totalCell).toBeVisible();
  276 | 
  277 |     // Verify PDF download button exists & API generates PDF
  278 |     const pdfBtn = page.locator('button[title="Download PDF"]').first();
  279 |     await expect(pdfBtn).toBeVisible();
  280 |     const pdfResponse = await page.request.get(`/api/invoices/1/pdf`);
  281 |     expect([200, 307, 302, 404]).toContain(pdfResponse.status());
  282 |   });
  283 | 
  284 |   // Flow 3: Kanban Task Lifecycle
  285 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  286 |     await page.goto("/login");
  287 |     await submitLoginForm(page, adminEmail, adminPassword);
  288 |     await expect(page).toHaveURL(/.*dashboard/);
  289 | 
  290 |     // Create project
  291 |     await page.goto("/projects");
> 292 |     await page.locator('button:has-text("New Project")').first().click({ force: true });
      |                                                                  ^ Error: locator.click: Test timeout of 30000ms exceeded.
  293 |     try {
  294 |       await page.waitForSelector('text=Create New Project', { timeout: 2000 });
  295 |     } catch (e) {
  296 |       await page.locator('button:has-text("New Project")').first().click({ force: true });
  297 |     }
  298 |     await page.fill('input[placeholder*="Acme"]', "E2E Projects Space");
  299 |     await page.fill('textarea[placeholder*="Describe"]', "E2E Kanban Lifecycle testing space");
  300 |     await page.locator('button[type="submit"]:has-text("Create Project")').click({ force: true });
  301 |     await expect(page.locator('text=Create New Project')).toBeHidden();
  302 | 
  303 |     // Add tasks
  304 |     const projCard = page.locator('text="E2E Projects Space"').first();
  305 |     await expect(projCard).toBeVisible({ timeout: 10000 });
  306 |     await projCard.click({ force: true });
  307 |     await page.waitForURL(/.*projects\/.*/);
  308 |     
  309 |     // Add Task 1
  310 |     await page.locator('button:has-text("Add Task")').first().click({ force: true });
  311 |     try {
  312 |       await page.waitForSelector('text=Create Task', { timeout: 2000 });
  313 |     } catch (e) {
  314 |       await page.locator('button:has-text("Add Task")').first().click({ force: true });
  315 |     }
  316 |     await page.fill('input[placeholder*="OIDC"]', "Task high priority");
  317 |     await page.selectOption('label:has-text("Priority") + select', "high");
  318 |     await page.locator('button[type="submit"]:has-text("Create Task")').click({ force: true });
  319 |     await expect(page.locator('text=Create Task')).toBeHidden();
  320 | 
  321 |     // Drag-and-drop simulation & verify persisting
  322 |     const taskCard = page.locator("text=Task high priority");
  323 |     const inProgressColumn = page.locator("text=In Progress");
  324 |     await taskCard.dragTo(inProgressColumn);
  325 | 
  326 |     await page.reload();
  327 |     await expect(page.locator('div[class*="w-[280px]"], div[class*="w-[320px]"]').filter({ hasText: "In Progress" })).toContainText("Task high priority");
  328 |   });
  329 | 
  330 |   // Flow 4: CRM Deal Pipeline
  331 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  332 |     await page.goto("/login");
  333 |     await submitLoginForm(page, adminEmail, adminPassword);
  334 |     await expect(page).toHaveURL(/.*dashboard/);
  335 | 
  336 |     await page.goto("/crm");
  337 |     // Add Client first (required for Lead)
  338 |     await page.locator('button:has-text("New Client")').first().click({ force: true });
  339 |     try {
  340 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  341 |     } catch (e) {
  342 |       await page.locator('button:has-text("New Client")').first().click({ force: true });
  343 |     }
  344 |     await page.fill('input[placeholder*="John Doe"]', "E2E Lead Client");
  345 |     await page.fill('input[type="email"]', "lead_client@invoice.com");
  346 |     await page.locator('button[type="submit"]:has-text("Add Client")').click({ force: true });
  347 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  348 | 
  349 |     // Add lead
  350 |     await page.locator('button:has-text("New Lead")').first().click({ force: true });
  351 |     try {
  352 |       await page.waitForSelector('text=Add New Lead', { timeout: 2000 });
  353 |     } catch (e) {
  354 |       await page.locator('button:has-text("New Lead")').first().click({ force: true });
  355 |     }
  356 |     await page.selectOption('select[required]', { index: 1 });
  357 |     await page.fill('input[placeholder*="5000"]', "25000");
  358 |     await page.locator('button[type="submit"]:has-text("Add Lead")').click({ force: true });
  359 |     await expect(page.locator('text=Add New Lead')).toBeHidden();
  360 | 
  361 |     // Check CRM list or pipeline dashboard update
  362 |     await page.goto("/crm");
  363 |     await expect(page.locator("text=25,000").or(page.locator("text=$25,000")).or(page.locator("text=25000"))).toBeVisible();
  364 |   });
  365 | 
  366 |   // Flow 5: Org invite and membership
  367 |   test("Flow 5: Invite Members and Roles", async ({ page }) => {
  368 |     await page.goto("/login");
  369 |     await submitLoginForm(page, adminEmail, adminPassword);
  370 |     await expect(page).toHaveURL(/.*dashboard/);
  371 | 
  372 |     await page.goto("/settings/members");
  373 |     await page.fill('input[placeholder="user@example.com"]', "invitee_user@forgeflow.com");
  374 |     await page.locator('button:has-text("Send Invitation")').click({ force: true });
  375 | 
  376 |     // Assert listed in pending
  377 |     await expect(page.locator("text=invitee_user@forgeflow.com").last()).toBeVisible();
  378 |   });
  379 | });
  380 | 
```