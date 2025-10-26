from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000")

        page.wait_for_selector('[data-tour="canvas"]')

        settings_button = page.get_by_role("button", name="Settings")
        settings_button.click()

        # Wait for the modal title to be visible
        modal_title = page.locator('h2:has-text("Settings")')
        modal_title.wait_for()

        page.screenshot(path="jules-scratch/verification/settings_modal.png")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
