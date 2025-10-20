# Interactive Conversation Simulator

This project allows you to visually design and simulate interactive voice conversations in Hebrew. It consists of three main parts:

1.  **Server (Node.js/Express/MongoDB):** A backend service that stores and manages the conversation flows.
2.  **Client (React):** A modern, web-based visual editor for creating and modifying conversation flows with a drag-and-drop interface.
3.  **Simulator (Python):** A script that runs on your local machine, fetches a conversation flow from the server, and uses your microphone and speakers to simulate the conversation in real-time.

## Architecture

*   The **React Client** provides a UI to build a conversation flow, which is represented as a graph of nodes (agent's responses) and edges (user's trigger phrases).
*   The flow is saved to a **MongoDB database** via the **Node.js Server**.
*   The **Python Simulator** fetches the flow from the server. It uses the `whisper` library for local, high-quality Hebrew speech-to-text and `gTTS` for text-to-speech. It navigates the conversation graph based on your spoken input.

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

1.  **Start the Server and Client:** Follow the setup instructions above.
2.  **Design a Conversation:**
    *   Open your browser to `http://localhost:3000`.
    *   A default flow is created for you. You can change its name at the top.
    *   Click "Add Node" to create new response blocks for the agent.
    *   **Double-click a node's text to edit the agent's response.**
    *   Drag from the handle at the bottom of one node to the handle at the top of another to connect them. You will be prompted to enter the "trigger phrase" the user needs to say to follow that path.
    *   Click "Save" to persist your changes.
3.  **Run the Simulation:**
    *   Start the Python script from the `simulator` directory.
    *   The script will load the first flow it finds.
    *   The agent will speak the message from the "Start" node.
    *   When you see "Listening...", say one of the trigger phrases you defined.
    *   The conversation will proceed according to the flow you designed.
    *   To end the simulation, say "סיים שיחה" (siyem sicha).
