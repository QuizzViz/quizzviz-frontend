import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

// pdf-parse doesn't support ESM default import — use require instead
const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{
  text: string;
  numpages: number;
}>;

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

    // Handle DOCX files using mammoth.js
    if (fileExtension === 'docx') {
      try {
        console.log('Starting DOCX extraction for file:', file.name, 'Size:', file.size);
        console.log('FileBuffer type:', typeof fileBuffer, 'Length:', fileBuffer.byteLength);
        
        const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
        console.log('Mammoth extraction result:', { 
          value: result.value?.substring(0, 100), 
          messages: result.messages 
        });
        
        const text = result.value;

        if (!text || text.trim().length === 0) {
          console.log('DOCX extraction returned empty text');
          return NextResponse.json({
            text: `Document appears to be empty or contains no extractable text.\n\nFile: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB`,
          });
        }

        console.log('DOCX extraction successful, text length:', text.length);
        return NextResponse.json({ text });
      } catch (error) {
        console.error('DOCX extraction error:', error);
        console.error('Error details:', {
          message: (error as Error)?.message,
          stack: (error as Error)?.stack,
          name: (error as Error)?.name
        });
        return NextResponse.json({
          text: `Failed to extract text from DOCX file. The file may be corrupted or password-protected.\n\nFile: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\n\nError: ${(error as Error)?.message || 'Unknown error'}\n\nPlease download the file to view its content.`,
        });
      }
    }

    // Handle PDF files using pdf-parse
    if (fileExtension === 'pdf') {
      try {
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
        return NextResponse.json({
          text: `Failed to extract text from PDF file. The file may be corrupted, password-protected, or image-based.\n\nFile: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\n\nPlease download the file to view its content.`,
        });
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