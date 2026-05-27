from pypdf import PdfReader


def extract_text_from_pdf(pdf_path):

    reader = PdfReader(pdf_path)

    text = ""

    for page in reader.pages:
        extracted = page.extract_text()

        if extracted:
            text += extracted + "\n"

    return text


if __name__ == "__main__":

    pdf_path = r"C:\Users\msban\Downloads\drylab.pdf"

    text = extract_text_from_pdf(pdf_path)

    print(text)

    with open("outputs/extracted_text.txt", "w", encoding="utf-8") as file:
        file.write(text)