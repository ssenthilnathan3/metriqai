from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum


class TaskType(str, Enum):
    IMAGE_CLASSIFICATION = "image-classification"
    TEXT_CLASSIFICATION = "text-classification"
    TOKEN_CLASSIFICATION = "token-classification"
    TEXT_GENERATION = "text-generation"
    TEXT2TEXT_GENERATION = "text2text-generation"
    TRANSLATION = "translation"
    SUMMARIZATION = "summarization"
    QUESTION_ANSWERING = "question-answering"
    OBJECT_DETECTION = "object-detection"
    IMAGE_SEGMENTATION = "image-segmentation"
    SPEECH_RECOGNITION = "automatic-speech-recognition"
    AUDIO_CLASSIFICATION = "audio-classification"
    TABULAR_CLASSIFICATION = "tabular-classification"
    TABULAR_REGRESSION = "tabular-regression"
    REINFORCEMENT_LEARNING = "reinforcement-learning"


class MetricType(str, Enum):
    ACCURACY = "accuracy"
    F1 = "f1"
    PRECISION = "precision"
    RECALL = "recall"
    BLEU = "bleu"
    ROUGE = "rouge"
    PERPLEXITY = "perplexity"
    WER = "wer"  # Word Error Rate
    CER = "cer"  # Character Error Rate
    EXACT_MATCH = "exact_match"
    SQUAD = "squad"
    GLUE = "glue"
    BERTSCORE = "bertscore"
    METEOR = "meteor"
    MSE = "mse"
    MAE = "mae"
    R2 = "r2"
    AUC = "auc"
    MAP = "map"  # Mean Average Precision
    IOU = "iou"  # Intersection over Union


class ModelSize(str, Enum):
    TINY = "tiny"
    SMALL = "small"
    BASE = "base"
    LARGE = "large"
    XL = "xl"
    XXL = "xxl"


class ModelFamily(str, Enum):
    BERT = "bert"
    GPT = "gpt"
    T5 = "t5"
    ROBERTA = "roberta"
    DISTILBERT = "distilbert"
    ELECTRA = "electra"
    DEBERTA = "deberta"
    ALBERT = "albert"
    RESNET = "resnet"
    VIT = "vit"  # Vision Transformer
    EFFICIENTNET = "efficientnet"
    MOBILENET = "mobilenet"
    DENSENET = "densenet"
    INCEPTION = "inception"
    CLIP = "clip"
    BLIP = "blip"
    WHISPER = "whisper"
    WAV2VEC = "wav2vec"
    LLAMA = "llama"
    MISTRAL = "mistral"
    GEMMA = "gemma"
    FALCON = "falcon"
    BLOOM = "bloom"
    OTHER = "other"


class EvaluationResult(BaseModel):
    metric_name: str = Field(..., description="Name of the evaluation metric")
    metric_type: MetricType = Field(..., description="Type of the metric")
    value: float = Field(..., description="Metric value", ge=0)
    dataset_name: str = Field(..., description="Name of the evaluation dataset")
    dataset_config: Optional[str] = Field(None, description="Dataset configuration/subset")
    dataset_split: str = Field(default="test", description="Dataset split used for evaluation")


class ModelInfo(BaseModel):
    model_id: str = Field(..., description="Unique model identifier")
    model_name: str = Field(..., description="Human-readable model name")
    model_family: ModelFamily = Field(..., description="Model architecture family")
    model_size: Optional[ModelSize] = Field(None, description="Model size category")
    parameter_count: Optional[int] = Field(None, description="Number of parameters", ge=0)
    task_type: TaskType = Field(..., description="Primary task the model is designed for")
    created_at: Optional[datetime] = Field(None, description="Model creation/upload date")
    last_modified: Optional[datetime] = Field(None, description="Last modification date")
    downloads: Optional[int] = Field(None, description="Number of downloads", ge=0)
    likes: Optional[int] = Field(None, description="Number of likes", ge=0)
    library_name: Optional[str] = Field(None, description="ML library used (e.g., transformers, timm)")
    license: Optional[str] = Field(None, description="Model license")
    tags: List[str] = Field(default_factory=list, description="Model tags")
    pipeline_tag: Optional[str] = Field(None, description="Pipeline tag for the model")


class BenchmarkEntry(BaseModel):
    model_info: ModelInfo = Field(..., description="Information about the model")
    evaluation_results: List[EvaluationResult] = Field(..., description="List of evaluation results")
    evaluated_at: Optional[datetime] = Field(None, description="When the evaluation was performed")


class DatasetStats(BaseModel):
    dataset_name: str = Field(..., description="Name of the dataset")
    task_type: TaskType = Field(..., description="Task type for this dataset")
    model_count: int = Field(..., description="Number of models evaluated on this dataset", ge=0)
    avg_performance: Dict[str, float] = Field(..., description="Average performance metrics")
    best_performance: Dict[str, float] = Field(..., description="Best performance metrics")
    worst_performance: Dict[str, float] = Field(..., description="Worst performance metrics")


class TaskStats(BaseModel):
    task_type: TaskType = Field(..., description="Task type")
    model_count: int = Field(..., description="Number of models for this task", ge=0)
    dataset_count: int = Field(..., description="Number of datasets for this task", ge=0)
    avg_metrics: Dict[str, float] = Field(..., description="Average metrics across all models")
    top_models: List[str] = Field(..., description="Top performing model IDs")


class ModelFamilyStats(BaseModel):
    family: ModelFamily = Field(..., description="Model family")
    model_count: int = Field(..., description="Number of models in this family", ge=0)
    avg_parameter_count: Optional[float] = Field(None, description="Average parameter count")
    avg_performance: Dict[str, float] = Field(..., description="Average performance metrics")
    task_distribution: Dict[TaskType, int] = Field(..., description="Distribution across tasks")


class TrendData(BaseModel):
    date: datetime = Field(..., description="Date of the data point")
    task_type: TaskType = Field(..., description="Task type")
    metric_name: str = Field(..., description="Metric name")
    avg_value: float = Field(..., description="Average metric value for this period")
    model_count: int = Field(..., description="Number of models in this period", ge=0)
    best_value: float = Field(..., description="Best metric value for this period")


class BenchmarkSummary(BaseModel):
    total_models: int = Field(..., description="Total number of models", ge=0)
    total_datasets: int = Field(..., description="Total number of datasets", ge=0)
    task_stats: List[TaskStats] = Field(..., description="Statistics per task")
    dataset_stats: List[DatasetStats] = Field(..., description="Statistics per dataset")
    model_family_stats: List[ModelFamilyStats] = Field(..., description="Statistics per model family")
    trend_data: List[TrendData] = Field(..., description="Performance trends over time")
    last_updated: datetime = Field(..., description="When the data was last updated")


class CorrelationMatrix(BaseModel):
    metrics: List[str] = Field(..., description="List of metric names")
    correlation_matrix: List[List[float]] = Field(..., description="Correlation matrix values")
    task_type: TaskType = Field(..., description="Task type for this correlation matrix")


class LeaderboardEntry(BaseModel):
    rank: int = Field(..., description="Rank in the leaderboard", ge=1)
    model_info: ModelInfo = Field(..., description="Model information")
    primary_metric: EvaluationResult = Field(..., description="Primary metric for ranking")
    secondary_metrics: List[EvaluationResult] = Field(default_factory=list, description="Additional metrics")
    efficiency_score: Optional[float] = Field(None, description="Performance per parameter score")


class Leaderboard(BaseModel):
    task_type: TaskType = Field(..., description="Task type for this leaderboard")
    dataset_name: str = Field(..., description="Dataset name")
    metric_name: str = Field(..., description="Primary metric for ranking")
    entries: List[LeaderboardEntry] = Field(..., description="Leaderboard entries")
    last_updated: datetime = Field(..., description="When the leaderboard was last updated")


# Response models for API endpoints
class BenchmarkResponse(BaseModel):
    data: List[BenchmarkEntry] = Field(..., description="List of benchmark entries")
    summary: BenchmarkSummary = Field(..., description="Summary statistics")
    correlations: List[CorrelationMatrix] = Field(..., description="Metric correlations per task")
    leaderboards: List[Leaderboard] = Field(..., description="Top model leaderboards")


class HealthResponse(BaseModel):
    status: str = Field(default="healthy")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    version: str = Field(default="1.0.0")
