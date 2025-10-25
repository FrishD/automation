
import asyncio
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        try:
            # Navigate to the app
            await page.goto("http://localhost:3000", timeout=60000)

            # Click the simulate button
            await page.get_by_role("button", name="Simulate").click()

            # Wait for the simulator panel to appear and check for the "Idle" status
            simulator_panel = page.locator(".w-96")
            await expect(simulator_panel).to_be_visible()
            await expect(page.get_by_text("Idle")).to_be_visible()

            # Wait a moment for the websocket to connect and the simulation to start.
            # We'll check for the "speaking" status, which indicates the simulation is running.
            await expect(page.get_by_text("speaking", exact=True)).to_be_visible(timeout=15000)

            # Check that the node is highlighted
            highlighted_node = page.locator(".react-flow__node.highlighted")
            await expect(highlighted_node).to_be_visible()

            # Check that the canvas is locked (has the dark overlay)
            canvas_lock = page.locator(".simulator-open")
            await expect(canvas_lock).to_be_visible()

            # Capture the screenshot
            await page.screenshot(path="jules-scratch/verification/verification.png")
            print("Screenshot captured successfully.")

        except Exception as e:
            print(f"An error occurred: {e}")
            await page.screenshot(path="jules-scratch/verification/error.png")

        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
