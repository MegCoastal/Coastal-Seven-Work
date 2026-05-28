import chromadb
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("all-MiniLM-L6-v2")

client = chromadb.Client()

collection = client.create_collection(name="docs")

docs = [
    "Python is easy to learn",
    "FAISS is used for similarity search",
    "ChromaDB stores embeddings with metadata",
    "AI can understand text using embeddings",
    "I love machine learning"
]

embeddings = model.encode(docs)

for i, doc in enumerate(docs):
    collection.add(
        ids=[str(i)],
        documents=[doc],
        embeddings=[embeddings[i].tolist()],
        metadatas=[{"source": "notes"}]
    )

query = "How does AI understand text?"
query_vec = model.encode([query]).tolist()

results = collection.query(
    query_embeddings=query_vec,
    n_results=3
)

print("\nQuery:", query)
print("\nTop matches:")

for doc in results["documents"][0]:
    print("-", doc)