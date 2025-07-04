import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Microscope,
  Activity,
  Zap,
  Upload,
  Camera,
  BarChart3,
  TrendingUp,
  Shield,
  Clock
} from "lucide-react";

interface HomePageProps {
  onNavigate: (page: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="px-6 py-8">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-primary rounded-2xl">
              <Microscope className="h-8 w-8 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-foreground">Sperm Analyzer AI</h1>
              <p className="text-sm text-muted-foreground">محلل الحيوانات المنوية بالذكاء الاصطناعي</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Activity className="h-3 w-3 mr-1" />
              Real-time Analysis
            </Badge>
            <Badge variant="secondary" className="bg-accent/10 text-accent">
              <Shield className="h-3 w-3 mr-1" />
              WHO Standards
            </Badge>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0"
            onClick={() => onNavigate('analyze')}
          >
            <CardContent className="p-6 text-center">
              <Camera className="h-12 w-12 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Camera Analysis</h3>
              <p className="text-xs opacity-90">تحليل بالكاميرا</p>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-accent to-accent/80 text-accent-foreground border-0"
            onClick={() => onNavigate('analyze')}
          >
            <CardContent className="p-6 text-center">
              <Upload className="h-12 w-12 mx-auto mb-3" />
              <h3 className="font-semibold mb-1">Upload File</h3>
              <p className="text-xs opacity-90">رفع ملف</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Features / المميزات</h2>
        <div className="space-y-3">
          {[
            {
              icon: Activity,
              title: "CASA Metrics",
              titleAr: "مقاييس CASA",
              description: "VCL, VSL, LIN, MOT analysis",
              descriptionAr: "تحليل معدل الحركة والسرعة"
            },
            {
              icon: Zap,
              title: "Real-time Processing",
              titleAr: "معالجة فورية",
              description: "Instant AI-powered analysis",
              descriptionAr: "تحليل فوري بالذكاء الاصطناعي"
            },
            {
              icon: BarChart3,
              title: "Visual Reports",
              titleAr: "تقارير مرئية",
              description: "Interactive charts and graphs",
              descriptionAr: "رسوم بيانية تفاعلية"
            },
            {
              icon: TrendingUp,
              title: "Trend Analysis",
              titleAr: "تحليل الاتجاهات",
              description: "Track changes over time",
              descriptionAr: "تتبع التغييرات عبر الزمن"
            }
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground">{feature.titleAr}</p>
                      <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Analysis */}
      <div className="px-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Analysis</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onNavigate('results')}
          >
            View All
          </Button>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center py-8">
              <Clock className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No analysis yet</p>
              <p className="text-sm text-muted-foreground">لا يوجد تحليل بعد</p>
              <Button 
                className="mt-4" 
                onClick={() => onNavigate('analyze')}
              >
                Start Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="px-6 mb-20">
        <h2 className="text-lg font-semibold mb-4 text-foreground">Quick Stats</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Analyses", labelAr: "إجمالي التحاليل", value: "0" },
            { label: "Avg. Count", labelAr: "المتوسط", value: "-" },
            { label: "Success Rate", labelAr: "معدل النجاح", value: "-" }
          ].map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.labelAr}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}