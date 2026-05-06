import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
const pkg = await import('pdf-parse/package.json');
console.log('PDF PARSE VERSION:', pkg.version);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

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

   if (fileExtension === 'docx') {
  try {
    // safer import (prevents weird bundling bugs)
    const mammoth = await import('mammoth');

    if (!buffer || buffer.length === 0) {
      throw new Error('Empty file buffer');
    }

    const result = await mammoth.extractRawText({
      buffer: buffer,
    });

    const text = result.value?.trim();

    if (!text) {
      return NextResponse.json({
        text: 'No readable text found in DOCX (might be empty or unsupported format)',
      });
    }

    return NextResponse.json({ text });

  } catch (error) {
    console.error('DOCX FULL ERROR:', error);
    console.error('DOCX STACK:', (error as Error).stack);

    return NextResponse.json(
      {
        error: 'DOCX parsing failed',
        detail: String(error),
      },
      { status: 500 }
    );
  }
}

 if (fileExtension === 'pdf') {
  try {
    console.log('PDF Processing - File size:', buffer.length, 'bytes');
    console.log('PDF Processing - File name:', file.name);
    
    // Check if buffer is valid
    if (!buffer || buffer.length === 0) {
      throw new Error('Empty PDF file');
    }
    
    // Check minimum PDF size (PDF header is at least 5 bytes)
    if (buffer.length < 5) {
      throw new Error('File too small to be a valid PDF');
    }
    
    // Check PDF signature
    const pdfSignature = buffer.toString('utf8', 0, 5);
    if (pdfSignature !== '%PDF-') {
      console.error('Invalid PDF signature:', pdfSignature);
      throw new Error('Invalid PDF format - missing PDF signature');
    }
    
    const pdfParse = (await import('pdf-parse')).default;
    console.log('PDF parser imported successfully');

    const data = await pdfParse(buffer);
    console.log('PDF parsed successfully, text length:', data.text?.length || 0);
    console.log('PDF text preview:', data.text?.substring(0, 100) || 'NO TEXT');
    
    if (!data.text || data.text.trim().length === 0) {
      return NextResponse.json({
        text: 'This PDF appears to be empty or contains only images. No text could be extracted.',
      });
    }
    
    return NextResponse.json({
      text: data.text.trim(),
    });

  } catch (err) {
    console.error('PDF Processing Error:', err);
    console.error('Error details:', {
      message: (err as Error).message,
      stack: (err as Error).stack,
      fileName: file.name,
      fileSize: buffer.length
    });
    
    // Return a user-friendly error message instead of throwing
    return NextResponse.json({
      text: `Unable to extract text from this PDF. The file may be corrupted, password-protected, or contain only images. Error: ${(err as Error).message}`,
    });
  }
}

    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });

  }catch (error) {
  console.error('FULL ERROR:', error);
  console.error('STACK:', (error as Error).stack);

  return NextResponse.json(
    {
      error: 'PDF parsing failed',
      detail: String(error),
    },
    { status: 500 }
  );
}
}