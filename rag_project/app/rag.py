import ollama
from app.vector_store import search_chunks


def ask_rag(question):

    chunks = search_chunks(question)

    context = "\n\n".join(chunks)

    prompt = f"""
Answer only from the provided context.

Context:
{context}

Question:
{question}

If the answer is not present in the context,
say that the information is not available.
"""

    response = ollama.chat(
        model="gemma3:1b",
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response["message"]["content"]