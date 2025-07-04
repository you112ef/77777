"""
Health check endpoints
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
import psutil
import torch
from datetime import datetime
from typing import Dict, Any

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str
    system_info: Dict[str, Any]

class SystemInfo(BaseModel):
    cpu_percent: float
    memory_percent: float
    disk_percent: float
    gpu_available: bool
    gpu_memory: Dict[str, Any] = None

@router.get("/status", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    
    # System metrics
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    # GPU info
    gpu_available = torch.cuda.is_available()
    gpu_memory = None
    
    if gpu_available:
        gpu_memory = {
            "total": torch.cuda.get_device_properties(0).total_memory,
            "allocated": torch.cuda.memory_allocated(),
            "cached": torch.cuda.memory_reserved()
        }
    
    system_info = {
        "cpu_percent": cpu_percent,
        "memory_percent": memory.percent,
        "disk_percent": disk.percent,
        "gpu_available": gpu_available,
        "gpu_memory": gpu_memory
    }
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        version="1.0.0",
        system_info=system_info
    )

@router.get("/model-status")
async def model_status():
    """Check model loading status"""
    # This will be implemented after model service is created
    return {"status": "model_service_pending"}