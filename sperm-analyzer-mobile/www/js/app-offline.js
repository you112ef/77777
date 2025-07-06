/**
 * Offline Sperm Analyzer App
 * Main application logic for local AI processing
 */

class SpermAnalyzerApp {
    constructor() {
        this.currentMedia = null;
        this.currentAnalysis = null;
        this.analysisHistory = [];
        this.settings = {
            confidenceThreshold: 0.5,
            analysisQuality: 'balanced',
            darkMode: false,
            autoSave: true
        };
        
        this.init();
    }
    
    init() {
        // Load settings
        this.loadSettings();
        
        // Initialize UI
        this.initializeUI();
        
        // Listen for AI model events
        this.setupAIEventListeners();
        
        // Load history
        this.loadAnalysisHistory();
        
        console.log('Sperm Analyzer App initialized');
    }
    
    loadSettings() {
        const savedSettings = localStorage.getItem('sperm-analyzer-settings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        }
        
        // Apply settings to UI
        this.applySettings();
    }
    
    saveSettings() {
        localStorage.setItem('sperm-analyzer-settings', JSON.stringify(this.settings));
    }
    
    applySettings() {
        // Dark mode
        if (this.settings.darkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('dark-mode').checked = true;
        }
        
        // Other settings
        document.getElementById('confidence-threshold').value = this.settings.confidenceThreshold;
        document.getElementById('confidence-value').textContent = this.settings.confidenceThreshold;
        document.getElementById('analysis-quality').value = this.settings.analysisQuality;
        document.getElementById('auto-save').checked = this.settings.autoSave;
    }
    
    initializeUI() {
        // Settings event listeners
        document.getElementById('confidence-threshold').addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            this.settings.confidenceThreshold = value;
            document.getElementById('confidence-value').textContent = value;
            this.saveSettings();
        });
        
        document.getElementById('analysis-quality').addEventListener('change', (e) => {
            this.settings.analysisQuality = e.target.value;
            this.saveSettings();
        });
        
        document.getElementById('dark-mode').addEventListener('change', (e) => {
            this.settings.darkMode = e.target.checked;
            document.body.classList.toggle('dark-mode', e.target.checked);
            this.saveSettings();
        });
        
        document.getElementById('auto-save').addEventListener('change', (e) => {
            this.settings.autoSave = e.target.checked;
            this.saveSettings();
        });
        
        // Show home section by default
        this.showSection('home');
        
        console.log('UI initialized');
    }
    
    setupAIEventListeners() {
        // Listen for AI model loading
        window.addEventListener('ai-model-loaded', (event) => {
            this.onAIModelLoaded(event.detail);
        });
        
        // Listen for video analysis progress
        window.addEventListener('video-analysis-progress', (event) => {
            this.onVideoAnalysisProgress(event.detail);
        });
    }
    
    onAIModelLoaded(detail) {
        console.log('AI Model loaded:', detail);
        
        // Hide loading screen
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        
        loadingScreen.style.display = 'none';
        app.style.display = 'block';
        
        // Update AI status
        const aiStatus = document.getElementById('ai-status');
        const statusIcon = aiStatus.querySelector('.status-icon');
        const statusText = aiStatus.querySelector('.status-text');
        
        statusIcon.textContent = 'psychology';
        statusIcon.style.color = '#4CAF50';
        statusText.textContent = 'جاهز للتحليل';
        
        // Update model info in settings
        this.updateModelInfo(detail.metadata);
        
        this.showToast('تم تحميل نموذج الذكاء الاصطناعي بنجاح', 'success');
    }
    
    updateModelInfo(metadata) {
        const modelInfoDiv = document.getElementById('model-info');
        const processorInfo = window.localAIProcessor.getModelInfo();
        
        modelInfoDiv.innerHTML = `
            <div class="info-row">
                <span class="info-label">إصدار النموذج:</span>
                <span class="info-value">${metadata?.model_version || '1.0'}</span>
            </div>
            <div class="info-row">
                <span class="info-label">نوع المعالج:</span>
                <span class="info-value">${processorInfo.backend}</span>
            </div>
            <div class="info-row">
                <span class="info-label">حالة التهيئة:</span>
                <span class="info-value ${processorInfo.isInitialized ? 'success' : 'error'}">
                    ${processorInfo.isInitialized ? 'مُهيأ' : 'غير مُهيأ'}
                </span>
            </div>
            <div class="info-row">
                <span class="info-label">استخدام الذاكرة:</span>
                <span class="info-value">${Math.round(processorInfo.memoryInfo?.numTensors || 0)} tensors</span>
            </div>
        `;
    }
    
    showSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const navItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }
        
        // Special handling for sections
        if (sectionId === 'results' && this.currentAnalysis) {
            this.displayAnalysisResults(this.currentAnalysis);
        } else if (sectionId === 'history') {
            this.displayAnalysisHistory();
        }
    }
    
    async captureImage() {
        try {
            if (!window.Capacitor?.isNativePlatform()) {
                // Web fallback
                await this.captureImageWeb();
                return;
            }
            
            const { Camera } = Capacitor.Plugins;
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: 'dataUrl',
                source: 'camera'
            });
            
            this.displayCapturedMedia(image.dataUrl, 'image');
            
        } catch (error) {
            console.error('Error capturing image:', error);
            this.showToast('فشل في التقاط الصورة', 'error');
        }
    }
    
    async captureImageWeb() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            
            video.addEventListener('loadedmetadata', () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0);
                
                const dataURL = canvas.toDataURL('image/jpeg', 0.9);
                
                // Stop camera
                stream.getTracks().forEach(track => track.stop());
                
                this.displayCapturedMedia(dataURL, 'image');
            });
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.showToast('فشل في الوصول للكاميرا', 'error');
        }
    }
    
    async captureVideo() {
        this.showToast('تسجيل الفيديو قيد التطوير', 'info');
    }
    
    async selectFromGallery() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,video/*';
            
            input.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
                        this.displayCapturedMedia(e.target.result, mediaType);
                    };
                    reader.readAsDataURL(file);
                }
            };
            
            input.click();
            
        } catch (error) {
            console.error('Error selecting from gallery:', error);
            this.showToast('فشل في اختيار الملف', 'error');
        }
    }
    
    displayCapturedMedia(dataURL, type) {
        this.currentMedia = { dataURL, type };
        
        const previewArea = document.getElementById('preview-area');
        const previewImage = document.getElementById('preview-image');
        const previewVideo = document.getElementById('preview-video');
        
        // Hide both elements first
        previewImage.style.display = 'none';
        previewVideo.style.display = 'none';
        
        if (type === 'image') {
            previewImage.src = dataURL;
            previewImage.style.display = 'block';
        } else {
            previewVideo.src = dataURL;
            previewVideo.style.display = 'block';
        }
        
        previewArea.style.display = 'block';
        
        this.showToast('تم التقاط العينة بنجاح', 'success');
    }
    
    closePreview() {
        document.getElementById('preview-area').style.display = 'none';
        this.currentMedia = null;
    }
    
    retakeMedia() {
        this.closePreview();
    }
    
    async analyzeMedia() {
        if (!this.currentMedia) {
            this.showToast('لا توجد عينة للتحليل', 'error');
            return;
        }
        
        if (!window.localAIProcessor.isInitialized) {
            this.showToast('نموذج الذكاء الاصطناعي غير جاهز', 'error');
            return;
        }
        
        // Switch to analysis section
        this.showSection('analysis');
        
        // Show processing UI
        document.getElementById('analysis-waiting').style.display = 'none';
        document.getElementById('analysis-processing').style.display = 'block';
        
        // Update sample type
        document.getElementById('sample-type').textContent = 
            this.currentMedia.type === 'image' ? 'صورة' : 'فيديو';
        
        try {
            await this.performAnalysis();
        } catch (error) {
            console.error('Analysis failed:', error);
            this.showToast('فشل في التحليل', 'error');
            this.resetAnalysisUI();
        }
    }
    
    async performAnalysis() {
        const startTime = Date.now();
        
        // Create image/video element for processing
        const mediaElement = this.createMediaElement();
        
        try {
            let analysis;
            
            if (this.currentMedia.type === 'image') {
                analysis = await this.analyzeImage(mediaElement);
            } else {
                analysis = await this.analyzeVideo(mediaElement);
            }
            
            const processingTime = Date.now() - startTime;
            analysis.totalProcessingTime = processingTime;
            
            this.currentAnalysis = analysis;
            
            // Save to history if auto-save is enabled
            if (this.settings.autoSave) {
                this.saveAnalysisToHistory(analysis);
            }
            
            // Show results
            this.showSection('results');
            this.displayAnalysisResults(analysis);
            
            this.showToast('تم التحليل بنجاح', 'success');
            
        } catch (error) {
            throw error;
        }
    }
    
    createMediaElement() {
        if (this.currentMedia.type === 'image') {
            const img = new Image();
            img.src = this.currentMedia.dataURL;
            return img;
        } else {
            const video = document.createElement('video');
            video.src = this.currentMedia.dataURL;
            video.muted = true;
            return video;
        }
    }
    
    async analyzeImage(imageElement) {
        this.updateAnalysisProgress(20, 'معالجة الصورة...');
        this.updateAnalysisStep('step-preprocessing', true);
        
        await this.wait(500);
        
        this.updateAnalysisProgress(50, 'اكتشاف الخلايا...');
        this.updateAnalysisStep('step-detection', true);
        
        const analysis = await window.localAIProcessor.processImage(imageElement, {
            confidenceThreshold: this.settings.confidenceThreshold,
            quality: this.settings.analysisQuality
        });
        
        this.updateAnalysisProgress(80, 'تحليل النتائج...');
        this.updateAnalysisStep('step-analysis', true);
        
        await this.wait(300);
        
        this.updateAnalysisProgress(100, 'إنشاء التقرير...');
        this.updateAnalysisStep('step-report', true);
        
        return analysis;
    }
    
    async analyzeVideo(videoElement) {
        this.updateAnalysisProgress(10, 'تحليل الفيديو...');
        
        const analysis = await window.localAIProcessor.processVideo(videoElement, {
            maxFrames: 30,
            confidenceThreshold: this.settings.confidenceThreshold,
            quality: this.settings.analysisQuality
        });
        
        this.updateAnalysisProgress(100, 'اكتمل التحليل');
        
        return analysis;
    }
    
    onVideoAnalysisProgress(detail) {
        const progress = Math.round(detail.progress);
        this.updateAnalysisProgress(progress, `تحليل الإطار ${detail.currentFrame}/${detail.totalFrames}`);
    }
    
    updateAnalysisProgress(percent, status) {
        document.getElementById('analysis-progress').style.width = percent + '%';
        document.getElementById('analysis-status').textContent = status;
        
        // Update processing time
        const startTime = performance.now();
        document.getElementById('processing-time').textContent = 
            Math.round((Date.now() - startTime) / 1000) + 's';
    }
    
    updateAnalysisStep(stepId, active) {
        const step = document.getElementById(stepId);
        if (step) {
            step.classList.toggle('active', active);
        }
    }
    
    resetAnalysisUI() {
        document.getElementById('analysis-waiting').style.display = 'block';
        document.getElementById('analysis-processing').style.display = 'none';
        
        // Reset progress
        document.getElementById('analysis-progress').style.width = '0%';
        
        // Reset steps
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
    }
    
    displayAnalysisResults(analysis) {
        const container = document.getElementById('results-container');
        
        container.innerHTML = `
            <div class="results-header">
                <h2>نتائج التحليل</h2>
                <div class="analysis-info">
                    <span class="analysis-date">${new Date(analysis.timestamp).toLocaleString('ar')}</span>
                    <span class="processing-time">وقت المعالجة: ${analysis.processingTime}ms</span>
                </div>
            </div>
            
            <div class="results-summary">
                <div class="summary-card">
                    <div class="summary-header">
                        <i class="material-icons">summarize</i>
                        <h3>ملخص التحليل</h3>
                    </div>
                    <div class="summary-content">
                        <div class="quality-indicator ${analysis.analysisReport.quality.toLowerCase()}">
                            ${analysis.analysisReport.quality}
                        </div>
                        <p class="summary-text">${analysis.analysisReport.summary}</p>
                    </div>
                </div>
            </div>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-icon">
                        <i class="material-icons">count</i>
                    </div>
                    <div class="metric-content">
                        <h4>العدد الكلي</h4>
                        <div class="metric-value">${analysis.casaMetrics.totalCount.toLocaleString()}</div>
                        <div class="metric-unit">خلية</div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon">
                        <i class="material-icons">science</i>
                    </div>
                    <div class="metric-content">
                        <h4>التركيز</h4>
                        <div class="metric-value">${(analysis.casaMetrics.concentration / 1000000).toFixed(1)}</div>
                        <div class="metric-unit">مليون/مل</div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon">
                        <i class="material-icons">trending_up</i>
                    </div>
                    <div class="metric-content">
                        <h4>الحركة التقدمية</h4>
                        <div class="metric-value">${analysis.casaMetrics.progressiveMotility}</div>
                        <div class="metric-unit">%</div>
                    </div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-icon">
                        <i class="material-icons">speed</i>
                    </div>
                    <div class="metric-content">
                        <h4>إجمالي الحركة</h4>
                        <div class="metric-value">${analysis.casaMetrics.totalMotility}</div>
                        <div class="metric-unit">%</div>
                    </div>
                </div>
            </div>
            
            <div class="detailed-metrics">
                <h3>تفاصيل القياسات</h3>
                <div class="metrics-table">
                    <div class="table-row">
                        <span class="metric-name">السرعة الخطية (VCL)</span>
                        <span class="metric-value">${analysis.casaMetrics.vclMean?.toFixed(1) || 'N/A'} μm/s</span>
                    </div>
                    <div class="table-row">
                        <span class="metric-name">السرعة المستقيمة (VSL)</span>
                        <span class="metric-value">${analysis.casaMetrics.vslMean?.toFixed(1) || 'N/A'} μm/s</span>
                    </div>
                    <div class="table-row">
                        <span class="metric-name">السرعة المتوسطة (VAP)</span>
                        <span class="metric-value">${analysis.casaMetrics.vapMean?.toFixed(1) || 'N/A'} μm/s</span>
                    </div>
                    <div class="table-row">
                        <span class="metric-name">الخطية (LIN)</span>
                        <span class="metric-value">${analysis.casaMetrics.linearityMean?.toFixed(1) || 'N/A'}%</span>
                    </div>
                    <div class="table-row">
                        <span class="metric-name">الاستقامة (STR)</span>
                        <span class="metric-value">${analysis.casaMetrics.straightnessMean?.toFixed(1) || 'N/A'}%</span>
                    </div>
                </div>
            </div>
            
            <div class="recommendations">
                <h3>التوصيات</h3>
                <div class="recommendation-list">
                    ${analysis.analysisReport.recommendations.map(rec => 
                        `<div class="recommendation-item">
                            <i class="material-icons">lightbulb</i>
                            <span>${rec}</span>
                        </div>`
                    ).join('')}
                </div>
            </div>
            
            <div class="normal-ranges">
                <h3>المعدلات الطبيعية</h3>
                <div class="ranges-table">
                    ${Object.entries(analysis.analysisReport.normalRanges).map(([key, value]) => 
                        `<div class="table-row">
                            <span class="range-name">${this.translateMetricName(key)}</span>
                            <span class="range-value">${value}</span>
                        </div>`
                    ).join('')}
                </div>
            </div>
            
            <div class="results-actions">
                <button class="primary-btn" onclick="app.saveAnalysis()">
                    <i class="material-icons">save</i>
                    حفظ النتائج
                </button>
                <button class="secondary-btn" onclick="app.shareResults()">
                    <i class="material-icons">share</i>
                    مشاركة
                </button>
                <button class="secondary-btn" onclick="app.exportResults()">
                    <i class="material-icons">download</i>
                    تصدير PDF
                </button>
            </div>
        `;
    }
    
    translateMetricName(key) {
        const translations = {
            concentration: 'التركيز',
            progressiveMotility: 'الحركة التقدمية',
            totalMotility: 'إجمالي الحركة'
        };
        return translations[key] || key;
    }
    
    saveAnalysisToHistory(analysis) {
        const historyItem = {
            id: Date.now(),
            timestamp: analysis.timestamp,
            analysis: analysis,
            mediaType: this.currentMedia?.type || 'unknown'
        };
        
        this.analysisHistory.unshift(historyItem);
        
        // Keep only last 50 analyses
        if (this.analysisHistory.length > 50) {
            this.analysisHistory = this.analysisHistory.slice(0, 50);
        }
        
        localStorage.setItem('sperm-analyzer-history', JSON.stringify(this.analysisHistory));
    }
    
    loadAnalysisHistory() {
        const savedHistory = localStorage.getItem('sperm-analyzer-history');
        if (savedHistory) {
            this.analysisHistory = JSON.parse(savedHistory);
        }
    }
    
    displayAnalysisHistory() {
        const historyList = document.getElementById('history-list');
        
        if (this.analysisHistory.length === 0) {
            historyList.innerHTML = `
                <div class="empty-history">
                    <i class="material-icons">history</i>
                    <h3>لا يوجد سجل تحليلات</h3>
                    <p>ابدأ بإجراء تحليل لرؤية النتائج هنا</p>
                </div>
            `;
            return;
        }
        
        historyList.innerHTML = this.analysisHistory.map(item => `
            <div class="history-item" onclick="app.viewHistoryItem(${item.id})">
                <div class="history-header">
                    <div class="history-date">${new Date(item.timestamp).toLocaleString('ar')}</div>
                    <div class="history-type">
                        <i class="material-icons">
                            ${item.mediaType === 'video' ? 'videocam' : 'image'}
                        </i>
                    </div>
                </div>
                <div class="history-summary">
                    <div class="summary-metric">
                        <span class="metric-label">العدد:</span>
                        <span class="metric-value">${item.analysis.casaMetrics.totalCount}</span>
                    </div>
                    <div class="summary-metric">
                        <span class="metric-label">الحركة:</span>
                        <span class="metric-value">${item.analysis.casaMetrics.totalMotility}%</span>
                    </div>
                    <div class="summary-metric">
                        <span class="metric-label">الجودة:</span>
                        <span class="metric-value ${item.analysis.analysisReport.quality.toLowerCase()}">
                            ${item.analysis.analysisReport.quality}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    viewHistoryItem(id) {
        const item = this.analysisHistory.find(h => h.id === id);
        if (item) {
            this.currentAnalysis = item.analysis;
            this.showSection('results');
            this.displayAnalysisResults(item.analysis);
        }
    }
    
    clearHistory() {
        if (confirm('هل تريد مسح جميع سجلات التحليل؟')) {
            this.analysisHistory = [];
            localStorage.removeItem('sperm-analyzer-history');
            this.displayAnalysisHistory();
            this.showToast('تم مسح السجل', 'success');
        }
    }
    
    exportHistory() {
        const dataStr = JSON.stringify(this.analysisHistory, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `sperm-analysis-history-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        this.showToast('تم تصدير السجل', 'success');
    }
    
    saveAnalysis() {
        if (this.currentAnalysis) {
            this.saveAnalysisToHistory(this.currentAnalysis);
            this.showToast('تم حفظ النتائج', 'success');
        }
    }
    
    shareResults() {
        if (navigator.share && this.currentAnalysis) {
            navigator.share({
                title: 'نتائج تحليل الحيوانات المنوية',
                text: this.currentAnalysis.analysisReport.summary,
                url: window.location.href
            });
        } else {
            this.showToast('المشاركة غير متاحة', 'info');
        }
    }
    
    exportResults() {
        this.showToast('تصدير PDF قيد التطوير', 'info');
    }
    
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="material-icons">${this.getToastIcon(type)}</i>
            <span>${message}</span>
        `;
        
        const container = document.getElementById('toast-container');
        container.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, 3000);
    }
    
    getToastIcon(type) {
        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };
        return icons[type] || 'info';
    }
    
    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Global functions for HTML onclick handlers
function showSection(sectionId) {
    app.showSection(sectionId);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('open');
}

function captureImage() {
    app.captureImage();
}

function captureVideo() {
    app.captureVideo();
}

function selectFromGallery() {
    app.selectFromGallery();
}

function closePreview() {
    app.closePreview();
}

function retakeMedia() {
    app.retakeMedia();
}

function analyzeMedia() {
    app.analyzeMedia();
}

function clearHistory() {
    app.clearHistory();
}

function exportHistory() {
    app.exportHistory();
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SpermAnalyzerApp();
});

// Loading screen updates
window.addEventListener('load', () => {
    let progress = 0;
    const loadingProgress = document.getElementById('loading-progress');
    const loadingStatus = document.getElementById('loading-status');
    
    const updateProgress = (percent, status) => {
        loadingProgress.style.width = percent + '%';
        loadingStatus.textContent = status;
    };
    
    // Simulate loading progress
    const progressSteps = [
        { percent: 20, status: 'تحميل TensorFlow.js...' },
        { percent: 40, status: 'تهيئة النموذج...' },
        { percent: 60, status: 'تحضير المعالج...' },
        { percent: 80, status: 'اختبار النموذج...' },
        { percent: 100, status: 'جاهز للاستخدام!' }
    ];
    
    let currentStep = 0;
    const progressInterval = setInterval(() => {
        if (currentStep < progressSteps.length) {
            const step = progressSteps[currentStep];
            updateProgress(step.percent, step.status);
            currentStep++;
        } else {
            clearInterval(progressInterval);
        }
    }, 1000);
});