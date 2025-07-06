// Sperm Analyzer AI - Main Application
class SpermAnalyzerApp {
    constructor() {
        this.currentImage = null;
        this.analysisHistory = [];
        this.isAnalyzing = false;
        this.model = null;
        this.isModelLoaded = false;
        
        // Initialize after DOM loaded
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
        });
        
        // Capacitor device ready
        document.addEventListener('deviceready', () => {
            this.initCapacitor();
        });
    }

    async init() {
        console.log('Initializing Sperm Analyzer App...');
        
        // Show splash screen briefly
        setTimeout(() => {
            this.hideSplashScreen();
        }, 2000);
        
        // Initialize UI components
        this.initUI();
        
        // Load analysis history
        this.loadAnalysisHistory();
        
        // Load AI model
        await this.loadAIModel();
        
        // Update stats
        this.updateStats();
        
        console.log('App initialized successfully');
    }

    hideSplashScreen() {
        const splash = document.getElementById('splash-screen');
        const mainApp = document.getElementById('main-app');
        
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.display = 'none';
            mainApp.classList.remove('hidden');
        }, 300);
    }

    initUI() {
        // Menu toggle
        const menuBtn = document.getElementById('menu-btn');
        const navDrawer = document.getElementById('nav-drawer');
        const overlay = document.getElementById('overlay');
        
        menuBtn.addEventListener('click', () => {
            navDrawer.classList.add('open');
            overlay.classList.add('visible');
        });

        overlay.addEventListener('click', () => {
            navDrawer.classList.remove('open');
            overlay.classList.remove('visible');
        });

        // Navigation items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                this.showPage(page);
                
                // Update active nav item
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
                
                // Close drawer
                navDrawer.classList.remove('open');
                overlay.classList.remove('visible');
            });
        });

        // Camera controls
        const takePhotoBtn = document.getElementById('take-photo-btn');
        const selectPhotoBtn = document.getElementById('select-photo-btn');

        takePhotoBtn.addEventListener('click', () => this.takePhoto());
        selectPhotoBtn.addEventListener('click', () => this.selectPhoto());

        // Analysis controls
        const startAnalysisBtn = document.getElementById('start-analysis-btn');
        startAnalysisBtn.addEventListener('click', () => this.startAnalysis());

        // Result actions
        const saveResultBtn = document.getElementById('save-result-btn');
        const shareResultBtn = document.getElementById('share-result-btn');
        const newAnalysisBtn = document.getElementById('new-analysis-btn');

        saveResultBtn.addEventListener('click', () => this.saveResult());
        shareResultBtn.addEventListener('click', () => this.shareResult());
        newAnalysisBtn.addEventListener('click', () => this.newAnalysis());

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        settingsBtn.addEventListener('click', () => this.showSettings());
    }

    async initCapacitor() {
        // Initialize Capacitor plugins
        try {
            await Capacitor.Plugins.StatusBar.setBackgroundColor({ color: '#2196F3' });
            await Capacitor.Plugins.SplashScreen.hide();
        } catch (error) {
            console.log('Capacitor plugins not available:', error);
        }
    }

    showPage(pageId) {
        // Hide all pages
        const pages = document.querySelectorAll('.page');
        pages.forEach(page => page.classList.remove('active'));
        
        // Show selected page
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.add('active');
            
            // Load page-specific content
            switch (pageId) {
                case 'history':
                    this.loadHistoryPage();
                    break;
                case 'reports':
                    this.loadReportsPage();
                    break;
            }
        }
    }

    async loadAIModel() {
        try {
            this.showToast('جاري تحميل نموذج الذكاء الاصطناعي...', 'info');
            
            // Load TensorFlow.js model (mock for now)
            // In a real implementation, you would load a pre-trained model
            await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
            
            this.isModelLoaded = true;
            this.showToast('تم تحميل النموذج بنجاح', 'success');
            
        } catch (error) {
            console.error('Error loading AI model:', error);
            this.showToast('خطأ في تحميل النموذج', 'error');
        }
    }

    async takePhoto() {
        try {
            if (!window.Capacitor || !Capacitor.Plugins.Camera) {
                this.showToast('الكاميرا غير متاحة في هذا المتصفح', 'warning');
                return;
            }

            const image = await Capacitor.Plugins.Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: 'base64',
                source: 'camera'
            });

            this.setSelectedImage(image.base64String);
            
        } catch (error) {
            console.error('Error taking photo:', error);
            this.showToast('خطأ في التقاط الصورة', 'error');
        }
    }

    async selectPhoto() {
        try {
            if (!window.Capacitor || !Capacitor.Plugins.Camera) {
                // Fallback for web
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const base64 = e.target.result.split(',')[1];
                            this.setSelectedImage(base64);
                        };
                        reader.readAsDataURL(file);
                    }
                };
                input.click();
                return;
            }

            const image = await Capacitor.Plugins.Camera.getPhoto({
                quality: 90,
                allowEditing: false,
                resultType: 'base64',
                source: 'photos'
            });

            this.setSelectedImage(image.base64String);
            
        } catch (error) {
            console.error('Error selecting photo:', error);
            this.showToast('خطأ في اختيار الصورة', 'error');
        }
    }

    setSelectedImage(base64) {
        this.currentImage = base64;
        
        // Update preview
        const preview = document.getElementById('image-preview');
        const placeholder = preview.querySelector('.preview-placeholder');
        
        if (placeholder) {
            placeholder.remove();
        }
        
        const img = document.createElement('img');
        img.src = `data:image/jpeg;base64,${base64}`;
        img.className = 'preview-image';
        preview.appendChild(img);
        
        // Show analysis section
        document.getElementById('analysis-section').classList.remove('hidden');
        
        this.showToast('تم تحديد الصورة بنجاح', 'success');
    }

    async startAnalysis() {
        if (!this.currentImage) {
            this.showToast('يجب اختيار صورة أولاً', 'warning');
            return;
        }

        if (!this.isModelLoaded) {
            this.showToast('جاري تحميل نموذج الذكاء الاصطناعي...', 'warning');
            await this.loadAIModel();
        }

        this.isAnalyzing = true;
        
        // Get form data
        const patientId = document.getElementById('patient-id').value || 'غير محدد';
        const sampleVolume = parseFloat(document.getElementById('sample-volume').value) || 3.5;
        const samplePh = parseFloat(document.getElementById('sample-ph').value) || 7.2;

        // Hide analysis section and show progress
        document.getElementById('analysis-section').classList.add('hidden');
        document.getElementById('analysis-progress').classList.remove('hidden');

        try {
            const results = await this.performAIAnalysis(this.currentImage, {
                patientId,
                sampleVolume,
                samplePh
            });

            // Show results
            this.displayAnalysisResults(results);
            
        } catch (error) {
            console.error('Analysis error:', error);
            this.showToast('خطأ في تحليل الصورة', 'error');
            
            // Reset UI
            document.getElementById('analysis-progress').classList.add('hidden');
            document.getElementById('analysis-section').classList.remove('hidden');
        }

        this.isAnalyzing = false;
    }

    async performAIAnalysis(imageBase64, metadata) {
        // Simulate AI analysis with realistic progress
        const progressSteps = [
            { progress: 10, message: 'معالجة الصورة...' },
            { progress: 25, message: 'كشف الحيوانات المنوية...' },
            { progress: 45, message: 'تحليل الحركة...' },
            { progress: 65, message: 'تحليل الشكل...' },
            { progress: 80, message: 'حساب التركيز...' },
            { progress: 95, message: 'إنهاء التحليل...' },
            { progress: 100, message: 'تم الانتهاء!' }
        ];

        for (const step of progressSteps) {
            await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
            this.updateProgress(step.progress, step.message);
        }

        // Generate realistic analysis results
        const results = this.generateAnalysisResults(metadata);
        
        return results;
    }

    generateAnalysisResults(metadata) {
        // Generate realistic but random results for demo
        const concentration = 15 + Math.random() * 100; // 15-115 million/ml
        const motility = 40 + Math.random() * 40; // 40-80%
        const morphology = 4 + Math.random() * 15; // 4-19%
        const viability = 60 + Math.random() * 30; // 60-90%
        
        const confidence = 0.85 + Math.random() * 0.1; // 85-95%

        const getStatus = (value, normal) => {
            return value >= normal ? 'normal' : 'abnormal';
        };

        return {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            metadata,
            results: {
                concentration: {
                    value: Math.round(concentration * 10) / 10,
                    status: getStatus(concentration, 15),
                    unit: 'مليون/مل',
                    normalRange: '15-250'
                },
                motility: {
                    value: Math.round(motility * 10) / 10,
                    status: getStatus(motility, 40),
                    unit: '%',
                    normalRange: '40%+'
                },
                morphology: {
                    value: Math.round(morphology * 10) / 10,
                    status: getStatus(morphology, 4),
                    unit: '%',
                    normalRange: '4%+'
                },
                viability: {
                    value: Math.round(viability * 10) / 10,
                    status: getStatus(viability, 58),
                    unit: '%',
                    normalRange: '58%+'
                }
            },
            confidence: Math.round(confidence * 1000) / 10,
            processingTime: 2.5 + Math.random() * 5
        };
    }

    updateProgress(percentage, message) {
        document.getElementById('progress-fill').style.width = `${percentage}%`;
        document.getElementById('progress-percentage').textContent = `${percentage}%`;
        document.getElementById('progress-text').textContent = message;
    }

    displayAnalysisResults(results) {
        // Hide progress and show results
        document.getElementById('analysis-progress').classList.add('hidden');
        document.getElementById('analysis-results').classList.remove('hidden');

        // Update confidence score
        document.getElementById('confidence-value').textContent = `${results.confidence}%`;

        // Update result values
        const metrics = ['concentration', 'motility', 'morphology', 'viability'];
        
        metrics.forEach(metric => {
            const result = results.results[metric];
            document.getElementById(`${metric}-value`).textContent = result.value;
            
            const statusElement = document.getElementById(`${metric}-status`);
            statusElement.textContent = result.status === 'normal' ? 'طبيعي' : 'غير طبيعي';
            statusElement.className = `result-status ${result.status}`;
        });

        // Store current analysis for saving
        this.currentAnalysis = results;
    }

    async saveResult() {
        if (!this.currentAnalysis) {
            this.showToast('لا توجد نتائج للحفظ', 'warning');
            return;
        }

        try {
            // Add to history
            this.analysisHistory.unshift(this.currentAnalysis);
            
            // Save to local storage
            localStorage.setItem('analysisHistory', JSON.stringify(this.analysisHistory));
            
            // Update stats
            this.updateStats();
            
            this.showToast('تم حفظ النتائج بنجاح', 'success');
            
        } catch (error) {
            console.error('Error saving result:', error);
            this.showToast('خطأ في حفظ النتائج', 'error');
        }
    }

    async shareResult() {
        if (!this.currentAnalysis) {
            this.showToast('لا توجد نتائج للمشاركة', 'warning');
            return;
        }

        try {
            const shareText = this.generateShareText(this.currentAnalysis);
            
            if (navigator.share) {
                await navigator.share({
                    title: 'نتائج تحليل الحيوانات المنوية',
                    text: shareText
                });
            } else {
                // Fallback: copy to clipboard
                await navigator.clipboard.writeText(shareText);
                this.showToast('تم نسخ النتائج إلى الحافظة', 'success');
            }
            
        } catch (error) {
            console.error('Error sharing result:', error);
            this.showToast('خطأ في مشاركة النتائج', 'error');
        }
    }

    generateShareText(analysis) {
        const { results, confidence, timestamp } = analysis;
        
        return `نتائج تحليل الحيوانات المنوية
التاريخ: ${new Date(timestamp).toLocaleString('ar')}
درجة الثقة: ${confidence}%

التركيز: ${results.concentration.value} ${results.concentration.unit} (${results.concentration.status === 'normal' ? 'طبيعي' : 'غير طبيعي'})
الحركة: ${results.motility.value}${results.motility.unit} (${results.motility.status === 'normal' ? 'طبيعي' : 'غير طبيعي'})
الشكل: ${results.morphology.value}${results.morphology.unit} (${results.morphology.status === 'normal' ? 'طبيعي' : 'غير طبيعي'})
الحيوية: ${results.viability.value}${results.viability.unit} (${results.viability.status === 'normal' ? 'طبيعي' : 'غير طبيعي'})

تنبيه: هذه النتائج للأغراض التعليمية فقط. استشر طبيباً مختصاً.`;
    }

    newAnalysis() {
        // Reset analysis UI
        this.currentImage = null;
        this.currentAnalysis = null;
        
        // Reset image preview
        const preview = document.getElementById('image-preview');
        preview.innerHTML = `
            <div class="preview-placeholder">
                <i class="material-icons">image</i>
                <p>لا توجد صورة محددة</p>
            </div>
        `;
        
        // Reset form
        document.getElementById('patient-id').value = '';
        document.getElementById('sample-volume').value = '';
        document.getElementById('sample-ph').value = '';
        
        // Hide sections
        document.getElementById('analysis-section').classList.add('hidden');
        document.getElementById('analysis-progress').classList.add('hidden');
        document.getElementById('analysis-results').classList.add('hidden');
        
        this.showToast('جاهز لتحليل جديد', 'success');
    }

    loadAnalysisHistory() {
        try {
            const saved = localStorage.getItem('analysisHistory');
            this.analysisHistory = saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error loading history:', error);
            this.analysisHistory = [];
        }
    }

    loadHistoryPage() {
        const historyList = document.getElementById('history-list');
        const emptyHistory = document.getElementById('empty-history');
        
        if (this.analysisHistory.length === 0) {
            historyList.style.display = 'none';
            emptyHistory.style.display = 'block';
            return;
        }
        
        historyList.style.display = 'block';
        emptyHistory.style.display = 'none';
        
        historyList.innerHTML = this.analysisHistory.map(analysis => `
            <div class="history-item" onclick="app.viewAnalysis('${analysis.id}')">
                <div class="history-header">
                    <div class="history-date">${new Date(analysis.timestamp).toLocaleString('ar')}</div>
                    <div class="history-confidence">${analysis.confidence}%</div>
                </div>
                <div class="history-results">
                    <div class="history-metric">
                        <div class="label">التركيز</div>
                        <div class="value">${analysis.results.concentration.value}</div>
                    </div>
                    <div class="history-metric">
                        <div class="label">الحركة</div>
                        <div class="value">${analysis.results.motility.value}%</div>
                    </div>
                    <div class="history-metric">
                        <div class="label">الشكل</div>
                        <div class="value">${analysis.results.morphology.value}%</div>
                    </div>
                    <div class="history-metric">
                        <div class="label">الحيوية</div>
                        <div class="value">${analysis.results.viability.value}%</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    loadReportsPage() {
        // Simple chart implementation would go here
        // For now, just update the period filter
        const periodSelect = document.getElementById('report-period');
        
        periodSelect.addEventListener('change', () => {
            this.generateReportChart(periodSelect.value);
        });
        
        // Generate initial chart
        this.generateReportChart('month');
    }

    generateReportChart(period) {
        // Simple implementation - in a real app you'd use Chart.js or similar
        const canvas = document.getElementById('results-chart');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Simple bar chart showing normal vs abnormal results
        const normalCount = this.analysisHistory.filter(a => 
            Object.values(a.results).every(r => r.status === 'normal')
        ).length;
        
        const abnormalCount = this.analysisHistory.length - normalCount;
        
        // Draw bars
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(50, 50, 80, normalCount * 10);
        
        ctx.fillStyle = '#F44336';
        ctx.fillRect(150, 50, 80, abnormalCount * 10);
        
        // Labels
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.fillText('طبيعي', 60, 180);
        ctx.fillText('غير طبيعي', 150, 180);
    }

    updateStats() {
        const totalAnalyses = this.analysisHistory.length;
        const normalResults = this.analysisHistory.filter(a => 
            Object.values(a.results).every(r => r.status === 'normal')
        ).length;
        
        const avgTime = this.analysisHistory.length > 0 
            ? (this.analysisHistory.reduce((sum, a) => sum + (a.processingTime || 3), 0) / this.analysisHistory.length).toFixed(1)
            : '--';
        
        document.getElementById('total-analyses').textContent = totalAnalyses;
        document.getElementById('normal-results').textContent = normalResults;
        document.getElementById('avg-time').textContent = avgTime !== '--' ? `${avgTime}ث` : '--';
    }

    viewAnalysis(analysisId) {
        const analysis = this.analysisHistory.find(a => a.id === analysisId);
        if (!analysis) return;
        
        // Set as current analysis and show results
        this.currentAnalysis = analysis;
        this.displayAnalysisResults(analysis);
        this.showPage('analyze');
    }

    showSettings() {
        this.showToast('الإعدادات قريباً...', 'info');
    }

    showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Remove toast after duration
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Global functions for HTML onclick handlers
window.showPage = function(pageId) {
    if (window.app) {
        window.app.showPage(pageId);
    }
};

// Initialize app
const app = new SpermAnalyzerApp();
window.app = app;

// Service Worker registration for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}