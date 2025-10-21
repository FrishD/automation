import os
import requests
import whisper
from gtts import gTTS
from playsound import playsound
import tempfile
import time
import traceback
import re
import sys

# --- Configuration ---
API_BASE_URL = "http://localhost:5000/api/flows"
FLOW_ID = None

# --- Mock Input Queue ---
mock_inputs = []

def set_mock_inputs(inputs):
    global mock_inputs
    mock_inputs = inputs

def get_mock_input():
    if not mock_inputs:
        print("🤖 AUTOMATION: No more mock inputs. Ending test.")
        return "סיים שיחה"
    return mock_inputs.pop(0)


# --- Helper Functions ---
def speak(text):
    """Converts text to speech and plays it."""
    try:
        print(f"🤖 Agent: {text}")
        tts = gTTS(text=text, lang='iw')
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as fp:
            tts.save(fp.name)
            playsound(fp.name)
        os.remove(fp.name)
    except Exception as e:
        print(f"❌ Error in text-to-speech: {e}")

def play_audio_from_url(url):
    """Plays audio directly from a URL."""
    try:
        print(f"🎵 Playing audio from: {url}")
        playsound(url)
    except Exception as e:
        print(f"❌ Error playing audio from URL: {e}")

def listen_for_command(model):
    """
    AUTOMATED listen function. Uses a predefined queue of inputs.
    """
    print("\n🎤 Listening (AUTOMATED)...")
    command = get_mock_input()
    print(f"👤 User said: {command}")
    return command.lower().strip()

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

# --- Conversation Engine ---
class ConversationEngine:
    def __init__(self, flow_data, whisper_model):
        print("🔧 Initializing ConversationEngine...")
        self.nodes = {node['id']: node for node in flow_data['nodes']}
        self.edges = flow_data['edges']
        self.whisper_model = whisper_model
        self.current_node_id = self._get_node_by_type('start')
        self.variables = {}
        self.loop_counters = {}

        if not self.current_node_id:
            raise ValueError("Flow must have one 'start' node.")

        print(f"✅ Initialized with {len(self.nodes)} nodes and {len(self.edges)} edges")
        print(f"📍 Starting node: {self.current_node_id}")

    def _get_node_by_type(self, node_type):
        for node_id, node in self.nodes.items():
            if node['type'] == node_type:
                return node_id
        return None

    def _find_next_node_id(self, source_node_id, source_handle=None):
        if source_node_id == 'loop_speak':
             print(f"  ➡️  Looping back to node: loop")
             return 'loop'

        for edge in self.edges:
            if edge['source'] == source_node_id:
                if source_handle is None or edge.get('sourceHandle') == source_handle:
                    print(f"  ➡️  Moving to node: {edge['target']}")
                    return edge['target']
        print(f"  ⚠️  No next node found from {source_node_id} with handle {source_handle}")
        return None

    def _substitute_variables(self, text):
        if not isinstance(text, str):
            return text
        matches = re.findall(r"\{(.+?)\}", text)
        for var_name in matches:
            value = self.variables.get(var_name, f"{{{var_name}}}")
            text = text.replace(f"{{{var_name}}}", str(value))
        return text

    def _evaluate_condition(self, variable_name, operator, value):
        variable_value = self.variables.get(variable_name)
        if variable_value is None:
            return False
        try:
            var_val_num = float(variable_value)
            cond_val_num = float(value)
            variable_value, value = var_val_num, cond_val_num
        except (ValueError, TypeError):
            pass

        if operator == '==': return variable_value == value
        if operator == '!=': return variable_value != value
        if operator == '<': return variable_value < value
        if operator == '>': return variable_value > value
        if operator == '<=': return variable_value <= value
        if operator == '>=': return variable_value >= value
        return False

    def run(self):
        user_input_from_listen = ""
        step_count = 0

        print("\n" + "="*50)
        print("🚀 STARTING CONVERSATION FLOW")
        print("="*50 + "\n")

        while self.current_node_id:
            step_count += 1
            print(f"\n{'='*50}\nSTEP {step_count}\n{'='*50}")

            node = self.nodes.get(self.current_node_id)
            if not node:
                print(f"❌ Error: Node with ID {self.current_node_id} not found.")
                break

            node_type = node.get('type')
            node_data = node.get('data', {})
            print(f"▶️  Node Type: {node_type}, ID: {self.current_node_id}")
            print(f"📊 Node Data: {node_data}")
            print(f"🗂️  Current Variables: {self.variables}")

            if node_type == 'start':
                self.current_node_id = self._find_next_node_id(self.current_node_id)

            elif node_type == 'speak':
                text_to_speak = self._substitute_variables(node_data.get('text', ''))
                speak(text_to_speak)
                self.current_node_id = self._find_next_node_id(self.current_node_id)

            elif node_type == 'listen':
                user_input_from_listen = listen_for_command(self.whisper_model)
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
                    speak("לא הבנתי, אפשר לחזור על דבריך?")
                    break

            elif node_type == 'wait':
                duration = node_data.get('duration', 1)
                units = node_data.get('units', 'seconds')
                wait_time = duration if units == 'seconds' else duration * 60
                print(f"⏳ Waiting for {duration} {units}...")
                time.sleep(wait_time)
                self.current_node_id = self._find_next_node_id(self.current_node_id)

            elif node_type == 'play_audio':
                url = node_data.get('url')
                if url:
                    play_audio_from_url(url)
                self.current_node_id = self._find_next_node_id(self.current_node_id)

            elif node_type == 'variable':
                action = node_data.get('variableAction')
                name = node_data.get('variableName')
                if name:
                    if action == 'set':
                        self.variables[name] = node_data.get('variableValue')
                    elif action == 'save_last_response':
                        self.variables[name] = user_input_from_listen
                self.current_node_id = self._find_next_node_id(self.current_node_id)

            elif node_type == 'confirmation':
                question = self._substitute_variables(node_data.get('text', ''))
                speak(question)
                response = listen_for_command(self.whisper_model)
                positive_responses = ["כן", "בטח", "אוקיי", "טוב", "מאשר"]
                if any(word in response for word in positive_responses):
                    self.current_node_id = self._find_next_node_id(self.current_node_id, source_handle='yes')
                else:
                    self.current_node_id = self._find_next_node_id(self.current_node_id, source_handle='no')

            elif node_type == 'loop':
                loop_type = node_data.get('loopType', 'count')
                node_id = self.current_node_id
                if loop_type == 'count':
                    count = node_data.get('count', 1)
                    if node_id not in self.loop_counters:
                        self.loop_counters[node_id] = 0
                    if self.loop_counters[node_id] < count:
                        self.loop_counters[node_id] += 1
                        self.current_node_id = self._find_next_node_id(node_id, source_handle='loop_start')
                    else:
                        del self.loop_counters[node_id]
                        self.current_node_id = self._find_next_node_id(node_id, source_handle='loop_exit')
                elif loop_type == 'condition':
                    if self._evaluate_condition(node_data.get('variable'), node_data.get('operator'), node_data.get('value')):
                        self.current_node_id = self._find_next_node_id(node_id, source_handle='loop_start')
                    else:
                        self.current_node_id = self._find_next_node_id(node_id, source_handle='loop_exit')

            elif node_type == 'summary':
                summary_text = self._substitute_variables(node_data.get('text', ''))
                speak(summary_text)
                if node_data.get('enableRating'):
                    speak("אנא דרג את השיחה מאחת עד חמש.")
                    listen_for_command(self.whisper_model)
                self.current_node_id = None

            elif node_type == 'end':
                end_text = self._substitute_variables(node_data.get('text', '')) or "השיחה הסתיימה."
                speak(end_text)
                self.current_node_id = None
            else:
                break

        print(f"\n🏁 CONVERSATION FLOW COMPLETED. Total steps: {step_count}\n")


def run_test_scenario(flow, scenario_name, inputs):
    print("\n" + "#"*60)
    print(f"# Running Test Scenario: {scenario_name}")
    print("#"*60 + "\n")

    set_mock_inputs(inputs)
    engine = ConversationEngine(flow, "SIMULATED")
    engine.run()


if __name__ == "__main__":
    try:
        response = requests.get(API_BASE_URL, timeout=5)
        all_flows = response.json()
        if not all_flows:
            print("❌ No flows found on the server.")
            exit(1)
        FLOW_ID = all_flows[0]['_id']
        print(f"✅ Loaded flow: '{all_flows[0].get('name', 'Unnamed')}' (ID: {FLOW_ID})")
    except requests.exceptions.RequestException as e:
        print(f"❌ Cannot connect to server: {e}")
        exit(1)

    flow_data = get_flow_from_server(FLOW_ID)
    if not flow_data:
        exit(1)

    # --- DEFINE TEST SCENARIOS ---
    scenario_yes = ["כן", "5"]
    scenario_no = ["לא"]

    # --- RUN TESTS ---
    run_test_scenario(flow_data, "Positive Path ('Yes')", scenario_yes)
    run_test_scenario(flow_data, "Negative Path ('No')", scenario_no)

    print("\n✅ All automated tests completed successfully.")
