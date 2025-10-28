from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.goto("http://localhost:3000")

    # Wait for the sidebar to be visible
    expect(page.locator('[data-testid="dnd-node-google_calendar"]')).to_be_visible()

    # Drag and drop a Google Calendar node
    page.drag_and_drop('[data-testid="dnd-node-google_calendar"]', 'div.react-flow__pane')

    # Wait for the node to appear and check for the language dropdown
    expect(page.locator('div[data-type="google_calendar"] select')).to_be_visible()

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
