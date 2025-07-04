import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings,
  Moon,
  Sun,
  Globe,
  Camera,
  Cpu,
  Database,
  Shield,
  Bell,
  Download,
  RotateCcw,
  Info
} from "lucide-react";

interface SettingsPageProps {
  onNavigate: (page: string) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

export default function SettingsPage({ onNavigate, darkMode, setDarkMode }: SettingsPageProps) {
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [cameraQuality, setCameraQuality] = useState([720]);
  const [analysisThreshold, setAnalysisThreshold] = useState([25]);
  const [storageLimit, setStorageLimit] = useState([100]);

  const resetSettings = () => {
    setLanguage('en');
    setNotifications(true);
    setAutoSave(true);
    setCameraQuality([720]);
    setAnalysisThreshold([25]);
    setStorageLimit([100]);
    setDarkMode(false);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">الإعدادات</p>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="camera">Camera</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sun className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>المظهر</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">الوضع المظلم</p>
                  </div>
                  <Switch
                    id="dark-mode"
                    checked={darkMode}
                    onCheckedChange={setDarkMode}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Language */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Language
                </CardTitle>
                <CardDescription>اللغة</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={language === 'en' ? 'default' : 'outline'}
                    onClick={() => setLanguage('en')}
                  >
                    English
                  </Button>
                  <Button
                    variant={language === 'ar' ? 'default' : 'outline'}
                    onClick={() => setLanguage('ar')}
                  >
                    العربية
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>الإشعارات</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notifications">Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">تفعيل الإشعارات</p>
                  </div>
                  <Switch
                    id="notifications"
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            {/* Analysis Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Analysis Parameters
                </CardTitle>
                <CardDescription>معاملات التحليل</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="threshold">Detection Threshold</Label>
                    <Badge variant="secondary">{analysisThreshold[0]}%</Badge>
                  </div>
                  <Slider
                    id="threshold"
                    min={10}
                    max={90}
                    step={5}
                    value={analysisThreshold}
                    onValueChange={setAnalysisThreshold}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">عتبة الكشف</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-save">Auto-save Results</Label>
                    <p className="text-sm text-muted-foreground">حفظ تلقائي للنتائج</p>
                  </div>
                  <Switch
                    id="auto-save"
                    checked={autoSave}
                    onCheckedChange={setAutoSave}
                  />
                </div>
              </CardContent>
            </Card>

            {/* WHO Standards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  WHO Standards
                </CardTitle>
                <CardDescription>معايير منظمة الصحة العالمية</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Concentration</p>
                    <p className="text-muted-foreground">≥15 million/ml</p>
                  </div>
                  <div>
                    <p className="font-medium">Progressive Motility</p>
                    <p className="text-muted-foreground">≥32%</p>
                  </div>
                  <div>
                    <p className="font-medium">Total Motility</p>
                    <p className="text-muted-foreground">≥40%</p>
                  </div>
                  <div>
                    <p className="font-medium">Normal Forms</p>
                    <p className="text-muted-foreground">≥4%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="camera" className="space-y-4">
            {/* Camera Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Camera Quality
                </CardTitle>
                <CardDescription>جودة الكاميرا</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="quality">Resolution</Label>
                    <Badge variant="secondary">{cameraQuality[0]}p</Badge>
                  </div>
                  <Slider
                    id="quality"
                    min={480}
                    max={1080}
                    step={240}
                    value={cameraQuality}
                    onValueChange={setCameraQuality}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">الدقة</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[480, 720, 1080].map((quality) => (
                    <Button
                      key={quality}
                      variant={cameraQuality[0] === quality ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCameraQuality([quality])}
                    >
                      {quality}p
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Video Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Video Recording</CardTitle>
                <CardDescription>تسجيل الفيديو</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Recommended Duration</span>
                    <Badge variant="outline">5-30 seconds</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Format</span>
                    <Badge variant="outline">WebM/MP4</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Frame Rate</span>
                    <Badge variant="outline">30 FPS</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            {/* Storage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Storage Management
                </CardTitle>
                <CardDescription>إدارة التخزين</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="storage">Storage Limit</Label>
                    <Badge variant="secondary">{storageLimit[0]} MB</Badge>
                  </div>
                  <Slider
                    id="storage"
                    min={50}
                    max={500}
                    step={50}
                    value={storageLimit}
                    onValueChange={setStorageLimit}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-1">حد التخزين</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Used Storage</span>
                    <Badge variant="outline">25 MB</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Analyses Stored</span>
                    <Badge variant="outline">12</Badge>
                  </div>
                </div>

                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
              </CardContent>
            </Card>

            {/* Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy & Security
                </CardTitle>
                <CardDescription>الخصوصية والأمان</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">Local Processing</p>
                      <p className="text-xs text-muted-foreground">معالجة محلية</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">No Data Upload</p>
                      <p className="text-xs text-muted-foreground">لا يتم رفع البيانات</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">Encrypted Storage</p>
                      <p className="text-xs text-muted-foreground">تخزين مشفر</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reset & About */}
        <div className="space-y-4 mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Reset Settings</p>
                  <p className="text-sm text-muted-foreground">إعادة تعيين الإعدادات</p>
                </div>
                <Button variant="outline" onClick={resetSettings}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                About
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Version</span>
                  <Badge variant="outline">1.0.0</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Build</span>
                  <Badge variant="outline">2024.01.15</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Engine</span>
                  <Badge variant="outline">YOLOv8</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Standards</span>
                  <Badge variant="outline">WHO 2021</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Padding for Navigation */}
        <div className="h-20" />
      </div>
    </div>
  );
}