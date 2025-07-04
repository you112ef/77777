import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText,
  Download,
  Eye,
  Trash2,
  Calendar,
  Activity,
  TrendingUp,
  BarChart3
} from "lucide-react";

interface ResultsPageProps {
  onNavigate: (page: string) => void;
}

interface AnalysisListItem {
  analysis_id: string;
  status: string;
  created_at: string;
  filename: string;
}

interface DetailedResult {
  analysis_id: string;
  filename: string;
  analysis_type: string;
  created_at: string;
  casa_metrics?: {
    total_count: number;
    progressive_motility: number;
    concentration: number;
    vcl_mean: number;
    vsl_mean: number;
    vap_mean: number;
    lin_mean: number;
    str_mean: number;
    wob_mean: number;
    alh_mean: number;
    bcf_mean: number;
  };
  status: string;
}

export default function ResultsPage({ onNavigate }: ResultsPageProps) {
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisListItem[]>([]);
  const [detailedResult, setDetailedResult] = useState<DetailedResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const { devApiClient } = await import('../backend/api');
      const response = await devApiClient.listAnalyses();
      setAnalyses(response.analyses);
    } catch (error) {
      console.error('Failed to load analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (resultId: string) => {
    setSelectedResult(resultId);
    try {
      const { devApiClient } = await import('../backend/api');
      const result = await devApiClient.getAnalysisResults(resultId);
      setDetailedResult(result);
    } catch (error) {
      console.error('Failed to load result details:', error);
    }
  };

  const handleViewGraphs = () => {
    onNavigate('graphs');
  };

  if (selectedResult && detailedResult) {
    const result = detailedResult;
    
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button 
              variant="ghost" 
              onClick={() => setSelectedResult(null)}
            >
              ← Back
            </Button>
            <h1 className="text-xl font-semibold">Analysis Details</h1>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleViewGraphs}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Graphs
            </Button>
          </div>

          {result && (
            <div className="space-y-6">
              {/* File Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {result.filename}
                  </CardTitle>
                  <CardDescription>
                    Analyzed on {new Date(result.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Type</p>
                      <Badge variant="secondary">{result.analysis_type}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Status</p>
                      <Badge variant="default">{result.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* CASA Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>CASA Metrics</CardTitle>
                  <CardDescription>مقاييس CASA</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-primary">{result.casa_metrics?.total_count || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Count</p>
                      <p className="text-xs text-muted-foreground">العدد الكلي</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-600">{result.casa_metrics?.progressive_motility?.toFixed(1) || 0}%</p>
                      <p className="text-sm text-muted-foreground">Motility</p>
                      <p className="text-xs text-muted-foreground">الحركة</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">{(result.casa_metrics?.concentration || 0).toFixed(1)}M/ml</p>
                      <p className="text-sm text-muted-foreground">Concentration</p>
                      <p className="text-xs text-muted-foreground">التركيز</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detailed Metrics */}
              <Tabs defaultValue="velocity" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="velocity">Velocity</TabsTrigger>
                  <TabsTrigger value="kinematic">Kinematic</TabsTrigger>
                  <TabsTrigger value="morphology">Morphology</TabsTrigger>
                </TabsList>
                
                <TabsContent value="velocity" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Velocity Parameters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { label: "VCL (Curvilinear Velocity)", value: `${result.casa_metrics?.vcl_mean?.toFixed(1) || 0} μm/s`, desc: "السرعة المنحنية" },
                          { label: "VSL (Straight Line Velocity)", value: `${result.casa_metrics?.vsl_mean?.toFixed(1) || 0} μm/s`, desc: "السرعة المستقيمة" },
                          { label: "VAP (Average Path Velocity)", value: `${result.casa_metrics?.vap_mean?.toFixed(1) || 0} μm/s`, desc: "متوسط سرعة المسار" }
                        ].map((metric, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{metric.label}</p>
                              <p className="text-xs text-muted-foreground">{metric.desc}</p>
                            </div>
                            <Badge variant="outline">{metric.value}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="kinematic" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Kinematic Parameters</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { label: "LIN (Linearity)", value: `${result.casa_metrics?.lin_mean?.toFixed(1) || 0}%`, desc: "الخطية" },
                          { label: "STR (Straightness)", value: `${result.casa_metrics?.str_mean?.toFixed(1) || 0}%`, desc: "الاستقامة" },
                          { label: "WOB (Wobble)", value: `${result.casa_metrics?.wob_mean?.toFixed(1) || 0}%`, desc: "التذبذب" },
                          { label: "ALH (Lateral Head)", value: `${result.casa_metrics?.alh_mean?.toFixed(1) || 0} μm`, desc: "السعة الجانبية" },
                          { label: "BCF (Beat Frequency)", value: `${result.casa_metrics?.bcf_mean?.toFixed(1) || 0} Hz`, desc: "تردد الضربات" }
                        ].map((metric, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{metric.label}</p>
                              <p className="text-xs text-muted-foreground">{metric.desc}</p>
                            </div>
                            <Badge variant="outline">{metric.value}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="morphology" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Morphology Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { label: "Normal Forms", value: "68%", desc: "الأشكال الطبيعية" },
                          { label: "Head Defects", value: "15%", desc: "عيوب الرأس" },
                          { label: "Midpiece Defects", value: "12%", desc: "عيوب الجزء الأوسط" },
                          { label: "Tail Defects", value: "5%", desc: "عيوب الذيل" }
                        ].map((metric, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{metric.label}</p>
                              <p className="text-xs text-muted-foreground">{metric.desc}</p>
                            </div>
                            <Badge variant="outline">{metric.value}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex gap-4">
                <Button className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
                <Button variant="outline" onClick={handleViewGraphs}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Graphs
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Analysis Results</h1>
          <p className="text-muted-foreground">نتائج التحليل</p>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
                <h3 className="font-semibold mb-2">Loading Results...</h3>
                <p className="text-muted-foreground">جاري تحميل النتائج...</p>
              </CardContent>
            </Card>
          ) : analyses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">No Results Yet</h3>
                <p className="text-muted-foreground mb-4">لا توجد نتائج بعد</p>
                <Button onClick={() => onNavigate('analyze')}>
                  Start Analysis
                </Button>
              </CardContent>
            </Card>
          ) : (
            analyses.map((analysis) => (
              <Card key={analysis.analysis_id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{analysis.filename}</CardTitle>
                      <CardDescription>
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={analysis.status === 'completed' ? 'default' : 'secondary'}
                    >
                      {analysis.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewDetails(analysis.analysis_id)}
                      disabled={analysis.status !== 'completed'}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" disabled={analysis.status !== 'completed'}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}