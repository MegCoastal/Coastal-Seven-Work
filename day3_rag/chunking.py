from langchain_text_splitters import CharacterTextSplitter


def chunk_text(text, chunk_size=500, chunk_overlap=100):

    splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        length_function=len
    )

    chunks = splitter.split_text(text)

    return chunks


if __name__ == "__main__":

    sample_text = """
    AI is transforming industries.
    Python is widely used in AI.
    RAG systems use embeddings.
    """ * 20

    chunks = chunk_text(sample_text)

    print(f"Total Chunks: {len(chunks)}")

    with open("outputs/chunks.txt", "w", encoding="utf-8") as file:

        for i, chunk in enumerate(chunks):

            file.write(f"\n--- CHUNK {i} ---\n")
            file.write(chunk)
            file.write("\n")