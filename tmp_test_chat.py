import os
import google.generativeai as genai

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    raise RuntimeError("Set the GEMINI_API_KEY environment variable before running this script.")

genai.configure(api_key=api_key)

try:
    model = genai.GenerativeModel("gemini-1.5-flash")
    result = model.generate_content("Say hello")
    print("SUCCESS", result.text)
except Exception as e:
    print("ERROR", str(e))
