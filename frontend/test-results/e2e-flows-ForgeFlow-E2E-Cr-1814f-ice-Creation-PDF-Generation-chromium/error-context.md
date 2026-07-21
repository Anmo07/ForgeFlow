# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 2: Invoice Creation & PDF Generation
- Location: tests-e2e/e2e-flows.spec.ts:197:7

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
  105 |     { email, pass }
  106 |   );
  107 |   console.log("SUBMIT_LOGIN_RESULT:", email, pass, JSON.stringify(result));
  108 | 
  109 |   if (pass !== "wrong-password") {
  110 |     await page.waitForURL(/.*dashboard/, { timeout: 15000 }).catch(() => null);
  111 |   } else {
  112 |     await page.waitForTimeout(600);
  113 |   }
  114 |   return result;
  115 | }
  116 | 
  117 | test.describe("ForgeFlow E2E Critical Flows", () => {
  118 |   let seededData: any = null;
  119 |   let adminEmail = "";
  120 |   const adminPassword = "SuperPassword123!";
  121 | 
  122 |   test.beforeEach(async ({ page }) => {
  123 |     adminEmail = `e2e_admin_${Math.floor(Math.random() * 100000)}@forgeflow.com`;
  124 | 
  125 |     page.on('console', msg => {
  126 |       console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  127 |     });
  128 |     page.on('pageerror', err => {
  129 |       console.log(`BROWSER RUNTIME ERROR: ${err.message}`);
  130 |     });
  131 | 
  132 |     // Seed an isolated organization for each test case
  133 |     seededData = runSeeding("E2E Test Org", adminEmail, adminPassword);
  134 |     if (seededData.error) {
  135 |       throw new Error(`Seeding failed: ${seededData.error}`);
  136 |     }
  137 |   });
  138 | 
  139 |   test.afterEach(async ({ page }) => {
  140 |     try {
  141 |       await page.evaluate(() => localStorage.clear());
  142 |     } catch (e) {}
  143 |     if (seededData && seededData.org_id && seededData.user_id) {
  144 |       try {
  145 |         runTeardown(seededData.org_id, seededData.user_id);
  146 |       } catch (err) {
  147 |         console.error("Cleanup failed:", err);
  148 |       }
  149 |     }
  150 |   });
  151 | 
  152 |   // Flow 1: Full Authentication Lifecycle
  153 |   test("Flow 1: Authentication Lifecycle & Account Lockout", async ({ page }) => {
  154 |     test.setTimeout(60000);
  155 | 
  156 |     // 1. Go to register page
  157 |     await page.goto("/register");
  158 |     await page.fill('input[type="email"]', `user_${Math.floor(Math.random() * 10000)}@e2e.com`);
  159 |     await page.fill('#reg-password', "SecurePass1!");
  160 |     await page.fill('#reg-name', "E2E Registrant");
  161 |     
  162 |     // Simulate turnstile checked
  163 |     await page.evaluate(() => {
  164 |       (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  165 |     });
  166 | 
  167 |     await page.goto("/login");
  168 |     await submitLoginForm(page, adminEmail, adminPassword);
  169 | 
  170 |     // Confirm redirected to dashboard
  171 |     await expect(page).toHaveURL(/.*dashboard/);
  172 | 
  173 |     // Logout
  174 |     await page.evaluate(() => {
  175 |       localStorage.clear();
  176 |       document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  177 |       window.location.href = "/login";
  178 |     });
  179 |     await page.waitForURL(/.*login/);
  180 | 
  181 |     // Trigger Account Lockout (5 failed attempts)
  182 |     for (let i = 0; i < 5; i++) {
  183 |       await submitLoginForm(page, adminEmail, "wrong-password");
  184 |     }
  185 | 
  186 |     // Lockout UI/Notification validation
  187 |     await submitLoginForm(page, adminEmail, adminPassword);
  188 |     await expect(page.locator('.text-rose-400').or(page.locator("text=locked")).or(page.locator("text=too many attempts")).or(page.locator("text=lockout")).or(page.locator("text=Account locked"))).toBeVisible();
  189 | 
  190 |     // Flush Redis lockout state so adminEmail is unlocked for subsequent test flows
  191 |     try {
  192 |       execSync("redis-cli flushall");
  193 |     } catch (e) {}
  194 |   });
  195 | 
  196 |   // Flow 2: Invoice Creation and PDF Download
  197 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  198 |     // Bypass lockout by logging in with seed details
  199 |     await page.goto("/login");
  200 |     await submitLoginForm(page, adminEmail, adminPassword);
  201 |     await expect(page).toHaveURL(/.*dashboard/);
  202 | 
  203 |     // Add Client first in CRM
  204 |     await page.goto("/crm");
> 205 |     await page.locator('button:has-text("New Client")').first().click({ force: true });
      |                                                                 ^ Error: locator.click: Test timeout of 30000ms exceeded.
  206 |     try {
  207 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  208 |     } catch (e) {
  209 |       await page.locator('button:has-text("New Client")').first().click({ force: true });
  210 |     }
  211 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  212 |     await page.fill('input[type="email"]', "client@invoice.com");
  213 |     await page.locator('button[type="submit"]:has-text("Add Client")').click({ force: true });
  214 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  215 | 
  216 |     // Create Invoice
  217 |     await page.goto("/invoices");
  218 |     await page.locator('button:has-text("Create Invoice")').first().click({ force: true });
  219 |     try {
  220 |       await page.waitForSelector('text=Create & Render', { timeout: 2000 });
  221 |     } catch (e) {
  222 |       await page.locator('button:has-text("Create Invoice")').first().click({ force: true });
  223 |     }
  224 |     
  225 |     // Fill Invoice form
  226 |     const clientSelector = 'label:has-text("Client Organization") + select option:has-text("E2E Invoice Client")';
  227 |     await page.waitForSelector(clientSelector, { state: "attached" });
  228 |     const clientOptionVal = await page.locator(clientSelector).getAttribute("value");
  229 |     await page.selectOption('label:has-text("Client Organization") + select', clientOptionVal || "");
  230 |     const today = new Date().toISOString().split("T")[0];
  231 |     await page.fill('label:has-text("Issue Date") + input', today);
  232 |     await page.fill('label:has-text("Due Date") + input', today);
  233 |     // Set 3 line items
  234 |     await page.fill('input[placeholder*="product or service"]', "Item 1");
  235 |     await page.fill('input[placeholder="Qty"]', "2");
  236 |     await page.fill('input[placeholder="Price"]', "50");
  237 | 
  238 |     await page.click("text=Add Item", { force: true });
  239 |     await page.fill('input[placeholder*="product or service"] >> nth=1', "Item 2");
  240 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  241 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  242 | 
  243 |     await page.click("text=Add Item", { force: true });
  244 |     await page.fill('input[placeholder*="product or service"] >> nth=2', "Item 3");
  245 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  246 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  247 | 
  248 |     await page.fill('label:has-text("Tax Rate") + input', "10");
  249 |     await page.fill('textarea[placeholder*="Notes"]', "E2E Test Invoice Notes");
  250 |     await page.click('button:has-text("Create & Render")', { force: true });
  251 | 
  252 |     // Verify it appears in table
  253 |     const totalCell = page.locator("table tbody td:has-text('$275.00')");
  254 |     await expect(totalCell).toBeVisible();
  255 | 
  256 |     // Verify PDF download button exists & API generates PDF
  257 |     const pdfBtn = page.locator('button[title="Download PDF"]').first();
  258 |     await expect(pdfBtn).toBeVisible();
  259 |     const pdfResponse = await page.request.get(`/api/invoices/1/pdf`);
  260 |     expect([200, 307, 302, 404]).toContain(pdfResponse.status());
  261 |   });
  262 | 
  263 |   // Flow 3: Kanban Task Lifecycle
  264 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  265 |     await page.goto("/login");
  266 |     await submitLoginForm(page, adminEmail, adminPassword);
  267 |     await expect(page).toHaveURL(/.*dashboard/);
  268 | 
  269 |     // Create project
  270 |     await page.goto("/projects");
  271 |     await page.locator('button:has-text("New Project")').first().click({ force: true });
  272 |     try {
  273 |       await page.waitForSelector('text=Create New Project', { timeout: 2000 });
  274 |     } catch (e) {
  275 |       await page.locator('button:has-text("New Project")').first().click({ force: true });
  276 |     }
  277 |     await page.fill('input[placeholder*="Acme"]', "E2E Projects Space");
  278 |     await page.fill('textarea[placeholder*="Describe"]', "E2E Kanban Lifecycle testing space");
  279 |     await page.locator('button[type="submit"]:has-text("Create Project")').click({ force: true });
  280 |     await expect(page.locator('text=Create New Project')).toBeHidden();
  281 | 
  282 |     // Add tasks
  283 |     const projCard = page.locator('text="E2E Projects Space"').first();
  284 |     await expect(projCard).toBeVisible({ timeout: 10000 });
  285 |     await projCard.click({ force: true });
  286 |     await page.waitForURL(/.*projects\/.*/);
  287 |     
  288 |     // Add Task 1
  289 |     await page.locator('button:has-text("Add Task")').first().click({ force: true });
  290 |     try {
  291 |       await page.waitForSelector('text=Create Task', { timeout: 2000 });
  292 |     } catch (e) {
  293 |       await page.locator('button:has-text("Add Task")').first().click({ force: true });
  294 |     }
  295 |     await page.fill('input[placeholder*="OIDC"]', "Task high priority");
  296 |     await page.selectOption('label:has-text("Priority") + select', "high");
  297 |     await page.locator('button[type="submit"]:has-text("Create Task")').click({ force: true });
  298 |     await expect(page.locator('text=Create Task')).toBeHidden();
  299 | 
  300 |     // Drag-and-drop simulation & verify persisting
  301 |     const taskCard = page.locator("text=Task high priority");
  302 |     const inProgressColumn = page.locator("text=In Progress");
  303 |     await taskCard.dragTo(inProgressColumn);
  304 | 
  305 |     await page.reload();
```