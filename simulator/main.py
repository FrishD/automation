import os
import requests
import whisper
import speech_recognition as sr
import tempfile
import time
import traceback
import asyncio
import edge_tts
import json
import sys
from mutagen.mp3 import MP3

# --- Configuration ---
API_BASE_URL = "http://localhost:5000/api/flows"

# --- Helper Functions ---
def send_message(data):
    """Sends a JSON message to stdout."""
    print(json.dumps(data), flush=True)

def speak(text):
    """Converts text to speech and plays it."""
    duration = 0
    temp_file = ""
    try:
        # Detect language
        if any('\u0590' <= c <= '\u05FF' for c in text):
            voice = "he-IL-HilaNeural"
        else:
            voice = "en-US-AriaNeural"

        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as fp:
            temp_file = fp.name

        async def create_speech():
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(temp_file)

        # Run async speech creation
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
        loop.run_until_complete(create_speech())

        # Get audio duration
        audio = MP3(temp_file)
        duration = audio.info.length

        # Send message with text and duration, then play sound
        send_message({"type": "speak_start", "text": text, "duration": duration})
        from playsound3 import playsound
        playsound(temp_file)

    except Exception as e:
        send_message({"type": "error", "message": f"TTS Error: {e}"})
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)
        send_message({"type": "speak_end"})


def listen_for_command(model, language=None):
    """Listens for a command from the user and returns it as text."""
    send_message({"type": "status_update", "status": "listening"})
    r = sr.Recognizer()
    with sr.Microphone() as source:
        r.pause_threshold = 1.5
        r.adjust_for_ambient_noise(source, duration=1)
        audio = r.listen(source)

    try:
        send_message({"type": "status_update", "status": "recognizing", "subtitle": "Transcribing audio..."})
        temp_audio_path = "temp_audio.wav"
        with open(temp_audio_path, "wb") as f:
            f.write(audio.get_wav_data())

        transcribe_options = {"fp16": False}
        if language:
            transcribe_options["language"] = language
        result = model.transcribe(temp_audio_path, **transcribe_options)
        command = result["text"]

        send_message({"type": "user_speech", "text": command})
        os.remove(temp_audio_path)
        return command.lower().strip()
    except Exception as e:
        send_message({"type": "error", "message": f"Recognition error: {e}"})
        return ""

# --- Conversation Engine ---
class ConversationEngine:
    def __init__(self, flow_data, whisper_model):
        self.nodes = {node['id']: node for node in flow_data['nodes']}
        self.edges = flow_data['edges']
        self.whisper_model = whisper_model
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
            if edge['source'] == source_node_id:
                if source_handle is None or edge.get('sourceHandle') == source_handle:
                    return edge['target']
        return None

    def run(self):
        """Executes the conversation flow step by step."""
        user_input_from_listen = ""

        send_message({"type": "status_update", "status": "starting", "subtitle": "Initializing simulator..."})
        time.sleep(1)

        while self.current_node_id:
            node = self.nodes.get(self.current_node_id)
            if not node:
                send_message({"type": "error", "message": f"Node with ID {self.current_node_id} not found."})
                break

            node_type = node.get('type')
            send_message({"type": "active_node", "nodeId": self.current_node_id, "nodeType": node_type})

            node_data = node.get('data', {})

            if node_type == 'start':
                self.current_node_id = self._find_next_node_id(self.current_node_id)

            elif node_type == 'speak':
                text_to_speak = node_data.get('text', 'No text configured.')
                speak(text_to_speak)
                time.sleep(0.5)
                self.current_node_id = self._find_next_node_id(self.current_node_id)

            elif node_type == 'listen':
                language = node_data.get('language', 'en')
                user_input_from_listen = listen_for_command(self.whisper_model, language=language)
                if "סיים שיחה" in user_input_from_listen:
                    speak("מסיים את השיחה. להתראות!")
                    break
                self.current_node_id = self._find_next_node_id(self.current_node_id)

            elif node_type == 'condition':
                conditions = node_data.get('conditions', [])
                next_node_found = False
                for i, condition in enumerate(conditions):
                    keyword = condition.get('keyword', '').lower()
                    if keyword and keyword in user_input_from_listen:
                        self.current_node_id = self._find_next_node_id(self.current_node_id, source_handle=str(i))
                        next_node_found = True
                        break

                if not next_node_found:
                    speak("I didn't understand. Could you please repeat?")
                    listen_nodes = [nid for nid, n in self.nodes.items() if n['type'] == 'listen']
                    if listen_nodes:
                        self.current_node_id = listen_nodes[-1]
                    else:
                        break

            elif node_type == 'end':
                end_text = node_data.get('text', 'Conversation ended.')
                speak(end_text)
                self.current_node_id = None

            else:
                send_message({"type": "error", "message": f"Unknown node type: {node_type}"})
                break

        send_message({"type": "status_update", "status": "finished", "subtitle": "Flow complete."})

if __name__ == "__main__":
    try:
        flow_data_string = sys.stdin.read()
        flow = json.loads(flow_data_string)
    except Exception as e:
        send_message({"type": "error", "message": f"Error reading flow data from stdin: {e}"})
        exit(1)

    try:
        send_message({"type": "status_update", "status": "loading", "subtitle": "Loading speech model..."})
        whisper_model = whisper.load_model("base")

        engine = ConversationEngine(flow, whisper_model)
        engine.run()

    except Exception as e:
        send_message({"type": "error", "message": f"Critical error: {e}"})
        traceback.print_exc()
        exit(1)
