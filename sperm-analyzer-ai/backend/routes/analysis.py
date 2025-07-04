"""
Analysis endpoints for sperm video/image processing
"""

from fastapi import APIRouter, File, UploadFile, HTTPException, BackgroundTasks, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import uuid
import json
from datetime import datetime
from pathlib import Path

from services.analysis_service import AnalysisService
from models.analysis_models import AnalysisRequest, AnalysisResult
from utils.logger import setup_logger

router = APIRouter()
logger = setup_logger()

# Initialize analysis service
analysis_service = AnalysisService()

class AnalysisResponse(BaseModel):
    analysis_id: str
    status: str
    message: str
    results: Optional[Dict[str, Any]] = None

class AnalysisStatus(BaseModel):
    analysis_id: str
    status: str
    progress: float
    message: str
    created_at: datetime
    completed_at: Optional[datetime] = None

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_sample(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    analysis_type: str = "video"
):
    """
    Analyze sperm sample from uploaded video or image
    """
    try:
        # Validate file type
        allowed_video_types = ["video/mp4", "video/avi", "video/mov", "video/quicktime"]
        allowed_image_types = ["image/jpeg", "image/png", "image/tiff"]
        
        if analysis_type == "video" and file.content_type not in allowed_video_types:
            raise HTTPException(status_code=400, detail="Invalid video file type. Supported: MP4, AVI, MOV")
        
        if analysis_type == "image" and file.content_type not in allowed_image_types:
            raise HTTPException(status_code=400, detail="Invalid image file type. Supported: JPEG, PNG, TIFF")
        
        # Generate unique analysis ID
        analysis_id = str(uuid.uuid4())
        
        # Save uploaded file
        upload_dir = Path("uploads")
        upload_dir.mkdir(exist_ok=True)
        
        file_extension = Path(file.filename).suffix
        temp_filename = f"{analysis_id}{file_extension}"
        temp_filepath = upload_dir / temp_filename
        
        # Save file
        with open(temp_filepath, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        logger.info(f"File uploaded: {temp_filepath} for analysis {analysis_id}")
        
        # Get model service from app state
        model_service = request.app.state.model_service
        
        # Create analysis request
        analysis_request = AnalysisRequest(
            analysis_id=analysis_id,
            file_path=str(temp_filepath),
            analysis_type=analysis_type,
            filename=file.filename
        )
        
        # Start background analysis
        background_tasks.add_task(
            analysis_service.process_analysis,
            analysis_request,
            model_service
        )
        
        return AnalysisResponse(
            analysis_id=analysis_id,
            status="processing",
            message="Analysis started. Use /analysis/{analysis_id}/status to check progress."
        )
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/analysis/{analysis_id}/status", response_model=AnalysisStatus)
async def get_analysis_status(analysis_id: str):
    """Get analysis status and progress"""
    try:
        status = analysis_service.get_analysis_status(analysis_id)
        if not status:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return status
    except Exception as e:
        logger.error(f"Failed to get analysis status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis/{analysis_id}/results")
async def get_analysis_results(analysis_id: str):
    """Get analysis results"""
    try:
        results = analysis_service.get_analysis_results(analysis_id)
        if not results:
            raise HTTPException(status_code=404, detail="Analysis results not found")
        return results
    except Exception as e:
        logger.error(f"Failed to get analysis results: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/analysis/{analysis_id}")
async def delete_analysis(analysis_id: str):
    """Delete analysis and associated files"""
    try:
        success = analysis_service.delete_analysis(analysis_id)
        if not success:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return {"message": "Analysis deleted successfully"}
    except Exception as e:
        logger.error(f"Failed to delete analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis/list")
async def list_analyses():
    """List all analyses"""
    try:
        analyses = analysis_service.list_analyses()
        return {"analyses": analyses}
    except Exception as e:
        logger.error(f"Failed to list analyses: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))