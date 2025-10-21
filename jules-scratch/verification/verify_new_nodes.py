
from playwright.sync_api import sync_playwright, expect

def run_verification(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    page.goto("http://localhost:3000")

    page.wait_for_selector('.react-flow__node-start')

    node_types_to_add = [
        ('Variable', 100, 300),
        ('Wait', 300, 300),
        ('Play Audio', 500, 300),
        ('Loop', 700, 300),
        ('Confirmation', 900, 300),
        ('Summary', 1100, 300),
    ]

    for node_type, x, y in node_types_to_add:
        page.locator('.react-flow__pane').dispatch_event('contextmenu', {'button': 2, 'x': x, 'y': y})

        # Target the context menu specifically
        context_menu = page.locator('.z-30')
        context_menu.get_by_role("button", name=node_type, exact=True).click()

    page.screenshot(path="jules-scratch/verification/new_nodes_verification.png")

    browser.close()

with sync_playwright() as p:
    run_verification(p)
