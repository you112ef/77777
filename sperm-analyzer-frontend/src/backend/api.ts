/**
 * Sperm Analyzer AI - API Service
 * Connects frontend to FastAPI backend for sperm analysis
 */

// Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-api.com/api/v1'
  : 'http://localhost:8000/api/v1';

// Types
interface AnalysisRequest {
  file: File;
  analysisType: 'video' | 'image';
}

interface AnalysisResponse {
  analysis_id: string;
  status: string;
  message: string;
  results?: any;
}

interface AnalysisStatus {
  analysis_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  created_at: string;
  completed_at?: string;
}

interface AnalysisResult {
  analysis_id: string;
  status: string;
  created_at: string;
  completed_at?: string;
  processing_time?: number;
  filename: string;
  file_size: number;
  analysis_type: 'video' | 'image';
  casa_metrics?: CASAMetrics;
  video_metrics?: VideoMetrics;
  image_metrics?: ImageMetrics;
  tracks?: SpermTrack[];
  model_version: string;
  error_message?: string;
}

interface CASAMetrics {
  total_count: number;
  concentration: number;
  progressive_motility: number;
  non_progressive_motility: number;
  total_motility: number;
  immotile: number;
  vcl_mean: number;
  vcl_std: number;
  vsl_mean: number;
  vsl_std: number;
  vap_mean: number;
  vap_std: number;
  lin_mean: number;
  str_mean: number;
  wob_mean: number;
  alh_mean: number;
  bcf_mean: number;
}

interface VideoMetrics {
  total_frames: number;
  fps: number;
  duration: number;
  width: number;
  height: number;
  frame_counts: number[];
  frame_densities: number[];
  count_over_time: Array<{time: number, count: number}>;
}

interface ImageMetrics {
  width: number;
  height: number;
  detection_regions: any[];
}

interface SpermTrack {
  track_id: number;
  detections: any[];
  start_frame: number;
  end_frame: number;
  duration: number;
  vcl?: number;
  vsl?: number;
  vap?: number;
  lin?: number;
  str_metric?: number;
  wob?: number;
  alh?: number;
  bcf?: number;
  motility_class?: string;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  version: string;
  system_info: any;
}

// API Client Class
export class SpermAnalyzerAPI {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Health check
  async checkHealth(): Promise<HealthStatus> {
    try {
      const response = await fetch(`${this.baseURL}/status`);
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }

  // Start analysis
  async startAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
    try {
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('analysis_type', request.analysisType);

      const response = await fetch(`${this.baseURL}/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Analysis failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Analysis start failed:', error);
      throw error;
    }
  }

  // Get analysis status
  async getAnalysisStatus(analysisId: string): Promise<AnalysisStatus> {
    try {
      const response = await fetch(`${this.baseURL}/analysis/${analysisId}/status`);
      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Status check failed:', error);
      throw error;
    }
  }

  // Get analysis results
  async getAnalysisResults(analysisId: string): Promise<AnalysisResult> {
    try {
      const response = await fetch(`${this.baseURL}/analysis/${analysisId}/results`);
      if (!response.ok) {
        throw new Error(`Results fetch failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Results fetch failed:', error);
      throw error;
    }
  }

  // List all analyses
  async listAnalyses(): Promise<{analyses: any[]}> {
    try {
      const response = await fetch(`${this.baseURL}/analysis/list`);
      if (!response.ok) {
        throw new Error(`List analyses failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('List analyses failed:', error);
      throw error;
    }
  }

  // Delete analysis
  async deleteAnalysis(analysisId: string): Promise<{message: string}> {
    try {
      const response = await fetch(`${this.baseURL}/analysis/${analysisId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Delete analysis failed:', error);
      throw error;
    }
  }

  // Export results as CSV
  async exportCSV(analysisId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseURL}/export/${analysisId}/csv`);
      if (!response.ok) {
        throw new Error(`CSV export failed: ${response.status}`);
      }
      return await response.blob();
    } catch (error) {
      console.error('CSV export failed:', error);
      throw error;
    }
  }

  // Export results as JSON
  async exportJSON(analysisId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseURL}/export/${analysisId}/json`);
      if (!response.ok) {
        throw new Error(`JSON export failed: ${response.status}`);
      }
      return await response.blob();
    } catch (error) {
      console.error('JSON export failed:', error);
      throw error;
    }
  }

  // Export comprehensive report
  async exportReport(analysisId: string, format: 'pdf' | 'html' = 'pdf'): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseURL}/export/${analysisId}/report?format=${format}`);
      if (!response.ok) {
        throw new Error(`Report export failed: ${response.status}`);
      }
      return await response.blob();
    } catch (error) {
      console.error('Report export failed:', error);
      throw error;
    }
  }

  // Export charts
  async exportCharts(analysisId: string): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseURL}/export/${analysisId}/charts`);
      if (!response.ok) {
        throw new Error(`Charts export failed: ${response.status}`);
      }
      return await response.blob();
    } catch (error) {
      console.error('Charts export failed:', error);
      throw error;
    }
  }

  // Poll analysis until completion
  async waitForAnalysis(analysisId: string, onProgress?: (status: AnalysisStatus) => void): Promise<AnalysisResult> {
    return new Promise((resolve, reject) => {
      const pollInterval = setInterval(async () => {
        try {
          const status = await this.getAnalysisStatus(analysisId);
          
          if (onProgress) {
            onProgress(status);
          }

          if (status.status === 'completed') {
            clearInterval(pollInterval);
            const results = await this.getAnalysisResults(analysisId);
            resolve(results);
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            reject(new Error('Analysis failed'));
          }
        } catch (error) {
          clearInterval(pollInterval);
          reject(error);
        }
      }, 1000); // Poll every second
    });
  }
}

// Create singleton instance
export const apiClient = new SpermAnalyzerAPI();

// Export types
export type {
  AnalysisRequest,
  AnalysisResponse,
  AnalysisStatus,
  AnalysisResult,
  CASAMetrics,
  VideoMetrics,
  ImageMetrics,
  SpermTrack,
  HealthStatus
};

// Mock API for development/testing
export class MockSpermAnalyzerAPI extends SpermAnalyzerAPI {
  private mockResults: Map<string, AnalysisResult> = new Map();

  async checkHealth(): Promise<HealthStatus> {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0-mock',
      system_info: {
        cpu_percent: 15.2,
        memory_percent: 45.8,
        disk_percent: 23.1,
        gpu_available: true
      }
    };
  }

  async startAnalysis(request: AnalysisRequest): Promise<AnalysisResponse> {
    const analysisId = Math.random().toString(36).substr(2, 9);
    
    // Simulate processing delay
    setTimeout(() => {
      const mockResult: AnalysisResult = {
        analysis_id: analysisId,
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date(Date.now() + 5000).toISOString(),
        processing_time: 5.2,
        filename: request.file.name,
        file_size: request.file.size,
        analysis_type: request.analysisType,
        casa_metrics: {
          total_count: 45,
          concentration: 82.5,
          progressive_motility: 68.2,
          non_progressive_motility: 18.3,
          total_motility: 86.5,
          immotile: 13.5,
          vcl_mean: 44.5,
          vcl_std: 8.2,
          vsl_mean: 30.1,
          vsl_std: 6.7,
          vap_mean: 37.8,
          vap_std: 7.1,
          lin_mean: 67.8,
          str_mean: 79.6,
          wob_mean: 85.2,
          alh_mean: 2.3,
          bcf_mean: 8.7
        },
        model_version: 'yolov8n-mock'
      };
      
      this.mockResults.set(analysisId, mockResult);
    }, 5000);

    return {
      analysis_id: analysisId,
      status: 'processing',
      message: 'Analysis started. Use /analysis/{analysis_id}/status to check progress.'
    };
  }

  async getAnalysisStatus(analysisId: string): Promise<AnalysisStatus> {
    const result = this.mockResults.get(analysisId);
    
    if (result) {
      return {
        analysis_id: analysisId,
        status: 'completed',
        progress: 100,
        message: 'Analysis complete!',
        created_at: result.created_at,
        completed_at: result.completed_at
      };
    }
    
    return {
      analysis_id: analysisId,
      status: 'processing',
      progress: Math.min(90, Date.now() % 100),
      message: 'Processing sperm analysis...',
      created_at: new Date().toISOString()
    };
  }

  async getAnalysisResults(analysisId: string): Promise<AnalysisResult> {
    const result = this.mockResults.get(analysisId);
    if (!result) {
      throw new Error('Analysis not found');
    }
    return result;
  }
}

// Use mock API in development
export const devApiClient = process.env.NODE_ENV === 'development' 
  ? new MockSpermAnalyzerAPI() 
  : apiClient;

export default devApiClient; 