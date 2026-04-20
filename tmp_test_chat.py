import google.generativeai as genai
genai.configure(api_key="AIzaSyDhQ5K5RsrQ5q6Sh4GMnrjeJljnlHHyWf8")
try:
    model = genai.GenerativeModel("gemini-1.5-flash")
    result = model.generate_content("Say hello")
    print("SUCCESS", result.text)
except Exception as e:
    print("ERROR", str(e))
