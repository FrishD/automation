from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000")

        # Wait for the main canvas to be ready
        page.wait_for_selector('[data-tour="canvas"]')

        # Take a screenshot of the main application screen
        page.screenshot(path="jules-scratch/verification/main_app.png")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
