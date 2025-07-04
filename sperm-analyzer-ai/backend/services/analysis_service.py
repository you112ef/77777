"""
Analysis service for processing sperm samples and calculating CASA metrics
"""

import asyncio
import json
import os
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import numpy as np
import pandas as pd
from scipy import stats
import cv2

from models.analysis_models import (
    AnalysisRequest, AnalysisResult, AnalysisStatus as StatusEnum,
    SpermTrack, SpermDetection, CASAMetrics, VideoAnalysisMetrics, 
    ImageAnalysisMetrics, SpermMotilityClass
)
from services.casa_calculator import CASACalculator
from utils.logger import setup_logger

logger = setup_logger()

class AnalysisService:
    """Service for managing sperm analysis workflows"""
    
    def __init__(self):
        self.active_analyses: Dict[str, Dict] = {}
        self.results_cache: Dict[str, AnalysisResult] = {}
        self.casa_calculator = CASACalculator()
        
        # Create necessary directories
        self.results_dir = Path("results")
        self.results_dir.mkdir(exist_ok=True)
    
    async def process_analysis(self, request: AnalysisRequest, model_service):
        """Process analysis request asynchronously"""
        analysis_id = request.analysis_id
        
        try:
            # Initialize analysis tracking
            self.active_analyses[analysis_id] = {
                'status': StatusEnum.PROCESSING,
                'progress': 0.0,
                'message': 'Initializing analysis...',
                'created_at': datetime.now(),
                'request': request
            }
            
            logger.info(f"Starting analysis {analysis_id}")
            start_time = time.time()
            
            # Update progress
            await self._update_analysis_progress(analysis_id, 10, "Loading file...")
            
            # Process based on type
            if request.analysis_type == "video":
                raw_results = await model_service.process_video(request.file_path)
                await self._update_analysis_progress(analysis_id, 60, "Calculating CASA metrics...")
                analysis_result = await self._process_video_results(request, raw_results)
            else:
                raw_results = await model_service.process_image(request.file_path)
                await self._update_analysis_progress(analysis_id, 60, "Calculating metrics...")
                analysis_result = await self._process_image_results(request, raw_results)
            
            # Calculate processing time
            processing_time = time.time() - start_time
            analysis_result.processing_time = processing_time
            analysis_result.completed_at = datetime.now()
            analysis_result.status = StatusEnum.COMPLETED
            
            # Save results
            await self._save_analysis_results(analysis_id, analysis_result)
            
            # Update progress
            await self._update_analysis_progress(analysis_id, 100, "Analysis complete!")
            
            # Store in cache
            self.results_cache[analysis_id] = analysis_result
            
            logger.info(f"Analysis {analysis_id} completed in {processing_time:.2f}s")
            
        except Exception as e:
            logger.error(f"Analysis {analysis_id} failed: {str(e)}")
            await self._handle_analysis_error(analysis_id, str(e))
    
    async def _process_video_results(self, request: AnalysisRequest, raw_results: Dict) -> AnalysisResult:
        """Process video analysis results and calculate CASA metrics"""
        
        # Extract video properties
        video_props = raw_results['video_properties']
        frame_detections = raw_results['frame_detections']
        tracks_data = raw_results['tracks']
        
        # Convert raw tracks to SpermTrack objects
        tracks = []
        for track_id, track_points in tracks_data.items():
            if len(track_points) < 3:  # Skip short tracks
                continue
            
            # Create detections for this track
            detections = []
            for point in track_points:
                detection = SpermDetection(
                    id=len(detections),
                    x=point['x'],
                    y=point['y'],
                    confidence=point['confidence'],
                    frame_number=point['frame_number'],
                    timestamp=point['timestamp']
                )
                detections.append(detection)
            
            # Calculate CASA metrics for this track
            casa_metrics = self.casa_calculator.calculate_track_metrics(
                detections, video_props['fps']
            )
            
            # Create track object
            track = SpermTrack(
                track_id=int(track_id),
                detections=detections,
                start_frame=detections[0].frame_number,
                end_frame=detections[-1].frame_number,
                duration=detections[-1].timestamp - detections[0].timestamp,
                vcl=casa_metrics.get('vcl'),
                vsl=casa_metrics.get('vsl'),
                vap=casa_metrics.get('vap'),
                lin=casa_metrics.get('lin'),
                str_metric=casa_metrics.get('str'),
                wob=casa_metrics.get('wob'),
                alh=casa_metrics.get('alh'),
                bcf=casa_metrics.get('bcf'),
                motility_class=casa_metrics.get('motility_class')
            )
            tracks.append(track)
        
        # Calculate overall CASA metrics
        overall_casa = self.casa_calculator.calculate_population_metrics(tracks)
        
        # Prepare video-specific metrics
        frame_counts = [fd['detection_count'] for fd in frame_detections]
        frame_densities = [
            count / (video_props['width'] * video_props['height']) * 1000000
            for count in frame_counts
        ]
        
        count_over_time = [
            {'time': fd['timestamp'], 'count': fd['detection_count']}
            for fd in frame_detections
        ]
        
        video_metrics = VideoAnalysisMetrics(
            total_frames=video_props['total_frames'],
            fps=video_props['fps'],
            duration=video_props['duration'],
            width=video_props['width'],
            height=video_props['height'],
            frame_counts=frame_counts,
            frame_densities=frame_densities,
            count_over_time=count_over_time
        )
        
        # Get file size
        file_size = os.path.getsize(request.file_path)
        
        # Create analysis result
        result = AnalysisResult(
            analysis_id=request.analysis_id,
            status=StatusEnum.PROCESSING,  # Will be updated later
            created_at=self.active_analyses[request.analysis_id]['created_at'],
            filename=request.filename,
            file_size=file_size,
            analysis_type=request.analysis_type,
            tracks=tracks,
            casa_metrics=overall_casa,
            video_metrics=video_metrics,
            model_version="yolov8n",
            parameters_used=request.parameters
        )
        
        return result
    
    async def _process_image_results(self, request: AnalysisRequest, raw_results: Dict) -> AnalysisResult:
        """Process image analysis results"""
        
        # Extract image properties
        image_props = raw_results['image_properties']
        detections_data = raw_results['detections']
        
        # Convert raw detections to SpermDetection objects
        detections = []
        for det_data in detections_data:
            detection = SpermDetection(**det_data)
            detections.append(detection)
        
        # For images, we can only calculate basic metrics
        total_count = len(detections)
        concentration = total_count / (image_props['width'] * image_props['height']) * 1000000  # per megapixel
        
        # Basic CASA metrics for image (limited without motion data)
        casa_metrics = CASAMetrics(
            total_count=total_count,
            concentration=concentration,
            progressive_motility=0.0,  # Cannot determine from static image
            non_progressive_motility=0.0,
            total_motility=0.0,
            immotile=100.0,  # Assume all immotile in static image
            vcl_mean=0.0,
            vcl_std=0.0,
            vsl_mean=0.0,
            vsl_std=0.0,
            vap_mean=0.0,
            vap_std=0.0,
            lin_mean=0.0,
            str_mean=0.0,
            wob_mean=0.0,
            alh_mean=0.0,
            bcf_mean=0.0
        )
        
        # Analyze detection regions (density clusters)
        detection_regions = self._analyze_detection_regions(
            detections, image_props['width'], image_props['height']
        )
        
        image_metrics = ImageAnalysisMetrics(
            width=image_props['width'],
            height=image_props['height'],
            detection_regions=detection_regions
        )
        
        # Get file size
        file_size = os.path.getsize(request.file_path)
        
        # Create analysis result
        result = AnalysisResult(
            analysis_id=request.analysis_id,
            status=StatusEnum.PROCESSING,  # Will be updated later
            created_at=self.active_analyses[request.analysis_id]['created_at'],
            filename=request.filename,
            file_size=file_size,
            analysis_type=request.analysis_type,
            casa_metrics=casa_metrics,
            image_metrics=image_metrics,
            model_version="yolov8n",
            parameters_used=request.parameters
        )
        
        return result
    
    def _analyze_detection_regions(self, detections: List[SpermDetection], width: int, height: int) -> List[Dict]:
        """Analyze regions of high sperm density"""
        if not detections:
            return []
        
        # Create density grid
        grid_size = 50
        x_bins = np.linspace(0, width, grid_size)
        y_bins = np.linspace(0, height, grid_size)
        
        # Count detections in each grid cell
        x_coords = [det.x for det in detections]
        y_coords = [det.y for det in detections]
        
        hist, _, _ = np.histogram2d(x_coords, y_coords, bins=[x_bins, y_bins])
        
        # Find high-density regions
        regions = []
        threshold = np.percentile(hist, 75)  # Top 25% density
        
        for i in range(len(x_bins)-1):
            for j in range(len(y_bins)-1):
                if hist[i, j] > threshold:
                    regions.append({
                        'x_min': x_bins[i],
                        'x_max': x_bins[i+1],
                        'y_min': y_bins[j],
                        'y_max': y_bins[j+1],
                        'density': float(hist[i, j])
                    })
        
        return regions
    
    async def _update_analysis_progress(self, analysis_id: str, progress: float, message: str):
        """Update analysis progress"""
        if analysis_id in self.active_analyses:
            self.active_analyses[analysis_id].update({
                'progress': progress,
                'message': message
            })
    
    async def _handle_analysis_error(self, analysis_id: str, error_message: str):
        """Handle analysis error"""
        if analysis_id in self.active_analyses:
            self.active_analyses[analysis_id].update({
                'status': StatusEnum.FAILED,
                'progress': 0.0,
                'message': f'Analysis failed: {error_message}',
                'error': error_message
            })
        
        # Create error result
        request = self.active_analyses[analysis_id]['request']
        error_result = AnalysisResult(
            analysis_id=analysis_id,
            status=StatusEnum.FAILED,
            created_at=self.active_analyses[analysis_id]['created_at'],
            filename=request.filename,
            file_size=0,
            analysis_type=request.analysis_type,
            error_message=error_message,
            model_version="yolov8n"
        )
        
        self.results_cache[analysis_id] = error_result
        await self._save_analysis_results(analysis_id, error_result)
    
    async def _save_analysis_results(self, analysis_id: str, result: AnalysisResult):
        """Save analysis results to file"""
        try:
            result_file = self.results_dir / f"{analysis_id}.json"
            with open(result_file, 'w') as f:
                json.dump(result.dict(), f, indent=2, default=str)
            logger.info(f"Results saved to {result_file}")
        except Exception as e:
            logger.error(f"Failed to save results: {str(e)}")
    
    def get_analysis_status(self, analysis_id: str) -> Optional[Dict]:
        """Get analysis status"""
        if analysis_id in self.active_analyses:
            analysis = self.active_analyses[analysis_id]
            return {
                'analysis_id': analysis_id,
                'status': analysis['status'],
                'progress': analysis['progress'],
                'message': analysis['message'],
                'created_at': analysis['created_at'],
                'completed_at': analysis.get('completed_at')
            }
        return None
    
    def get_analysis_results(self, analysis_id: str) -> Optional[AnalysisResult]:
        """Get analysis results"""
        # Check cache first
        if analysis_id in self.results_cache:
            return self.results_cache[analysis_id]
        
        # Try loading from file
        try:
            result_file = self.results_dir / f"{analysis_id}.json"
            if result_file.exists():
                with open(result_file, 'r') as f:
                    data = json.load(f)
                result = AnalysisResult(**data)
                self.results_cache[analysis_id] = result
                return result
        except Exception as e:
            logger.error(f"Failed to load results: {str(e)}")
        
        return None
    
    def delete_analysis(self, analysis_id: str) -> bool:
        """Delete analysis and associated files"""
        try:
            # Remove from active analyses
            if analysis_id in self.active_analyses:
                del self.active_analyses[analysis_id]
            
            # Remove from cache
            if analysis_id in self.results_cache:
                del self.results_cache[analysis_id]
            
            # Delete result file
            result_file = self.results_dir / f"{analysis_id}.json"
            if result_file.exists():
                result_file.unlink()
            
            # Delete uploaded file
            upload_files = Path("uploads").glob(f"{analysis_id}.*")
            for file in upload_files:
                file.unlink()
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to delete analysis: {str(e)}")
            return False
    
    def list_analyses(self) -> List[Dict]:
        """List all analyses"""
        analyses = []
        
        # Add active analyses
        for analysis_id, analysis in self.active_analyses.items():
            analyses.append({
                'analysis_id': analysis_id,
                'status': analysis['status'],
                'created_at': analysis['created_at'],
                'filename': analysis['request'].filename
            })
        
        # Add completed analyses from files
        for result_file in self.results_dir.glob("*.json"):
            analysis_id = result_file.stem
            if analysis_id not in self.active_analyses:
                try:
                    with open(result_file, 'r') as f:
                        data = json.load(f)
                    analyses.append({
                        'analysis_id': analysis_id,
                        'status': data.get('status', 'unknown'),
                        'created_at': data.get('created_at'),
                        'filename': data.get('filename', 'unknown')
                    })
                except Exception as e:
                    logger.error(f"Failed to read result file {result_file}: {str(e)}")
        
        return sorted(analyses, key=lambda x: x.get('created_at', ''), reverse=True)