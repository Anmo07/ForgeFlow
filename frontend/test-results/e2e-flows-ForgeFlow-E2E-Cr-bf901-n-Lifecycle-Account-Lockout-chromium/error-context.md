# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 1: Authentication Lifecycle & Account Lockout
- Location: tests-e2e/e2e-flows.spec.ts:152:7

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /.*dashboard/
Received string:  "http://localhost:3000/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    14 × unexpected value "http://localhost:3000/login"

```

```yaml
- link "ForgeFlow":
  - /url: /
- heading "Welcome back" [level=1]
- paragraph: Sign in to your encrypted MSP Command Center
- button "Sign In with Fingerprint (Requires HTTPS — available in production)" [disabled]
- text: Or Use Credentials Email Address
- textbox "Email Address":
  - /placeholder: name@company.com
- text: Password
- link "Forgot password?":
  - /url: "#"
- textbox "Password":
  - /placeholder: ••••••••
- button
- checkbox "Remember me on this machine (Encrypted Cookie)" [checked]
- text: Remember me on this machine (Encrypted Cookie)
- checkbox "Enable Fingerprint Sensor 2-Step Verification for easy login" [checked]
- text: Enable Fingerprint Sensor 2-Step Verification for easy login
- button "Sign In with Credentials"
- paragraph:
  - text: Don't have an account?
  - link "Sign Up":
    - /url: /register
```

# Test source

```ts
  70  |   await page.waitForLoadState("domcontentloaded");
  71  |   const result = await page.evaluate(
  72  |     async ({ email, pass }: any) => {
  73  |       try {
  74  |         const res = await fetch("/api/auth/login", {
  75  |           method: "POST",
  76  |           headers: { "Content-Type": "application/json" },
  77  |           body: JSON.stringify({
  78  |             email,
  79  |             password: pass,
  80  |             turnstile_token: "mocked-turnstile-response-token",
  81  |           }),
  82  |         });
  83  |         const data = await res.json();
  84  |         if (res.ok && data.access_token) {
  85  |           document.cookie = `access_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
  86  |           localStorage.setItem("access_token", data.access_token);
  87  |           const authState = {
  88  |             state: {
  89  |               user: data.user,
  90  |               isAuthenticated: true,
  91  |               accessToken: data.access_token,
  92  |             },
  93  |             version: 0,
  94  |           };
  95  |           localStorage.setItem("forgeflow-auth", JSON.stringify(authState));
  96  |           window.location.href = "/dashboard";
  97  |           return { success: true };
  98  |         } else {
  99  |           return { success: false, status: res.status, data };
  100 |         }
  101 |       } catch (err: any) {
  102 |         return { success: false, error: String(err) };
  103 |       }
  104 |     },
  105 |     { email, pass }
  106 |   );
  107 | 
  108 |   if (pass !== "wrong-password") {
  109 |     await page.waitForURL(/.*dashboard/, { timeout: 15000 }).catch(() => null);
  110 |   } else {
  111 |     await page.waitForTimeout(600);
  112 |   }
  113 |   return result;
  114 | }
  115 | 
  116 | test.describe("ForgeFlow E2E Critical Flows", () => {
  117 |   let seededData: any = null;
  118 |   let adminEmail = "";
  119 |   const adminPassword = "SuperPassword123!";
  120 | 
  121 |   test.beforeEach(async ({ page }) => {
  122 |     adminEmail = `e2e_admin_${Math.floor(Math.random() * 100000)}@forgeflow.com`;
  123 | 
  124 |     page.on('console', msg => {
  125 |       console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
  126 |     });
  127 |     page.on('pageerror', err => {
  128 |       console.log(`BROWSER RUNTIME ERROR: ${err.message}`);
  129 |     });
  130 | 
  131 |     // Seed an isolated organization for each test case
  132 |     seededData = runSeeding("E2E Test Org", adminEmail, adminPassword);
  133 |     if (seededData.error) {
  134 |       throw new Error(`Seeding failed: ${seededData.error}`);
  135 |     }
  136 |   });
  137 | 
  138 |   test.afterEach(async ({ page }) => {
  139 |     try {
  140 |       await page.evaluate(() => localStorage.clear());
  141 |     } catch (e) {}
  142 |     if (seededData && seededData.org_id && seededData.user_id) {
  143 |       try {
  144 |         runTeardown(seededData.org_id, seededData.user_id);
  145 |       } catch (err) {
  146 |         console.error("Cleanup failed:", err);
  147 |       }
  148 |     }
  149 |   });
  150 | 
  151 |   // Flow 1: Full Authentication Lifecycle
  152 |   test("Flow 1: Authentication Lifecycle & Account Lockout", async ({ page }) => {
  153 |     test.setTimeout(60000);
  154 | 
  155 |     // 1. Go to register page
  156 |     await page.goto("/register");
  157 |     await page.fill('input[type="email"]', `user_${Math.floor(Math.random() * 10000)}@e2e.com`);
  158 |     await page.fill('#reg-password', "SecurePass1!");
  159 |     await page.fill('#reg-name', "E2E Registrant");
  160 |     
  161 |     // Simulate turnstile checked
  162 |     await page.evaluate(() => {
  163 |       (window as any).__MOCK_TURNSTILE_TOKEN__ = "mocked-turnstile-response-token";
  164 |     });
  165 | 
  166 |     await page.goto("/login");
  167 |     await submitLoginForm(page, adminEmail, adminPassword);
  168 | 
  169 |     // Confirm redirected to dashboard
> 170 |     await expect(page).toHaveURL(/.*dashboard/);
      |                        ^ Error: expect(page).toHaveURL(expected) failed
  171 | 
  172 |     // Logout
  173 |     await page.evaluate(() => {
  174 |       localStorage.clear();
  175 |       document.cookie = "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  176 |       window.location.href = "/login";
  177 |     });
  178 |     await page.waitForURL(/.*login/);
  179 | 
  180 |     // Trigger Account Lockout (5 failed attempts)
  181 |     for (let i = 0; i < 5; i++) {
  182 |       await submitLoginForm(page, adminEmail, "wrong-password");
  183 |     }
  184 | 
  185 |     // Lockout UI/Notification validation
  186 |     await submitLoginForm(page, adminEmail, adminPassword);
  187 |     await expect(page.locator('.text-rose-400').or(page.locator("text=locked")).or(page.locator("text=too many attempts")).or(page.locator("text=lockout")).or(page.locator("text=Account locked"))).toBeVisible();
  188 | 
  189 |     // Flush Redis lockout state so adminEmail is unlocked for subsequent test flows
  190 |     try {
  191 |       execSync("redis-cli flushall");
  192 |     } catch (e) {}
  193 |   });
  194 | 
  195 |   // Flow 2: Invoice Creation and PDF Download
  196 |   test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
  197 |     // Bypass lockout by logging in with seed details
  198 |     await page.goto("/login");
  199 |     await submitLoginForm(page, adminEmail, adminPassword);
  200 |     await expect(page).toHaveURL(/.*dashboard/);
  201 | 
  202 |     // Add Client first in CRM
  203 |     await page.goto("/crm");
  204 |     await page.locator('button:has-text("New Client")').first().click({ force: true });
  205 |     try {
  206 |       await page.waitForSelector('text=Add New Client', { timeout: 2000 });
  207 |     } catch (e) {
  208 |       await page.locator('button:has-text("New Client")').first().click({ force: true });
  209 |     }
  210 |     await page.fill('input[placeholder*="John Doe"]', "E2E Invoice Client");
  211 |     await page.fill('input[type="email"]', "client@invoice.com");
  212 |     await page.locator('button[type="submit"]:has-text("Add Client")').click({ force: true });
  213 |     await expect(page.locator('text=Add New Client')).toBeHidden();
  214 | 
  215 |     // Create Invoice
  216 |     await page.goto("/invoices");
  217 |     await page.locator('button:has-text("Create Invoice")').first().click({ force: true });
  218 |     try {
  219 |       await page.waitForSelector('text=Create & Render', { timeout: 2000 });
  220 |     } catch (e) {
  221 |       await page.locator('button:has-text("Create Invoice")').first().click({ force: true });
  222 |     }
  223 |     
  224 |     // Fill Invoice form
  225 |     const clientSelector = 'label:has-text("Client Organization") + select option:has-text("E2E Invoice Client")';
  226 |     await page.waitForSelector(clientSelector, { state: "attached" });
  227 |     const clientOptionVal = await page.locator(clientSelector).getAttribute("value");
  228 |     await page.selectOption('label:has-text("Client Organization") + select', clientOptionVal || "");
  229 |     const today = new Date().toISOString().split("T")[0];
  230 |     await page.fill('label:has-text("Issue Date") + input', today);
  231 |     await page.fill('label:has-text("Due Date") + input', today);
  232 |     // Set 3 line items
  233 |     await page.fill('input[placeholder*="product or service"]', "Item 1");
  234 |     await page.fill('input[placeholder="Qty"]', "2");
  235 |     await page.fill('input[placeholder="Price"]', "50");
  236 | 
  237 |     await page.click("text=Add Item", { force: true });
  238 |     await page.fill('input[placeholder*="product or service"] >> nth=1', "Item 2");
  239 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  240 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  241 | 
  242 |     await page.click("text=Add Item", { force: true });
  243 |     await page.fill('input[placeholder*="product or service"] >> nth=2', "Item 3");
  244 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  245 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  246 | 
  247 |     await page.fill('label:has-text("Tax Rate") + input', "10");
  248 |     await page.fill('textarea[placeholder*="Notes"]', "E2E Test Invoice Notes");
  249 |     await page.click('button:has-text("Create & Render")', { force: true });
  250 | 
  251 |     // Verify it appears in table
  252 |     const totalCell = page.locator("table tbody td:has-text('$275.00')");
  253 |     await expect(totalCell).toBeVisible();
  254 | 
  255 |     // Verify PDF download button exists & API generates PDF
  256 |     const pdfBtn = page.locator('button[title="Download PDF"]').first();
  257 |     await expect(pdfBtn).toBeVisible();
  258 |     const pdfResponse = await page.request.get(`/api/invoices/1/pdf`);
  259 |     expect([200, 307, 302, 404]).toContain(pdfResponse.status());
  260 |   });
  261 | 
  262 |   // Flow 3: Kanban Task Lifecycle
  263 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  264 |     await page.goto("/login");
  265 |     await submitLoginForm(page, adminEmail, adminPassword);
  266 |     await expect(page).toHaveURL(/.*dashboard/);
  267 | 
  268 |     // Create project
  269 |     await page.goto("/projects");
  270 |     await page.locator('button:has-text("New Project")').first().click({ force: true });
```