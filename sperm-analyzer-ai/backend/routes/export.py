"""
Export endpoints for downloading analysis results
"""

from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import FileResponse
from typing import Optional
import os
import json
import pandas as pd
from pathlib import Path
from datetime import datetime

from services.export_service import ExportService
from utils.logger import setup_logger

router = APIRouter()
logger = setup_logger()

export_service = ExportService()

@router.get("/export/{analysis_id}/csv")
async def export_csv(analysis_id: str):
    """Export analysis results as CSV"""
    try:
        csv_path = export_service.export_to_csv(analysis_id)
        if not csv_path or not os.path.exists(csv_path):
            raise HTTPException(status_code=404, detail="CSV export not found")
        
        return FileResponse(
            path=csv_path,
            media_type='text/csv',
            filename=f"sperm_analysis_{analysis_id}.csv"
        )
    except Exception as e:
        logger.error(f"CSV export failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/{analysis_id}/json")
async def export_json(analysis_id: str):
    """Export analysis results as JSON"""
    try:
        json_path = export_service.export_to_json(analysis_id)
        if not json_path or not os.path.exists(json_path):
            raise HTTPException(status_code=404, detail="JSON export not found")
        
        return FileResponse(
            path=json_path,
            media_type='application/json',
            filename=f"sperm_analysis_{analysis_id}.json"
        )
    except Exception as e:
        logger.error(f"JSON export failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/{analysis_id}/report")
async def export_report(analysis_id: str, format: str = "pdf"):
    """Export comprehensive analysis report"""
    try:
        if format not in ["pdf", "html"]:
            raise HTTPException(status_code=400, detail="Format must be 'pdf' or 'html'")
        
        report_path = export_service.generate_report(analysis_id, format)
        if not report_path or not os.path.exists(report_path):
            raise HTTPException(status_code=404, detail="Report generation failed")
        
        media_type = "application/pdf" if format == "pdf" else "text/html"
        filename = f"sperm_analysis_report_{analysis_id}.{format}"
        
        return FileResponse(
            path=report_path,
            media_type=media_type,
            filename=filename
        )
    except Exception as e:
        logger.error(f"Report export failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/{analysis_id}/charts")
async def export_charts(analysis_id: str):
    """Export visualization charts as images"""
    try:
        charts_archive = export_service.export_charts(analysis_id)
        if not charts_archive or not os.path.exists(charts_archive):
            raise HTTPException(status_code=404, detail="Charts export not found")
        
        return FileResponse(
            path=charts_archive,
            media_type='application/zip',
            filename=f"sperm_analysis_charts_{analysis_id}.zip"
        )
    except Exception as e:
        logger.error(f"Charts export failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))