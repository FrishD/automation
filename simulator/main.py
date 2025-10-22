import os
import requests
import whisper
import speech_recognition as sr
from gtts import gTTS
from playsound3 import playsound
import tempfile
import time
import traceback
import asyncio
import edge_tts
from langdetect import detect, DetectorFactory
from langdetect.lang_detect_exception import LangDetectException
import re
import dateparser

# --- Configuration ---
API_BASE_URL = "http://localhost:5000/api/flows"
FLOW_ID = None
# Ensure consistent detection results
DetectorFactory.seed = 0

import ssl
ssl._create_default_https_context = ssl._create_unverified_context

# --- Entity Extraction ---
def extract_entity(text, entity_type):
    """Extracts a specific entity type from the text."""
    if entity_type == 'full_text':
        return text
    if entity_type == 'number':
        match = re.search(r'\d+', text)
        return match.group(0) if match else None
    if entity_type == 'email':
        match = re.search(r'[\w\.-]+@[\w\.-]+', text)
        return match.group(0) if match else None
    if entity_type == 'date':
        # Use dateparser, preferring dates in the future
        parsed_date = dateparser.parse(text, settings={'PREFER_DATES_FROM': 'future'})
        return parsed_date.strftime('%Y-%m-%d') if parsed_date else None
    return None

# --- Helper Functions ---
def speak(text):
    """Converts text to speech and plays it."""
    try:
        print(f"🤖 Agent: {text}")

        # Detect language for TTS voice selection
        try:
            lang = detect(text)
            print(f"🌍 Detected language: {lang}")
            if lang == 'he':
                voice = "he-IL-HilaNeural"
            else:
                voice = "en-US-AriaNeural"
        except LangDetectException:
            print("⚠️  Language detection failed. Falling back to character-based detection.")
            # Fallback for very short texts or detection errors
            if any('\u0590' <= c <= '\u05FF' for c in text):
                voice = "he-IL-HilaNeural"
            else:
                voice = "en-US-AriaNeural"

        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as fp:
            temp_file = fp.name

        # Create speech asynchronously
        async def create_speech():
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(temp_file)

        asyncio.run(create_speech())
        playsound(temp_file)
        os.remove(temp_file)
    except Exception as e:
        print(f"❌ Error in text-to-speech: {e}")

def listen_for_command(model, language='he'):
    """Listens for a command from the user and returns it as text."""
    r = sr.Recognizer()
    with sr.Microphone() as source:
        print(f"\n🎤 Listening... (Language: {language})")
        r.pause_threshold = 1.5
        r.adjust_for_ambient_noise(source, duration=1)
        audio = r.listen(source)

    try:
        print("🔄 Recognizing...")
        temp_audio_path = "temp_audio.wav"
        with open(temp_audio_path, "wb") as f:
            f.write(audio.get_wav_data())

        # Pass the language to Whisper for better accuracy
        result = model.transcribe(temp_audio_path, language=language, fp16=False)
        command = result["text"]

        print(f"👤 User said: {command}")
        os.remove(temp_audio_path)
        return command.lower().strip()
    except Exception as e:
        print(f"❌ Recognition error: {e}")
        return ""

# --- Conversation Engine ---
class ConversationEngine:
    def __init__(self, flow_data, whisper_model):
        print("🔧 Initializing ConversationEngine...")
        self.nodes = {node['id']: node for node in flow_data['nodes']}
        self.edges = flow_data['edges']
        self.whisper_model = whisper_model
        self.variables = {}  # Store conversation variables
        self.current_node_id = self._get_node_by_type('start')

        if not self.current_node_id:
            raise ValueError("Flow must have one 'start' node.")

        print(f"✅ Initialized with {len(self.nodes)} nodes and {len(self.edges)} edges")
        print(f"📍 Starting node: {self.current_node_id}")

    def _get_node_by_type(self, node_type):
        for node_id, node in self.nodes.items():
            if node['type'] == node_type:
                return node_id
        return None

    def _replace_variables(self, text):
        """Replaces {variable_name} placeholders with stored variable values."""
        for var_name, var_value in self.variables.items():
            # Use a regex to replace {var_name} to avoid replacing parts of words
            # Ensure var_value is a string
            text = re.sub(r'\{' + var_name + r'\}', str(var_value or ''), text)
        return text

    def _find_next_node_id(self, source_node_id, source_handle=None):
        for edge in self.edges:
            if edge['source'] == source_node_id:
                if source_handle is None or edge.get('sourceHandle') == source_handle:
                    print(f"  ➡️  Moving to node: {edge['target']}")
                    return edge['target']
        print(f"  ⚠️  No next node found from {source_node_id}")
        return None

    def run(self):
        """Executes the conversation flow step by step."""
        user_input_from_listen = ""
        step_count = 0

        print("\n" + "="*50)
        print("🚀 STARTING CONVERSATION FLOW")
        print("="*50 + "\n")

        while self.current_node_id:
            step_count += 1
            print(f"\n{'='*50}")
            print(f"STEP {step_count}")
            print(f"{'='*50}")

            node = self.nodes.get(self.current_node_id)
            if not node:
                print(f"❌ Error: Node with ID {self.current_node_id} not found.")
                break

            node_type = node.get('type')
            node_data = node.get('data', {})
            print(f"▶️  Node Type: {node_type}")
            print(f"📝 Node ID: {self.current_node_id}")
            print(f"📊 Node Data: {node_data}")

            if node_type == 'start':
                print("--- ✨ Starting Conversation ---")
                self.current_node_id = self._find_next_node_id(self.current_node_id)

            elif node_type == 'speak':
                text_to_speak = node_data.get('text', '')
                if not text_to_speak or text_to_speak == "Agent says...":
                    print("⚠️  Warning: No meaningful text configured for speak node")
                    text_to_speak = "אין טקסט מוגדר"

                final_text = self._replace_variables(text_to_speak)
                speak(final_text)
                time.sleep(0.5)
                self.current_node_id = self._find_next_node_id(self.current_node_id)

            elif node_type == 'listen':
                language = node_data.get('language', 'he')
                retries = int(node_data.get('retries', 1))

                # Find variable nodes that are children of this listen node
                child_variable_nodes = [
                    n for n in self.nodes.values()
                    if n.get('parentNode') == self.current_node_id and n.get('type') == 'variable'
                ]

                user_input_from_listen = ""
                all_entities_found = False

                for attempt in range(retries):
                    user_input_from_listen = listen_for_command(self.whisper_model, language=language)
                    if "סיים שיחה" in user_input_from_listen:
                        speak("מסיים את השיחה. להתראות!")
                        self.current_node_id = None
                        break

                    # Extract entities
                    found_entities_count = 0
                    if not child_variable_nodes:
                        all_entities_found = True
                        break

                    for var_node in child_variable_nodes:
                        var_data = var_node.get('data', {})
                        var_name = var_data.get('variableName')
                        entity_type = var_data.get('entityType', 'full_text')

                        if not var_name:
                            continue

                        extracted_value = extract_entity(user_input_from_listen, entity_type)
                        if extracted_value:
                            self.variables[var_name] = extracted_value
                            print(f"  ✅ Extracted '{var_name}' ({entity_type}): {extracted_value}")
                            found_entities_count += 1
                        else:
                            print(f"  ❌ Could not extract '{var_name}' ({entity_type})")
                            self.variables[var_name] = None # Explicitly set to None

                    if found_entities_count == len(child_variable_nodes):
                        all_entities_found = True
                        break

                    if attempt < retries - 1:
                        speak("לא הצלחתי להבין. בוא ננסה שוב.")

                if not self.current_node_id: # Exit if conversation was ended
                    break

                if not all_entities_found:
                    print("⚠️  Failed to extract all required entities after all retries.")

                print(f"💾 Stored variables: {self.variables}")
                self.current_node_id = self._find_next_node_id(self.current_node_id)


            elif node_type == 'condition':
                conditions = node_data.get('conditions', [])
                print(f"🔍 Checking {len(conditions)} conditions against: '{user_input_from_listen}'")

                next_node_found = False
                for i, condition in enumerate(conditions):
                    keyword = condition.get('keyword', '').lower()
                    print(f"  - Condition {i}: keyword='{keyword}'")

                    if keyword and keyword in user_input_from_listen:
                        print(f"  ✅ Match found! Taking path {i}")
                        self.current_node_id = self._find_next_node_id(self.current_node_id, source_handle=str(i))
                        next_node_found = True
                        break

                if not next_node_found:
                    print("  ❌ No condition matched")
                    speak("לא הבנתי, אפשר לחזור על דבריך?")
                    # Return to previous listen node
                    listen_node = self._get_node_by_type('listen')
                    if listen_node:
                        self.current_node_id = listen_node
                    else:
                        print("⚠️  No listen node found to return to")
                        break

            elif node_type == 'end':
                print("--- 🏁 Conversation Ended ---")
                end_text = node_data.get('text', '') or node_data.get('label', '') or "השיחה הסתיימה. להתראות!"
                speak(end_text)
                self.current_node_id = None

            else:
                print(f"❌ Unknown node type: {node_type}")
                break

        print("\n" + "="*50)
        print("🏁 CONVERSATION FLOW COMPLETED")
        print(f"Total steps: {step_count}")
        print("="*50 + "\n")

def get_flow_from_server(flow_id):
    """Fetches flow data from the server."""
    try:
        print(f"📡 Fetching flow {flow_id} from server...")
        response = requests.get(f"{API_BASE_URL}/{flow_id}")
        response.raise_for_status()
        flow_data = response.json()
        print(f"✅ Flow fetched successfully")
        return flow_data
    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching flow: {e}")
        return None

if __name__ == "__main__":
    print("\n" + "="*60)
    print("🎯 CONVERSATION SIMULATOR STARTING")
    print("="*60 + "\n")

    try:
        print(f"📡 Connecting to server: {API_BASE_URL}")
        response = requests.get(API_BASE_URL, timeout=5)
        print(f"✅ Server responded with status: {response.status_code}")

        all_flows = response.json()
        print(f"📋 Found {len(all_flows)} flow(s)")

        if all_flows:
            FLOW_ID = all_flows[0]['_id']
            flow_name = all_flows[0].get('name', 'Unnamed')
            print(f"✅ Loaded flow: '{flow_name}' (ID: {FLOW_ID})")
        else:
            print("❌ No flows found on the server.")
            print("💡 Please create a flow in the web interface first.")
            exit(1)

    except requests.exceptions.ConnectionError as e:
        print(f"\n❌ Cannot connect to server at {API_BASE_URL}")
        print(f"💡 Make sure the Node.js server is running:")
        print(f"   cd server && npm start")
        exit(1)
    except requests.exceptions.Timeout:
        print(f"\n❌ Connection timeout to {API_BASE_URL}")
        exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error while connecting to server:")
        print(f"   Type: {type(e).__name__}")
        print(f"   Error: {e}")
        traceback.print_exc()
        exit(1)

    # Fetch the full flow data
    flow = get_flow_from_server(FLOW_ID)
    if not flow:
        print("❌ Failed to load flow from server")
        exit(1)

    try:
        # Load the whisper model
        print("\n🔄 Loading Whisper speech recognition model...")
        print("⏳ This may take a minute on first run...")
        whisper_model = whisper.load_model("tiny")
        print("✅ Whisper model loaded successfully\n")

        # Create and run the conversation engine
        engine = ConversationEngine(flow, whisper_model)
        engine.run()

    except Exception as e:
        print(f"\n❌ Error during conversation execution:")
        print(f"   Type: {type(e).__name__}")
        print(f"   Error: {e}")
        traceback.print_exc()
        exit(1)

    print("\n✅ Program completed successfully")