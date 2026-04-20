import google.generativeai as genai
import sys

genai.configure(api_key="AIzaSyDhQ5K5RsrQ5q6Sh4GMnrjeJljnlHHyWf8")
print("Trying to list models...")
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)
