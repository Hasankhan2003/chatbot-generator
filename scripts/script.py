import pdfplumber
import re
from typing import Dict, List, Optional
import sys

class PDFTextExtractor:
    """
    A robust PDF text extractor that handles various PDF structures including
    tables, headers, footers, and different layouts.
    """
    
    def __init__(self, pdf_path: str, table_format: str = 'html'):
        self.pdf_path = pdf_path
        self.pages_data = []
        self.table_format = table_format  # 'html' or 'markdown'
        
    def is_likely_header_footer(self, text: str, threshold: int = 100) -> bool:
        """
        Detect if text is likely a header or footer based on length and patterns.
        
        Args:
            text (str): Text to check
            threshold (int): Character threshold for header/footer
            
        Returns:
            bool: True if likely header/footer
        """
        if not text or len(text.strip()) > threshold:
            return False
            
        # Common header/footer patterns
        patterns = [
            r'^\d+$',  # Just page numbers
            r'page\s*\d+',  # "Page 1", "page 2"
            r'\d+\s*of\s*\d+',  # "1 of 10"
            r'©.*\d{4}',  # Copyright notices
            r'^chapter\s+\d+',  # Chapter headings
        ]
        
        text_lower = text.lower().strip()
        for pattern in patterns:
            if re.search(pattern, text_lower):
                return True
                
        return False
    
    def extract_tables(self, page) -> List[List[List[str]]]:
        """
        Extract tables from a page.
        
        Args:
            page: pdfplumber page object
            
        Returns:
            List of tables (each table is a list of rows)
        """
        tables = []
        try:
            extracted_tables = page.extract_tables()
            if extracted_tables:
                for table in extracted_tables:
                    if table:  # Make sure table is not empty
                        # Clean up None values and empty strings
                        cleaned_table = [
                            [cell.strip() if cell else '' for cell in row]
                            for row in table if row
                        ]
                        tables.append(cleaned_table)
        except Exception as e:
            print(f"Warning: Error extracting tables: {str(e)}")
        
        return tables
    
    def format_table(self, table: List[List[str]], format_type: str = 'html') -> str:
        """
        Format a table as a readable string in HTML-like or markdown structure.
        
        Args:
            table: List of rows (each row is a list of cells)
            format_type: 'html' or 'markdown'
            
        Returns:
            Formatted table string
        """
        if not table:
            return ""
        
        if format_type == 'html':
            return self._format_table_html(table)
        else:
            return self._format_table_markdown(table)
    
    def _format_table_html(self, table: List[List[str]]) -> str:
        """
        Format table as HTML-like text structure (unstyled, just tags).
        
        Args:
            table: List of rows (each row is a list of cells)
            
        Returns:
            HTML-like formatted string
        """
        formatted = "\n<table>\n"
        
        for row_idx, row in enumerate(table):
            formatted += "  <tr>\n"
            
            # First row is typically header
            tag = "th" if row_idx == 0 else "td"
            
            for cell in row:
                cell_content = str(cell).strip() if cell else ""
                formatted += f"    <{tag}>{cell_content}</{tag}>\n"
            
            formatted += "  </tr>\n"
        
        formatted += "</table>\n"
        return formatted
    
    def _format_table_markdown(self, table: List[List[str]]) -> str:
        """
        Format table as markdown structure.
        
        Args:
            table: List of rows (each row is a list of cells)
            
        Returns:
            Markdown formatted string
        """
        if not table:
            return ""
        
        # Calculate column widths
        col_widths = []
        num_cols = max(len(row) for row in table)
        
        for col_idx in range(num_cols):
            max_width = max(
                len(str(row[col_idx]).strip()) if col_idx < len(row) else 0 
                for row in table
            )
            col_widths.append(max(max_width, 3))  # Minimum width of 3
        
        formatted = "\n"
        
        for row_idx, row in enumerate(table):
            # Format cells in row
            cells = []
            for col_idx in range(num_cols):
                cell_content = str(row[col_idx]).strip() if col_idx < len(row) and row[col_idx] else ""
                cells.append(f" {cell_content:<{col_widths[col_idx]}} ")
            
            formatted += "|" + "|".join(cells) + "|\n"
            
            # Add separator after header row
            if row_idx == 0:
                separators = ["-" * (w + 2) for w in col_widths]
                formatted += "|" + "|".join(separators) + "|\n"
        
        formatted += "\n"
        return formatted
    
    def clean_text(self, text: str) -> str:
        """
        Clean extracted text by removing excessive whitespace and normalizing.
        
        Args:
            text (str): Raw text
            
        Returns:
            Cleaned text
        """
        if not text:
            return ""
        
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Fix common OCR issues
        text = text.replace('ﬁ', 'fi').replace('ﬂ', 'fl')
        
        # Normalize line breaks
        text = re.sub(r'\n\s*\n\s*\n+', '\n\n', text)
        
        return text.strip()
    
    def extract_page_content(self, page, page_num: int, 
                            remove_headers_footers: bool = True) -> Dict:
        """
        Extract all content from a single page including text and tables.
        
        Args:
            page: pdfplumber page object
            page_num (int): Page number
            remove_headers_footers (bool): Whether to attempt removing headers/footers
            
        Returns:
            Dictionary containing page data
        """
        page_data = {
            'page_number': page_num,
            'text': '',
            'tables': [],
            'has_tables': False
        }
        
        try:
            # Extract tables first
            tables = self.extract_tables(page)
            if tables:
                page_data['has_tables'] = True
                page_data['tables'] = tables
            
            # Extract text
            text = page.extract_text()
            
            if text:
                # Split into lines for header/footer detection
                lines = text.split('\n')
                
                if remove_headers_footers and len(lines) > 3:
                    # Check first and last lines for headers/footers
                    if self.is_likely_header_footer(lines[0]):
                        lines = lines[1:]
                    if self.is_likely_header_footer(lines[-1]):
                        lines = lines[:-1]
                
                text = '\n'.join(lines)
                page_data['text'] = self.clean_text(text)
        
        except Exception as e:
            print(f"Warning: Error processing page {page_num}: {str(e)}")
        
        return page_data
    
    def extract_all(self, remove_headers_footers: bool = True) -> List[Dict]:
        """
        Extract content from all pages in the PDF.
        
        Args:
            remove_headers_footers (bool): Whether to attempt removing headers/footers
            
        Returns:
            List of page data dictionaries
        """
        try:
            with pdfplumber.open(self.pdf_path) as pdf:
                print(f"Processing PDF: {self.pdf_path}")
                print(f"Total pages: {len(pdf.pages)}\n")
                print("=" * 80)
                
                for page_num, page in enumerate(pdf.pages, start=1):
                    page_data = self.extract_page_content(
                        page, page_num, remove_headers_footers
                    )
                    self.pages_data.append(page_data)
                    
        except Exception as e:
            print(f"Error: Failed to process PDF: {str(e)}")
            return []
        
        return self.pages_data
    
    def print_page(self, page_data: Dict):
        """
        Print formatted page content.
        
        Args:
            page_data (Dict): Page data dictionary
        """
        print(f"\n--- Page {page_data['page_number']} ---\n")
        
        if page_data['text']:
            print(page_data['text'])
        
        if page_data['has_tables']:
            for table_idx, table in enumerate(page_data['tables'], start=1):
                print(f"\n{self.format_table(table, self.table_format)}")
        
        print("\n" + "=" * 80)
    
    def print_all(self):
        """Print all extracted pages."""
        for page_data in self.pages_data:
            self.print_page(page_data)
    
    def get_full_text(self, include_tables: bool = True) -> str:
        """
        Get all text from the PDF as a single string.
        
        Args:
            include_tables (bool): Whether to include formatted tables
            
        Returns:
            Complete text content
        """
        full_text = []
        
        for page_data in self.pages_data:
            if page_data['text']:
                full_text.append(page_data['text'])
            
            if include_tables and page_data['has_tables']:
                for table in page_data['tables']:
                    full_text.append(self.format_table(table, self.table_format))
        
        return '\n\n'.join(full_text)


def main():
    """Main function to run the PDF extractor."""
    if len(sys.argv) < 2:
        print("Usage: python script.py <path_to_pdf_file> [--keep-headers-footers]")
        print("Example: python script.py document.pdf")
        print("\nOptions:")
        print("  --keep-headers-footers    Don't attempt to remove headers/footers")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    remove_headers_footers = '--keep-headers-footers' not in sys.argv
    
    # Create extractor and process PDF
    extractor = PDFTextExtractor(pdf_path)
    extractor.extract_all(remove_headers_footers=remove_headers_footers)
    
    # Print all pages
    extractor.print_all()
    
    # Optional: Get full text as a single string
    full_text = extractor.get_full_text()
    print("\n\n=== FULL DOCUMENT TEXT ===\n")
    print(full_text)


if __name__ == "__main__":
    main()