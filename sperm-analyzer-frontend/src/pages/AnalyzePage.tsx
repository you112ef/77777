import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Camera,
  Upload,
  Video,
  Image as ImageIcon,
  Play,
  Square,
  RotateCcw,
  FileVideo,
  Loader2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface AnalyzePageProps {
  onNavigate: (page: string) => void;
}

type AnalysisMode = 'camera' | 'upload' | null;
type FileType = 'video' | 'image' | null;

export default function AnalyzePage({ onNavigate }: AnalyzePageProps) {
  const [mode, setMode] = useState<AnalysisMode>(null);
  const [fileType, setFileType] = useState<FileType>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const startRecording = () => {
    if (!cameraStream) return;
    
    const mediaRecorder = new MediaRecorder(cameraStream);
    mediaRecorderRef.current = mediaRecorder;
    
    const chunks: BlobPart[] = [];
    mediaRecorder.ondataavailable = (event) => {
      chunks.push(event.data);
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const file = new File([blob], 'recorded-video.webm', { type: 'video/webm' });
      setSelectedFile(file);
      analyzeFile(file);
    };
    
    mediaRecorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    if (context) {
      context.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'captured-photo.jpg', { type: 'image/jpeg' });
          setSelectedFile(file);
          analyzeFile(file);
        }
      }, 'image/jpeg');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      analyzeFile(file);
    }
  };

  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    try {
      // Import API client
      const { devApiClient } = await import('@/backend/api');
      
      // Start analysis
      const analysisType = file.type.startsWith('video/') ? 'video' : 'image';
      const response = await devApiClient.startAnalysis({
        file,
        analysisType
      });
      
      console.log('Analysis started:', response.analysis_id);
      
      // Wait for completion with progress updates
      await devApiClient.waitForAnalysis(
        response.analysis_id,
        (status) => {
          setAnalysisProgress(status.progress);
          console.log('Progress:', status.progress, status.message);
        }
      );
      
      setIsAnalyzing(false);
      // Navigate to results after analysis
      setTimeout(() => onNavigate('results'), 500);
      
    } catch (error) {
      console.error('Analysis failed:', error);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      
      // Show error to user
      alert('Analysis failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const resetAnalysis = () => {
    setMode(null);
    setFileType(null);
    setSelectedFile(null);
    setIsAnalyzing(false);
    setAnalysisProgress(0);
    stopCamera();
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <CardTitle>Analyzing Sample</CardTitle>
            <CardDescription>تحليل العينة جاري...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={analysisProgress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">
              {Math.round(analysisProgress)}% Complete
            </p>
            {selectedFile && (
              <div className="text-center">
                <p className="text-sm font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === 'camera') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold">Camera Analysis</h1>
            <Button variant="ghost" size="sm" onClick={resetAnalysis}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Camera View */}
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-[4/3] bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {!cameraStream && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button onClick={startCamera}>
                      <Camera className="h-4 w-4 mr-2" />
                      Start Camera
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Controls */}
          {cameraStream && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={capturePhoto}
                  variant="outline"
                  className="h-12"
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Photo
                </Button>
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant={isRecording ? "destructive" : "default"}
                  className="h-12"
                >
                  {isRecording ? (
                    <>
                      <Square className="h-4 w-4 mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4 mr-2" />
                      Record
                    </>
                  )}
                </Button>
              </div>

              {isRecording && (
                <div className="text-center">
                  <Badge variant="destructive" className="animate-pulse">
                    Recording...
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (mode === 'upload') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold">Upload File</h1>
            <Button variant="ghost" size="sm" onClick={resetAnalysis}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* File Upload */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-center">Select Analysis Type</CardTitle>
              <CardDescription className="text-center">
                اختر نوع التحليل
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant={fileType === 'video' ? 'default' : 'outline'}
                  onClick={() => setFileType('video')}
                  className="h-20 flex-col"
                >
                  <FileVideo className="h-8 w-8 mb-2" />
                  <span>Video</span>
                  <span className="text-xs">فيديو</span>
                </Button>
                <Button
                  variant={fileType === 'image' ? 'default' : 'outline'}
                  onClick={() => setFileType('image')}
                  className="h-20 flex-col"
                >
                  <ImageIcon className="h-8 w-8 mb-2" />
                  <span>Image</span>
                  <span className="text-xs">صورة</span>
                </Button>
              </div>

              {fileType && (
                <div className="space-y-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={fileType === 'video' ? 'video/*' : 'image/*'}
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-12"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose {fileType === 'video' ? 'Video' : 'Image'} File
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    <p>Supported formats:</p>
                    <p>
                      {fileType === 'video' 
                        ? 'MP4, AVI, MOV, WebM' 
                        : 'JPEG, PNG, TIFF'
                      }
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main selection screen
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Analysis Mode</h1>
          <p className="text-muted-foreground">وضع التحليل</p>
        </div>

        {/* Mode Selection */}
        <div className="space-y-4">
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
            onClick={() => setMode('camera')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Camera className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Camera Analysis</h3>
                  <p className="text-sm text-muted-foreground">تحليل بالكاميرا</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Capture live video or photos using your camera
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary"
            onClick={() => setMode('upload')}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-full">
                  <Upload className="h-8 w-8 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Upload File</h3>
                  <p className="text-sm text-muted-foreground">رفع ملف</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload existing video or image files
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-center text-lg">Instructions</CardTitle>
            <CardDescription className="text-center">تعليمات</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">For best results:</p>
                <p className="text-xs text-muted-foreground">
                  Use good lighting and stable positioning
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Video length:</p>
                <p className="text-xs text-muted-foreground">
                  5-30 seconds for optimal analysis
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Privacy:</p>
                <p className="text-xs text-muted-foreground">
                  All analysis is done locally on your device
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}