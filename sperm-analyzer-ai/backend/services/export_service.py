"""
Export service for generating reports and data exports
"""

import os
import json
import zipfile
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict, Any
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from io import BytesIO
import base64

from models.analysis_models import AnalysisResult
from services.analysis_service import AnalysisService
from utils.logger import setup_logger

logger = setup_logger()

class ExportService:
    """Service for exporting analysis results in various formats"""
    
    def __init__(self):
        self.exports_dir = Path("exports")
        self.exports_dir.mkdir(exist_ok=True)
        self.analysis_service = AnalysisService()
    
    def export_to_csv(self, analysis_id: str) -> Optional[str]:
        """Export analysis results to CSV format"""
        try:
            results = self.analysis_service.get_analysis_results(analysis_id)
            if not results:
                return None
            
            # Prepare data for CSV
            data_rows = []
            
            # Add basic info
            basic_info = {
                'analysis_id': results.analysis_id,
                'filename': results.filename,
                'analysis_type': results.analysis_type,
                'created_at': results.created_at,
                'processing_time': results.processing_time
            }
            
            # Add CASA metrics if available
            if results.casa_metrics:
                casa_data = {
                    'total_count': results.casa_metrics.total_count,
                    'concentration': results.casa_metrics.concentration,
                    'progressive_motility_pct': results.casa_metrics.progressive_motility,
                    'non_progressive_motility_pct': results.casa_metrics.non_progressive_motility,
                    'total_motility_pct': results.casa_metrics.total_motility,
                    'immotile_pct': results.casa_metrics.immotile,
                    'vcl_mean': results.casa_metrics.vcl_mean,
                    'vcl_std': results.casa_metrics.vcl_std,
                    'vsl_mean': results.casa_metrics.vsl_mean,
                    'vsl_std': results.casa_metrics.vsl_std,
                    'vap_mean': results.casa_metrics.vap_mean,
                    'vap_std': results.casa_metrics.vap_std,
                    'lin_mean': results.casa_metrics.lin_mean,
                    'str_mean': results.casa_metrics.str_mean,
                    'wob_mean': results.casa_metrics.wob_mean,
                    'alh_mean': results.casa_metrics.alh_mean,
                    'bcf_mean': results.casa_metrics.bcf_mean
                }
                basic_info.update(casa_data)
            
            data_rows.append(basic_info)
            
            # Create separate CSV for individual track data
            if results.tracks:
                track_data = []
                for track in results.tracks:
                    track_row = {
                        'track_id': track.track_id,
                        'start_frame': track.start_frame,
                        'end_frame': track.end_frame,
                        'duration': track.duration,
                        'vcl': track.vcl,
                        'vsl': track.vsl,
                        'vap': track.vap,
                        'lin': track.lin,
                        'str': track.str_metric,
                        'wob': track.wob,
                        'alh': track.alh,
                        'bcf': track.bcf,
                        'motility_class': track.motility_class
                    }
                    track_data.append(track_row)
                
                # Save track data
                track_df = pd.DataFrame(track_data)
                track_csv_path = self.exports_dir / f"{analysis_id}_tracks.csv"
                track_df.to_csv(track_csv_path, index=False)
            
            # Save main results
            main_df = pd.DataFrame(data_rows)
            csv_path = self.exports_dir / f"{analysis_id}_results.csv"
            main_df.to_csv(csv_path, index=False)
            
            logger.info(f"CSV export completed: {csv_path}")
            return str(csv_path)
            
        except Exception as e:
            logger.error(f"CSV export failed: {str(e)}")
            return None
    
    def export_to_json(self, analysis_id: str) -> Optional[str]:
        """Export analysis results to JSON format"""
        try:
            results = self.analysis_service.get_analysis_results(analysis_id)
            if not results:
                return None
            
            # Convert to dictionary and save
            json_path = self.exports_dir / f"{analysis_id}_results.json"
            with open(json_path, 'w') as f:
                json.dump(results.dict(), f, indent=2, default=str)
            
            logger.info(f"JSON export completed: {json_path}")
            return str(json_path)
            
        except Exception as e:
            logger.error(f"JSON export failed: {str(e)}")
            return None
    
    def generate_report(self, analysis_id: str, format: str = "html") -> Optional[str]:
        """Generate comprehensive analysis report"""
        try:
            results = self.analysis_service.get_analysis_results(analysis_id)
            if not results:
                return None
            
            # Generate HTML report
            html_content = self._generate_html_report(results)
            
            if format == "html":
                report_path = self.exports_dir / f"{analysis_id}_report.html"
                with open(report_path, 'w', encoding='utf-8') as f:
                    f.write(html_content)
                return str(report_path)
            
            elif format == "pdf":
                # For PDF generation, you would need additional libraries like weasyprint
                # For now, return HTML version
                report_path = self.exports_dir / f"{analysis_id}_report.html"
                with open(report_path, 'w', encoding='utf-8') as f:
                    f.write(html_content)
                return str(report_path)
            
        except Exception as e:
            logger.error(f"Report generation failed: {str(e)}")
            return None
    
    def _generate_html_report(self, results: AnalysisResult) -> str:
        """Generate HTML report content"""
        
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sperm Analysis Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { background-color: #2c3e50; color: white; padding: 20px; margin-bottom: 30px; }
                .section { margin-bottom: 30px; padding: 20px; border-left: 4px solid #3498db; }
                .metric { display: inline-block; margin: 10px; padding: 15px; background-color: #f8f9fa; border-radius: 5px; }
                .metric-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
                .metric-label { font-size: 14px; color: #7f8c8d; }
                .normal { color: #27ae60; }
                .abnormal { color: #e74c3c; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Sperm Analysis Report</h1>
                <p>Analysis ID: {analysis_id}</p>
                <p>Date: {date}</p>
            </div>
            
            <div class="section">
                <h2>Sample Information</h2>
                <p><strong>Filename:</strong> {filename}</p>
                <p><strong>Analysis Type:</strong> {analysis_type}</p>
                <p><strong>Processing Time:</strong> {processing_time:.2f} seconds</p>
            </div>
            
            {casa_section}
            
            {video_section}
            
            {tracks_section}
            
            <div class="section">
                <h2>Analysis Parameters</h2>
                <p><strong>Model Version:</strong> {model_version}</p>
                <p><strong>Generated:</strong> {generated_at}</p>
            </div>
            
        </body>
        </html>
        """
        
        # Format basic information
        casa_section = ""
        if results.casa_metrics:
            casa_section = f"""
            <div class="section">
                <h2>CASA Metrics</h2>
                <div class="metric">
                    <div class="metric-value">{results.casa_metrics.total_count}</div>
                    <div class="metric-label">Total Count</div>
                </div>
                <div class="metric">
                    <div class="metric-value">{results.casa_metrics.concentration:.1f}</div>
                    <div class="metric-label">Concentration (10⁶/ml)</div>
                </div>
                <div class="metric">
                    <div class="metric-value">{results.casa_metrics.progressive_motility:.1f}%</div>
                    <div class="metric-label">Progressive Motility</div>
                </div>
                <div class="metric">
                    <div class="metric-value">{results.casa_metrics.total_motility:.1f}%</div>
                    <div class="metric-label">Total Motility</div>
                </div>
                
                <h3>Velocity Parameters</h3>
                <table>
                    <tr>
                        <th>Parameter</th>
                        <th>Mean</th>
                        <th>Std Dev</th>
                        <th>Unit</th>
                    </tr>
                    <tr>
                        <td>VCL (Curvilinear Velocity)</td>
                        <td>{results.casa_metrics.vcl_mean:.1f}</td>
                        <td>{results.casa_metrics.vcl_std:.1f}</td>
                        <td>μm/s</td>
                    </tr>
                    <tr>
                        <td>VSL (Straight Line Velocity)</td>
                        <td>{results.casa_metrics.vsl_mean:.1f}</td>
                        <td>{results.casa_metrics.vsl_std:.1f}</td>
                        <td>μm/s</td>
                    </tr>
                    <tr>
                        <td>VAP (Average Path Velocity)</td>
                        <td>{results.casa_metrics.vap_mean:.1f}</td>
                        <td>{results.casa_metrics.vap_std:.1f}</td>
                        <td>μm/s</td>
                    </tr>
                </table>
                
                <h3>Kinematic Parameters</h3>
                <table>
                    <tr>
                        <th>Parameter</th>
                        <th>Mean</th>
                        <th>Unit</th>
                    </tr>
                    <tr>
                        <td>LIN (Linearity)</td>
                        <td>{results.casa_metrics.lin_mean:.1f}</td>
                        <td>%</td>
                    </tr>
                    <tr>
                        <td>STR (Straightness)</td>
                        <td>{results.casa_metrics.str_mean:.1f}</td>
                        <td>%</td>
                    </tr>
                    <tr>
                        <td>WOB (Wobble)</td>
                        <td>{results.casa_metrics.wob_mean:.1f}</td>
                        <td>%</td>
                    </tr>
                    <tr>
                        <td>ALH (Amplitude Lateral Head)</td>
                        <td>{results.casa_metrics.alh_mean:.1f}</td>
                        <td>μm</td>
                    </tr>
                    <tr>
                        <td>BCF (Beat Cross Frequency)</td>
                        <td>{results.casa_metrics.bcf_mean:.1f}</td>
                        <td>Hz</td>
                    </tr>
                </table>
            </div>
            """
        
        video_section = ""
        if results.video_metrics:
            video_section = f"""
            <div class="section">
                <h2>Video Analysis</h2>
                <p><strong>Duration:</strong> {results.video_metrics.duration:.2f} seconds</p>
                <p><strong>Frame Rate:</strong> {results.video_metrics.fps:.1f} fps</p>
                <p><strong>Resolution:</strong> {results.video_metrics.width}x{results.video_metrics.height}</p>
                <p><strong>Frames Processed:</strong> {results.video_metrics.total_frames}</p>
            </div>
            """
        
        tracks_section = ""
        if results.tracks:
            tracks_section = f"""
            <div class="section">
                <h2>Individual Track Analysis</h2>
                <p><strong>Total Tracks:</strong> {len(results.tracks)}</p>
                <table>
                    <tr>
                        <th>Track ID</th>
                        <th>Duration (s)</th>
                        <th>VCL (μm/s)</th>
                        <th>VSL (μm/s)</th>
                        <th>Motility Class</th>
                    </tr>
                    {self._generate_track_rows(results.tracks[:10])}  <!-- Show first 10 tracks -->
                </table>
                {f"<p><em>Showing first 10 of {len(results.tracks)} tracks</em></p>" if len(results.tracks) > 10 else ""}
            </div>
            """
        
        return html_template.format(
            analysis_id=results.analysis_id,
            date=results.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            filename=results.filename,
            analysis_type=results.analysis_type,
            processing_time=results.processing_time or 0,
            casa_section=casa_section,
            video_section=video_section,
            tracks_section=tracks_section,
            model_version=results.model_version,
            generated_at=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        )
    
    def _generate_track_rows(self, tracks) -> str:
        """Generate HTML table rows for tracks"""
        rows = []
        for track in tracks:
            rows.append(f"""
                <tr>
                    <td>{track.track_id}</td>
                    <td>{track.duration:.2f}</td>
                    <td>{track.vcl:.1f if track.vcl else 'N/A'}</td>
                    <td>{track.vsl:.1f if track.vsl else 'N/A'}</td>
                    <td>{track.motility_class if track.motility_class else 'N/A'}</td>
                </tr>
            """)
        return "".join(rows)
    
    def export_charts(self, analysis_id: str) -> Optional[str]:
        """Export visualization charts as images"""
        try:
            results = self.analysis_service.get_analysis_results(analysis_id)
            if not results:
                return None
            
            # Create charts directory
            charts_dir = self.exports_dir / f"{analysis_id}_charts"
            charts_dir.mkdir(exist_ok=True)
            
            # Generate charts
            chart_files = []
            
            if results.casa_metrics:
                # Motility pie chart
                pie_chart = self._create_motility_pie_chart(results.casa_metrics)
                pie_path = charts_dir / "motility_distribution.png"
                pie_chart.savefig(pie_path, dpi=300, bbox_inches='tight')
                chart_files.append(pie_path)
                
                # Velocity histogram
                if results.tracks:
                    hist_chart = self._create_velocity_histogram(results.tracks)
                    hist_path = charts_dir / "velocity_distribution.png"
                    hist_chart.savefig(hist_path, dpi=300, bbox_inches='tight')
                    chart_files.append(hist_path)
            
            if results.video_metrics:
                # Count over time
                time_chart = self._create_count_over_time_chart(results.video_metrics)
                time_path = charts_dir / "count_over_time.png"
                time_chart.savefig(time_path, dpi=300, bbox_inches='tight')
                chart_files.append(time_path)
            
            # Create zip archive
            zip_path = self.exports_dir / f"{analysis_id}_charts.zip"
            with zipfile.ZipFile(zip_path, 'w') as zipf:
                for chart_file in chart_files:
                    zipf.write(chart_file, chart_file.name)
            
            logger.info(f"Charts exported: {zip_path}")
            return str(zip_path)
            
        except Exception as e:
            logger.error(f"Charts export failed: {str(e)}")
            return None
    
    def _create_motility_pie_chart(self, casa_metrics):
        """Create motility distribution pie chart"""
        fig, ax = plt.subplots(figsize=(8, 6))
        
        labels = ['Progressive', 'Non-Progressive', 'Immotile']
        sizes = [
            casa_metrics.progressive_motility,
            casa_metrics.non_progressive_motility,
            casa_metrics.immotile
        ]
        colors = ['#2ecc71', '#f39c12', '#e74c3c']
        
        ax.pie(sizes, labels=labels, colors=colors, autopct='%1.1f%%', startangle=90)
        ax.set_title('Sperm Motility Distribution', fontsize=14, fontweight='bold')
        
        return fig
    
    def _create_velocity_histogram(self, tracks):
        """Create velocity distribution histogram"""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
        
        # VCL distribution
        vcl_values = [t.vcl for t in tracks if t.vcl is not None]
        if vcl_values:
            ax1.hist(vcl_values, bins=20, alpha=0.7, color='#3498db', edgecolor='black')
            ax1.set_xlabel('VCL (μm/s)')
            ax1.set_ylabel('Frequency')
            ax1.set_title('Curvilinear Velocity Distribution')
        
        # VSL distribution
        vsl_values = [t.vsl for t in tracks if t.vsl is not None]
        if vsl_values:
            ax2.hist(vsl_values, bins=20, alpha=0.7, color='#e74c3c', edgecolor='black')
            ax2.set_xlabel('VSL (μm/s)')
            ax2.set_ylabel('Frequency')
            ax2.set_title('Straight Line Velocity Distribution')
        
        plt.tight_layout()
        return fig
    
    def _create_count_over_time_chart(self, video_metrics):
        """Create sperm count over time chart"""
        fig, ax = plt.subplots(figsize=(12, 6))
        
        times = [point['time'] for point in video_metrics.count_over_time]
        counts = [point['count'] for point in video_metrics.count_over_time]
        
        ax.plot(times, counts, linewidth=2, color='#2c3e50')
        ax.fill_between(times, counts, alpha=0.3, color='#3498db')
        ax.set_xlabel('Time (seconds)')
        ax.set_ylabel('Sperm Count')
        ax.set_title('Sperm Count Over Time')
        ax.grid(True, alpha=0.3)
        
        return fig