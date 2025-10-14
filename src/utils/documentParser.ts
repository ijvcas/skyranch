/**
 * Simple document parser for text files
 * For PDFs, we'll extract text content
 */
export const parse_document = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target?.result as string;
      resolve(text);
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    // For text files, read as text
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // For PDFs, we'll read as text (basic extraction)
      // In a real scenario, you'd want a PDF parsing library
      reader.readAsText(file);
    } else {
      reject(new Error('Unsupported file type'));
    }
  });
};
