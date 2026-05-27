import requests

url = "http://localhost:11434/api/generate"

payload = {
    "model": "gemma3:1b",
    "prompt": "Explain APIs in simple words",
    "stream": False
}

try:

    response = requests.post(url, json=payload)

    # Convert API response to dictionary
    data = response.json()

    print("FULL RESPONSE:")
    print(data)

    # Check if generation succeeded
    if "response" in data:

        answer = data["response"]

        print("\nMODEL OUTPUT:")
        print(answer)

    # Check if API returned error
    elif "error" in data:

        print("\nERROR FROM MODEL:")
        print(data["error"])

    else:

        print("\nUnexpected response format")

except Exception as e:

    print("Python Exception Occurred:")
    print(e)