# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 3: Kanban Projects and Tasks
- Location: tests-e2e/e2e-flows.spec.ts:229:7

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
          - generic [ref=e101]: "0"
          - generic [ref=e102]: "1"
        - generic [ref=e103]: Issue
      - button "Collapse issues badge" [ref=e104]:
        - img [ref=e105]
  - alert [ref=e107]
  - generic [ref=e108]:
    - img [ref=e110]
    - button "Open Tanstack query devtools" [ref=e158] [cursor=pointer]:
      - img [ref=e159]
```

# Test source

```ts
  135 |     // Confirm redirected to dashboard
  136 |     await expect(page).toHaveURL(/.*dashboard/);
  137 | 
  138 |     // Logout
  139 |     await page.evaluate(() => {
  140 |       localStorage.clear();
  141 |       document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  142 |       window.location.href = "/login";
  143 |     });
  144 |     await page.waitForURL(/.*login/);
  145 | 
  146 |     // Trigger Account Lockout (5 failed attempts)
  147 |     for (let i = 0; i < 5; i++) {
  148 |       await submitLoginForm(page, adminEmail, "wrong-password");
  149 |     }
  150 | 
  151 |     // Lockout UI/Notification validation
  152 |     await submitLoginForm(page, adminEmail, adminPassword);
  153 |     await expect(page.locator('.text-rose-400').or(page.locator("text=locked")).or(page.locator("text=too many attempts")).or(page.locator("text=lockout")).or(page.locator("text=Account locked"))).toBeVisible();
  154 | 
  155 |     // Flush Redis lockout state so adminEmail is unlocked for subsequent test flows
  156 |     try {
  157 |       execSync("redis-cli flushall");
  158 |     } catch (e) {}
  159 |   });
  160 | 
  161 |   // Flow 2: Invoice Creation and PDF Download
  162 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  163 |     // Bypass lockout by logging in with seed details
  164 |     await page.goto("/login");
  165 |     await submitLoginForm(page, adminEmail, adminPassword);
  166 |     await expect(page).toHaveURL(/.*dashboard/);
  167 | 
  168 |     // Add Client first in CRM
  169 |     await page.goto("/crm");
  170 |     await page.locator('button:has-text("New Client")').first().click();
  171 |     try {
  172 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  173 |     } catch (e) {
  174 |       await page.locator('button:has-text("New Client")').first().click();
  175 |     }
  176 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  177 |     await page.fill('input[type="email"]', "client@invoice.com");
  178 |     await page.locator('button[type="submit"]:has-text("Add Client")').click();
  179 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  180 | 
  181 |     // Create Invoice
  182 |     await page.goto("/invoices");
  183 |     await page.locator('button:has-text("Create Invoice")').first().click();
  184 |     try {
  185 |       await page.waitForSelector('text=Create & Render', { timeout: 2000 });
  186 |     } catch (e) {
  187 |       await page.locator('button:has-text("Create Invoice")').first().click();
  188 |     }
  189 |     
  190 |     // Fill Invoice form
  191 |     const clientSelector = 'label:has-text("Client Organization") + select option:has-text("E2E Invoice Client")';
  192 |     await page.waitForSelector(clientSelector, { state: "attached" });
  193 |     const clientOptionVal = await page.locator(clientSelector).getAttribute("value");
  194 |     await page.selectOption('label:has-text("Client Organization") + select', clientOptionVal || "");
  195 |     const today = new Date().toISOString().split("T")[0];
  196 |     await page.fill('label:has-text("Issue Date") + input', today);
  197 |     await page.fill('label:has-text("Due Date") + input', today);
  198 |     // Set 3 line items
  199 |     await page.fill('input[placeholder*="product or service"]', "Item 1");
  200 |     await page.fill('input[placeholder="Qty"]', "2");
  201 |     await page.fill('input[placeholder="Price"]', "50");
  202 | 
  203 |     await page.click("text=Add Item");
  204 |     await page.fill('input[placeholder*="product or service"] >> nth=1', "Item 2");
  205 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  206 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  207 | 
  208 |     await page.click("text=Add Item");
  209 |     await page.fill('input[placeholder*="product or service"] >> nth=2', "Item 3");
  210 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  211 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  212 | 
  213 |     await page.fill('label:has-text("Tax Rate") + input', "10");
  214 |     await page.fill('textarea[placeholder*="Notes"]', "E2E Test Invoice Notes");
  215 |     await page.click('button:has-text("Create & Render")');
  216 | 
  217 |     // Verify it appears in table
  218 |     const totalCell = page.locator("table tbody td:has-text('$275.00')");
  219 |     await expect(totalCell).toBeVisible();
  220 | 
  221 |     // Verify PDF download button exists & API generates PDF
  222 |     const pdfBtn = page.locator('button[title="Download PDF"]').first();
  223 |     await expect(pdfBtn).toBeVisible();
  224 |     const pdfResponse = await page.request.get(`/api/invoices/1/pdf`);
  225 |     expect([200, 307, 302, 404]).toContain(pdfResponse.status());
  226 |   });
  227 | 
  228 |   // Flow 3: Kanban Task Lifecycle
  229 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  230 |     await page.goto("/login");
  231 |     await submitLoginForm(page, adminEmail, adminPassword);
  232 |     await expect(page).toHaveURL(/.*dashboard/);
  233 | 
  234 |     // Create project
> 235 |     await page.goto("/projects");
      |                ^ Error: page.goto: net::ERR_ABORTED at http://localhost:3000/projects
  236 |     await page.locator('button:has-text("New Project")').first().click();
  237 |     try {
  238 |       await page.waitForSelector('text=Create New Project', { timeout: 2000 });
  239 |     } catch (e) {
  240 |       await page.locator('button:has-text("New Project")').first().click();
  241 |     }
  242 |     await page.fill('input[placeholder*="Acme"]', "E2E Projects Space");
  243 |     await page.fill('textarea[placeholder*="Describe"]', "E2E Kanban Lifecycle testing space");
  244 |     await page.locator('button[type="submit"]:has-text("Create Project")').click();
  245 |     await expect(page.locator('text=Create New Project')).toBeHidden();
  246 | 
  247 |     // Add tasks
  248 |     const projCard = page.locator('text="E2E Projects Space"').first();
  249 |     await expect(projCard).toBeVisible({ timeout: 10000 });
  250 |     await projCard.click();
  251 |     await page.waitForURL(/.*projects\/.*/);
  252 |     
  253 |     // Add Task 1
  254 |     await page.locator('button:has-text("Add Task")').first().click();
  255 |     try {
  256 |       await page.waitForSelector('text=Create Task', { timeout: 2000 });
  257 |     } catch (e) {
  258 |       await page.locator('button:has-text("Add Task")').first().click();
  259 |     }
  260 |     await page.fill('input[placeholder*="OIDC"]', "Task high priority");
  261 |     await page.selectOption('label:has-text("Priority") + select', "high");
  262 |     await page.locator('button[type="submit"]:has-text("Create Task")').click();
  263 |     await expect(page.locator('text=Create Task')).toBeHidden();
  264 | 
  265 |     // Drag-and-drop simulation & verify persisting
  266 |     const taskCard = page.locator("text=Task high priority");
  267 |     const inProgressColumn = page.locator("text=In Progress");
  268 |     await taskCard.dragTo(inProgressColumn);
  269 | 
  270 |     await page.reload();
  271 |     await expect(page.locator('div[class*="w-[280px]"], div[class*="w-[320px]"]').filter({ hasText: "In Progress" })).toContainText("Task high priority");
  272 |   });
  273 | 
  274 |   // Flow 4: CRM Deal Pipeline
  275 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  276 |     await page.goto("/login");
  277 |     await submitLoginForm(page, adminEmail, adminPassword);
  278 |     await expect(page).toHaveURL(/.*dashboard/);
  279 | 
  280 |     await page.goto("/crm");
  281 |     // Add Client first (required for Lead)
  282 |     await page.locator('button:has-text("New Client")').first().click();
  283 |     try {
  284 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  285 |     } catch (e) {
  286 |       await page.locator('button:has-text("New Client")').first().click();
  287 |     }
  288 |     await page.fill('input[placeholder*="John Doe"]', "E2E Lead Client");
  289 |     await page.fill('input[type="email"]', "lead_client@invoice.com");
  290 |     await page.locator('button[type="submit"]:has-text("Add Client")').click();
  291 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  292 | 
  293 |     // Add lead
  294 |     await page.locator('button:has-text("New Lead")').first().click();
  295 |     try {
  296 |       await page.waitForSelector('text=Add New Lead', { timeout: 2000 });
  297 |     } catch (e) {
  298 |       await page.locator('button:has-text("New Lead")').first().click();
  299 |     }
  300 |     await page.selectOption('select[required]', { index: 1 });
  301 |     await page.fill('input[placeholder*="5000"]', "25000");
  302 |     await page.locator('button[type="submit"]:has-text("Add Lead")').click();
  303 |     await expect(page.locator('text=Add New Lead')).toBeHidden();
  304 | 
  305 |     // Check CRM list or pipeline dashboard update
  306 |     await page.goto("/crm");
  307 |     await expect(page.locator("text=25,000").or(page.locator("text=$25,000")).or(page.locator("text=25000"))).toBeVisible();
  308 |   });
  309 | 
  310 |   // Flow 5: Org invite and membership
  311 |   test("Flow 5: Invite Members and Roles", async ({ page }) => {
  312 |     await page.goto("/login");
  313 |     await submitLoginForm(page, adminEmail, adminPassword);
  314 |     await expect(page).toHaveURL(/.*dashboard/);
  315 | 
  316 |     await page.goto("/settings/members");
  317 |     await page.fill('input[placeholder="user@example.com"]', "invitee_user@forgeflow.com");
  318 |     await page.locator('button:has-text("Send Invitation")').click();
  319 | 
  320 |     // Assert listed in pending
  321 |     await expect(page.locator("text=invitee_user@forgeflow.com").last()).toBeVisible();
  322 |   });
  323 | });
  324 | 
```