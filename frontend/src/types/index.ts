// Core data types matching the backend Pydantic models
export enum TaskType {
  IMAGE_CLASSIFICATION = "image-classification",
  TEXT_CLASSIFICATION = "text-classification",
  TOKEN_CLASSIFICATION = "token-classification",
  TEXT_GENERATION = "text-generation",
  TEXT2TEXT_GENERATION = "text2text-generation",
  TRANSLATION = "translation",
  SUMMARIZATION = "summarization",
  QUESTION_ANSWERING = "question-answering",
  OBJECT_DETECTION = "object-detection",
  IMAGE_SEGMENTATION = "image-segmentation",
  SPEECH_RECOGNITION = "automatic-speech-recognition",
  AUDIO_CLASSIFICATION = "audio-classification",
  TABULAR_CLASSIFICATION = "tabular-classification",
  TABULAR_REGRESSION = "tabular-regression",
  REINFORCEMENT_LEARNING = "reinforcement-learning"
}

export enum MetricType {
  ACCURACY = "accuracy",
  F1 = "f1",
  PRECISION = "precision",
  RECALL = "recall",
  BLEU = "bleu",
  ROUGE = "rouge",
  PERPLEXITY = "perplexity",
  WER = "wer",
  CER = "cer",
  EXACT_MATCH = "exact_match",
  SQUAD = "squad",
  GLUE = "glue",
  BERTSCORE = "bertscore",
  METEOR = "meteor",
  MSE = "mse",
  MAE = "mae",
  R2 = "r2",
  AUC = "auc",
  MAP = "map",
  IOU = "iou"
}

export enum ModelFamily {
  BERT = "bert",
  GPT = "gpt",
  T5 = "t5",
  ROBERTA = "roberta",
  DISTILBERT = "distilbert",
  ELECTRA = "electra",
  DEBERTA = "deberta",
  ALBERT = "albert",
  RESNET = "resnet",
  VIT = "vit",
  EFFICIENTNET = "efficientnet",
  MOBILENET = "mobilenet",
  DENSENET = "densenet",
  INCEPTION = "inception",
  CLIP = "clip",
  BLIP = "blip",
  WHISPER = "whisper",
  WAV2VEC = "wav2vec",
  LLAMA = "llama",
  MISTRAL = "mistral",
  GEMMA = "gemma",
  FALCON = "falcon",
  BLOOM = "bloom",
  OTHER = "other"
}

export enum ModelSize {
  TINY = "tiny",
  SMALL = "small",
  BASE = "base",
  LARGE = "large",
  XL = "xl",
  XXL = "xxl"
}

export interface EvaluationResult {
  metric_name: string;
  metric_type: MetricType;
  value: number;
  dataset_name: string;
  dataset_config?: string;
  dataset_split: string;
}

export interface ModelInfo {
  model_id: string;
  model_name: string;
  model_family: ModelFamily;
  model_size?: ModelSize;
  parameter_count?: number;
  task_type: TaskType;
  created_at?: string;
  last_modified?: string;
  downloads?: number;
  likes?: number;
  library_name?: string;
  license?: string;
  tags: string[];
  pipeline_tag?: string;
}

export interface BenchmarkEntry {
  model_info: ModelInfo;
  evaluation_results: EvaluationResult[];
  evaluated_at?: string;
}

export interface TaskStats {
  task_type: TaskType;
  model_count: number;
  dataset_count: number;
  avg_metrics: Record<string, number>;
  top_models: string[];
}

export interface DatasetStats {
  dataset_name: string;
  task_type: TaskType;
  model_count: number;
  avg_performance: Record<string, number>;
  best_performance: Record<string, number>;
  worst_performance: Record<string, number>;
}

export interface ModelFamilyStats {
  family: ModelFamily;
  model_count: number;
  avg_parameter_count?: number;
  avg_performance: Record<string, number>;
  task_distribution: Record<TaskType, number>;
}

export interface TrendData {
  date: string;
  task_type: TaskType;
  metric_name: string;
  avg_value: number;
  model_count: number;
  best_value: number;
}

export interface BenchmarkSummary {
  total_models: number;
  total_datasets: number;
  task_stats: TaskStats[];
  dataset_stats: DatasetStats[];
  model_family_stats: ModelFamilyStats[];
  trend_data: TrendData[];
  last_updated: string;
}

export interface CorrelationMatrix {
  metrics: string[];
  correlation_matrix: number[][];
  task_type: TaskType;
}

export interface LeaderboardEntry {
  rank: number;
  model_info: ModelInfo;
  primary_metric: EvaluationResult;
  secondary_metrics: EvaluationResult[];
  efficiency_score?: number;
}

export interface Leaderboard {
  task_type: TaskType;
  dataset_name: string;
  metric_name: string;
  entries: LeaderboardEntry[];
  last_updated: string;
}

export interface BenchmarkResponse {
  data: BenchmarkEntry[];
  summary: BenchmarkSummary;
  correlations: CorrelationMatrix[];
  leaderboards: Leaderboard[];
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  version: string;
}

// UI-specific types
export interface ChartProps {
  data: any[];
  title?: string;
  subtitle?: string;
  className?: string;
  height?: number;
  width?: number;
}

export interface FilterState {
  taskTypes: TaskType[];
  modelFamilies: ModelFamily[];
  datasets: string[];
  dateRange: {
    start?: string;
    end?: string;
  };
  searchQuery: string;
}

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}

export interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
  group?: string;
}

export interface PlotlyConfig {
  displayModeBar?: boolean;
  responsive?: boolean;
  displaylogo?: boolean;
  modeBarButtonsToRemove?: string[];
  toImageButtonOptions?: {
    format: 'png' | 'svg' | 'pdf';
    filename: string;
    height: number;
    width: number;
    scale: number;
  };
}

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface CacheStatus {
  cache_valid: boolean;
  last_updated?: string;
  ttl_minutes: number;
  has_data: boolean;
  data_count: number;
}

// Hook types
export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseBenchmarkDataResult {
  benchmarkData: BenchmarkResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  lastUpdated?: string;
}

// Component prop types
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ErrorMessageProps {
  error: string | Error;
  retry?: () => void;
  className?: string;
}

export interface MetricBadgeProps {
  value: number;
  metricType: string;
  showLabel?: boolean;
  className?: string;
}

export interface ModelCardProps {
  model: ModelInfo;
  evaluationResults?: EvaluationResult[];
  className?: string;
  onClick?: () => void;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  className?: string;
}

// Chart-specific types
export interface BarChartData {
  category: string;
  value: number;
  color?: string;
  label?: string;
}

export interface LineChartData {
  x: string | number;
  y: number;
  series?: string;
}

export interface ScatterPlotData {
  x: number;
  y: number;
  text?: string;
  color?: string;
  size?: number;
}

export interface HeatmapData {
  x: string;
  y: string;
  z: number;
}

export interface TreemapData {
  label: string;
  value: number;
  parent?: string;
  color?: string;
}

// Export utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Theme types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
  };
  fonts: {
    sans: string[];
    mono: string[];
  };
  spacing: Record<string, string>;
  breakpoints: Record<string, string>;
}

// Context types
export interface ThemeContextValue {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export interface FilterContextValue {
  filters: FilterState;
  updateFilters: (updates: Partial<FilterState>) => void;
  resetFilters: () => void;
}

// Navigation types
export interface NavigationItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
  children?: NavigationItem[];
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'range';
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}
