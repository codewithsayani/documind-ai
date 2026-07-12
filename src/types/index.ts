// =============================================================================
// DocuMind AI - All TypeScript Domain Types
// =============================================================================

export type Plan = "free" | "pro" | "enterprise";
export type SourceType = "zip" | "files" | "github";
export type UploadStatus = "pending" | "processing" | "completed" | "failed";
export type ExportFormat = "markdown" | "pdf" | "docx" | "readme";
export type Theme = "light" | "dark" | "system";
export type ActionType = "generate" | "upload" | "download" | "export" | "search";
export type ActivityType =
  | "project_created"
  | "doc_generated"
  | "doc_edited"
  | "doc_exported"
  | "version_created"
  | "project_deleted";

// =============================================================================
// Database Models
// =============================================================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  plan: Plan;
  bio: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  source_type: SourceType;
  source_url: string | null;
  framework: string | null;
  language: string | null;
  package_manager: string | null;
  tech_stack: string[];
  file_count: number;
  total_size_bytes: number;
  is_favorite: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Joined fields
  documentations?: Documentation[];
}

export interface Upload {
  id: string;
  project_id: string;
  user_id: string;
  storage_path: string | null;
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  status: UploadStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface Documentation {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  content: string;
  content_json: DocumentationContent;
  quality_score: number;
  word_count: number;
  is_published: boolean;
  current_version: number;
  generation_metadata: GenerationMetadata;
  created_at: string;
  updated_at: string;
  // Joined
  project?: Project;
}

export interface DocumentationVersion {
  id: string;
  documentation_id: string;
  project_id: string;
  user_id: string;
  version_number: number;
  title: string;
  content: string;
  content_json: DocumentationContent;
  quality_score: number;
  word_count: number;
  change_summary: string | null;
  created_at: string;
}

export interface Download {
  id: string;
  user_id: string;
  documentation_id: string;
  project_id: string;
  format: ExportFormat;
  storage_path: string | null;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  action: ActionType;
  project_id: string | null;
  documentation_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DailyLimit {
  id: string;
  user_id: string;
  date: string;
  generation_count: number;
  upload_count: number;
  export_count: number;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  project_id: string;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: Theme;
  email_notifications: boolean;
  generation_notifications: boolean;
  weekly_digest: boolean;
  default_export_format: ExportFormat;
  editor_font_size: number;
  editor_word_wrap: boolean;
  compact_view: boolean;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  type: ActivityType;
  title: string;
  description: string | null;
  project_id: string | null;
  documentation_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// =============================================================================
// AI & Documentation Types
// =============================================================================

export interface DocumentationContent {
  overview?: string;
  executive_summary?: string;
  readme?: string;
  features?: string;
  folder_structure?: string;
  tech_stack?: string;
  architecture?: string;
  installation?: string;
  usage?: string;
  configuration?: string;
  environment_variables?: string;
  database?: string;
  api_docs?: string;
  auth_flow?: string;
  code_organization?: string;
  major_components?: string;
  reusable_modules?: string;
  design_patterns?: string;
  security_suggestions?: string;
  performance_suggestions?: string;
  code_quality?: string;
  future_improvements?: string;
  known_limitations?: string;
  deployment?: string;
  contributing?: string;
  license?: string;
  complexity_analysis?: string;
  dependency_analysis?: string;
  project_summary?: string;
  readme_badges?: string;
  quality_score_breakdown?: QualityScoreBreakdown;
}

export interface QualityScoreBreakdown {
  overall: number;
  completeness: number;
  readability: number;
  structure: number;
  technical_depth: number;
  best_practices: number;
}

export interface GenerationMetadata {
  model: string;
  tokens_used?: number;
  generation_time_ms?: number;
  files_analyzed: number;
  chunks_processed: number;
  framework_detected?: string;
  language_detected?: string;
}

export interface ProjectAnalysis {
  name: string;
  description: string;
  framework: string;
  language: string;
  packageManager: string;
  techStack: string[];
  fileCount: number;
  totalSizeBytes: number;
  files: AnalyzedFile[];
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  hasTests: boolean;
  hasDocker: boolean;
  hasCI: boolean;
  hasDotenv: boolean;
  hasDatabase: boolean;
  dbType?: string;
  apiStyle?: string;
  authMethod?: string;
  folderStructure: FolderNode;
}

export interface AnalyzedFile {
  path: string;
  name: string;
  extension: string;
  content: string;
  size: number;
  language: string;
  isConfig: boolean;
  isEntryPoint: boolean;
}

export interface FolderNode {
  name: string;
  type: "file" | "directory";
  children?: FolderNode[];
  size?: number;
}

export interface GenerationChunk {
  index: number;
  files: AnalyzedFile[];
  summary?: string;
}

// =============================================================================
// API Response Types
// =============================================================================

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface GenerateDocRequest {
  projectId: string;
  projectAnalysis: ProjectAnalysis;
}

export interface GenerateDocResponse {
  documentation: DocumentationContent;
  qualityScore: number;
  wordCount: number;
  metadata: GenerationMetadata;
}

// =============================================================================
// UI State Types
// =============================================================================

export interface UploadProgress {
  stage: "uploading" | "extracting" | "analyzing" | "generating" | "saving" | "done" | "error";
  progress: number; // 0-100
  message: string;
  details?: string;
}

export interface SearchResult {
  type: "project" | "documentation";
  id: string;
  title: string;
  description?: string;
  framework?: string;
  language?: string;
  created_at: string;
  project_id?: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalDocumentations: number;
  totalDownloads: number;
  generationsToday: number;
  generationsLimit: number;
  storageUsed: number;
}
