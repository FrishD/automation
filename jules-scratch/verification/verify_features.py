from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    page.wait_for_timeout(30000)

    page.goto("http://localhost:3000")

    # Click the history button to open the history panel
    page.click('button:has-text("history")')
    page.wait_for_selector('.bg-white.dark\\:bg-slate-800.border-l.border-border-light.dark\\:border-border-dark')
    page.click('button:has-text("close")')

    # Click the simulate button to open the simulator
    page.click('button:has-text("play_circle")')
    page.wait_for_selector('.sound-visualization')

    page.screenshot(path="jules-scratch/verification/verification.png")

    context.close()
    browser.close()

with sync_playwright() as playwright:
    run(playwright)
