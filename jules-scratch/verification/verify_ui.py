
import asyncio
from playwright.async_api import async_playwright

async def main():
    """
    This script verifies the built UI loads correctly, allows a node to be added
    to the canvas, and captures a screenshot of the result. It points to the
    production build served on localhost:8000.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # 1. Navigate to the application.
            await page.goto("http://localhost:8000", timeout=10000)

            # 2. Wait for the main canvas to be visible.
            await page.wait_for_selector(".react-flow__pane", timeout=10000)

            # 3. Drag "Start" node to the canvas.
            start_node = page.locator(".sidebar-node", has_text="Start")
            canvas = page.locator(".react-flow__pane")

            start_box = await start_node.bounding_box()
            canvas_box = await canvas.bounding_box()

            await page.mouse.move(start_box['x'] + start_box['width'] / 2, start_box['y'] + start_box['height'] / 2)
            await page.mouse.down()
            await page.mouse.move(canvas_box['x'] + 200, canvas_box['y'] + 150)
            await page.mouse.up()

            # 4. Wait for the node to appear.
            await page.wait_for_selector(".react-flow__node-start", timeout=2000)

            # 5. Take a screenshot.
            await page.screenshot(path="jules-scratch/verification/verification.png")

        except Exception as e:
            print(f"An error occurred: {e}")
            content = await page.content()
            with open("jules-scratch/verification/error_page.html", "w") as f:
                f.write(content)
            raise

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
