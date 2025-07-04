"""
Pydantic models for analysis requests and responses
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class AnalysisType(str, Enum):
    VIDEO = "video"
    IMAGE = "image"

class AnalysisStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class SpermMotilityClass(str, Enum):
    PROGRESSIVE = "progressive"  # PR - Progressive motility
    NON_PROGRESSIVE = "non_progressive"  # NP - Non-progressive motility
    IMMOTILE = "immotile"  # IM - Immotile

class AnalysisRequest(BaseModel):
    analysis_id: str
    file_path: str
    analysis_type: AnalysisType
    filename: str
    parameters: Optional[Dict[str, Any]] = {}

class SpermDetection(BaseModel):
    """Individual sperm detection"""
    id: int
    x: float
    y: float
    confidence: float
    frame_number: int
    timestamp: float
    
class SpermTrack(BaseModel):
    """Sperm tracking data"""
    track_id: int
    detections: List[SpermDetection]
    start_frame: int
    end_frame: int
    duration: float
    
    # CASA metrics
    vcl: Optional[float] = None  # Curvilinear Velocity
    vsl: Optional[float] = None  # Straight Line Velocity
    vap: Optional[float] = None  # Average Path Velocity
    lin: Optional[float] = None  # Linearity
    str_metric: Optional[float] = None  # Straightness
    wob: Optional[float] = None  # Wobble
    alh: Optional[float] = None  # Amplitude of Lateral Head displacement
    bcf: Optional[float] = None  # Beat Cross Frequency
    
    motility_class: Optional[SpermMotilityClass] = None

class CASAMetrics(BaseModel):
    """Computer Assisted Sperm Analysis metrics"""
    total_count: int
    concentration: float  # cells/ml
    
    # Motility percentages
    progressive_motility: float  # % PR
    non_progressive_motility: float  # % NP
    total_motility: float  # % Total motile
    immotile: float  # % Immotile
    
    # Velocity metrics (μm/s)
    vcl_mean: float
    vcl_std: float
    vsl_mean: float
    vsl_std: float
    vap_mean: float
    vap_std: float
    
    # Kinematic parameters
    lin_mean: float  # Linearity %
    str_mean: float  # Straightness %
    wob_mean: float  # Wobble %
    alh_mean: float  # μm
    bcf_mean: float  # Hz

class VideoAnalysisMetrics(BaseModel):
    """Video-specific analysis metrics"""
    total_frames: int
    fps: float
    duration: float
    width: int
    height: int
    
    # Frame-by-frame counts
    frame_counts: List[int]
    frame_densities: List[float]
    
    # Temporal analysis
    count_over_time: List[Dict[str, float]]  # [{"time": 1.0, "count": 45}, ...]

class ImageAnalysisMetrics(BaseModel):
    """Image-specific analysis metrics"""
    width: int
    height: int
    detection_regions: List[Dict[str, Any]]  # Regions with high sperm density

class AnalysisResult(BaseModel):
    """Complete analysis results"""
    analysis_id: str
    status: AnalysisStatus
    created_at: datetime
    completed_at: Optional[datetime] = None
    processing_time: Optional[float] = None
    
    # Input file info
    filename: str
    file_size: int
    analysis_type: AnalysisType
    
    # Detection results
    tracks: List[SpermTrack] = []
    casa_metrics: Optional[CASAMetrics] = None
    
    # Type-specific metrics
    video_metrics: Optional[VideoAnalysisMetrics] = None
    image_metrics: Optional[ImageAnalysisMetrics] = None
    
    # Processing info
    model_version: str = "yolov8n"
    parameters_used: Dict[str, Any] = {}
    
    # Error info (if failed)
    error_message: Optional[str] = None
    error_details: Optional[Dict[str, Any]] = None