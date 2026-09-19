import mammoth from "mammoth";

export interface ParsedDocument {
  text: string;
  pdfBase64?: string;
  fileType: string;
  fileName: string;
}

export async function parseDocumentBuffer(
  buffer: Buffer,
  fileName: string,
  mimeType?: string
): Promise<ParsedDocument> {
  const lowerName = fileName.toLowerCase();

  // Handle PDF files
  if (lowerName.endsWith(".pdf") || mimeType === "application/pdf") {
    let extractedText = "";
    try {
      const pdfModule = await import("pdf-parse");
      // pdf-parse v2 support
      if (pdfModule && (pdfModule as any).PDFParse) {
        const parser: any = new (pdfModule as any).PDFParse({ data: buffer });
        if (typeof parser.load === "function") {
          await parser.load();
        }
        if (typeof parser.getText === "function") {
          const textResult = await parser.getText();
          extractedText = typeof textResult === "string" ? textResult : (textResult?.text || "");
        }
      } else if (typeof pdfModule === "function") {
        const data = await (pdfModule as any)(buffer);
        extractedText = data.text || "";
      } else if (typeof (pdfModule as any).default === "function") {
        const data = await (pdfModule as any).default(buffer);
        extractedText = data.text || "";
      }
    } catch (e) {
      console.warn("pdf-parse text extraction note (falling back to multimodal PDF ingestion):", e);
    }

    return {
      text: extractedText.trim(),
      pdfBase64: buffer.toString("base64"),
      fileType: "pdf",
      fileName,
    };
  }

  // Handle DOCX files
  if (
    lowerName.endsWith(".docx") ||
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return {
        text: result.value.trim(),
        fileType: "docx",
        fileName,
      };
    } catch (e) {
      console.error("Mammoth DOCX parsing error:", e);
      return {
        text: "",
        fileType: "docx",
        fileName,
      };
    }
  }

  // Handle DOC files (try mammoth or utf8 extraction)
  if (lowerName.endsWith(".doc")) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      if (result.value && result.value.trim().length > 0) {
        return {
          text: result.value.trim(),
          fileType: "doc",
          fileName,
        };
      }
    } catch {
      // Fallback
    }
    const raw = buffer.toString("utf8").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " ");
    return {
      text: raw.trim(),
      fileType: "doc",
      fileName,
    };
  }

  // Plain text / Markdown
  const text = buffer.toString("utf8");
  return {
    text: text.trim(),
    fileType: "txt",
    fileName,
  };
}
