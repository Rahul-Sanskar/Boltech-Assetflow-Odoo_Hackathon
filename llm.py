import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
MODEL = "openai/gpt-3.5-turbo"  # You can change the model as needed

def call_openrouter(prompt: str) -> dict:
    """
    Calls the OpenRouter API with a prompt and returns a JSON dict.
    Handles missing API key, network timeout, OpenRouter failure, and invalid JSON.
    """
    if not OPENROUTER_API_KEY:
        return {"error": "Missing OpenRouter API key. Set OPENROUTER_API_KEY in .env"}

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": "You are AssetFlow AI. Respond only with valid JSON, no markdown."},
            {"role": "user", "content": prompt},
        ],
    }

    try:
        response = requests.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=30,
        )
    except requests.exceptions.Timeout:
        return {"error": "Network timeout while contacting OpenRouter"}
    except requests.exceptions.RequestException:
        return {"error": "Network error while contacting OpenRouter"}

    if response.status_code != 200:
        return {"error": f"OpenRouter failure: {response.status_code} {response.text}"}

    try:
        data = response.json()
        content = data["choices"][0]["message"]["content"]
        # Try to parse the model's response as JSON
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"error": "Invalid JSON returned by OpenRouter", "raw": content}
    except (KeyError, IndexError, ValueError):
        return {"error": "Invalid response structure from OpenRouter"}
