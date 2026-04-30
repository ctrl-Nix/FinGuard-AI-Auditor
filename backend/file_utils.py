import io
from pypdf import PdfReader
from docx import Document
from PIL import Image

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        return f"Error parsing PDF: {str(e)}"

def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        doc = Document(io.BytesIO(file_bytes))
        return "\n".join([para.text for para in doc.paragraphs]).strip()
    except Exception as e:
        return f"Error parsing DOCX: {str(e)}"

def is_image(filename: str) -> bool:
    return filename.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))

def is_pdf(filename: str) -> bool:
    return filename.lower().endswith('.pdf')

def is_docx(filename: str) -> bool:
    return filename.lower().endswith('.docx')
