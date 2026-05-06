import { NextRequest, NextResponse } from 'next/server';

// Force Node.js runtime — mammoth and pdf-parse are Node-only packages
// and will crash on Edge runtime
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileBuffer = await file.arrayBuffer();

    // Handle plain text / code files directly
    if (
      fileExtension === 'txt'  || fileExtension === 'md'   ||
      fileExtension === 'js'   || fileExtension === 'ts'   ||
      fileExtension === 'jsx'  || fileExtension === 'tsx'  ||
      fileExtension === 'py'   || fileExtension === 'java' ||
      fileExtension === 'cpp'  || fileExtension === 'c'    ||
      fileExtension === 'cs'   || fileExtension === 'go'   ||
      fileExtension === 'rs'   || fileExtension === 'php'  ||
      fileExtension === 'rb'   || fileExtension === 'swift'||
      fileExtension === 'kt'   || fileExtension === 'scala'||
      fileExtension === 'pl'   || fileExtension === 'hs'   ||
      fileExtension === 'm'    || fileExtension === 'r'    ||
      fileExtension === 'sql'  || fileExtension === 'html' ||
      fileExtension === 'css'  || fileExtension === 'json' ||
      fileExtension === 'xml'  || fileExtension === 'yaml' ||
      fileExtension === 'yml'
    ) {
      const text = await file.text();
      return NextResponse.json({ text });
    }

    // Handle DOCX files
    // require() inside function body — mammoth accesses the filesystem at
    // import time and will crash if bundled at the module level by Next.js
    if (fileExtension === 'docx') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mammoth = require('mammoth') as {
          extractRawText: (opts: { arrayBuffer: ArrayBuffer }) => Promise<{
            value: string;
            messages: unknown[];
          }>;
        };

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
    // Same reason as mammoth — require() must stay inside the function
    if (fileExtension === 'pdf') {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pdfParse = require('pdf-parse') as (
          buffer: Buffer,
          options?: Record<string, unknown>
        ) => Promise<{ text: string; numpages: number }>;

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

    return NextResponse.json(
      { error: 'Unsupported file type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error extracting text:', error);
    return NextResponse.json(
      { error: 'Failed to extract text from file' },
      { status: 500 }
    );
  }
}