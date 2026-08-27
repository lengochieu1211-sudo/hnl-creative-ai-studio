// Document & Spreadsheet Parsing Engine for HNL Creative AI Studio
// Real parsers for PDF, DOCX, PPTX, XLS/XLSX/CSV, JSON/Markdown/Text.

import * as XLSX from "xlsx";
import JSZip from "jszip";
import { ExtractedDocumentData } from "../types/asset";

const cleanXmlText = (xml: string) =>
  xml
    .replace(/<w:tab\/?\s*>/g, "\t")
    .replace(/<w:br\/?\s*>/g, "\n")
    .replace(/<a:br\/?\s*>/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();

const splitParagraphs = (text: string) =>
  text.split(/\n{2,}|(?<=\.)\s+(?=[A-ZÀ-Ỹ0-9])/u).map((p) => p.trim()).filter(Boolean);

const detectHeadings = (paragraphs: string[]) =>
  paragraphs.filter((p) => /^#{1,6}\s+/.test(p) || (p.length <= 90 && !/[.!?]$/.test(p))).slice(0, 50);

export class DocumentParser {
  static async parseDocument(file: File): Promise<ExtractedDocumentData> {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (["xlsx", "xls", "csv"].includes(ext)) return this.parseSpreadsheet(file);
    if (ext === "pdf") return this.parsePdf(file);
    if (ext === "docx") return this.parseDocx(file);
    if (ext === "pptx") return this.parsePptx(file);
    if (["txt", "md", "json"].includes(ext)) return this.parseTextDocument(file);
    if (["doc", "ppt"].includes(ext)) {
      throw new Error(`Legacy .${ext} is not parsed directly in the browser. Please convert it to .${ext === "doc" ? "docx" : "pptx"} first.`);
    }
    return this.parseTextDocument(file);
  }

  static async parseSpreadsheet(file: File): Promise<ExtractedDocumentData> {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: true });
    const tables: Array<{ sheetName: string; headers: string[]; rows: any[][] }> = [];
    const paragraphs: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, raw: false, defval: "" });
      if (jsonData.length === 0) continue;
      const headers = (jsonData[0] || []).map((h) => String(h ?? ""));
      const rows = jsonData.slice(1);
      tables.push({ sheetName, headers, rows });
      paragraphs.push(`Sheet: ${sheetName} (${rows.length} rows)`);
      rows.slice(0, 50).forEach((row, idx) => {
        const rowText = headers.map((h, i) => `${h || `Column ${i + 1}`}: ${row[i] ?? ""}`).join(" | ");
        paragraphs.push(`Row ${idx + 1}: ${rowText}`);
      });
    }

    return {
      pageCount: workbook.SheetNames.length,
      headings: workbook.SheetNames,
      paragraphs,
      tables,
      rawText: paragraphs.join("\n"),
      sourceFormat: file.name.split(".").pop()?.toLowerCase()
    };
  }

  static async parsePdf(file: File): Promise<ExtractedDocumentData> {
    const [{ GlobalWorkerOptions, getDocument }, workerModule] = await Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url")
    ]);
    GlobalWorkerOptions.workerSrc = workerModule.default;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const pdf = await getDocument({ data: bytes }).promise;
    const pages: NonNullable<ExtractedDocumentData["pages"]> = [];
    const paragraphs: string[] = [];
    const headings: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => (typeof item.str === "string" ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      const pageParagraphs = splitParagraphs(pageText);
      const pageHeadings = detectHeadings(pageParagraphs);
      pages.push({ pageNumber, text: pageText, headings: pageHeadings });
      paragraphs.push(...pageParagraphs.map((p) => `[Page ${pageNumber}] ${p}`));
      headings.push(...pageHeadings.map((h) => `[Page ${pageNumber}] ${h}`));
    }

    return {
      pageCount: pdf.numPages,
      headings: headings.slice(0, 100),
      paragraphs,
      pages,
      rawText: pages.map((p) => `--- Page ${p.pageNumber} ---\n${p.text}`).join("\n\n"),
      sourceFormat: "pdf"
    };
  }

  static async parseDocx(file: File): Promise<ExtractedDocumentData> {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const documentXml = await zip.file("word/document.xml")?.async("text");
    if (!documentXml) throw new Error("DOCX document.xml is missing or corrupt.");
    const paragraphXml = documentXml.match(/<w:p[\s\S]*?<\/w:p>/g) || [];
    const paragraphs = paragraphXml.map(cleanXmlText).filter(Boolean);
    const headings = detectHeadings(paragraphs);
    return {
      pageCount: undefined,
      headings,
      paragraphs,
      rawText: paragraphs.join("\n\n"),
      sourceFormat: "docx",
      warnings: ["DOCX page numbers are layout-dependent; source traceability uses paragraph/heading order instead of physical pages."]
    };
  }

  static async parsePptx(file: File): Promise<ExtractedDocumentData> {
    const zip = await JSZip.loadAsync(await file.arrayBuffer());
    const slidePaths = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => Number(a.match(/slide(\d+)/)?.[1] || 0) - Number(b.match(/slide(\d+)/)?.[1] || 0));
    if (slidePaths.length === 0) throw new Error("No PPTX slides were found.");

    const pages: NonNullable<ExtractedDocumentData["pages"]> = [];
    const paragraphs: string[] = [];
    const headings: string[] = [];
    for (let i = 0; i < slidePaths.length; i++) {
      const xml = await zip.file(slidePaths[i])!.async("text");
      const runs = Array.from(xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)).map((m) => cleanXmlText(m[1]));
      const text = runs.filter(Boolean).join("\n");
      const slideParagraphs = text.split("\n").map((p) => p.trim()).filter(Boolean);
      const slideHeadings = slideParagraphs.slice(0, 1);
      pages.push({ pageNumber: i + 1, text, headings: slideHeadings });
      headings.push(...slideHeadings.map((h) => `[Slide ${i + 1}] ${h}`));
      paragraphs.push(...slideParagraphs.map((p) => `[Slide ${i + 1}] ${p}`));
    }
    return {
      pageCount: slidePaths.length,
      headings,
      paragraphs,
      pages,
      rawText: pages.map((p) => `--- Slide ${p.pageNumber} ---\n${p.text}`).join("\n\n"),
      sourceFormat: "pptx"
    };
  }

  static async parseTextDocument(file: File): Promise<ExtractedDocumentData> {
    const text = await file.text();
    let normalized = text;
    if (file.name.toLowerCase().endsWith(".json")) {
      try { normalized = JSON.stringify(JSON.parse(text), null, 2); } catch { /* keep original invalid JSON text */ }
    }
    const paragraphs = normalized.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const headings = detectHeadings(paragraphs);
    return {
      pageCount: Math.max(1, Math.ceil(paragraphs.length / 10)),
      headings,
      paragraphs,
      rawText: normalized,
      sourceFormat: file.name.split(".").pop()?.toLowerCase()
    };
  }
}
