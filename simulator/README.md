# Conversation Simulator

This Python script simulates a voice conversation based on a flow defined in the web interface.

## Installation

1.  **Install Python:** Make sure you have Python 3.8 or higher installed.
2.  **Install Dependencies:** Navigate to this directory in your terminal and run:
    ```bash
    pip install -r requirements.txt
    ```
3.  **Install FFmpeg:** Whisper requires FFmpeg to be installed on your system.
    *   **On macOS:** `brew install ffmpeg`
    *   **On Windows:** `choco install ffmpeg`
    *   **On Linux:** `sudo apt update && sudo apt install ffmpeg`

## Running the Simulator

1.  **Start the server:** Make sure the Node.js server is running (`npm start` in the `server` directory).
2.  **Create a flow:** Use the web interface to create at least one conversation flow.
3.  **Run the script:**
    ```bash
    python main.py
    ```

The script will automatically try to load the first conversation flow it finds from the server.
