import requests

response = requests.get(
    "https://jsonplaceholder.typicode.com/users"
)

print(response.json())

import requests

updated_data = {
    "name": "John",
    "age": 22
}

response = requests.put(
    "https://jsonplaceholder.typicode.com/posts/1",
    json=updated_data
)

print(response.json())