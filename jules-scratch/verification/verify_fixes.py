
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000")

    # Give the app time to load
    page.wait_for_selector('.react-flow__node')

    # Get the initial number of nodes
    initial_nodes = page.locator('.react-flow__node').count()

    # 1. Right-click on a node to open the context menu
    node = page.locator('.react-flow__node').first
    node.click(button='right')
    page.screenshot(path="jules-scratch/verification/01_context_menu_on_node.png")

    # 2. Click the "Delete" button
    delete_button = page.get_by_text("Delete")
    expect(delete_button).to_be_visible()
    delete_button.click()
    page.screenshot(path="jules-scratch/verification/02_node_deleted.png")

    # 3. Verify the node was deleted
    expect(page.locator('.react-flow__node')).to_have_count(initial_nodes - 1)

    # 4. Trigger notification
    page.get_by_text("Save").click()
    notification = page.locator('.notification')
    page.screenshot(path="jules-scratch/verification/03_notification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
