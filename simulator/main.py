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
FLOW_ID = None # Fetched dynamically

# --- Helper Functions ---
def speak(text):
    """Converts text to speech and plays it."""
    try:
        print(f"Agent: {text}")
        tts = gTTS(text=text, lang='he')
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as fp:
            tts.save(fp.name)
            playsound(fp.name)
        os.remove(fp.name)
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

        model = whisper.load_model("base")
        result = model.transcribe(temp_audio_path, fp16=False)
        command = result["text"]

        print(f"User said: {command}")
        os.remove(temp_audio_path)
        return command.lower().strip()
    except Exception as e:
        print(f"Recognition error: {e}")
        return ""

# --- Conversation Engine ---
class ConversationEngine:
    def __init__(self, flow_data):
        self.nodes = {node['id']: node for node in flow_data['nodes']}
        self.edges = flow_data['edges']
        self.current_node_id = self._get_node_by_type('start')
        if not self.current_node_id:
            raise ValueError("Flow must have one 'start' node.")

    def _get_node_by_type(self, node_type):
        for node_id, node in self.nodes.items():
            if node['type'] == node_type:
                return node_id
        return None

    def _find_next_node_id(self, source_node_id, source_handle=None):
        for edge in self.edges:
            if edge['source'] == source_node_id and (source_handle is None or edge['sourceHandle'] == source_handle):
                return edge['target']
        return None

    def run(self):
        """Executes the conversation flow step by step."""
        while self.current_node_id:
            node = self.nodes.get(self.current_node_id)
            if not node:
                print(f"Error: Node with ID {self.current_node_id} not found.")
                break

            node_type = node.get('type')
            node_data = node.get('data', {})

            if node_type == 'start':
                print("--- Starting Conversation ---")
                self.current_node_id = self._find_next_node_id(self.current_node_id)

            elif node_type == 'speak':
                text_to_speak = node_data.get('text', "I don't know what to say.")
                speak(text_to_speak)
                time.sleep(1) # Pause after speaking
                self.current_node_id = self._find_next_node_id(self.current_node_id)

            elif node_type == 'listen':
                user_input = listen_for_command()
                if "סיים שיחה" in user_input:
                    speak("מסיים את השיחה. להתראות!")
                    break

                # The 'listen' node itself doesn't have logic,
                # it transitions to a 'condition' node which does.
                self.current_node_id = self._find_next_node_id(self.current_node_id)
                # Pass the user input to the next node (which should be a condition node)
                if self.current_node_id:
                    self.nodes[self.current_node_id]['data']['_internal_user_input'] = user_input


            elif node_type == 'condition':
                user_input = node_data.get('_internal_user_input', '')
                conditions = node_data.get('conditions', [])

                next_node_found = False
                for i, condition in enumerate(conditions):
                    keyword = condition.get('keyword', '').lower()
                    if keyword and keyword in user_input:
                        self.current_node_id = self._find_next_node_id(self.current_node_id, source_handle=str(i))
                        next_node_found = True
                        break

                if not next_node_found:
                    speak("לא הבנתי, אפשר לחזור על דבריך?")
                    # This should ideally loop back to a 'listen' node.
                    # For simplicity, we'll just stop if no condition is met.
                    self.current_node_id = None


            elif node_type == 'end':
                print("--- Conversation Ended ---")
                speak("השיחה הסתיימה. להתראות!")
                self.current_node_id = None

            else:
                print(f"Unknown node type: {node_type}")
                break

def get_flow_from_server(flow_id):
    """Fetches flow data from the server."""
    try:
        response = requests.get(f"{API_BASE_URL}/{flow_id}")
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching flow: {e}")
        return None

if __name__ == "__main__":
    try:
        all_flows = requests.get(API_BASE_URL).json()
        if all_flows:
            FLOW_ID = all_flows[0]['_id']
            print(f"Loaded flow '{all_flows[0]['name']}' ({FLOW_ID})")
        else:
            print("No flows found on the server.")
            exit()
    except Exception as e:
        print(f"Could not fetch flows. Is the server running? Error: {e}")
        exit()

    flow = get_flow_from_server(FLOW_ID)
    if flow:
        engine = ConversationEngine(flow)
        engine.run()
