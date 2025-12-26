import 'jspdf';
import 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: {
      pageNumber: number;
      finalY?: number;
      [key: string]: any;
    };
  }
}
