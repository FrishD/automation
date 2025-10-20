# Interactive Conversation Simulator V2

This project allows you to visually design and simulate complex, stateful interactive voice conversations in Hebrew. It's a powerful tool for prototyping and building automated call-center flows, voice assistants, and more.

This is the second version of the project, featuring a completely redesigned user interface and a more powerful, block-based logic system.

## Core Components

1.  **Server (Node.js/Express/MongoDB):** A backend service that stores and manages the conversation flows. It now supports a rich schema for different block types.
2.  **Client (React):** A modern, web-based visual editor for creating and modifying conversation flows. It features a drag-and-drop interface with a sidebar of available blocks.
3.  **Simulator (Python):** A script that runs a conversation flow. It operates as a state machine, executing each block's logic (speaking, listening, evaluating conditions) in sequence.

## Block Types

You can build your conversation by dragging these blocks from the sidebar onto the canvas:

*   **🚀 Start:** The entry point for every conversation.
*   **🗣️ Speak:** Makes the agent say a specific piece of text.
*   **👂 Listen:** Pauses the flow and waits for the user to provide voice input.
*   **🔀 Condition:** The core of your logic. It allows the conversation to branch based on keywords in the user's response. Each condition you add creates a new output handle on the block.
*   **🏁 End:** Marks a final point in a conversation path.

## Getting Started

### Prerequisites

*   Node.js and npm
*   Python 3.8+ and pip
*   MongoDB installed and running locally
*   FFmpeg (required by `whisper`):
    *   **macOS:** `brew install ffmpeg`
    *   **Windows:** `choco install ffmpeg`
    *   **Linux:** `sudo apt update && sudo apt install ffmpeg`

### 1. Server Setup

```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Start the server (runs on http://localhost:5000)
npm start
```

### 2. Client Setup

```bash
# Navigate to the client directory
cd client

# Install dependencies
npm install

# Start the React development server (opens in your browser at http://localhost:3000)
npm start
```

### 3. Simulator Setup

```bash
# Navigate to the simulator directory
cd simulator

# Install Python dependencies
pip install -r requirements.txt

# Run the simulator
python main.py
```

## How to Use

1.  **Start the Server and Client.**
2.  **Design a Conversation:**
    *   Open your browser to `http://localhost:3000`.
    *   Drag blocks from the sidebar on the left onto the canvas.
    *   Fill in the details for each block (e.g., the text for a "Speak" block, or keywords for a "Condition" block).
    *   Connect the blocks by dragging from a source handle (bottom or right of a block) to a target handle (top of a block).
    *   Give your flow a name in the top-left corner and click **Save Flow**.
3.  **Run the Simulation:**
    *   Start the Python script from the `simulator` directory.
    *   The script will automatically load the most recent conversation flow.
    *   The simulation will begin, executing the logic you designed.
    *   To end the simulation at any time, say "סיים שיחה" (siyem sicha).
