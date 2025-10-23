import time
from playwright.sync_api import Playwright, sync_playwright

def run(playwright: Playwright) -> None:
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.goto("http://localhost:3000")

    print("Waiting for page to load...")
    page.wait_for_selector('.react-flow__pane', timeout=60000)
    print("Page loaded.")
    time.sleep(2)

    # 1. Test History Panel
    print("Testing History Panel...")
    page.click('button:has(span:has-text("history"))')
    time.sleep(2)
    page.screenshot(path="jules-scratch/verification/history_panel.png")
    print("History panel screenshot taken.")
    page.click('div:has(h2:has-text("Version History")) button:has(span:has-text("close"))')
    time.sleep(1)
    print("History panel closed.")

    # 2. Test Simulator Panel
    print("Testing Simulator Panel...")
    page.click('button:has(span:has-text("play_circle"))')
    time.sleep(2)
    page.screenshot(path="jules-scratch/verification/simulator_panel.png")
    print("Simulator panel screenshot taken.")
    page.click('div:has(h2:has-text("Simulator")) button:has(span:has-text("close"))')
    time.sleep(1)
    print("Simulator panel closed.")

    browser.close()
    print("Verification script finished successfully.")

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
