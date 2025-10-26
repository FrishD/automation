from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000")

        # Wait for the main canvas to be ready
        canvas = page.locator('[data-tour="canvas"]')
        canvas.wait_for()

        # Drag the Google Calendar node to the canvas
        calendar_node_in_palette = page.get_by_text("Google Calendar")
        canvas_bounds = canvas.bounding_box()

        # Drag and drop
        calendar_node_in_palette.drag_to(
            page.locator('div[data-tour="canvas"]'),
            target_position={'x': canvas_bounds['width'] / 2, 'y': canvas_bounds['height'] / 2}
        )

        # Wait for the node to appear on the canvas
        page.wait_for_selector("text=Google Calendar")

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/calendar_node.png")

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
