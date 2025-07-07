import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart3,
  LineChart,
  PieChart,
  Download,
  RefreshCw,
  TrendingUp,
  Activity,
  AlertCircle
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { devApiClient, AnalysisResult, CASAMetrics, VideoMetrics } from '@/backend/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

interface GraphsPageProps {
  onNavigate: (page: string) => void;
}

// Chart configuration
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: 'hsl(var(--foreground))'
      }
    },
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      ticks: {
        color: 'hsl(var(--muted-foreground))'
      },
      grid: {
        color: 'hsl(var(--border))'
      }
    },
    y: {
      ticks: {
        color: 'hsl(var(--muted-foreground))'
      },
      grid: {
        color: 'hsl(var(--border))'
      }
    }
  }
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        color: 'hsl(var(--foreground))'
      }
    },
  },
};

export default function GraphsPage({ onNavigate }: GraphsPageProps) {
  const [selectedChart, setSelectedChart] = useState<string>('motility');
  const [analyses, setAnalyses] = useState<AnalysisResult[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await devApiClient.listAnalyses();
      const completedAnalyses = response.analyses.filter(
        (analysis: AnalysisResult) => analysis.status === 'completed' && analysis.casa_metrics
      );
      setAnalyses(completedAnalyses);
      
      // Select the most recent analysis by default
      if (completedAnalyses.length > 0 && !selectedAnalysis) {
        setSelectedAnalysis(completedAnalyses[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analyses');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalyses();
    setRefreshing(false);
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleExport = async (type: 'png' | 'pdf' | 'csv' | 'report') => {
    if (!selectedAnalysis) return;
    
    try {
      let blob: Blob;
      let filename: string;
      
      switch (type) {
        case 'png':
          blob = await devApiClient.exportCharts(selectedAnalysis.analysis_id);
          filename = `sperm-analysis-charts-${selectedAnalysis.analysis_id}.zip`;
          break;
        case 'pdf':
          blob = await devApiClient.exportReport(selectedAnalysis.analysis_id, 'pdf');
          filename = `sperm-analysis-report-${selectedAnalysis.analysis_id}.pdf`;
          break;
        case 'csv':
          blob = await devApiClient.exportCSV(selectedAnalysis.analysis_id);
          filename = `sperm-analysis-data-${selectedAnalysis.analysis_id}.csv`;
          break;
        case 'report':
          blob = await devApiClient.exportReport(selectedAnalysis.analysis_id, 'html');
          filename = `sperm-analysis-report-${selectedAnalysis.analysis_id}.html`;
          break;
        default:
          return;
      }
      
      downloadFile(blob, filename);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const getMotilityChartData = () => {
    if (!selectedAnalysis?.casa_metrics) {
      return {
        labels: ['Progressive', 'Non-Progressive', 'Immotile'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        }]
      };
    }
    
    const metrics = selectedAnalysis.casa_metrics;
    return {
      labels: ['Progressive', 'Non-Progressive', 'Immotile'],
      datasets: [{
        data: [
          metrics.progressive_motility,
          metrics.non_progressive_motility,
          metrics.immotile
        ],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderColor: ['#059669', '#d97706', '#dc2626'],
        borderWidth: 2,
      }]
    };
  };

  const getVelocityChartData = () => {
    if (!selectedAnalysis?.video_metrics?.count_over_time) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    const timeData = selectedAnalysis.video_metrics.count_over_time;
    const metrics = selectedAnalysis.casa_metrics;
    
    return {
      labels: timeData.map((_, index) => `${(index * 0.5).toFixed(1)}s`),
      datasets: [
        {
          label: 'VCL (μm/s)',
          data: timeData.map(() => metrics?.vcl_mean || 0),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: false,
        },
        {
          label: 'VSL (μm/s)',
          data: timeData.map(() => metrics?.vsl_mean || 0),
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: false,
        },
        {
          label: 'VAP (μm/s)',
          data: timeData.map(() => metrics?.vap_mean || 0),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: false,
        },
      ],
    };
  };

  const getCountOverTimeChartData = () => {
    if (!selectedAnalysis?.video_metrics?.count_over_time) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    const timeData = selectedAnalysis.video_metrics.count_over_time;
    
    return {
      labels: timeData.map(d => `${d.time.toFixed(1)}s`),
      datasets: [
        {
          label: 'Sperm Count',
          data: timeData.map(d => d.count),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          fill: true,
        },
      ],
    };
  };

  const MotilityPieChart = () => (
    <div className="space-y-4">
      <div className="w-full h-64 bg-muted rounded-lg p-4">
        <Doughnut data={getMotilityChartData()} options={pieOptions} />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm font-medium">Progressive</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {selectedAnalysis?.casa_metrics?.progressive_motility?.toFixed(1) || '0.0'}%
          </p>
          <p className="text-xs text-muted-foreground">متقدمة</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full" />
            <span className="text-sm font-medium">Non-Progressive</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {selectedAnalysis?.casa_metrics?.non_progressive_motility?.toFixed(1) || '0.0'}%
          </p>
          <p className="text-xs text-muted-foreground">غير متقدمة</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-sm font-medium">Immotile</span>
          </div>
          <p className="text-2xl font-bold text-red-600">
            {selectedAnalysis?.casa_metrics?.immotile?.toFixed(1) || '0.0'}%
          </p>
          <p className="text-xs text-muted-foreground">غير متحركة</p>
        </div>
      </div>
    </div>
  );

  const VelocityLineChart = () => (
    <div className="space-y-4">
      <div className="w-full h-64 bg-muted rounded-lg p-4">
        <Line data={getVelocityChartData()} options={chartOptions} />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <span className="text-sm font-medium">VCL</span>
          </div>
          <p className="text-lg font-bold text-blue-600">
            {selectedAnalysis?.casa_metrics?.vcl_mean?.toFixed(1) || '0.0'} μm/s
          </p>
          <p className="text-xs text-muted-foreground">السرعة المنحنية</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span className="text-sm font-medium">VSL</span>
          </div>
          <p className="text-lg font-bold text-red-600">
            {selectedAnalysis?.casa_metrics?.vsl_mean?.toFixed(1) || '0.0'} μm/s
          </p>
          <p className="text-xs text-muted-foreground">السرعة المستقيمة</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span className="text-sm font-medium">VAP</span>
          </div>
          <p className="text-lg font-bold text-green-600">
            {selectedAnalysis?.casa_metrics?.vap_mean?.toFixed(1) || '0.0'} μm/s
          </p>
          <p className="text-xs text-muted-foreground">متوسط السرعة</p>
        </div>
      </div>
    </div>
  );

  const CountTimeChart = () => {
    const avgCount = selectedAnalysis?.video_metrics?.count_over_time
      ? selectedAnalysis.video_metrics.count_over_time.reduce((sum, d) => sum + d.count, 0) / 
        selectedAnalysis.video_metrics.count_over_time.length
      : 0;
    
    return (
      <div className="space-y-4">
        <div className="w-full h-64 bg-muted rounded-lg p-4">
          <Line data={getCountOverTimeChartData()} options={chartOptions} />
        </div>
        
        <div className="text-center">
          <p className="text-2xl font-bold text-primary">{avgCount.toFixed(1)}</p>
          <p className="text-sm text-muted-foreground">Average Count per Frame</p>
          <p className="text-xs text-muted-foreground">متوسط العدد لكل إطار</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Analysis Graphs</h1>
            <p className="text-muted-foreground">الرسوم البيانية للتحليل</p>
            {selectedAnalysis && (
              <p className="text-xs text-muted-foreground mt-1">
                Analysis: {selectedAnalysis.analysis_id} • {selectedAnalysis.filename}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            {selectedAnalysis && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleExport('png')}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Analysis Selector */}
        {analyses.length > 1 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm">Select Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {analyses.map((analysis) => (
                  <Button
                    key={analysis.analysis_id}
                    variant={selectedAnalysis?.analysis_id === analysis.analysis_id ? 'default' : 'outline'}
                    className="justify-start h-auto p-3"
                    onClick={() => setSelectedAnalysis(analysis)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{analysis.filename}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(analysis.created_at).toLocaleDateString()} • 
                        Count: {analysis.casa_metrics?.total_count || 0}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chart Selection */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { id: 'motility', label: 'Motility', icon: PieChart, labelAr: 'الحركة' },
            { id: 'velocity', label: 'Velocity', icon: LineChart, labelAr: 'السرعة' },
            { id: 'count', label: 'Count/Time', icon: BarChart3, labelAr: 'العدد/الزمن' }
          ].map((chart) => {
            const Icon = chart.icon;
            return (
              <Button
                key={chart.id}
                variant={selectedChart === chart.id ? 'default' : 'outline'}
                onClick={() => setSelectedChart(chart.id)}
                className="h-auto p-3 flex-col"
              >
                <Icon className="h-5 w-5 mb-1" />
                <span className="text-xs">{chart.label}</span>
                <span className="text-xs opacity-70">{chart.labelAr}</span>
              </Button>
            );
          })}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}. Please try refreshing or check if you have completed analyses.
            </AlertDescription>
          </Alert>
        )}

        {/* No Data State */}
        {!loading && !error && analyses.length === 0 && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Analysis Data</h3>
                <p className="text-muted-foreground mb-4">
                  Complete an analysis first to view graphs and charts.
                </p>
                <Button onClick={() => onNavigate('analyze')}>
                  Start Analysis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chart Display */}
        {!loading && !error && selectedAnalysis && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedChart === 'motility' && <PieChart className="h-5 w-5" />}
                {selectedChart === 'velocity' && <LineChart className="h-5 w-5" />}
                {selectedChart === 'count' && <BarChart3 className="h-5 w-5" />}
                
                {selectedChart === 'motility' && 'Motility Distribution'}
                {selectedChart === 'velocity' && 'Velocity Over Time'}
                {selectedChart === 'count' && 'Count Over Time'}
              </CardTitle>
              <CardDescription>
                {selectedChart === 'motility' && 'توزيع الحركة'}
                {selectedChart === 'velocity' && 'السرعة عبر الزمن'}
                {selectedChart === 'count' && 'العدد عبر الزمن'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedChart === 'motility' && <MotilityPieChart />}
              {selectedChart === 'velocity' && <VelocityLineChart />}
              {selectedChart === 'count' && <CountTimeChart />}
            </CardContent>
          </Card>
        )}

        {/* Statistical Summary */}
        {!loading && !error && selectedAnalysis && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Statistical Summary</CardTitle>
              <CardDescription>الملخص الإحصائي</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { 
                    label: 'Mean VCL', 
                    value: `${selectedAnalysis.casa_metrics?.vcl_mean?.toFixed(1) || '0.0'} μm/s`, 
                    labelAr: 'متوسط VCL' 
                  },
                  { 
                    label: 'Std Dev', 
                    value: `±${selectedAnalysis.casa_metrics?.vcl_std?.toFixed(1) || '0.0'} μm/s`, 
                    labelAr: 'الانحراف المعياري' 
                  },
                  { 
                    label: 'Progressive %', 
                    value: `${selectedAnalysis.casa_metrics?.progressive_motility?.toFixed(1) || '0.0'}%`, 
                    labelAr: 'نسبة التقدمية' 
                  },
                  { 
                    label: 'Total Count', 
                    value: selectedAnalysis.casa_metrics?.total_count?.toString() || '0', 
                    labelAr: 'العدد الكلي' 
                  }
                ].map((stat, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{stat.label}</p>
                      <p className="text-xs text-muted-foreground">{stat.labelAr}</p>
                    </div>
                    <Badge variant="outline">{stat.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Export Options */}
        {!loading && !error && selectedAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>خيارات التصدير</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="h-12"
                  onClick={() => handleExport('png')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Charts
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12"
                  onClick={() => handleExport('pdf')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12"
                  onClick={() => handleExport('csv')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12"
                  onClick={() => handleExport('report')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Full Report
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation */}
        <div className="flex gap-4 mt-6 mb-20">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => onNavigate('results')}
          >
            Back to Results
          </Button>
          <Button 
            className="flex-1"
            onClick={() => onNavigate('analyze')}
          >
            New Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}