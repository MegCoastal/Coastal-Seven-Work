from openai import OpenAI

client = OpenAI(
    api_key=""
)

response = client.chat.completions.create(
    model="gpt-4.1-mini",
    messages=[
        {
            "role": "user",
            "content": "Explain CNN"
        }
    ]
)

print(response.choices[0].message.content)