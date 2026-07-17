import { test, expect } from "@playwright/test";
import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

function getEnvFromRoot() {
  const envPath = path.resolve(__dirname, "../../.env");
  const envVars: Record<string, string> = { ...process.env };
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    content.split("\n").forEach(line => {
      const match = line.trim().match(/^([\w.\-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || "";
        if (value.length > 0 && value.startsWith('"') && value.endsWith('"')) {
          value = value.substring(1, value.length - 1);
        }
        if (value.length > 0 && value.startsWith("'") && value.endsWith("'")) {
          value = value.substring(1, value.length - 1);
        }
        envVars[key] = value;
      }
    });
  }
  return envVars;
}

// Helper to run backend seeding/teardown commands
function runSeeding(orgName: string, email: string, pass: string) {
  const pythonPath = path.resolve(__dirname, "../../backend/.venv/bin/python");
  const scriptPath = path.resolve(__dirname, "../../backend/scripts/seed_test_org.py");
  const backendPath = path.resolve(__dirname, "../../backend");
  const result = execSync(
    `"${pythonPath}" "${scriptPath}" "${orgName}" "${email}" "${pass}"`,
    { encoding: "utf8", env: getEnvFromRoot(), cwd: backendPath }
  );
  const lines = result.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        return JSON.parse(trimmed);
      } catch (e) {
        // ignore and continue
      }
    }
  }
  throw new Error(`Failed to find JSON output in seeding result: ${result}`);
}

function runTeardown(orgId: number, userId: number) {
  const pythonPath = path.resolve(__dirname, "../../backend/.venv/bin/python");
  const scriptPath = path.resolve(__dirname, "../../backend/scripts/teardown_test_org.py");
  const backendPath = path.resolve(__dirname, "../../backend");
  execSync(
    `"${pythonPath}" "${scriptPath}" ${orgId} ${userId}`,
    { env: getEnvFromRoot(), cwd: backendPath }
  );
}

test.describe("ForgeFlow E2E Critical Flows", () => {
  let seededData: any = null;
  const adminEmail = `e2e_admin_${Math.floor(Math.random() * 100000)}@forgeflow.local`;
  const adminPassword = "SuperPassword123!";

  test.beforeEach(() => {
    // Seed an isolated organization for each test case
    seededData = runSeeding("E2E Test Org", adminEmail, adminPassword);
    if (seededData.error) {
      throw new Error(`Seeding failed: ${seededData.error}`);
    }
  });

  test.afterEach(() => {
    if (seededData && seededData.org_id && seededData.user_id) {
      try {
        runTeardown(seededData.org_id, seededData.user_id);
      } catch (err) {
        console.error("Cleanup failed:", err);
      }
    }
  });

  // Flow 1: Full Authentication Lifecycle
  test("Flow 1: Authentication Lifecycle & Account Lockout", async ({ page }) => {
    // 1. Go to register page
    await page.goto("/register");
    await page.fill('input[type="email"]', `user_${Math.floor(Math.random() * 10000)}@e2e.local`);
    await page.fill('input[placeholder*="Password"]', "SecurePass1!");
    await page.fill('input[placeholder*="Full Name"]', "E2E Registrant");
    
    // Simulate turnstile checked
    await page.evaluate(() => {
      // Mock turnstile token insertion if present
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = "cf-turnstile-response";
      input.value = "mocked-turnstile-response-token";
      document.querySelector("form")?.appendChild(input);
    });

    // We skip actual email verify/MFA TOTP code extraction in client E2E if mock authentication modes are toggled,
    // but we simulate the authentication flow steps.
    await page.goto("/login");
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');

    // Confirm redirected to dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Logout
    await page.click('button[title="Sign Out"]');
    await expect(page).toHaveURL(/.*login/);

    // Trigger Account Lockout (5 failed attempts)
    for (let i = 0; i < 5; i++) {
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', "wrong-password");
      await page.click('button[type="submit"]');
    }

    // Lockout UI/Notification validation
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await expect(page.locator("text=locked").or(page.locator("text=too many attempts")).or(page.locator("text=lockout"))).toBeVisible();
  });

  // Flow 2: Invoice Creation and PDF Download
  test("Flow 2: Invoice Creation & PDF Generation", async ({ page }) => {
    // Bypass lockout by logging in with seed details
    await page.goto("/login");
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to Invoices
    await page.goto("/invoices");

    // Add Client first
    await page.goto("/crm");
    await page.click("text=New Client");
    await page.fill('input[placeholder*="Client Name"]', "E2E Invoice Client");
    await page.fill('input[type="email"]', "client@invoice.local");
    await page.click("text=Save");

    // Create Invoice
    await page.goto("/invoices");
    await page.click("text=Create Invoice");
    
    // Fill Invoice form
    await page.selectOption("select", { label: "E2E Invoice Client" });
    await page.fill('input[type="date"]', new Date().toISOString().split("T")[0]);
    // Set 3 line items
    await page.fill('input[placeholder="Item description"]', "Item 1");
    await page.fill('input[placeholder="Qty"]', "2");
    await page.fill('input[placeholder="Price"]', "50");

    await page.click("text=Add Line Item");
    await page.fill('input[placeholder="Item description"] >> nth=1', "Item 2");
    await page.fill('input[placeholder="Qty"] >> nth=1', "1");
    await page.fill('input[placeholder="Price"] >> nth=1', "100");

    await page.click("text=Add Line Item");
    await page.fill('input[placeholder="Item description"] >> nth=2', "Item 3");
    await page.fill('input[placeholder="Qty"] >> nth=2', "5");
    await page.fill('input[placeholder="Price"] >> nth=2', "10");

    await page.fill('input[placeholder="Tax rate"]', "10");
    await page.fill('textarea[placeholder="Notes"]', "E2E Test Invoice Notes");
    await page.click('button:has-text("Create")');

    // Verify it appears in table
    const totalCell = page.locator("text=$275.00");
    await expect(totalCell).toBeVisible();

    // Download PDF (intercept browser download event)
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click('button[title="Download PDF"] >> nth=0')
    ]);

    expect(download.suggestedFilename()).toContain(".pdf");
    const downloadPath = await download.path();
    const fileBytes = fs.readFileSync(downloadPath!);
    
    // Verify magic bytes %PDF
    const pdfMagicBytes = fileBytes.toString("utf8", 0, 4);
    expect(pdfMagicBytes).toBe("%PDF");
  });

  // Flow 3: Kanban Task Lifecycle
  test("Flow 3: Kanban Projects and Tasks", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');

    // Create project
    await page.goto("/projects");
    await page.click("text=Create Project");
    await page.fill('input[placeholder="Project Name"]', "E2E Projects Space");
    await page.fill('textarea[placeholder="Description"]', "E2E Kanban Lifecycle testing space");
    await page.click("text=Create");

    // Add tasks
    await page.click("text=E2E Projects Space");
    
    // Add Task 1
    await page.click("text=Add Task");
    await page.fill('input[placeholder="Task Title"]', "Task high priority");
    await page.selectOption("select[name='priority']", "high");
    await page.click("text=Create");

    // Drag-and-drop simulation & verify persisting
    // (Playwright dragTo handles drag simulation)
    const taskCard = page.locator("text=Task high priority");
    const inProgressColumn = page.locator("text=In Progress");
    await taskCard.dragTo(inProgressColumn);

    await page.reload();
    await expect(page.locator('[data-status="in_progress"]')).toContainText("Task high priority");
  });

  // Flow 4: CRM Deal Pipeline
  test("Flow 4: CRM Leads & Deals pipeline", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');

    await page.goto("/crm");
    // Add lead
    await page.click("text=New Lead");
    await page.fill('input[placeholder="Lead Title"]', "Enterprise Deal Lead");
    await page.fill('input[placeholder="Value"]', "25000");
    await page.click("text=Save");

    // Check pipeline dashboard update
    await page.goto("/dashboard");
    await expect(page.locator("text=$25,000")).toBeVisible();
  });

  // Flow 5: Org invite and membership
  test("Flow 5: Invite Members and Roles", async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[type="email"]', adminEmail);
    await page.fill('input[type="password"]', adminPassword);
    await page.click('button[type="submit"]');

    await page.goto("/settings");
    await page.click("text=Members");
    await page.click("text=Invite Member");
    await page.fill('input[placeholder="Email"]', "invitee_user@forgeflow.local");
    await page.click("text=Send Invitation");

    // Assert listed in pending
    await expect(page.locator("text=invitee_user@forgeflow.local")).toBeVisible();
  });
});
