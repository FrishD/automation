import edge_tts
import asyncio
import os
from playsound import playsound

async def _create_speech(text, output_file):
    """פונקציה פנימית ליצירת קובץ דיבור"""
    # קול עברי איכותי של Microsoft
    voice = "he-IL-HilaNeural"  # קול נשי
    # voice = "he-IL-AvriNeural"  # קול גברי - החלף אם תרצה

    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(output_file)

def speak_hebrew(text, save_file=None, play_audio=True):
    """
    ממיר טקסט עברי לדיבור באיכות גבוהה

    Args:
        text (str): הטקסט בעברית
        save_file (str): נתיב לשמירה (אופציונלי)
        play_audio (bool): האם להשמיע
    """
    try:
        # קובץ זמני או קבוע
        if save_file is None:
            save_file = "temp_hebrew_speech.mp3"
            temp_file = True
        else:
            temp_file = False

        # יצירת הדיבור
        print(f"מכין דיבור: {text[:50]}...")
        asyncio.run(_create_speech(text, save_file))

        # השמעה
        if play_audio:
            print("משמיע...")
            playsound(save_file)

        # מחיקת קובץ זמני
        if temp_file and play_audio:
            try:
                os.remove(save_file)
            except:
                pass

        if not temp_file:
            print(f"נשמר ב: {save_file}")

    except Exception as e:
        print(f"שגיאה: {e}")

def speak_hebrew_list(text_list, delay=0.5):
    """מדבר רשימת משפטים"""
    import time

    for i, text in enumerate(text_list):
        print(f"\nמשפט {i+1}: {text}")
        speak_hebrew(text, play_audio=True)
        if i < len(text_list) - 1:
            time.sleep(delay)