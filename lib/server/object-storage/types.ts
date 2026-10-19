export type StoredObjectStatus = "quarantined" | "approved" | "rejected";
export type StoredObjectScope = "avatar" | "project" | "chat" | "attachment" | "document";

export type StoredObjectScan = {
  passed: boolean;
  checks: string[];
  warnings: string[];
  scannedAt: string;
};

export type StoredObjectMetadata = {
  id: string;
  ownerAccountId: string;
  scope: StoredObjectScope;
  originalName: string;
  safeName: string;
  storedName: string;
  extension: string;
  mimeType: string;
  size: number;
  sha256: string;
  status: StoredObjectStatus;
  width?: number;
  height?: number;
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedByAccountId?: string;
  rejectionReason?: string;
  scan: StoredObjectScan;
};

export type ObjectStorageHealth = {
  driver: "local-file";
  location: string;
  writable: boolean;
  objects: number;
  quarantined: number;
  approved: number;
  rejected: number;
  warning: string;
};
