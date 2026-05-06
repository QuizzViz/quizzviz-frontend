import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileBuffer = await file.arrayBuffer();

    // Handle plain text / code files directly
    const textExtensions = new Set([
      'txt', 'md', 'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'go',
      'rs', 'php', 'rb', 'swift', 'kt', 'scala', 'pl', 'hs', 'm', 'r', 'sql',
      'html', 'css', 'json', 'xml', 'yaml', 'yml',
    ]);

    if (fileExtension && textExtensions.has(fileExtension)) {
      const text = await file.text();
      return NextResponse.json({ text });
    }

    // Handle DOCX files
    if (fileExtension === 'docx') {
      try {
        const mammoth = await import('mammoth');
        const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
        const text = result.value;

        if (!text || text.trim().length === 0) {
          return NextResponse.json({
            text: `Document appears to be empty or contains no extractable text.\n\nFile: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB`,
          });
        }

        return NextResponse.json({ text });
      } catch (error) {
        console.error('DOCX extraction error:', error);
        return NextResponse.json(
          {
            error: 'Failed to extract text from DOCX file',
            detail: (error as Error)?.message || 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    // Handle PDF files
    if (fileExtension === 'pdf') {
      try {
        type PdfParseFn = (
          buffer: Buffer,
          options?: Record<string, unknown>
        ) => Promise<{ text: string; numpages: number }>;

        const pdfParseModule = await import('pdf-parse');
        const pdfParse: PdfParseFn = pdfParseModule.default ?? pdfParseModule;

        const pdfData = await pdfParse(Buffer.from(fileBuffer));
        const text = pdfData.text;

        if (!text || text.trim().length === 0) {
          return NextResponse.json({
            text: `PDF appears to be empty or contains no extractable text (may be image-based).\n\nFile: ${file.name}\nPages: ${pdfData.numpages}\nSize: ${(file.size / 1024).toFixed(1)} KB`,
          });
        }

        return NextResponse.json({ text: text.trim() });
      } catch (error) {
        console.error('PDF extraction error:', error);
        return NextResponse.json(
          {
            error: 'Failed to extract text from PDF file',
            detail: (error as Error)?.message || 'Unknown error',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });

  } catch (error) {
    console.error('Error extracting text:', error);
    return NextResponse.json({ error: 'Failed to extract text from file' }, { status: 500 });
  }
}