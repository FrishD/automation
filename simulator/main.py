import os
import requests
import whisper
import speech_recognition as sr
from gtts import gTTS
from playsound import playsound
import tempfile
import time

# --- Configuration ---
API_BASE_URL = "http://localhost:5000/api/flows"
FLOW_ID = "YOUR_FLOW_ID_HERE" # This will be replaced by a dynamically fetched ID

# --- Helper Functions ---
def speak(text):
    """Converts text to speech and plays it."""
    try:
        print(f"Agent: {text}")
        tts = gTTS(text=text, lang='he')
        with tempfile.NamedTemporaryFile(delete=False) as fp:
            tts.save(f"{fp.name}.mp3")
            playsound(f"{fp.name}.mp3")
            os.remove(f"{fp.name}.mp3")
    except Exception as e:
        print(f"Error in text-to-speech: {e}")

def listen_for_command():
    """Listens for a command from the user and returns it as text."""
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print("\nListening...")
        r.pause_threshold = 1.5
        r.adjust_for_ambient_noise(source, duration=1)
        audio = r.listen(source)

    try:
        print("Recognizing...")
        temp_audio_path = "temp_audio.wav"
        with open(temp_audio_path, "wb") as f:
            f.write(audio.get_wav_data())

        # Using a smaller model for faster performance.
        # For higher accuracy, you can use "medium" or "large".
        model = whisper.load_model("base")
        result = model.transcribe(temp_audio_path, fp16=False)
        command = result["text"]

        print(f"User said: {command}")
        os.remove(temp_audio_path) # Clean up
        return command.lower().strip()
    except Exception as e:
        print(f"Recognition error: {e}")
        return ""


# --- Main Logic ---
class ConversationManager:
    def __init__(self, flow_data):
        self.nodes = {node['id']: node for node in flow_data['nodes']}
        self.edges = flow_data['edges']
        self.current_node_id = self._get_start_node_id()

    def _get_start_node_id(self):
        """Finds the node with no incoming edges."""
        all_target_ids = {edge['target'] for edge in self.edges}
        for node_id in self.nodes:
            if node_id not in all_target_ids:
                return node_id
        return None # No start node found

    def start_conversation(self):
        """Starts the conversation from the beginning."""
        if not self.current_node_id:
            speak("Error: Could not find a starting point for the conversation.")
            return

        start_node = self.nodes.get(self.current_node_id)
        if start_node:
            speak(start_node['data']['label'])

    def process_user_input(self, user_input):
        """Processes user input and advances the conversation."""
        if not self.current_node_id:
            return

        # Find possible next steps from the current node
        possible_edges = [edge for edge in self.edges if edge['source'] == self.current_node_id]

        # Check if any trigger phrase is in the user's input
        for edge in possible_edges:
            trigger_phrase = edge.get('label', '').lower()
            if trigger_phrase and trigger_phrase in user_input:
                self.current_node_id = edge['target']
                next_node = self.nodes.get(self.current_node_id)
                if next_node:
                    speak(next_node['data']['label'])
                return # Stop after finding the first match

        # If no match was found
        speak("לא הבנתי, אפשר לחזור על דבריך?")


def get_flow_from_server(flow_id):
    """Fetches the conversation flow data from the server."""
    try:
        response = requests.get(f"{API_BASE_URL}/{flow_id}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching flow from server: {e}")
        return None

if __name__ == "__main__":
    print("Starting Conversation Simulator...")

    active_flow_id = FLOW_ID
    if active_flow_id == "YOUR_FLOW_ID_HERE":
        try:
            all_flows = requests.get(API_BASE_URL).json()
            if all_flows:
                active_flow_id = all_flows[0]['_id']
                print(f"Using the first available flow with ID: {active_flow_id}")
            else:
                print("No flows found on the server. Please create one.")
                exit()
        except Exception as e:
            print(f"Could not fetch flows. Is the server running? Error: {e}")
            exit()

    flow_data = get_flow_from_server(active_flow_id)

    if flow_data:
        manager = ConversationManager(flow_data)
        manager.start_conversation()

        # Continuous conversation loop
        while True:
            user_input = listen_for_command()
            if "סיים שיחה" in user_input: # Exit condition
                speak("מסיים את השיחה. להתראות!")
                break
            if user_input:
                manager.process_user_input(user_input)
            time.sleep(1) # Small delay to prevent frantic looping
    else:
        speak("מצטער, לא הצלחתי לטעון את הגדרות השיחה.")

    print("Simulation finished.")
