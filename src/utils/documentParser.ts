/**
 * Document parser for text and PDF files
 * For PDFs, reads as binary ArrayBuffer for proper parsing
 * For text files, reads as UTF-8 text
 */
export const parse_document = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          // For PDFs, we read as ArrayBuffer and will need backend processing
          // Return a marker that indicates PDF needs server-side parsing
          resolve('__PDF_FILE__');
        } else {
          // For text files, return the content directly
          const text = event.target?.result as string;
          resolve(text);
        }
      } catch (error) {
        reject(new Error('Failed to process file'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    // Read PDFs as ArrayBuffer, text files as text
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      reader.readAsArrayBuffer(file);
    } else if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      reject(new Error('Unsupported file type. Please upload PDF or TXT files.'));
    }
  });
};
