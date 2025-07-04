"""
CASA (Computer Assisted Sperm Analysis) Calculator
Implements WHO standards for sperm motility and kinematic analysis
"""

import numpy as np
import pandas as pd
from scipy import stats
from typing import List, Dict, Optional, Any
import math

from models.analysis_models import SpermDetection, SpermTrack, CASAMetrics, SpermMotilityClass
from utils.logger import setup_logger

logger = setup_logger()

class CASACalculator:
    """
    Calculator for CASA metrics following WHO Laboratory Manual standards
    """
    
    def __init__(self):
        # WHO reference values (5th edition)
        self.who_references = {
            'concentration_lower_limit': 15,  # million/ml
            'progressive_motility_lower_limit': 32,  # %
            'total_motility_lower_limit': 40,  # %
            'vcl_threshold_progressive': 25,  # μm/s
            'vsl_threshold_progressive': 5,   # μm/s
            'linearity_threshold_progressive': 0.45,  # %
        }
        
        # Pixel to micrometer conversion (depends on microscope settings)
        # This would need calibration in real implementation
        self.pixel_to_micron = 0.2  # 0.2 μm per pixel (example)
        
    def calculate_track_metrics(self, detections: List[SpermDetection], fps: float) -> Dict[str, Any]:
        """Calculate CASA metrics for a single sperm track"""
        
        if len(detections) < 3:
            return {}
        
        # Extract coordinates and times
        positions = [(det.x * self.pixel_to_micron, det.y * self.pixel_to_micron) for det in detections]
        times = [det.timestamp for det in detections]
        
        # Calculate velocities and kinematic parameters
        metrics = {}
        
        try:
            # Calculate path points
            path_points = np.array(positions)
            time_points = np.array(times)
            
            # Time intervals
            dt = np.diff(time_points)
            if np.any(dt <= 0):
                logger.warning("Invalid time intervals in track")
                return {}
            
            # Distance calculations
            distances = np.sqrt(np.sum(np.diff(path_points, axis=0)**2, axis=1))
            
            # VCL - Curvilinear Velocity (actual path velocity)
            total_distance = np.sum(distances)
            total_time = time_points[-1] - time_points[0]
            metrics['vcl'] = total_distance / total_time if total_time > 0 else 0
            
            # VSL - Straight Line Velocity (start to end)
            straight_distance = np.sqrt(np.sum((path_points[-1] - path_points[0])**2))
            metrics['vsl'] = straight_distance / total_time if total_time > 0 else 0
            
            # VAP - Average Path Velocity (smoothed path)
            # Use moving average to smooth path
            if len(path_points) >= 5:
                smoothed_path = self._smooth_path(path_points)
                smoothed_distances = np.sqrt(np.sum(np.diff(smoothed_path, axis=0)**2, axis=1))
                smoothed_total_distance = np.sum(smoothed_distances)
                metrics['vap'] = smoothed_total_distance / total_time if total_time > 0 else 0
            else:
                metrics['vap'] = metrics['vsl']
            
            # LIN - Linearity (VSL/VCL)
            metrics['lin'] = (metrics['vsl'] / metrics['vcl'] * 100) if metrics['vcl'] > 0 else 0
            
            # STR - Straightness (VSL/VAP)
            metrics['str'] = (metrics['vsl'] / metrics['vap'] * 100) if metrics['vap'] > 0 else 0
            
            # WOB - Wobble (VAP/VCL)
            metrics['wob'] = (metrics['vap'] / metrics['vcl'] * 100) if metrics['vcl'] > 0 else 0
            
            # ALH - Amplitude of Lateral Head displacement
            metrics['alh'] = self._calculate_alh(path_points)
            
            # BCF - Beat Cross Frequency
            metrics['bcf'] = self._calculate_bcf(path_points, time_points)
            
            # Classify motility
            metrics['motility_class'] = self._classify_motility(metrics)
            
        except Exception as e:
            logger.error(f"Error calculating track metrics: {str(e)}")
            return {}
        
        return metrics
    
    def _smooth_path(self, path_points: np.ndarray, window_size: int = 3) -> np.ndarray:
        """Smooth sperm path using moving average"""
        if len(path_points) < window_size:
            return path_points
        
        smoothed = np.zeros_like(path_points)
        half_window = window_size // 2
        
        for i in range(len(path_points)):
            start_idx = max(0, i - half_window)
            end_idx = min(len(path_points), i + half_window + 1)
            smoothed[i] = np.mean(path_points[start_idx:end_idx], axis=0)
        
        return smoothed
    
    def _calculate_alh(self, path_points: np.ndarray) -> float:
        """Calculate Amplitude of Lateral Head displacement"""
        if len(path_points) < 3:
            return 0.0
        
        try:
            # Fit a line to the overall path
            x_coords = path_points[:, 0]
            y_coords = path_points[:, 1]
            
            # Linear regression to find main direction
            slope, intercept, _, _, _ = stats.linregress(x_coords, y_coords)
            
            # Calculate perpendicular distances from each point to the line
            distances = []
            for x, y in path_points:
                # Distance from point to line ax + by + c = 0
                # where line is y = mx + b -> mx - y + b = 0
                distance = abs(slope * x - y + intercept) / np.sqrt(slope**2 + 1)
                distances.append(distance)
            
            # ALH is the mean of the maximum lateral displacement
            return float(np.mean(distances))
            
        except Exception as e:
            logger.error(f"Error calculating ALH: {str(e)}")
            return 0.0
    
    def _calculate_bcf(self, path_points: np.ndarray, time_points: np.ndarray) -> float:
        """Calculate Beat Cross Frequency"""
        if len(path_points) < 5:
            return 0.0
        
        try:
            # Calculate the average direction vector
            overall_direction = path_points[-1] - path_points[0]
            if np.linalg.norm(overall_direction) == 0:
                return 0.0
            
            overall_direction = overall_direction / np.linalg.norm(overall_direction)
            
            # Project points onto perpendicular axis
            perpendicular = np.array([-overall_direction[1], overall_direction[0]])
            lateral_positions = np.dot(path_points - path_points[0], perpendicular)
            
            # Count zero crossings of the lateral displacement
            zero_crossings = 0
            for i in range(1, len(lateral_positions)):
                if lateral_positions[i-1] * lateral_positions[i] < 0:
                    zero_crossings += 1
            
            # BCF is half the number of zero crossings per second
            total_time = time_points[-1] - time_points[0]
            bcf = (zero_crossings / 2) / total_time if total_time > 0 else 0
            
            return float(bcf)
            
        except Exception as e:
            logger.error(f"Error calculating BCF: {str(e)}")
            return 0.0
    
    def _classify_motility(self, metrics: Dict[str, float]) -> SpermMotilityClass:
        """Classify sperm motility based on WHO criteria"""
        
        vcl = metrics.get('vcl', 0)
        vsl = metrics.get('vsl', 0)
        lin = metrics.get('lin', 0)
        
        # Progressive motility criteria
        if (vcl >= self.who_references['vcl_threshold_progressive'] and 
            vsl >= self.who_references['vsl_threshold_progressive']):
            return SpermMotilityClass.PROGRESSIVE
        
        # Non-progressive motility (moving but not progressive)
        elif vcl > 5:  # Some movement threshold
            return SpermMotilityClass.NON_PROGRESSIVE
        
        # Immotile
        else:
            return SpermMotilityClass.IMMOTILE
    
    def calculate_population_metrics(self, tracks: List[SpermTrack]) -> CASAMetrics:
        """Calculate population-level CASA metrics"""
        
        if not tracks:
            return CASAMetrics(
                total_count=0,
                concentration=0.0,
                progressive_motility=0.0,
                non_progressive_motility=0.0,
                total_motility=0.0,
                immotile=100.0,
                vcl_mean=0.0, vcl_std=0.0,
                vsl_mean=0.0, vsl_std=0.0,
                vap_mean=0.0, vap_std=0.0,
                lin_mean=0.0, str_mean=0.0, wob_mean=0.0,
                alh_mean=0.0, bcf_mean=0.0
            )
        
        # Count motility classes
        progressive_count = sum(1 for t in tracks if t.motility_class == SpermMotilityClass.PROGRESSIVE)
        non_progressive_count = sum(1 for t in tracks if t.motility_class == SpermMotilityClass.NON_PROGRESSIVE)
        immotile_count = sum(1 for t in tracks if t.motility_class == SpermMotilityClass.IMMOTILE)
        
        total_count = len(tracks)
        motile_count = progressive_count + non_progressive_count
        
        # Calculate percentages
        progressive_pct = (progressive_count / total_count * 100) if total_count > 0 else 0
        non_progressive_pct = (non_progressive_count / total_count * 100) if total_count > 0 else 0
        total_motility_pct = (motile_count / total_count * 100) if total_count > 0 else 0
        immotile_pct = (immotile_count / total_count * 100) if total_count > 0 else 0
        
        # Extract velocity values
        vcl_values = [t.vcl for t in tracks if t.vcl is not None]
        vsl_values = [t.vsl for t in tracks if t.vsl is not None]
        vap_values = [t.vap for t in tracks if t.vap is not None]
        lin_values = [t.lin for t in tracks if t.lin is not None]
        str_values = [t.str_metric for t in tracks if t.str_metric is not None]
        wob_values = [t.wob for t in tracks if t.wob is not None]
        alh_values = [t.alh for t in tracks if t.alh is not None]
        bcf_values = [t.bcf for t in tracks if t.bcf is not None]
        
        # Calculate statistics
        def safe_mean_std(values):
            if values:
                return float(np.mean(values)), float(np.std(values))
            return 0.0, 0.0
        
        vcl_mean, vcl_std = safe_mean_std(vcl_values)
        vsl_mean, vsl_std = safe_mean_std(vsl_values)
        vap_mean, vap_std = safe_mean_std(vap_values)
        lin_mean, _ = safe_mean_std(lin_values)
        str_mean, _ = safe_mean_std(str_values)
        wob_mean, _ = safe_mean_std(wob_values)
        alh_mean, _ = safe_mean_std(alh_values)
        bcf_mean, _ = safe_mean_std(bcf_values)
        
        # Estimate concentration (this would need calibration in real system)
        # For now, use arbitrary conversion
        concentration = total_count * 1000000  # Convert to cells/ml (needs calibration)
        
        return CASAMetrics(
            total_count=total_count,
            concentration=concentration,
            progressive_motility=progressive_pct,
            non_progressive_motility=non_progressive_pct,
            total_motility=total_motility_pct,
            immotile=immotile_pct,
            vcl_mean=vcl_mean,
            vcl_std=vcl_std,
            vsl_mean=vsl_mean,
            vsl_std=vsl_std,
            vap_mean=vap_mean,
            vap_std=vap_std,
            lin_mean=lin_mean,
            str_mean=str_mean,
            wob_mean=wob_mean,
            alh_mean=alh_mean,
            bcf_mean=bcf_mean
        )
    
    def generate_who_assessment(self, casa_metrics: CASAMetrics) -> Dict[str, Any]:
        """Generate WHO-based assessment of sperm quality"""
        
        assessment = {
            'concentration_status': 'normal' if casa_metrics.concentration >= self.who_references['concentration_lower_limit'] else 'below_reference',
            'progressive_motility_status': 'normal' if casa_metrics.progressive_motility >= self.who_references['progressive_motility_lower_limit'] else 'below_reference',
            'total_motility_status': 'normal' if casa_metrics.total_motility >= self.who_references['total_motility_lower_limit'] else 'below_reference',
            'overall_quality': 'normal',
            'recommendations': []
        }
        
        # Determine overall quality
        issues = 0
        if assessment['concentration_status'] == 'below_reference':
            issues += 1
            assessment['recommendations'].append('Low sperm concentration detected')
        
        if assessment['progressive_motility_status'] == 'below_reference':
            issues += 1
            assessment['recommendations'].append('Low progressive motility detected')
        
        if assessment['total_motility_status'] == 'below_reference':
            issues += 1
            assessment['recommendations'].append('Low total motility detected')
        
        if issues == 0:
            assessment['overall_quality'] = 'normal'
        elif issues == 1:
            assessment['overall_quality'] = 'mild_impairment'
        elif issues == 2:
            assessment['overall_quality'] = 'moderate_impairment'
        else:
            assessment['overall_quality'] = 'severe_impairment'
        
        if not assessment['recommendations']:
            assessment['recommendations'].append('All parameters within normal range')
        
        return assessment