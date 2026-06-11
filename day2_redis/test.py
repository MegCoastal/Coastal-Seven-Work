from urllib.parse import urlparse
import socket
import os
from dotenv import load_dotenv

load_dotenv()

url = os.getenv("REDIS_URL")
parsed = urlparse(url)

print("HOST:", parsed.hostname)

print(socket.gethostbyname(parsed.hostname))