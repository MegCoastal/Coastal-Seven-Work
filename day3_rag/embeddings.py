from sentence_transformers import SentenceTransformer


model = SentenceTransformer("all-MiniLM-L6-v2")


def generate_embeddings(chunks):

    embeddings = model.encode(chunks)

    return embeddings


if __name__ == "__main__":

    chunks = [
        "AI is powerful",
        "Python is used for ML"
    ]

    embeddings = generate_embeddings(chunks)

    print(embeddings.shape)