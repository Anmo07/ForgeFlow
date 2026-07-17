# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flows.spec.ts >> ForgeFlow E2E Critical Flows >> Flow 5: Invite Members and Roles
- Location: tests-e2e/e2e-flows.spec.ts:248:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.goto: Test timeout of 30000ms exceeded.
Call log:
  - navigating to "http://localhost:3000/login", waiting until "load"

```

# Test source

```ts
  149 | 
  150 |     // Create Invoice
  151 |     await page.goto("/invoices");
  152 |     await page.click("text=Create Invoice");
  153 |     
  154 |     // Fill Invoice form
  155 |     await page.selectOption("select", { label: "E2E Invoice Client" });
  156 |     await page.fill('input[type="date"]', new Date().toISOString().split("T")[0]);
  157 |     // Set 3 line items
  158 |     await page.fill('input[placeholder="Item description"]', "Item 1");
  159 |     await page.fill('input[placeholder="Qty"]', "2");
  160 |     await page.fill('input[placeholder="Price"]', "50");
  161 | 
  162 |     await page.click("text=Add Line Item");
  163 |     await page.fill('input[placeholder="Item description"] >> nth=1', "Item 2");
  164 |     await page.fill('input[placeholder="Qty"] >> nth=1', "1");
  165 |     await page.fill('input[placeholder="Price"] >> nth=1', "100");
  166 | 
  167 |     await page.click("text=Add Line Item");
  168 |     await page.fill('input[placeholder="Item description"] >> nth=2', "Item 3");
  169 |     await page.fill('input[placeholder="Qty"] >> nth=2', "5");
  170 |     await page.fill('input[placeholder="Price"] >> nth=2', "10");
  171 | 
  172 |     await page.fill('input[placeholder="Tax rate"]', "10");
  173 |     await page.fill('textarea[placeholder="Notes"]', "E2E Test Invoice Notes");
  174 |     await page.click('button:has-text("Create")');
  175 | 
  176 |     // Verify it appears in table
  177 |     const totalCell = page.locator("text=$275.00");
  178 |     await expect(totalCell).toBeVisible();
  179 | 
  180 |     // Download PDF (intercept browser download event)
  181 |     const [download] = await Promise.all([
  182 |       page.waitForEvent("download"),
  183 |       page.click('button[title="Download PDF"] >> nth=0')
  184 |     ]);
  185 | 
  186 |     expect(download.suggestedFilename()).toContain(".pdf");
  187 |     const downloadPath = await download.path();
  188 |     const fileBytes = fs.readFileSync(downloadPath!);
  189 |     
  190 |     // Verify magic bytes %PDF
  191 |     const pdfMagicBytes = fileBytes.toString("utf8", 0, 4);
  192 |     expect(pdfMagicBytes).toBe("%PDF");
  193 |   });
  194 | 
  195 |   // Flow 3: Kanban Task Lifecycle
  196 |   test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
  197 |     await page.goto("/login");
  198 |     await page.fill('input[type="email"]', adminEmail);
  199 |     await page.fill('input[type="password"]', adminPassword);
  200 |     await page.click('button[type="submit"]');
  201 | 
  202 |     // Create project
  203 |     await page.goto("/projects");
  204 |     await page.click("text=Create Project");
  205 |     await page.fill('input[placeholder="Project Name"]', "E2E Projects Space");
  206 |     await page.fill('textarea[placeholder="Description"]', "E2E Kanban Lifecycle testing space");
  207 |     await page.click("text=Create");
  208 | 
  209 |     // Add tasks
  210 |     await page.click("text=E2E Projects Space");
  211 |     
  212 |     // Add Task 1
  213 |     await page.click("text=Add Task");
  214 |     await page.fill('input[placeholder="Task Title"]', "Task high priority");
  215 |     await page.selectOption("select[name='priority']", "high");
  216 |     await page.click("text=Create");
  217 | 
  218 |     // Drag-and-drop simulation & verify persisting
  219 |     // (Playwright dragTo handles drag simulation)
  220 |     const taskCard = page.locator("text=Task high priority");
  221 |     const inProgressColumn = page.locator("text=In Progress");
  222 |     await taskCard.dragTo(inProgressColumn);
  223 | 
  224 |     await page.reload();
  225 |     await expect(page.locator('[data-status="in_progress"]')).toContainText("Task high priority");
  226 |   });
  227 | 
  228 |   // Flow 4: CRM Deal Pipeline
  229 |   test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
  230 |     await page.goto("/login");
  231 |     await page.fill('input[type="email"]', adminEmail);
  232 |     await page.fill('input[type="password"]', adminPassword);
  233 |     await page.click('button[type="submit"]');
  234 | 
  235 |     await page.goto("/crm");
  236 |     // Add lead
  237 |     await page.click("text=New Lead");
  238 |     await page.fill('input[placeholder="Lead Title"]', "Enterprise Deal Lead");
  239 |     await page.fill('input[placeholder="Value"]', "25000");
  240 |     await page.click("text=Save");
  241 | 
  242 |     // Check pipeline dashboard update
  243 |     await page.goto("/dashboard");
  244 |     await expect(page.locator("text=$25,000")).toBeVisible();
  245 |   });
  246 | 
  247 |   // Flow 5: Org invite and membership
  248 |   test("Flow 5: Invite Members and Roles", async ({ page }) => {
> 249 |     await page.goto("/login");
      |                ^ Error: page.goto: Test timeout of 30000ms exceeded.
  250 |     await page.fill('input[type="email"]', adminEmail);
  251 |     await page.fill('input[type="password"]', adminPassword);
  252 |     await page.click('button[type="submit"]');
  253 | 
  254 |     await page.goto("/settings");
  255 |     await page.click("text=Members");
  256 |     await page.click("text=Invite Member");
  257 |     await page.fill('input[placeholder="Email"]', "invitee_user@forgeflow.local");
  258 |     await page.click("text=Send Invitation");
  259 | 
  260 |     // Assert listed in pending
  261 |     await expect(page.locator("text=invitee_user@forgeflow.local")).toBeVisible();
  262 |   });
  263 | });
  264 | 
```