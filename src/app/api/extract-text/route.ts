import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import * as pdfjslib from 'pdfjs-dist/legacy/build/pdf.js';
import type { PDFDocumentProxy } from 'pdfjs-dist';

// Configure PDF.js for Node.js environment
const pdfjs = pdfjslib as any;
pdfjs.GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.js';

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
    
    // Handle text files directly
    if (fileExtension === 'txt' || fileExtension === 'md' || fileExtension === 'js' || 
        fileExtension === 'ts' || fileExtension === 'jsx' || fileExtension === 'tsx' ||
        fileExtension === 'py' || fileExtension === 'java' || fileExtension === 'cpp' ||
        fileExtension === 'c' || fileExtension === 'cs' || fileExtension === 'go' ||
        fileExtension === 'rs' || fileExtension === 'php' || fileExtension === 'rb' ||
        fileExtension === 'swift' || fileExtension === 'kt' || fileExtension === 'scala' ||
        fileExtension === 'pl' || fileExtension === 'hs' || fileExtension === 'm' ||
        fileExtension === 'r' || fileExtension === 'sql' || fileExtension === 'html' ||
        fileExtension === 'css' || fileExtension === 'json' || fileExtension === 'xml' ||
        fileExtension === 'yaml' || fileExtension === 'yml') {
      
      const text = await file.text();
      return NextResponse.json({ text });
    }
    
    // Handle DOCX files using mammoth.js
    if (fileExtension === 'docx') {
      try {
        const result = await mammoth.extractRawText({ arrayBuffer: fileBuffer });
        const text = result.value;
        
        if (!text || text.trim().length === 0) {
          return NextResponse.json({
            text: `Document appears to be empty or contains no extractable text.\n\nFile: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB`
          });
        }
        
        return NextResponse.json({ text });
      } catch (error) {
        console.error('DOCX extraction error:', error);
        return NextResponse.json({
          text: `Failed to extract text from DOCX file. The file may be corrupted or password-protected.\n\nFile: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\n\nPlease download the file to view its content.`
        });
      }
    }
    
    // Handle PDF files using pdf.js
    if (fileExtension === 'pdf') {
      try {
        const pdf: PDFDocumentProxy = await pdfjs.getDocument({ data: fileBuffer }).promise;
        const numPages = pdf.numPages;
        let fullText = '';
        
        // Extract text from all pages
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          fullText += pageText + '\n';
        }
        
        if (!fullText || fullText.trim().length === 0) {
          return NextResponse.json({
            text: `PDF appears to be empty or contains no extractable text (may be image-based).\n\nFile: ${file.name}\nPages: ${numPages}\nSize: ${(file.size / 1024).toFixed(1)} KB`
          });
        }
        
        return NextResponse.json({ text: fullText.trim() });
      } catch (error) {
        console.error('PDF extraction error:', error);
        return NextResponse.json({
          text: `Failed to extract text from PDF file. The file may be corrupted, password-protected, or image-based.\n\nFile: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB\n\nPlease download the file to view its content.`
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
