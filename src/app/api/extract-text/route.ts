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
    const pdfParse = (await import('pdf-parse')).default;

    const data = await pdfParse(buffer);
 console.log("DATA TEXT :",data.text || '')
    return NextResponse.json({
      text: data.text || 'EMPTY',
    });

    

  } catch (err) {
    console.error('PDF CRASH:', err);
    throw err;
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