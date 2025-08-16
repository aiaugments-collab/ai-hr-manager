declare module 'pdf-parse' {
  interface PDFInfo {
    PDFFormatVersion: string;
    IsAcroFormPresent: boolean;
    IsXFAPresent: boolean;
    Title?: string;
    Author?: string;
    Subject?: string;
    Creator?: string;
    Producer?: string;
    CreationDate?: Date;
    ModDate?: Date;
  }

  interface PDFMetadata {
    info: PDFInfo;
    metadata: any;
    version: string;
  }

  interface PDFData {
    numpages: number;
    numrender: number;
    info: PDFInfo;
    metadata: PDFMetadata;
    version: string;
    text: string;
  }

  interface PDFOptions {
    pagerender?: (pageData: any) => string;
    max?: number;
    version?: string;
  }

  function pdfParse(buffer: Buffer, options?: PDFOptions): Promise<PDFData>;
  export = pdfParse;
}

declare module 'mammoth' {
  interface ConvertResult {
    value: string;
    messages: any[];
  }
  export function extractRawText(options: { buffer: Buffer }): Promise<ConvertResult>;
}
