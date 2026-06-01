from sentence_transformers import SentenceTransformer
import numpy as np
import faiss

embedding_model = SentenceTransformer(
    "all-MiniLM-L6-v2"
)

dimension = 384

index = faiss.IndexFlatL2(dimension)

stored_chunks = []


def add_chunks(chunks):

    embeddings = embedding_model.encode(chunks)

    vectors = np.array(
        embeddings
    ).astype("float32")

    index.add(vectors)

    stored_chunks.extend(chunks)


def search_chunks(question, k=3):

    query_embedding = embedding_model.encode(
        [question]
    )

    query_embedding = np.array(
        query_embedding
    ).astype("float32")

    distances, indices = index.search(
        query_embedding,
        k
    )

    results = []

    for idx in indices[0]:

        if idx < len(stored_chunks):
            results.append(
                stored_chunks[idx]
            )

    return results