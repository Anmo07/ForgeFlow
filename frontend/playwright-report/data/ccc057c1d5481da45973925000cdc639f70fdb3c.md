# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 1: Authentication Lifecycle & Account Lockout
- Location: tests-e2e/e2e-flows.spec.ts:96:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button[title="Sign Out"]')

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
```

# Test source

```ts
  17  |           value = value.substring(1, value.length - 1);
  18  |         }
  19  |         if (value.length > 0 && value.startsWith("'") && value.endsWith("'")) {
  20  |           value = value.substring(1, value.length - 1);
  21  |         }
  22  |         envVars[key] = value;
  23  |       }
  24  |     });
  25  |   }
  26  |   return envVars;
  27  | }
  28  | 
  29  | // Helper to run backend seeding/teardown commands
  30  | function runSeeding(orgName: string, email: string, pass: string) {
  31  |   const pythonPath = path.resolve(__dirname, "../../backend/.venv/bin/python");
  32  |   const scriptPath = path.resolve(__dirname, "../../backend/scripts/seed_test_org.py");
  33  |   const backendPath = path.resolve(__dirname, "../../backend");
  34  |   const result = execSync(
  35  |     `"${pythonPath}" "${scriptPath}" "${orgName}" "${email}" "${pass}"`,
  36  |     { encoding: "utf8", env: getEnvFromRoot(), cwd: backendPath }
  37  |   );
  38  |   const lines = result.split("\n");
  39  |   for (const line of lines) {
  40  |     const trimmed = line.trim();
  41  |     if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
  42  |       try {
  43  |         return JSON.parse(trimmed);
  44  |       } catch (e) {
  45  |         // ignore and continue
  46  |       }
  47  |     }
  48  |   }
  49  |   throw new Error(`Failed to find JSON output in seeding result: ${result}`);
  50  | }
  51  | 
  52  | function runTeardown(orgId: number, userId: number) {
  53  |   const pythonPath = path.resolve(__dirname, "../../backend/.venv/bin/python");
  54  |   const scriptPath = path.resolve(__dirname, "../../backend/scripts/teardown_test_org.py");
  55  |   const backendPath = path.resolve(__dirname, "../../backend");
  56  |   execSync(
  57  |     `"${pythonPath}" "${scriptPath}" ${orgId} ${userId}`,
  58  |     { env: getEnvFromRoot(), cwd: backendPath }
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
  77  |   test.beforeEach(() => {
  78  |     // Seed an isolated organization for each test case
  79  |     seededData = runSeeding("E2E Test Org", adminEmail, adminPassword);
  80  |     if (seededData.error) {
  81  |       throw new Error(`Seeding failed: ${seededData.error}`);
  82  |     }
  83  |   });
  84  | 
  85  |   test.afterEach(() => {
  86  |     if (seededData && seededData.org_id && seededData.user_id) {
  87  |       try {
  88  |         runTeardown(seededData.org_id, seededData.user_id);
  89  |       } catch (err) {
  90  |         console.error("Cleanup failed:", err);
  91  |       }
  92  |     }
  93  |   });
  94  | 
  95  |   // Flow 1: Full Authentication Lifecycle
  96  |   test("Flow 1: Authentication Lifecycle & Account Lockout", async ({ page }) => {
  97  |     // 1. Go to register page
  98  |     await page.goto("/register");
  99  |     await page.fill('input[type="email"]', `user_${Math.floor(Math.random() * 10000)}@e2e.com`);
  100 |     await page.fill('#reg-password', "SecurePass1!");
  101 |     await page.fill('#reg-name', "E2E Registrant");
  102 |     
  103 |     // Simulate turnstile checked
  104 |     await page.evaluate(() => {
  105 |       (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  106 |     });
  107 | 
  108 |     // We skip actual email verify/MFA TOTP code extraction in client E2E if mock authentication modes are toggled,
  109 |     // but we simulate the authentication flow steps.
  110 |     await page.goto("/login");
  111 |     await submitLoginForm(page, adminEmail, adminPassword);
  112 | 
  113 |     // Confirm redirected to dashboard
  114 |     await expect(page).toHaveURL(/.*dashboard/);
  115 | 
  116 |     // Logout
> 117 |     await page.click('button[title="Sign Out"]');
      |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  118 |     await expect(page).toHaveURL(/.*login/);
  119 | 
  120 |     // Trigger Account Lockout (5 failed attempts)
  121 |     for (let i = 0; i < 5; i++) {
  122 |       await submitLoginForm(page, adminEmail, "wrong-password");
  123 |     }
  124 | 
  125 |     // Lockout UI/Notification validation
  126 |     await submitLoginForm(page, adminEmail, adminPassword);
  127 |     await expect(page.locator("text=locked").or(page.locator("text=too many attempts")).or(page.locator("text=lockout"))).toBeVisible();
  128 |   });
  129 | 
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
  143 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  144 |     await page.fill('input[type="email"]', "client@invoice.com");
  145 |     await page.click("text=Add Client");
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
  171 |     await page.click('button:has-text("Create & Render")');
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
  196 |     await expect(page).toHaveURL(/.*dashboard/);
  197 | 
  198 |     // Create project
  199 |     await page.goto("/projects");
  200 |     await page.click("text=New Project");
  201 |     await page.fill('input[placeholder="Project Name"]', "E2E Projects Space");
  202 |     await page.fill('textarea[placeholder="Description"]', "E2E Kanban Lifecycle testing space");
  203 |     await page.click("text=Create Project");
  204 | 
  205 |     // Add tasks
  206 |     await page.click("text=E2E Projects Space");
  207 |     
  208 |     // Add Task 1
  209 |     await page.click("text=Add Task");
  210 |     await page.fill('input[placeholder="Task Title"]', "Task high priority");
  211 |     await page.selectOption("select[name='priority']", "high");
  212 |     await page.click("text=Create Task");
  213 | 
  214 |     // Drag-and-drop simulation & verify persisting
  215 |     // (Playwright dragTo handles drag simulation)
  216 |     const taskCard = page.locator("text=Task high priority");
  217 |     const inProgressColumn = page.locator("text=In Progress");
```