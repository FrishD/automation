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
import dateparser
from dateparser.search import search_dates
import regex
from mutagen.mp3 import MP3
from babel.dates import format_datetime
from datetime import datetime, timedelta
import pytz

# --- Configuration ---
API_BASE_URL = "http://localhost:5000/api/flows"

def format_spoken_datetime(iso_str, language='en'):
    """Formats an ISO datetime string into a natural spoken format."""
    dt_utc = datetime.fromisoformat(iso_str.replace('Z', '+00:00'))
    # Assuming the server/user is in 'Asia/Jerusalem' timezone. This should ideally be a setting.
    target_tz = pytz.timezone('Asia/Jerusalem')
    dt_local = dt_utc.astimezone(target_tz)

    locale = 'he_IL' if language == 'he' else 'en_US'

    # Format: "EEEE, MMMM d 'at' h:mm a" -> "Tuesday, October 28 at 3:00 PM"
    return format_datetime(dt_local, "EEEE, MMMM d 'at' h:mm a", locale=locale)

# --- Helper Functions ---
def send_message(data):
    """Sends a JSON message to stdout."""
    print(json.dumps(data), flush=True)

def speak(text, language='en'):
    """Converts text to speech and plays it."""
    duration = 0
    temp_file = ""
    send_message({"type": "debug", "message": f"Speak function called with language: {language}"})
    try:
        # Use the specified language
        voice = "he-IL-HilaNeural" if language == 'he' else "en-US-AriaNeural"

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

def extract_entity(text, entity_type, language='en'):
    """Extracts a specific entity from the given text."""
    if not text:
        return None

    if entity_type == 'full_text':
        return text

    if entity_type == 'date':
        # Use dateparser for robust date extraction
        parsed_date = search_dates(text, languages=[language])
        return parsed_date[0][1].strftime('%Y-%m-%d') if parsed_date else None

    if entity_type == 'time' or entity_type == 'hour':
        # Regex for HH:MM format, optionally with AM/PM
        match = regex.search(r'\b(\d{1,2}:\d{2})\s?(am|pm)?\b', text, regex.IGNORECASE)
        return match.group(0) if match else None

    if entity_type == 'email':
        match = regex.search(r'[\w\.-]+@[\w\.-]+\.\w+', text)
        return match.group(0) if match else None

    if entity_type == 'phone_number':
        # Regex for various phone number formats
        match = regex.search(r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}', text)
        return match.group(0) if match else None

    return None


# --- Conversation Engine ---
class ConversationEngine:
    def __init__(self, flow_data, whisper_model, token=None):
        self.flow_id = flow_data['_id']
        self.nodes = {node['id']: node for node in flow_data['nodes']}
        self.edges = flow_data['edges']
        self.variables = {}
        self.whisper_model = whisper_model
        self.current_node_id = self._get_node_by_type('start')
        self.jwt_token = token

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
                    target_id = edge.get('target')
                    # Ensure the target node actually exists before returning it
                    if target_id and target_id in self.nodes:
                        return target_id
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
                language_code = node_data.get('language', self.variables.get('language', 'en'))

                # Perform variable substitution
                def replace_var(match):
                    var_name = match.group(1).strip()
                    return str(self.variables.get(var_name, f"{{{var_name}}}"))

                processed_text = regex.sub(r'\{([^}]+)\}', replace_var, text_to_speak)

                speak(processed_text, language=language_code)
                self.current_node_id = self._find_next_node_id(self.current_node_id)

            elif node_type == 'listen':
                language = node_data.get('language', 'en')
                self.variables['language'] = language
                user_input_from_listen = listen_for_command(self.whisper_model, language=language)

                if "סיים שיחה" in user_input_from_listen:
                    speak("מסיים את השיחה. להתראות!")
                    break

                # Find the next node in the sequence
                next_node_id = self._find_next_node_id(self.current_node_id)

                if not next_node_id:
                    self.current_node_id = None
                    continue

                next_node = self.nodes.get(next_node_id)

                # Check if the next node is a variable node for processing
                if next_node and next_node.get('type') == 'variable':
                    # It's a variable node, so perform extraction as a side-effect.
                    extraction_type = next_node.get('data', {}).get('extractionType', 'full_text')
                    variable_name = next_node.get('data', {}).get('variableName')
                    if variable_name:
                        extracted_value = extract_entity(user_input_from_listen, extraction_type, language)
                        self.variables[variable_name] = extracted_value
                        send_message({
                            "type": "variable_update",
                            "name": variable_name,
                            "value": extracted_value,
                            "status": "extracted" if extracted_value else "failed"
                        })

                    # Then, skip over it to the *next* node in the flow.
                    self.current_node_id = self._find_next_node_id(next_node_id)
                else:
                    # It's a regular node, proceed as normal.
                    self.current_node_id = next_node_id

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

            elif node_type == 'google_calendar':
                language_code = node_data.get('language', 'en')
                send_message({"type": "debug", "message": f"Google Calendar Node: Language set to '{language_code}'"})

                prompt_text = "מתי תרצה לקבוע את הפגישה? למשל, 'מחר בשלוש'." if language_code == 'he' else "When would you like to book the meeting? For example, 'tomorrow at 3pm'."
                speak(prompt_text, language=language_code)
                user_response = listen_for_command(self.whisper_model, language=language_code)

                # Clean the response to help the parser
                cleaned_response = user_response.replace('.', '')
                send_message({"type": "debug", "message": f"Trying to parse date from cleaned user response: '{cleaned_response}'"})


                settings = {
                    'TIMEZONE': 'Asia/Jerusalem',
                    'RETURN_AS_TIMEZONE_AWARE': True,
                    'PREFER_DATES_FROM': 'future'
                }
                # Add PREFER_DATES_FROM to correctly handle times like "9am"
                search_results = search_dates(cleaned_response, languages=[language_code], settings=settings)
                parsed_date = search_results[0][1] if search_results else None
                send_message({"type": "debug", "message": f"Parsed date: {parsed_date.isoformat() if parsed_date else 'None'}"})

                if not parsed_date or parsed_date < datetime.now(pytz.timezone('Asia/Jerusalem')):
                    speak("I'm sorry, I couldn't find a valid future date in your request. Please try again.", language=language_code)
                    continue

                try:
                    headers = {'Authorization': f'Bearer {self.jwt_token}'} if self.jwt_token else {}
                    api_payload = {"flowId": self.flow_id, "nodeId": self.current_node_id, "startDate": parsed_date.isoformat()}
                    send_message({"type": "debug", "message": f"Sending to /availability: {json.dumps(api_payload)}"})
                    response = requests.post(
                        "http://localhost:5000/api/google-calendar/availability",
                        json=api_payload,
                        headers=headers
                    )
                    response.raise_for_status()
                    availability = response.json()
                    send_message({"type": "debug", "message": f"Received from /availability: {json.dumps(availability)}"})


                    if availability.get('requestedSlotAvailable'):
                        slot_to_book = {
                            'start': parsed_date.isoformat(),
                            'end': (parsed_date + timedelta(minutes=node_data.get('meetingDuration', 30))).isoformat()
                        }
                        # PROCEED_WITH_BOOKING_LOGIC
                        speak(f"I found an opening at {format_spoken_datetime(slot_to_book['start'], language_code)}. Should I book it for you?", language=language_code)
                        confirmation = listen_for_command(self.whisper_model, language=language_code)
                        if "yes" in confirmation or "ok" in confirmation or "ken" in confirmation:
                            event_payload = {
                                "flowId": self.flow_id,
                                "nodeId": self.current_node_id,
                                "startTime": slot_to_book['start'],
                                "endTime": slot_to_book['end'],
                                "attendees": [self.variables.get('caller_email')]
                            }
                            create_response = requests.post("http://localhost:5000/api/google-calendar/create-event", json=event_payload, headers=headers)
                            create_response.raise_for_status()
                            speak("Great, your meeting is confirmed.", language=language_code)
                            self.current_node_id = self._find_next_node_id(self.current_node_id, source_handle='success')
                        else:
                            speak("Ok, I won't schedule it.", language=language_code)
                            self.current_node_id = self._find_next_node_id(self.current_node_id, source_handle='failure')

                    else: # Not available, check reason
                        reason = availability.get('reason')
                        next_slot = availability.get('nextAvailableSlot')

                        if reason == 'OUT_OF_HOURS' and availability.get('workingHours'):
                            # Handle multiple time slots in a day
                            hours_list = availability['workingHours']
                            hours_str = " and ".join([f"from {slot['start']} to {slot['end']}" for slot in hours_list])
                            speak(f"That time is outside of business hours. On that day, hours are {hours_str}.", language=language_code)
                        else: # Busy or other reasons
                             speak("I'm sorry, that time is unavailable.", language=language_code)

                        if next_slot:
                            speak(f"The next opening is on {format_spoken_datetime(next_slot['start'], language_code)}. Would you like to book that instead?", language=language_code)
                            confirmation = listen_for_command(self.whisper_model, language=language_code)
                            if "yes" in confirmation or "ok" in confirmation or "ken" in confirmation:
                                event_payload = {
                                    "flowId": self.flow_id,
                                    "nodeId": self.current_node_id,
                                    "startTime": next_slot['start'],
                                    "endTime": next_slot['end'],
                                    "attendees": [self.variables.get('caller_email')]
                                }
                                create_response = requests.post("http://localhost:5000/api/google-calendar/create-event", json=event_payload, headers=headers)
                                create_response.raise_for_status()
                                speak("Great, your meeting is confirmed.", language=language_code)
                                self.current_node_id = self._find_next_node_id(self.current_node_id, source_handle='success')
                            else:
                                speak("Alright. Is there another time you'd like to check?", language=language_code)
                                continue # Re-ask the initial question
                        else:
                             speak("I couldn't find any other available slots in the near future.", language=language_code)
                             self.current_node_id = self._find_next_node_id(self.current_node_id, source_handle='failure')

                except requests.exceptions.RequestException as e:
                    error_message = str(e.response.text) if e.response else str(e)
                    send_message({"type": "error", "message": error_message})
                    speak("Sorry, I'm having trouble connecting to the calendar. Please try again later.", language=language_code)
                    self.current_node_id = self._find_next_node_id(self.current_node_id, source_handle='failure')


            else:
                send_message({"type": "error", "message": f"Unknown node type: {node_type}"})
                break

        send_message({"type": "status_update", "status": "finished", "subtitle": "Flow complete."})

if __name__ == "__main__":
    try:
        initial_message_string = sys.stdin.read()
        initial_message = json.loads(initial_message_string)
        flow = initial_message['flow']
        token = initial_message.get('token')
    except Exception as e:
        send_message({"type": "error", "message": f"Error reading initial message from stdin: {e}"})
        exit(1)

    try:
        send_message({"type": "status_update", "status": "loading", "subtitle": "Loading speech model..."})
        whisper_model = whisper.load_model("base")

        engine = ConversationEngine(flow, whisper_model, token=token)
        engine.run()

    except Exception as e:
        send_message({"type": "error", "message": f"Critical error: {e}"})
        traceback.print_exc()
        exit(1)