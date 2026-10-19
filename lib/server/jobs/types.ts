export type LocalJobStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";

export type LocalJob<TPayload = unknown, TResult = unknown> = {
  id: string;
  type: string;
  deduplicationKey?: string;
  payload: TPayload;
  status: LocalJobStatus;
  attempts: number;
  maxAttempts: number;
  availableAt: number;
  lockedUntil?: number;
  lockedBy?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  error?: string;
  result?: TResult;
};
