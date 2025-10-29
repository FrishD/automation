
import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        await page.goto("http://localhost:3000")

        # Right-click the React Flow canvas to open the context menu
        await page.click('.react-flow__pane', button='right')

        # Click the "Google Calendar" button in the context menu
        await page.click('button:has-text("google_calendar")')

        # Take a screenshot of the new node
        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
