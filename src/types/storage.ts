// Storage Architecture Schema for Local-First Persistence

export interface StorageStats {
  projectCount: number;
  assetCount: number;
  totalStorageBytes: number;
  indexedDbSupported: boolean;
  opfsSupported: boolean;
}

export interface BackupPackageSchema {
  version: string;
  exportedAt: number;
  project: any;
  assetManifest: Array<{
    id: string;
    filename: string;
    type: string;
    size: number;
    mimeType: string;
  }>;
}
