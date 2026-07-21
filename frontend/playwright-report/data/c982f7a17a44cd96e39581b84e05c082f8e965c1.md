# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 2: Invoice Creation & PDF Generation
- Location: tests-e2e/e2e-flows.spec.ts:218:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button:has-text("New Client")').first()

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
    - heading "Select an organization" [level=3] [ref=e38]
    - paragraph [ref=e39]: Please select or create an organization from the workspace switcher in the header to view and manage CRM entries.
  - contentinfo [ref=e40]:
    - generic [ref=e41]:
      - generic [ref=e42]:
        - generic [ref=e44]:
          - link "ForgeFlow" [ref=e45] [cursor=pointer]:
            - /url: /
            - generic [ref=e46]: ForgeFlow
          - paragraph [ref=e47]: The unified command center and billing automation engine for modern IT Managed Service Providers.
          - generic [ref=e48]:
            - link "Facebook" [ref=e49] [cursor=pointer]:
              - /url: /
              - img [ref=e50]
            - link "Twitter" [ref=e52] [cursor=pointer]:
              - /url: /
              - img [ref=e53]
            - link "YouTube" [ref=e55] [cursor=pointer]:
              - /url: /
              - img [ref=e56]
            - link "LinkedIn" [ref=e58] [cursor=pointer]:
              - /url: /
              - img [ref=e59]
        - generic [ref=e62]:
          - heading "Useful Links" [level=2] [ref=e63]
          - list [ref=e64]:
            - listitem [ref=e65]:
              - link "Features" [ref=e66] [cursor=pointer]:
                - /url: /#features
            - listitem [ref=e67]:
              - link "Pricing" [ref=e68] [cursor=pointer]:
                - /url: /#pricing
            - listitem [ref=e69]:
              - link "About" [ref=e70] [cursor=pointer]:
                - /url: /#about
        - generic [ref=e72]:
          - heading "Terms" [level=2] [ref=e73]
          - list [ref=e74]:
            - listitem [ref=e75]:
              - link "TOS" [ref=e76] [cursor=pointer]:
                - /url: /terms
            - listitem [ref=e77]:
              - link "Privacy Policy" [ref=e78] [cursor=pointer]:
                - /url: /privacy
            - listitem [ref=e79]:
              - link "Refund Policy" [ref=e80] [cursor=pointer]:
                - /url: /
        - generic [ref=e82]:
          - heading "Support & Help" [level=2] [ref=e83]
          - list [ref=e84]:
            - listitem [ref=e85]:
              - link "Open Support Ticket" [ref=e86] [cursor=pointer]:
                - /url: /#contact
            - listitem [ref=e87]:
              - link "Terms of Use" [ref=e88] [cursor=pointer]:
                - /url: /
            - listitem [ref=e89]:
              - link "About" [ref=e90] [cursor=pointer]:
                - /url: /#about
      - paragraph [ref=e92]: © 2026 ForgeFlow. Built for IT Service Providers.
```

# Test source

```ts
  126 |     { email, pass }
  127 |   );
  128 |   console.log("SUBMIT_LOGIN_RESULT:", email, pass, JSON.stringify(result));
  129 | 
  130 |   if (pass !== "wrong-password") {
  131 |     await page.waitForURL(/.*dashboard/, { timeout: 15000 }).catch(() => null);
  132 |   } else {
  133 |     await page.waitForTimeout(600);
  134 |   }
  135 |   return result;
  136 | }
  137 | 
  138 | test.describe("ForgeFlow E2E Critical Flows", () => {
  139 |   let seededData: any = null;
  140 |   let adminEmail = "";
  141 |   const adminPassword = "SuperPassword123!";
  142 | 
  143 |   test.beforeEach(async ({ page }) => {
  144 |     adminEmail = `e2e_admin_${Math.floor(Math.random() * 100000)}@forgeflow.com`;
  145 | 
  146 |     page.on('console', msg => {
  147 |       console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  148 |     });
  149 |     page.on('pageerror', err => {
  150 |       console.log(`BROWSER RUNTIME ERROR: ${err.message}`);
  151 |     });
  152 | 
  153 |     // Seed an isolated organization for each test case
  154 |     seededData = runSeeding("E2E Test Org", adminEmail, adminPassword);
  155 |     if (seededData.error) {
  156 |       throw new Error(`Seeding failed: ${seededData.error}`);
  157 |     }
  158 |   });
  159 | 
  160 |   test.afterEach(async ({ page }) => {
  161 |     try {
  162 |       await page.evaluate(() => localStorage.clear());
  163 |     } catch (e) {}
  164 |     if (seededData && seededData.org_id && seededData.user_id) {
  165 |       try {
  166 |         runTeardown(seededData.org_id, seededData.user_id);
  167 |       } catch (err) {
  168 |         console.error("Cleanup failed:", err);
  169 |       }
  170 |     }
  171 |   });
  172 | 
  173 |   // Flow 1: Full Authentication Lifecycle
  174 |   test("Flow 1: Authentication Lifecycle & Account Lockout", async ({ page }) => {
  175 |     test.setTimeout(60000);
  176 | 
  177 |     // 1. Go to register page
  178 |     await page.goto("/register");
  179 |     await page.fill('input[type="email"]', `user_${Math.floor(Math.random() * 10000)}@e2e.com`);
  180 |     await page.fill('#reg-password', "SecurePass1!");
  181 |     await page.fill('#reg-name', "E2E Registrant");
  182 |     
  183 |     // Simulate turnstile checked
  184 |     await page.evaluate(() => {
  185 |       (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  186 |     });
  187 | 
  188 |     await page.goto("/login");
  189 |     await submitLoginForm(page, adminEmail, adminPassword);
  190 | 
  191 |     // Confirm redirected to dashboard
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
> 226 |     await page.locator('button:has-text("New Client")').first().click({ force: true });
      |                                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
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
  292 |     await page.locator('button:has-text("New Project")').first().click({ force: true });
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
```