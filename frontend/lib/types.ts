export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  total?: number;
  meta?: ApiMeta;
  error?: string;
  errors?: unknown;
};

export type ApiMeta = {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
};

export type ApiError = {
  success: false;
  message: string;
  error?: string;
  errors?: unknown;
};

export type HealthData = {
  status: string;
  server: string;
  time: string;
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
  sizeKB?: number;
  sizeMB: number;
  sizeText?: string;
  mimetype?: string;
  ext?: string;
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
  sizeKB?: number;
  sizeMB?: number;
  sizeText?: string;
  ext?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type GenerateStatusType =
  | "idle"
  | "uploading"
  | "processing"
  | "generating"
  | "completed"
  | "failed"
  | "error"
  | string;

export type AiProviderType = "demo" | "custom" | "polling" | string;

export type GeneratedModel = {
  id: string;
  status: GenerateStatusType;
  provider: AiProviderType;
  inputImage: InputImage | null;
  outputModel: OutputModel | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GenerateStatusData = {
  id: string;
  status: GenerateStatusType;
  error: string | null;
  outputModel: OutputModel | null;
  createdAt: string;
  updatedAt: string;
};

export type UploadAndGenerateResult = {
  upload: UploadData;
  model: GeneratedModel | undefined;
};

export type FileValidationResult = {
  valid: boolean;
  message: string;
};

export type GenerateStep = {
  key: string;
  label: string;
  description?: string;
};

export type ModelFileExtension = ".glb" | ".gltf" | ".obj" | ".fbx" | ".stl";

export type ImageFileExtension = ".jpg" | ".jpeg" | ".png" | ".webp";

export type ImageMimeType =
  | "image/jpeg"
  | "image/jpg"
  | "image/png"
  | "image/webp";

export type ModelMimeType =
  | "model/gltf-binary"
  | "model/gltf+json"
  | "application/octet-stream"
  | "text/plain";

export type UploadBoxProps = {
  disabled?: boolean;
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  onError?: (message: string) => void;
};

export type ImagePreviewProps = {
  file?: File | null;
  imageUrl?: string;
  title?: string;
  description?: string;
  emptyText?: string;
  className?: string;
  showInfo?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
};

export type GenerateButtonProps = {
  loading?: boolean;
  disabled?: boolean;
  text?: string;
  loadingText?: string;
  fullWidth?: boolean;
  onClick?: () => void;
};

export type GenerateStatusProps = {
  status?: GenerateStatusType;
  error?: string;
  loading?: boolean;
  currentStep?: string;
  steps?: GenerateStep[];
  className?: string;
};

export type ModelViewerProps = {
  modelUrl?: string;
  downloadUrl?: string;
  filename?: string;
  title?: string;
  description?: string;
  emptyText?: string;
  height?: number | string;
  className?: string;
  autoRotate?: boolean;
  showActions?: boolean;
  showInfo?: boolean;
};

export type DownloadButtonProps = {
  url?: string;
  filename?: string;
  text?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  variant?: "primary" | "outline";
  className?: string;
};

export type PageState = {
  loading: boolean;
  error: string;
  statusText: string;
};

export type UploadPageState = PageState & {
  selectedFile: File | null;
  previewUrl: string;
  uploadedImage: UploadData | null;
  generatedModel: GeneratedModel | null;
};

export type ResultPageState = PageState & {
  model: GeneratedModel | null;
};

export type BackendEndpoint = {
  name: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  description: string;
};

export type BackendConfig = {
  apiBaseUrl: string;
  uploadEndpoint: string;
  generateEndpoint: string;
  modelEndpoint: string;
};

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export type ID = string;

export type Filename = string;

export type Url = string;