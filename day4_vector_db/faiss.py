import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

docs = [
    "I like cricket",
    "Python is a programming language",
    "AI is transforming the world",
    "I enjoy playing football",
    "Machine learning is a subset of AI"
]

embeddings = model.encode(docs)

embeddings = np.array(embeddings).astype("float32")

index = faiss.IndexFlatL2(embeddings.shape[1])
index.add(embeddings)

query = "I love coding in Python"
query_vec = model.encode([query]).astype("float32")

D, I = index.search(query_vec, k=3)

print("\nQuery:", query)
print("\nTop matches:")

for i in I[0]:
    print("-", docs[i])