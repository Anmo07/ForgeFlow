# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 2: Invoice Creation & PDF Generation
- Location: tests-e2e/e2e-flows.spec.ts:138:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.selectOption: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('select')
    - locator resolved to 2 elements. Proceeding with the first one: <select class="bg-background/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary/50">…</select>
  - attempting select option action
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
    - waiting 20ms
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
      - waiting 100ms
    35 × waiting for element to be visible and enabled
       - did not find some options
     - retrying select option action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - banner [ref=e3]:
      - generic [ref=e5]: Invoices
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
          - button "E2E Test Org 5900" [expanded] [ref=e29]:
            - generic [ref=e30]: E2E Test Org 5900
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
            - generic [ref=e57]:
              - img [ref=e58]
              - generic [ref=e61]: Invoices
          - link "Org Settings" [ref=e62] [cursor=pointer]:
            - /url: /settings/members
            - generic [ref=e63]:
              - img [ref=e64]
              - generic [ref=e65]: Org Settings
        - generic [ref=e66]:
          - generic [ref=e67]:
            - generic [ref=e68]: T
            - generic [ref=e69]:
              - generic [ref=e70]: Test Admin
              - generic [ref=e71]: e2e_admin_96518@forgeflow.com
          - button "Sign Out" [ref=e72]:
            - img [ref=e73]
    - main [ref=e76]:
      - generic [ref=e78]:
        - generic [ref=e79]:
          - generic [ref=e80]:
            - heading "Billing & Invoices" [level=1] [ref=e81]
            - paragraph [ref=e83]: Issue, track and verify payments seamlessly.
          - button "Create Invoice" [active] [ref=e84]:
            - img [ref=e85]
            - text: Create Invoice
        - generic [ref=e86]:
          - generic [ref=e87]:
            - generic [ref=e88]:
              - generic [ref=e89]: Total Billed
              - img [ref=e90]
            - generic [ref=e92]: $0.00
            - paragraph [ref=e93]: Total billing value issued
          - generic [ref=e94]:
            - generic [ref=e95]:
              - generic [ref=e96]: Collected
              - img [ref=e97]
            - generic [ref=e100]: $0.00
            - paragraph [ref=e101]: Paid and settled invoices
          - generic [ref=e102]:
            - generic [ref=e103]:
              - generic [ref=e104]: Outstanding
              - img [ref=e105]
            - generic [ref=e108]: $0.00
            - paragraph [ref=e109]: Unpaid sent invoices
          - generic [ref=e110]:
            - generic [ref=e111]:
              - generic [ref=e112]: Overdue
              - img [ref=e113]
            - generic [ref=e115]: $0.00
            - paragraph [ref=e116]: Past due dates
        - generic [ref=e117]:
          - generic [ref=e118]:
            - img [ref=e119]
            - textbox "Search invoice number, client..." [ref=e122]
          - combobox [ref=e124]:
            - option "All Statuses" [selected]
            - option "Draft"
            - option "Sent"
            - option "Paid"
            - option "Overdue"
            - option "Cancelled"
        - table [ref=e127]:
          - rowgroup [ref=e128]:
            - row "Invoice ID Client Issue Date Due Date Amount Status Actions" [ref=e129]:
              - columnheader "Invoice ID" [ref=e130]
              - columnheader "Client" [ref=e131]
              - columnheader "Issue Date" [ref=e132]
              - columnheader "Due Date" [ref=e133]
              - columnheader "Amount" [ref=e134]
              - columnheader "Status" [ref=e135]
              - columnheader "Actions" [ref=e136]
          - rowgroup [ref=e137]:
            - row "No invoices matching your filter criteria." [ref=e138]:
              - cell "No invoices matching your filter criteria." [ref=e139]
        - generic [ref=e142]:
          - generic [ref=e143]:
            - heading "Create Customer Invoice" [level=2] [ref=e144]
            - button [ref=e145]:
              - img [ref=e146]
          - generic [ref=e149]:
            - generic [ref=e150]:
              - generic [ref=e151]:
                - text: Client Organization
                - combobox [ref=e152]:
                  - option "Direct Client (No organization link)" [selected]
              - generic [ref=e153]:
                - text: Tax Rate (%)
                - spinbutton [ref=e154]: "0"
            - generic [ref=e155]:
              - generic [ref=e156]:
                - text: Issue Date
                - textbox [ref=e157]
              - generic [ref=e158]:
                - text: Due Date
                - textbox [ref=e159]
            - generic [ref=e160]:
              - generic [ref=e161]:
                - heading "Line Items" [level=3] [ref=e162]
                - button "Add Item" [ref=e163]:
                  - img [ref=e164]
                  - text: Add Item
              - generic [ref=e166]:
                - textbox "Description of product or service..." [ref=e168]
                - spinbutton [ref=e170]: "1"
                - spinbutton [ref=e172]: "0"
                - button [disabled] [ref=e174]:
                  - img [ref=e175]
            - generic [ref=e178]:
              - generic [ref=e179]:
                - generic [ref=e180]: "Subtotal:"
                - generic [ref=e181]: $0.00
              - generic [ref=e182]:
                - generic [ref=e183]: "Tax (0%):"
                - generic [ref=e184]: $0.00
              - generic [ref=e185]:
                - generic [ref=e186]: "Grand Total:"
                - generic [ref=e187]: $0.00
            - generic [ref=e188]:
              - text: Notes / Invoice terms
              - textbox "Notes, terms, payment details..." [ref=e189]
            - generic [ref=e190]:
              - button "Cancel" [ref=e191]
              - button "Create & Render" [ref=e192]
  - button "Open Next.js Dev Tools" [ref=e198] [cursor=pointer]:
    - img [ref=e199]
  - alert [ref=e202]: Billing & Invoices
  - generic [ref=e203]:
    - img [ref=e205]
    - button "Open Tanstack query devtools" [ref=e253] [cursor=pointer]:
      - img [ref=e254]
```

# Test source

```ts
  59  |   );
  60  | }
  61  | 
  62  | async function submitLoginForm(page: any, email: string, pass: string) {
  63  |   await page.waitForSelector("form");
  64  |   await page.evaluate(() => {
  65  |     (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  66  |   });
  67  |   await page.fill('input[type="email"]', email);
  68  |   await page.fill('input[type="password"]', pass);
  69  |   await page.click('button[type="submit"]');
  70  | }
  71  | 
  72  | test.describe("ForgeFlow E2E Critical Flows", () => {
  73  |   let seededData: any = null;
  74  |   const adminEmail = `e2e_admin_${Math.floor(Math.random() * 100000)}@forgeflow.com`;
  75  |   const adminPassword = "SuperPassword123!";
  76  | 
  77  |   test.beforeEach(async ({ page }) => {
  78  |     page.on('console', msg => {
  79  |       console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  80  |     });
  81  |     page.on('pageerror', err => {
  82  |       console.log(`BROWSER RUNTIME ERROR: ${err.message}`);
  83  |     });
  84  | 
  85  |     // Seed an isolated organization for each test case
  86  |     seededData = runSeeding("E2E Test Org", adminEmail, adminPassword);
  87  |     if (seededData.error) {
  88  |       throw new Error(`Seeding failed: ${seededData.error}`);
  89  |     }
  90  |   });
  91  | 
  92  |   test.afterEach(() => {
  93  |     if (seededData && seededData.org_id && seededData.user_id) {
  94  |       try {
  95  |         runTeardown(seededData.org_id, seededData.user_id);
  96  |       } catch (err) {
  97  |         console.error("Cleanup failed:", err);
  98  |       }
  99  |     }
  100 |   });
  101 | 
  102 |   // Flow 1: Full Authentication Lifecycle
  103 |   test("Flow 1: Authentication Lifecycle & Account Lockout", async ({ page }) => {
  104 |     // 1. Go to register page
  105 |     await page.goto("/register");
  106 |     await page.fill('input[type="email"]', `user_${Math.floor(Math.random() * 10000)}@e2e.com`);
  107 |     await page.fill('#reg-password', "SecurePass1!");
  108 |     await page.fill('#reg-name', "E2E Registrant");
  109 |     
  110 |     // Simulate turnstile checked
  111 |     await page.evaluate(() => {
  112 |       (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  113 |     });
  114 | 
  115 |     // We skip actual email verify/MFA TOTP code extraction in client E2E if mock authentication modes are toggled,
  116 |     // but we simulate the authentication flow steps.
  117 |     await page.goto("/login");
  118 |     await submitLoginForm(page, adminEmail, adminPassword);
  119 | 
  120 |     // Confirm redirected to dashboard
  121 |     await expect(page).toHaveURL(/.*dashboard/);
  122 | 
  123 |     // Logout
  124 |     await page.click('button[title="Sign Out"]');
  125 |     await expect(page).toHaveURL(/.*(login|\/)$/);
  126 | 
  127 |     // Trigger Account Lockout (5 failed attempts)
  128 |     for (let i = 0; i < 5; i++) {
  129 |       await submitLoginForm(page, adminEmail, "wrong-password");
  130 |     }
  131 | 
  132 |     // Lockout UI/Notification validation
  133 |     await submitLoginForm(page, adminEmail, adminPassword);
  134 |     await expect(page.locator("text=locked").or(page.locator("text=too many attempts")).or(page.locator("text=lockout"))).toBeVisible();
  135 |   });
  136 | 
  137 |   // Flow 2: Invoice Creation and PDF Download
  138 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  139 |     // Bypass lockout by logging in with seed details
  140 |     await page.goto("/login");
  141 |     await submitLoginForm(page, adminEmail, adminPassword);
  142 |     await expect(page).toHaveURL(/.*dashboard/);
  143 | 
  144 |     // Navigate to Invoices
  145 |     await page.goto("/invoices");
  146 | 
  147 |     // Add Client first
  148 |     await page.goto("/crm");
  149 |     await page.click("text=New Client");
  150 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  151 |     await page.fill('input[type="email"]', "client@invoice.com");
  152 |     await page.click("text=Add Client");
  153 | 
  154 |     // Create Invoice
  155 |     await page.goto("/invoices");
  156 |     await page.click("text=Create Invoice");
  157 |     
  158 |     // Fill Invoice form
> 159 |     await page.selectOption("select", { label: "E2E Invoice Client" });
      |                ^ Error: page.selectOption: Test timeout of 30000ms exceeded.
  160 |     await page.fill('input[type="date"]', new Date().toISOString().split("T")[0]);
  161 |     // Set 3 line items
  162 |     await page.fill('input[placeholder="Item description"]', "Item 1");
  163 |     await page.fill('input[placeholder="Qty"]', "2");
  164 |     await page.fill('input[placeholder="Price"]', "50");
  165 | 
  166 |     await page.click("text=Add Line Item");
  167 |     await page.fill('input[placeholder="Item description"] >> nth=1', "Item 2");
  168 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  169 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  170 | 
  171 |     await page.click("text=Add Line Item");
  172 |     await page.fill('input[placeholder="Item description"] >> nth=2', "Item 3");
  173 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  174 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  175 | 
  176 |     await page.fill('input[placeholder="Tax rate"]', "10");
  177 |     await page.fill('textarea[placeholder="Notes"]', "E2E Test Invoice Notes");
  178 |     await page.click('button:has-text("Create & Render")');
  179 | 
  180 |     // Verify it appears in table
  181 |     const totalCell = page.locator("text=$275.00");
  182 |     await expect(totalCell).toBeVisible();
  183 | 
  184 |     // Download PDF (intercept browser download event)
  185 |     const [download] = await Promise.all([
  186 |       page.waitForEvent("download"),
  187 |       page.click('button[title="Download PDF"] >> nth=0')
  188 |     ]);
  189 | 
  190 |     expect(download.suggestedFilename()).toContain(".pdf");
  191 |     const downloadPath = await download.path();
  192 |     const fileBytes = fs.readFileSync(downloadPath!);
  193 |     
  194 |     // Verify magic bytes %PDF
  195 |     const pdfMagicBytes = fileBytes.toString("utf8", 0, 4);
  196 |     expect(pdfMagicBytes).toBe("%PDF");
  197 |   });
  198 | 
  199 |   // Flow 3: Kanban Task Lifecycle
  200 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  201 |     await page.goto("/login");
  202 |     await submitLoginForm(page, adminEmail, adminPassword);
  203 |     await expect(page).toHaveURL(/.*dashboard/);
  204 | 
  205 |     // Create project
  206 |     await page.goto("/projects");
  207 |     await page.click("text=New Project");
  208 |     await page.fill('input[placeholder="Project Name"]', "E2E Projects Space");
  209 |     await page.fill('textarea[placeholder="Description"]', "E2E Kanban Lifecycle testing space");
  210 |     await page.click("text=Create Project");
  211 | 
  212 |     // Add tasks
  213 |     await page.click("text=E2E Projects Space");
  214 |     
  215 |     // Add Task 1
  216 |     await page.click("text=Add Task");
  217 |     await page.fill('input[placeholder="Task Title"]', "Task high priority");
  218 |     await page.selectOption("select[name='priority']", "high");
  219 |     await page.click("text=Create Task");
  220 | 
  221 |     // Drag-and-drop simulation & verify persisting
  222 |     // (Playwright dragTo handles drag simulation)
  223 |     const taskCard = page.locator("text=Task high priority");
  224 |     const inProgressColumn = page.locator("text=In Progress");
  225 |     await taskCard.dragTo(inProgressColumn);
  226 | 
  227 |     await page.reload();
  228 |     await expect(page.locator('[data-status="in_progress"]')).toContainText("Task high priority");
  229 |   });
  230 | 
  231 |   // Flow 4: CRM Deal Pipeline
  232 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  233 |     await page.goto("/login");
  234 |     await submitLoginForm(page, adminEmail, adminPassword);
  235 |     await expect(page).toHaveURL(/.*dashboard/);
  236 | 
  237 |     await page.goto("/crm");
  238 |     // Add Client first (required for Lead)
  239 |     await page.click("text=New Client");
  240 |     await page.fill('input[placeholder*="John Doe"]', "E2E Lead Client");
  241 |     await page.fill('input[type="email"]', "lead_client@invoice.com");
  242 |     await page.click("text=Add Client");
  243 | 
  244 |     // Add lead
  245 |     await page.click("text=New Lead");
  246 |     await page.selectOption('select[required]', { label: "E2E Lead Client" });
  247 |     await page.fill('input[placeholder*="5000"]', "25000");
  248 |     await page.click("text=Add Lead");
  249 | 
  250 |     // Check pipeline dashboard update
  251 |     await page.goto("/dashboard");
  252 |     await expect(page.locator("text=$25,000")).toBeVisible();
  253 |   });
  254 | 
  255 |   // Flow 5: Org invite and membership
  256 |   test("Flow 5: Invite Members and Roles", async ({ page }) => {
  257 |     await page.goto("/login");
  258 |     await submitLoginForm(page, adminEmail, adminPassword);
  259 |     await expect(page).toHaveURL(/.*dashboard/);
```