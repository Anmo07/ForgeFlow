# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 4: CRM Leads & Deals pipeline
- Location: tests-e2e/e2e-flows.spec.ts:224:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=New Lead')
    - waiting for" http://localhost:3000/login?from=%2Fcrm" navigation to finish...
    - navigated to "http://localhost:3000/login?from=%2Fcrm"

```

# Page snapshot

```yaml
- generic [ref=e6]:
  - generic [ref=e7]:
    - link "ForgeFlow" [ref=e8] [cursor=pointer]:
      - /url: /
      - generic [ref=e9]: ForgeFlow
    - generic [ref=e10]:
      - img [ref=e12]
      - generic [ref=e15]:
        - heading "Welcome back" [level=1] [ref=e16]
        - paragraph [ref=e17]: Log in to your ForgeFlow account
  - generic [ref=e18]:
    - generic [ref=e19]:
      - generic [ref=e20]: Email Address
      - generic [ref=e21]:
        - img [ref=e22]
        - textbox "Email Address" [ref=e25]:
          - /placeholder: name@company.com
    - generic [ref=e26]:
      - generic [ref=e27]:
        - generic [ref=e28]: Password
        - link "Forgot password?" [ref=e29] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e30]:
        - img [ref=e31]
        - textbox "Password" [ref=e34]:
          - /placeholder: ••••••••
        - button [ref=e35]:
          - img [ref=e36]
    - button "Sign In" [ref=e39]:
      - img [ref=e40]
      - text: Sign In
  - generic [ref=e45]: Or continue with
  - link "Sign In with Google" [ref=e47] [cursor=pointer]:
    - /url: /api/auth/sso/google/init
    - img [ref=e48]
    - generic [ref=e53]: Sign In with Google
  - paragraph [ref=e54]:
    - text: Don't have an account?
    - link "Sign Up" [ref=e55] [cursor=pointer]:
      - /url: /register
```

# Test source

```ts
  130 |   // Flow 2: Invoice Creation and PDF Download
  131 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  132 |     // Bypass lockout by logging in with seed details
  133 |     await page.goto("/login");
  134 |     await submitLoginForm(page, adminEmail, adminPassword);
  135 |     await expect(page).toHaveURL(/.*dashboard/);
  136 | 
  137 |     // Navigate to Invoices
  138 |     await page.goto("/invoices");
  139 | 
  140 |     // Add Client first
  141 |     await page.goto("/crm");
  142 |     await page.click("text=New Client");
  143 |     await page.fill('input[placeholder*="Client Name"]', "E2E Invoice Client");
  144 |     await page.fill('input[type="email"]', "client@invoice.local");
  145 |     await page.click("text=Save");
  146 | 
  147 |     // Create Invoice
  148 |     await page.goto("/invoices");
  149 |     await page.click("text=Create Invoice");
  150 |     
  151 |     // Fill Invoice form
  152 |     await page.selectOption("select", { label: "E2E Invoice Client" });
  153 |     await page.fill('input[type="date"]', new Date().toISOString().split("T")[0]);
  154 |     // Set 3 line items
  155 |     await page.fill('input[placeholder="Item description"]', "Item 1");
  156 |     await page.fill('input[placeholder="Qty"]', "2");
  157 |     await page.fill('input[placeholder="Price"]', "50");
  158 | 
  159 |     await page.click("text=Add Line Item");
  160 |     await page.fill('input[placeholder="Item description"] >> nth=1', "Item 2");
  161 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  162 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  163 | 
  164 |     await page.click("text=Add Line Item");
  165 |     await page.fill('input[placeholder="Item description"] >> nth=2', "Item 3");
  166 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  167 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  168 | 
  169 |     await page.fill('input[placeholder="Tax rate"]', "10");
  170 |     await page.fill('textarea[placeholder="Notes"]', "E2E Test Invoice Notes");
  171 |     await page.click('button:has-text("Create")');
  172 | 
  173 |     // Verify it appears in table
  174 |     const totalCell = page.locator("text=$275.00");
  175 |     await expect(totalCell).toBeVisible();
  176 | 
  177 |     // Download PDF (intercept browser download event)
  178 |     const [download] = await Promise.all([
  179 |       page.waitForEvent("download"),
  180 |       page.click('button[title="Download PDF"] >> nth=0')
  181 |     ]);
  182 | 
  183 |     expect(download.suggestedFilename()).toContain(".pdf");
  184 |     const downloadPath = await download.path();
  185 |     const fileBytes = fs.readFileSync(downloadPath!);
  186 |     
  187 |     // Verify magic bytes %PDF
  188 |     const pdfMagicBytes = fileBytes.toString("utf8", 0, 4);
  189 |     expect(pdfMagicBytes).toBe("%PDF");
  190 |   });
  191 | 
  192 |   // Flow 3: Kanban Task Lifecycle
  193 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  194 |     await page.goto("/login");
  195 |     await submitLoginForm(page, adminEmail, adminPassword);
  196 | 
  197 |     // Create project
  198 |     await page.goto("/projects");
  199 |     await page.click("text=Create Project");
  200 |     await page.fill('input[placeholder="Project Name"]', "E2E Projects Space");
  201 |     await page.fill('textarea[placeholder="Description"]', "E2E Kanban Lifecycle testing space");
  202 |     await page.click("text=Create");
  203 | 
  204 |     // Add tasks
  205 |     await page.click("text=E2E Projects Space");
  206 |     
  207 |     // Add Task 1
  208 |     await page.click("text=Add Task");
  209 |     await page.fill('input[placeholder="Task Title"]', "Task high priority");
  210 |     await page.selectOption("select[name='priority']", "high");
  211 |     await page.click("text=Create");
  212 | 
  213 |     // Drag-and-drop simulation & verify persisting
  214 |     // (Playwright dragTo handles drag simulation)
  215 |     const taskCard = page.locator("text=Task high priority");
  216 |     const inProgressColumn = page.locator("text=In Progress");
  217 |     await taskCard.dragTo(inProgressColumn);
  218 | 
  219 |     await page.reload();
  220 |     await expect(page.locator('[data-status="in_progress"]')).toContainText("Task high priority");
  221 |   });
  222 | 
  223 |   // Flow 4: CRM Deal Pipeline
  224 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  225 |     await page.goto("/login");
  226 |     await submitLoginForm(page, adminEmail, adminPassword);
  227 | 
  228 |     await page.goto("/crm");
  229 |     // Add lead
> 230 |     await page.click("text=New Lead");
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  231 |     await page.fill('input[placeholder="Lead Title"]', "Enterprise Deal Lead");
  232 |     await page.fill('input[placeholder="Value"]', "25000");
  233 |     await page.click("text=Save");
  234 | 
  235 |     // Check pipeline dashboard update
  236 |     await page.goto("/dashboard");
  237 |     await expect(page.locator("text=$25,000")).toBeVisible();
  238 |   });
  239 | 
  240 |   // Flow 5: Org invite and membership
  241 |   test("Flow 5: Invite Members and Roles", async ({ page }) => {
  242 |     await page.goto("/login");
  243 |     await submitLoginForm(page, adminEmail, adminPassword);
  244 | 
  245 |     await page.goto("/settings");
  246 |     await page.click("text=Members");
  247 |     await page.click("text=Invite Member");
  248 |     await page.fill('input[placeholder="Email"]', "invitee_user@forgeflow.local");
  249 |     await page.click("text=Send Invitation");
  250 | 
  251 |     // Assert listed in pending
  252 |     await expect(page.locator("text=invitee_user@forgeflow.local")).toBeVisible();
  253 |   });
  254 | });
  255 | 
```