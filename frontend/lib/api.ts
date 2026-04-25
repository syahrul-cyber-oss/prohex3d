export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  total?: number;
  error?: string;
  errors?: unknown;
};

export type UploadData = {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  sizeMB: number;
  url: string;
  path: string;
  uploadedAt: string;
};

export type UploadedImage = {
  filename: string;
  originalName?: string;
  size: number;
  sizeMB: number;
  url: string;
  path: string;
  createdAt: string;
  updatedAt: string;
};

export type InputImage = {
  filename: string;
  path: string;
  url: string;
};

export type OutputModel = {
  filename: string;
  path: string;
  url: string;
  downloadUrl: string;
  size?: number;
  sizeMB?: number;
  ext?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type GeneratedModel = {
  id: string;
  status: "processing" | "completed" | "failed" | string;
  provider: string;
  inputImage: InputImage | null;
  outputModel: OutputModel | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GenerateStatus = {
  id: string;
  status: string;
  error: string | null;
  outputModel: OutputModel | null;
  createdAt: string;
  updatedAt: string;
};

export type HealthResponse = {
  status: string;
  server: string;
  time: string;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
};

function buildUrl(path: string) {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const cleanBase = API_BASE_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${cleanBase}${cleanPath}`;
}

async function parseJson<T>(response: Response): Promise<ApiResponse<T>> {
  const text = await response.text();

  if (!text) {
    return {
      success: response.ok,
      message: response.ok ? "Success" : "Request failed",
    };
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      message: "Invalid JSON response from server",
    };
  }
}

async function request<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { method = "GET", body, headers, cache = "no-store" } = options;

  const response = await fetch(buildUrl(path), {
    method,
    cache,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const result = await parseJson<T>(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Request failed");
  }

  return result;
}

async function uploadRequest<T>(
  path: string,
  formData: FormData
): Promise<ApiResponse<T>> {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    body: formData,
  });

  const result = await parseJson<T>(response);

  if (!response.ok || !result.success) {
    throw new Error(result.message || "Upload failed");
  }

  return result;
}

export async function checkHealth() {
  return request<HealthResponse>("/api/health");
}

export async function uploadImage(file: File) {
  if (!file) {
    throw new Error("File is required");
  }

  const formData = new FormData();
  formData.append("image", file);

  return uploadRequest<UploadData>("/api/upload", formData);
}

export async function getUploadedImages() {
  return request<UploadedImage[]>("/api/upload");
}

export async function getUploadedImageByName(filename: string) {
  if (!filename) {
    throw new Error("Filename is required");
  }

  return request<UploadedImage>(`/api/upload/${encodeURIComponent(filename)}`);
}

export async function deleteUploadedImage(filename: string) {
  if (!filename) {
    throw new Error("Filename is required");
  }

  return request<{ filename: string }>(`/api/upload/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
}

export async function generateModelFromImage(filename: string) {
  if (!filename) {
    throw new Error("Filename is required");
  }

  return request<GeneratedModel>("/api/generate", {
    method: "POST",
    body: {
      filename,
    },
  });
}

export async function getGeneratedModels() {
  return request<GeneratedModel[]>("/api/generate");
}

export async function getGenerateStatus(id: string) {
  if (!id) {
    throw new Error("Generate ID is required");
  }

  return request<GenerateStatus>(`/api/generate/status/${encodeURIComponent(id)}`);
}

export async function getGeneratedModelById(id: string) {
  if (!id) {
    throw new Error("Generate ID is required");
  }

  return request<GeneratedModel>(`/api/generate/${encodeURIComponent(id)}`);
}

export async function deleteGeneratedModel(id: string) {
  if (!id) {
    throw new Error("Generate ID is required");
  }

  return request<{ id: string }>(`/api/generate/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function getAllModels() {
  return request<GeneratedModel[]>("/api/model");
}

export async function getModelById(id: string) {
  if (!id) {
    throw new Error("Model ID is required");
  }

  return request<GeneratedModel>(`/api/model/${encodeURIComponent(id)}`);
}

export async function deleteModel(id: string) {
  if (!id) {
    throw new Error("Model ID is required");
  }

  return request<{ id: string; filename: string }>(
    `/api/model/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
}

export function getModelDownloadUrl(filename: string) {
  if (!filename) {
    return "";
  }

  return buildUrl(`/api/model/download/${encodeURIComponent(filename)}`);
}

export function getUploadFileUrl(filename: string) {
  if (!filename) {
    return "";
  }

  return buildUrl(`/uploads/${encodeURIComponent(filename)}`);
}

export function getResultFileUrl(filename: string) {
  if (!filename) {
    return "";
  }

  return buildUrl(`/results/${encodeURIComponent(filename)}`);
}

export async function uploadAndGenerateImage(file: File) {
  const uploadResult = await uploadImage(file);

  if (!uploadResult.data?.filename) {
    throw new Error("Uploaded filename not found");
  }

  const generateResult = await generateModelFromImage(uploadResult.data.filename);

  return {
    upload: uploadResult.data,
    model: generateResult.data,
  };
}

export function isImageFile(file: File) {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  return allowedTypes.includes(file.type);
}

export function validateImageFile(file: File, maxSizeMB = 10) {
  if (!file) {
    return {
      valid: false,
      message: "File is required",
    };
  }

  if (!isImageFile(file)) {
    return {
      valid: false,
      message: "Format gambar harus JPG, JPEG, PNG, atau WEBP.",
    };
  }

  const maxSize = maxSizeMB * 1024 * 1024;

  if (file.size > maxSize) {
    return {
      valid: false,
      message: `Ukuran gambar maksimal ${maxSizeMB} MB.`,
    };
  }

  return {
    valid: true,
    message: "File valid",
  };
}

export function formatFileSize(size: number) {
  const bytes = Number(size) || 0;

  if (bytes <= 0) {
    return "0 B";
  }

  const kb = bytes / 1024;
  const mb = kb / 1024;

  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }

  if (kb >= 1) {
    return `${kb.toFixed(2)} KB`;
  }

  return `${bytes} B`;
}

const api = {
  API_BASE_URL,

  checkHealth,

  uploadImage,
  getUploadedImages,
  getUploadedImageByName,
  deleteUploadedImage,

  generateModelFromImage,
  getGeneratedModels,
  getGenerateStatus,
  getGeneratedModelById,
  deleteGeneratedModel,

  getAllModels,
  getModelById,
  deleteModel,

  getModelDownloadUrl,
  getUploadFileUrl,
  getResultFileUrl,

  uploadAndGenerateImage,

  isImageFile,
  validateImageFile,
  formatFileSize,
};

export default api;