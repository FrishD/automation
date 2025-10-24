
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

            # Wait for the simulator panel to be visible
            simulator_panel = page.locator(".w-96")
            await expect(simulator_panel).to_be_visible()

            # Wait a moment for the opening animation to complete and for the websocket to connect
            await page.wait_for_timeout(2000)

            # Check that the speaking animation is visible
            await expect(page.locator("canvas")).to_be_visible()

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
