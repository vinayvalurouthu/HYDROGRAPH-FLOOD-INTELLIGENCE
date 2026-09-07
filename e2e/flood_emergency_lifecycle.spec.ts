import { test, expect } from "@playwright/test";

test.describe("Phase 4: Disaster Management Lifecycle End-to-End Test Suite", () => {
  test("Complete Flood Emergency Mission Lifecycle: Citizen SOS -> Operator Dispatch -> Rescue Execution", async ({
    browser,
  }) => {
    // ─── STEP 1: CITIZEN SOS TRIGGER & OFFLINE MESH RELAY ────────────────────
    const citizenContext = await browser.newContext();
    const citizenPage = await citizenContext.newPage();

    // 1. Navigate to login and authenticate as Citizen
    await citizenPage.goto("/login");
    await citizenPage.click("button:has-text('LOGIN AS CITIZEN')");
    await citizenPage.click("button:has-text('AUTHENTICATE & ENTER PORTAL')");

    // Assert Citizen Portal renders
    await expect(citizenPage.locator("h1")).toContainText(/CITIZEN EMERGENCY PORTAL/i);

    // 2. Configure Triage details & transmit SOS
    const transmitSosBtn = citizenPage.locator("button:has-text('TRANSMIT SOS')");
    await expect(transmitSosBtn).toBeVisible();
    await transmitSosBtn.click();

    // Wait for active ticket to be generated and displayed
    const activeTicketBadge = citizenPage.locator("text=ACTIVE TICKET ID").locator("..").locator("span").nth(1);
    await expect(activeTicketBadge).toBeVisible();
    const ticketId = (await activeTicketBadge.textContent())?.trim() || "#10284";
    console.log(`[E2E] Generated Citizen SOS Incident Ticket ID: ${ticketId}`);

    // 3. Disconnect network -> Offline Mesh Relay Simulation
    await citizenContext.setOffline(true);

    // Verify offline status updates to OFFLINE MESH RELAY and QR code renders
    await expect(citizenPage.locator("text=OFFLINE MESH STANDBY")).toBeVisible();
    await expect(citizenPage.locator("text=SCAN FOR RESCUE BOAT INFRASTRUCTURE")).toBeVisible();

    // 4. Reconnect network -> Verify auto-sync confirmation
    await citizenContext.setOffline(false);
    await expect(citizenPage.locator("text=REAL-TIME SYNC")).toBeVisible();


    // ─── STEP 2: OPERATOR COMMAND & DISPATCH ──────────────────────────────────
    const operatorContext = await browser.newContext();
    const operatorPage = await operatorContext.newPage();

    // 1. Login as Operator
    await operatorPage.goto("/login");
    await operatorPage.click("button:has-text('LOGIN AS OPERATOR')");
    await operatorPage.click("button:has-text('AUTHENTICATE & ENTER PORTAL')");

    // Assert Operator Command Base renders
    await expect(operatorPage.locator("text=FLOOD INTELLIGENCE")).toBeVisible();

    // 2. Navigate to SOS Triage View
    const sosNavButton = operatorPage.locator("button[title='SOS Triage']");
    await sosNavButton.click();

    // 3. Assert incident feed is visible
    await expect(operatorPage.locator("text=SOS DISPATCH")).toBeVisible();
    
    // Mark verified first if button present
    const markVerifiedBtn = operatorPage.locator("button:has-text('MARK VERIFIED')");
    if (await markVerifiedBtn.isVisible()) {
      await markVerifiedBtn.click();
    }

    // Click EXECUTE DISPATCH allocating Rescue Team R-07
    const executeDispatchBtn = operatorPage.locator("button:has-text('EXECUTE DISPATCH')");
    await expect(executeDispatchBtn).toBeVisible();
    await executeDispatchBtn.click();

    // Verify mission status transitions
    await expect(operatorPage.locator("text=DISPATCH EXECUTED")).toBeVisible();


    // ─── STEP 3: FIELD RESPONDER EXECUTION ─────────────────────────────────────
    const rescuerContext = await browser.newContext();
    const rescuerPage = await rescuerContext.newPage();

    // 1. Login as Rescuer
    await rescuerPage.goto("/login");
    await rescuerPage.click("button:has-text('LOGIN AS RESCUE')");
    await rescuerPage.click("button:has-text('AUTHENTICATE & ENTER PORTAL')");

    // Assert Rescue Field Console renders
    await expect(rescuerPage.locator("text=ACTIVE MISSION TARGET")).toBeVisible();
    await expect(rescuerPage.locator("text=TEAM ALLOCATION HUD")).toBeVisible();

    // 2. Step through mission status progression buttons sequentially: EN ROUTE -> ON SCENE -> RESCUED -> CLOSED
    const enRouteBtn = rescuerPage.locator("button:has-text('EN ROUTE TO VICTIM')");
    if (await enRouteBtn.isVisible()) await enRouteBtn.click();

    const onSceneBtn = rescuerPage.locator("button:has-text('ON SCENE AT LANDMARK')");
    if (await onSceneBtn.isVisible()) await onSceneBtn.click();

    const rescuedBtn = rescuerPage.locator("button:has-text('VICTIMS RESCUED & ABOARD')");
    if (await rescuedBtn.isVisible()) await rescuedBtn.click();

    const closeMissionBtn = rescuerPage.locator("button:has-text('EN ROUTE TO SHELTER (COMPLETE)')");
    if (await closeMissionBtn.isVisible()) await closeMissionBtn.click();

    // 4. Verify Operator Console reflects status update
    await operatorPage.bringToFront();
    await expect(operatorPage.locator("text=CLOSED").first()).toBeVisible();

    // Clean up contexts
    await citizenContext.close();
    await operatorContext.close();
    await rescuerContext.close();
  });
});
