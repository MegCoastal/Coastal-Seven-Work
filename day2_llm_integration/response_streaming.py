import requests
import json

url = "http://localhost:11434/api/generate"

payload = {
    "model": "gemma3:1b",
    "prompt": "Explain Neural Networks",
    "stream": True
}

response = requests.post(
    url,
    json=payload,
    stream=True
)

for line in response.iter_lines():

    if line:

        chunk = json.loads(line)

        print(chunk.get("response", ""), end="")