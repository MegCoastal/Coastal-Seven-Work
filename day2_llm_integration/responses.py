import requests

url = "http://localhost:11434/api/generate"

payload = {
    "model": "gemma3:1b",
    "prompt": "What is Machine Learning?",
    "stream": False
}

response = requests.post(url, json=payload)

if response.status_code == 200:

    data = response.json()

    print("MODEL:", data["model"])

    print("\nRESPONSE:")
    print(data["response"])

else:
    print("Request Failed")