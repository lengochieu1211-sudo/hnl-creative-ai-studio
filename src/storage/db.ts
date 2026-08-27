// IndexedDB Local-First Persistence Engine for HNL Creative AI Studio
// Persists project metadata separately from binary asset blobs so project JSON stays small.

import { ProjectSchema, AssetSchema, BrandKitSchema } from "../types";

const DB_NAME = "HNLCreativeAI_Studio_DB";
const DB_VERSION = 2;
const ASSET_BLOB_STORE = "assetBlobs";

export function sanitizeProjectForPersistence(project: ProjectSchema): ProjectSchema {
  return {
    ...project,
    brandKit: {
      ...project.brandKit,
      logoUrl: project.brandKit.logoAssetId && project.brandKit.logoUrl?.startsWith("blob:") ? undefined : project.brandKit.logoUrl
    },
    pages: project.pages.map((page) => ({
      ...page,
      canvas: {
        ...page.canvas,
        backgroundImageUrl: page.canvas.backgroundImageUrl?.startsWith("blob:") ? undefined : page.canvas.backgroundImageUrl,
        elements: page.canvas.elements.map((element) => ({
          ...element,
          imageUrl: element.assetId && element.imageUrl?.startsWith("blob:") ? undefined : element.imageUrl,
          originalImageUrl: element.assetId && element.originalImageUrl?.startsWith("blob:") ? undefined : element.originalImageUrl
        }))
      }
    })),
    storyboard: {
      ...project.storyboard,
      scenes: project.storyboard.scenes.map((scene) => ({
        ...scene,
        assignedAssetUrl: scene.assignedAssetId && scene.assignedAssetUrl?.startsWith("blob:") ? undefined : scene.assignedAssetUrl,
        assignedAssetThumbnail: scene.assignedAssetId && scene.assignedAssetThumbnail?.startsWith("blob:") ? undefined : scene.assignedAssetThumbnail
      }))
    }
  };
}

class IndexedDBStorage {
  private dbPromise: Promise<IDBDatabase>;
  private runtimeObjectUrls = new Map<string, string>();

  constructor() {
    this.dbPromise = this.openDB();
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.indexedDB) {
        reject(new Error("IndexedDB is not supported in this environment"));
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains("projects")) {
          const projectStore = db.createObjectStore("projects", { keyPath: "id" });
          projectStore.createIndex("updatedAt", "updatedAt", { unique: false });
        }
        if (!db.objectStoreNames.contains("assets")) {
          const assetStore = db.createObjectStore("assets", { keyPath: "id" });
          assetStore.createIndex("type", "type", { unique: false });
          assetStore.createIndex("createdAt", "createdAt", { unique: false });
          assetStore.createIndex("origin", "origin", { unique: false });
        }
        if (!db.objectStoreNames.contains(ASSET_BLOB_STORE)) db.createObjectStore(ASSET_BLOB_STORE, { keyPath: "assetId" });
        if (!db.objectStoreNames.contains("brandKit")) db.createObjectStore("brandKit", { keyPath: "id" });
        if (!db.objectStoreNames.contains("characters")) db.createObjectStore("characters", { keyPath: "id" });
        if (!db.objectStoreNames.contains("products")) db.createObjectStore("products", { keyPath: "id" });
        if (!db.objectStoreNames.contains("history")) db.createObjectStore("history", { keyPath: "id" });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async transact<T>(storeName: string, mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.dbPromise;
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const request = work(tx.objectStore(storeName));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.onerror = () => reject(tx.error);
    });
  }

  async saveProject(project: ProjectSchema): Promise<void> {
    const persisted = { ...sanitizeProjectForPersistence(project), updatedAt: Date.now() };
    await this.transact("projects", "readwrite", (store) => store.put(persisted));
  }

  async getProject(id: string): Promise<ProjectSchema | null> {
    const result = await this.transact<any>("projects", "readonly", (store) => store.get(id));
    return result || null;
  }

  async getAllProjects(): Promise<ProjectSchema[]> {
    const result = await this.transact<any[]>("projects", "readonly", (store) => store.getAll());
    return (result || []).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async deleteProject(id: string): Promise<void> {
    await this.transact("projects", "readwrite", (store) => store.delete(id));
  }

  async saveAsset(asset: AssetSchema, blob?: Blob): Promise<void> {
    if (asset.url?.startsWith("blob:")) {
      const previous = this.runtimeObjectUrls.get(asset.id);
      if (previous && previous !== asset.url) URL.revokeObjectURL(previous);
      this.runtimeObjectUrls.set(asset.id, asset.url);
    }
    const metadata: AssetSchema = {
      ...asset,
      url: asset.url.startsWith("blob:") ? "" : asset.url,
      thumbnailUrl: asset.thumbnailUrl?.startsWith("blob:") ? undefined : asset.thumbnailUrl
    };
    await this.transact("assets", "readwrite", (store) => store.put(metadata));
    if (blob) {
      await this.transact(ASSET_BLOB_STORE, "readwrite", (store) =>
        store.put({ assetId: asset.id, blob, filename: asset.filename, mimeType: asset.mimeType, updatedAt: Date.now() })
      );
    }
  }

  async saveAssetBlob(assetId: string, blob: Blob, filename?: string, mimeType?: string): Promise<void> {
    await this.transact(ASSET_BLOB_STORE, "readwrite", (store) =>
      store.put({ assetId, blob, filename, mimeType, updatedAt: Date.now() })
    );
  }

  async getAssetBlob(assetId: string): Promise<Blob | null> {
    const record = await this.transact<any>(ASSET_BLOB_STORE, "readonly", (store) => store.get(assetId));
    return record?.blob || null;
  }

  private revokeRuntimeUrl(assetId: string) {
    const previous = this.runtimeObjectUrls.get(assetId);
    if (previous) URL.revokeObjectURL(previous);
    this.runtimeObjectUrls.delete(assetId);
  }

  async hydrateAsset(asset: AssetSchema): Promise<AssetSchema> {
    const blob = await this.getAssetBlob(asset.id);
    if (!blob) return asset;
    this.revokeRuntimeUrl(asset.id);
    const url = URL.createObjectURL(blob);
    this.runtimeObjectUrls.set(asset.id, url);
    return {
      ...asset,
      url,
      thumbnailUrl: asset.type === "image" || asset.type === "logo" ? url : asset.thumbnailUrl,
      storageKey: asset.id
    };
  }

  async getAllAssets(): Promise<AssetSchema[]> {
    const result = await this.transact<AssetSchema[]>("assets", "readonly", (store) => store.getAll());
    return (result || []).sort((a, b) => b.createdAt - a.createdAt);
  }

  async getAllAssetsHydrated(): Promise<AssetSchema[]> {
    const assets = await this.getAllAssets();
    return Promise.all(assets.map((asset) => this.hydrateAsset(asset)));
  }

  async deleteAsset(id: string): Promise<void> {
    this.revokeRuntimeUrl(id);
    await Promise.all([
      this.transact("assets", "readwrite", (store) => store.delete(id)),
      this.transact(ASSET_BLOB_STORE, "readwrite", (store) => store.delete(id))
    ]);
  }

  async saveBrandKit(brandKit: BrandKitSchema): Promise<void> {
    const persisted = {
      ...brandKit,
      logoUrl: brandKit.logoAssetId && brandKit.logoUrl?.startsWith("blob:") ? undefined : brandKit.logoUrl
    };
    await this.transact("brandKit", "readwrite", (store) => store.put(persisted));
  }

  async getBrandKit(id: string = "default-brand"): Promise<BrandKitSchema | null> {
    const result = await this.transact<any>("brandKit", "readonly", (store) => store.get(id));
    return result || null;
  }

  async getStorageStats(): Promise<{ projectCount: number; assetCount: number; totalEstimatedBytes: number }> {
    const [projects, assets] = await Promise.all([this.getAllProjects(), this.getAllAssets()]);
    return {
      projectCount: projects.length,
      assetCount: assets.length,
      totalEstimatedBytes: assets.reduce((acc, a) => acc + (a.size || 0), 0)
    };
  }

  disposeObjectUrls() {
    for (const url of this.runtimeObjectUrls.values()) URL.revokeObjectURL(url);
    this.runtimeObjectUrls.clear();
  }
}

export const storage = new IndexedDBStorage();
