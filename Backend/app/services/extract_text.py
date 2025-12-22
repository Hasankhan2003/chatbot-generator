import pdfplumber
import re
from pathlib import Path

# <<< CHANGE THIS TO YOUR PDF FILE PATH >>>
# PDF_PATH = r"report.pdf"  # e.g. r"C:\Users\you\Documents\sample.pdf"


def normalize_whitespace(text: str) -> str:

    if not text:
        return ""

    # Fix hyphenation at line breaks
    text = re.sub(r"-\s*\n\s*", "-", text)

    # Replace remaining newlines within paragraphs with spaces
    # but keep double newlines (paragraph breaks)
    text = text.replace("\r", "")
    text = re.sub(r"\n{2,}", "\n\n", text)  # collapse many blank lines to max 1 blank line

    # Within a paragraph, replace single newlines with spaces
    lines = text.split("\n\n")
    normalized_paragraphs = []
    for block in lines:
        # Turn all internal whitespace in the block into single spaces
        block = re.sub(r"\s+", " ", block).strip()
        if block:
            normalized_paragraphs.append(block)

    # Join paragraphs with a double newline so you still have some structure
    return "\n\n".join(normalized_paragraphs)


def clean_lines_remove_page_numbers(text: str) -> str:
    """
    Remove typical standalone page-number lines like '1', '12', 'Page 3', '3 / 10'.
    """
    cleaned_lines = []
    for line in text.splitlines():
        stripped = line.strip()
        if re.fullmatch(r"\d{1,3}", stripped):
            continue
        if re.fullmatch(r"Page\s+\d{1,3}", stripped, flags=re.IGNORECASE):
            continue
        if re.fullmatch(r"\d{1,3}\s*/\s*\d{1,3}", stripped):
            continue
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines)


def extract_clean_text_from_pdf(
    pdf_path: str,
    header_height_ratio: float = 0.08,
    footer_height_ratio: float = 0.08,
    x_tolerance: float = 1.0,
    y_tolerance: float = 3.0,
) -> str:
    """
    Extract cleaned text from a PDF, page by page.

    - Crops top/bottom margins to drop headers/footers.
    - Uses pdfplumber's text reconstruction with tolerances.
    - Cleans page numbers, then normalizes whitespace globally.
    """
    pdf_path = Path(pdf_path)
    all_pages_raw = []

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            width = page.width
            height = page.height

            top_crop = header_height_ratio * height
            bottom_crop = height - footer_height_ratio * height
            main_region = page.crop((0, top_crop, width, bottom_crop))

            page_text = main_region.extract_text(
                x_tolerance=x_tolerance,
                y_tolerance=y_tolerance,
            ) or ""

            page_text = clean_lines_remove_page_numbers(page_text)
            if page_text.strip():
                all_pages_raw.append(page_text)

    joined_text = "\n\n".join(all_pages_raw)
    cleaned_text = normalize_whitespace(joined_text)
    return cleaned_text
