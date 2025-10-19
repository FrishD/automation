# -*- coding: utf-8 -*- 
# -*- coding: utf-8 -*-
from tts_hebrew import speak_hebrew
from stt_hebrew import listen_hebrew
from datetime import datetime

def main_menu():
    while True:
        print("\n" + "="*50)
        print("1. TTS")
        print("2. STT")
        print("3. Q&A")
        print("4. Exit")

        choice = input("\nChoose: ")

        if choice == "1":
            text = input("Text: ")
            if text: speak_hebrew(text)
        elif choice == "2":
            text = listen_hebrew()
            if text: print(f"Got: {text}")
        elif choice == "3":
            qa_mode()
        elif choice == "4":
            break

def qa_mode():
    speak_hebrew("shalom")
    while True:
        mode = input("\n1=Voice 2=Text 0=Exit: ")
        if mode == "0": break

        question = listen_hebrew() if mode == "1" else input("Q: ")
        if not question: continue

        answer = get_answer(question)
        print(f"A: {answer}")
        speak_hebrew(answer)

def get_answer(q):
    q = q.lower()
    if "shalom" in q: return "shalom"
    if "shem" in q: return "shmi nurit"
    if "shaa" in q: return f"hashaa {datetime.now().strftime('%H:%M')}"
    return "lo yodaat"

if __name__ == "__main__":
    main_menu()