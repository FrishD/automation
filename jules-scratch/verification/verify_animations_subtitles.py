from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        page.goto("http://localhost:3000")

        # Wait for the canvas to be visible and set a larger viewport
        page.set_viewport_size({"width": 1920, "height": 1080})
        canvas = page.locator('[data-tour="canvas"]')
        expect(canvas).to_be_visible(timeout=30000)

        # Drag a "Speak" node
        speak_palette = page.locator('div[draggable="true"]:has-text("Speak")')
        speak_palette.drag_to(canvas, target_position={"x": 400, "y": 200})
        speak_node = page.locator('.react-flow__node-speak').last

        # Add some text to the speak node
        speak_node.locator('textarea').fill("Hello, this is a test of the new animations and subtitles.")

        # Drag a "Listen" node
        listen_palette = page.locator('div[draggable="true"]:has-text("Listen")')
        listen_palette.drag_to(canvas, target_position={"x": 700, "y": 200})
        listen_node = page.locator('.react-flow__node-listen').last

        # Connect the nodes
        start_node_handle = page.locator('.react-flow__node-start .react-flow__handle.source')
        speak_node_target_handle = speak_node.locator('.react-flow__handle.target')
        start_node_handle.drag_to(speak_node_target_handle)

        speak_node_source_handle = speak_node.locator('.react-flow__handle.source')
        listen_node_target_handle = listen_node.locator('.react-flow__handle.target')
        speak_node_source_handle.drag_to(listen_node_target_handle)

        # Start simulation
        page.locator('[data-tour="simulate-button"]').click(force=True)
        simulator_panel = page.locator('div:has-text("Simulator")').last
        expect(simulator_panel).to_be_visible()

        # 1. Verify Speaking animation and subtitles
        expect(simulator_panel.locator('p:has-text("Agent Speaking")')).to_be_visible(timeout=10000)
        expect(simulator_panel.locator('span:has-text("Hello, this is a test")')).to_be_visible()
        page.screenshot(path="jules-scratch/verification/speaking_animation.png")

        # 2. Verify Listening animation
        expect(simulator_panel.locator('p:has-text("Listening...")')).to_be_visible(timeout=15000) # Wait longer for TTS to finish
        page.screenshot(path="jules-scratch/verification/listening_animation.png")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
