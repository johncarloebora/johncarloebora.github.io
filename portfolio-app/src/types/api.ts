// ============================================================
// API Response Types — Worker API contract
// ============================================================

export interface ApiSuccess<T = unknown> {
  success: true;
  data?: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// Auth
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: { id: number; username: string; email: string };
}

export interface MeResponse {
  id: number;
  username: string;
  email: string;
}

// Media Upload
export interface UploadResponse {
  id: number;
  folder: string;
  filename: string;
  url: string;
  size: number;
  mime_type: string;
  alt_text: string;
}

// Reorder
export interface ReorderRequest {
  ids: number[];
}

// Settings
export interface SettingRecord {
  key: string;
  value: string;
}

// Publish
export interface PublishResponse {
  url: string;
  published_at: string;
}
