// Asset Schema & Universal Asset Types for HNL Creative AI Studio

export type AssetType =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "logo"
  | "product"
  | "character"
  | "font"
  | "other";

export type AssetOrigin =
  | "USER_UPLOAD"
  | "AI_GENERATED"
  | "AI_MODIFIED"
  | "DOCUMENT_EXTRACTED"
  | "TEMPLATE_DEFAULT";

export type AssetCategory =
  | "images"
  | "videos"
  | "audio"
  | "documents"
  | "logos"
  | "products"
  | "characters"
  | "generated"
  | "favorites";

export interface SmartAssetAnalysis {
  description?: string;
  tags: string[];
  detectedElements: {
    objects: string[];
    peopleCount: number;
    clothing?: string[];
    scene?: string;
    dominantColors?: string[];
    ocrText?: string;
  };
  suggestedRoles?: Array<"Character" | "Clothing" | "Environment" | "Product" | "Motion" | "Audio" | "B-roll" | "Logo">;
  analyzedAt?: number;
  aiProvider?: string;
}

export interface ExtractedDocumentData {
  pageCount?: number;
  headings?: string[];
  paragraphs?: string[];
  tables?: Array<{
    sheetName?: string;
    headers: string[];
    rows: any[][];
  }>;
  rawText?: string;
  pages?: Array<{ pageNumber: number; text: string; headings?: string[] }>;
  sourceFormat?: string;
  warnings?: string[];
  charts?: any[];
  imagesExtracted?: number;
}

export interface AssetSchema {
  id: string;
  name: string;
  filename: string;
  type: AssetType;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  fps?: number;
  hasAudio?: boolean;
  sampleRate?: number;
  createdAt: number;
  origin: AssetOrigin;
  url: string;
  storageKey?: string;
  proxyUrl?: string;
  thumbnailUrl?: string;
  tags: string[];
  referenceTag?: string;
  isFavorite?: boolean;
  analysis?: SmartAssetAnalysis;
  documentData?: ExtractedDocumentData;
  waveform?: number[];
  parentAssetId?: string;
  versionTree?: {
    version: string;
    parentId?: string;
    notes?: string;
    timestamp: number;
  };
}
