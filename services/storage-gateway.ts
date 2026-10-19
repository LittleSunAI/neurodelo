"use client";

export type UploadedFileRecord = {
  id: string;
  originalName: string;
  safeName: string;
  mimeType: string;
  size: number;
  status: "quarantined" | "approved" | "rejected";
  width?: number;
  height?: number;
};

async function readApiError(response: Response) {
  const payload = await response.json().catch(() => null) as { error?: string } | null;
  return payload?.error || `HTTP ${response.status}`;
}

export async function uploadProtectedFile(file: File, scope: "avatar" | "project" | "chat" | "attachment" | "document" = "attachment") {
  const form = new FormData();
  form.set("file", file);
  form.set("scope", scope);
  const response = await fetch("/api/v1/files", { method: "POST", body: form, credentials: "same-origin" });
  if (!response.ok) throw new Error(await readApiError(response));
  const payload = await response.json() as { metadata: UploadedFileRecord; deduplicated: boolean };
  return payload;
}

export async function downloadPortableData() {
  const response = await fetch("/api/v1/portable-data?download=1", { credentials: "same-origin" });
  if (!response.ok) throw new Error(await readApiError(response));
  return response.blob();
}

export async function importPortableDataFile(file: File, dryRun = false) {
  if (file.size > 5 * 1024 * 1024) throw new Error("Файл экспорта превышает 5 МБ");
  const text = await file.text();
  let envelope: unknown;
  try { envelope = JSON.parse(text); } catch { throw new Error("Файл не является корректным JSON"); }
  const response = await fetch("/api/v1/portable-data", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ envelope, dryRun }),
  });
  if (!response.ok) throw new Error(await readApiError(response));
  return response.json() as Promise<{ ok: true; dryRun: boolean; summary: { projects: number; notifications: number; nickname: string } }>;
}

export function protectedFileDownloadUrl(id: string) {
  return `/api/v1/files/${encodeURIComponent(id)}?download=1`;
}
