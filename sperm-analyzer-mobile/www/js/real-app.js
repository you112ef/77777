/**
 * Real Sperm Analyzer App - Main Application Controller
 * Integrates all components for a complete sperm analysis experience
 */

class RealSpermApp {
    constructor() {
        this.analyzer = null;
        this.camera = null;
        this.chartManager = null;
        this.dataExporter = null;
        this.currentPage = 'home';
        this.currentAnalysis = null;
        this.isAnalyzing = false;
        
        // UI Elements
        this.elements = {};
        
        // App state
        this.appState = {
            isInitialized: false,
            analysisHistory: [],
            userPreferences: this.loadUserPreferences(),
            currentSession: null
        };
        
        this.initializeApp();
    }
    
    async initializeApp() {
        try {
            console.log('🚀 Starting Real Sperm Analyzer App...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
                return;
            }
            
            // Cache DOM elements
            this.cacheElements();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize core components
            await this.initializeComponents();
            
            // Setup UI
            this.setupUI();
            
            // Hide splash screen
            this.hideSplashScreen();
            
            this.appState.isInitialized = true;
            console.log('✅ Real Sperm Analyzer App initialized successfully');
            
        } catch (error) {
            console.error('❌ App initialization failed:', error);
            this.showError('فشل في تحميل التطبيق: ' + error.message);
        }
    }
    
    cacheElements() {
        // Main app elements
        this.elements = {
            splashScreen: document.getElementById('splash-screen'),
            mainApp: document.getElementById('main-app'),
            
            // Navigation
            menuBtn: document.getElementById('menu-btn'),
            navDrawer: document.getElementById('nav-drawer'),
            overlay: document.getElementById('overlay'),
            navItems: document.querySelectorAll('.nav-item'),
            
            // Pages
            pages: document.querySelectorAll('.page'),
            homePage: document.getElementById('home-page'),
            analyzePage: document.getElementById('analyze-page'),
            historyPage: document.getElementById('history-page'),
            graphsPage: document.getElementById('graphs-page'),
            
            // Camera/Analysis controls
            imagePreview: document.getElementById('image-preview'),
            takePhotoBtn: document.getElementById('take-photo-btn'),
            selectPhotoBtn: document.getElementById('select-photo-btn'),
            startAnalysisBtn: document.getElementById('start-analysis-btn'),
            
            // Progress indicators
            analysisProgress: document.getElementById('analysis-progress'),
            progressFill: document.getElementById('progress-fill'),
            progressText: document.getElementById('progress-text'),
            progressPercentage: document.getElementById('progress-percentage'),
            
            // Results display
            analysisResults: document.getElementById('analysis-results'),
            confidenceValue: document.getElementById('confidence-value'),
            
            // Statistics
            totalAnalyses: document.getElementById('total-analyses'),
            normalResults: document.getElementById('normal-results'),
            avgTime: document.getElementById('avg-time'),
            
            // Forms
            patientId: document.getElementById('patient-id'),
            sampleVolume: document.getElementById('sample-volume'),
            samplePh: document.getElementById('sample-ph'),
            
            // Toast container
            toastContainer: document.getElementById('toast-container')
        };
    }
    
    setupEventListeners() {
        // Navigation events
        this.elements.menuBtn?.addEventListener('click', () => this.toggleNavDrawer());
        this.elements.overlay?.addEventListener('click', () => this.closeNavDrawer());
        
        this.elements.navItems?.forEach(item => {
            item.addEventListener('click', (e) => {
                const page = e.currentTarget.dataset.page;
                if (page) {
                    this.navigateToPage(page);
                    this.closeNavDrawer();
                }
            });
        });
        
        // Camera/Photo events
        this.elements.takePhotoBtn?.addEventListener('click', () => this.takePhoto());
        this.elements.selectPhotoBtn?.addEventListener('click', () => this.selectPhoto());
        this.elements.startAnalysisBtn?.addEventListener('click', () => this.startAnalysis());
        
        // Analysis events
        document.getElementById('save-result-btn')?.addEventListener('click', () => this.saveCurrentResult());
        document.getElementById('share-result-btn')?.addEventListener('click', () => this.shareResult());
        document.getElementById('new-analysis-btn')?.addEventListener('click', () => this.startNewAnalysis());
        
        // Custom events from analyzer
        window.addEventListener('init-progress', (e) => this.handleInitProgress(e.detail));
        window.addEventListener('analysis-progress', (e) => this.handleAnalysisProgress(e.detail));
        window.addEventListener('analyzer-ready', (e) => this.handleAnalyzerReady(e.detail));
        window.addEventListener('analysis-error', (e) => this.handleAnalysisError(e.detail));
        
        // Capacitor events
        if (window.Capacitor) {
            document.addEventListener('deviceready', () => this.handleDeviceReady());
            document.addEventListener('resume', () => this.handleAppResume());
            document.addEventListener('pause', () => this.handleAppPause());
        }
    }
    
    async initializeComponents() {
        console.log('🔧 Initializing core components...');
        
        // Initialize AI analyzer
        this.analyzer = new RealSpermAnalyzer();
        
        // Initialize camera system
        this.camera = new RealCameraSystem();
        
        // Initialize chart manager
        this.chartManager = new RealChartManager();
        
        // Initialize data exporter
        this.dataExporter = new RealDataExporter();
        
        console.log('✅ Core components initialized');
    }
    
    setupUI() {
        // Setup charts
        this.chartManager.initializeCharts();
        
        // Load analysis history
        this.loadAnalysisHistory();
        
        // Update statistics
        this.updateStatistics();
        
        // Setup localization
        this.setupLocalization();
        
        // Apply user preferences
        this.applyUserPreferences();
    }
    
    hideSplashScreen() {
        setTimeout(() => {
            this.elements.splashScreen?.classList.add('fade-out');
            this.elements.mainApp?.classList.remove('hidden');
            
            setTimeout(() => {
                this.elements.splashScreen?.style.display = 'none';
            }, 500);
        }, 2000);
    }
    
    // Navigation methods
    navigateToPage(pageName) {
        if (this.currentPage === pageName) return;
        
        // Update navigation
        this.elements.navItems?.forEach(item => {
            item.classList.toggle('active', item.dataset.page === pageName);
        });
        
        // Show page
        this.elements.pages?.forEach(page => {
            page.classList.toggle('active', page.id === `${pageName}-page`);
        });
        
        this.currentPage = pageName;
        
        // Page-specific setup
        this.handlePageChange(pageName);
    }
    
    handlePageChange(pageName) {
        switch (pageName) {
            case 'home':
                this.updateStatistics();
                break;
            case 'analyze':
                this.setupAnalyzePage();
                break;
            case 'history':
                this.loadAnalysisHistory();
                break;
            case 'graphs':
                this.setupGraphsPage();
                break;
        }
    }
    
    toggleNavDrawer() {
        this.elements.navDrawer?.classList.toggle('open');
        this.elements.overlay?.classList.toggle('show');
    }
    
    closeNavDrawer() {
        this.elements.navDrawer?.classList.remove('open');
        this.elements.overlay?.classList.remove('show');
    }
    
    // Camera and photo methods
    async takePhoto() {
        try {
            if (!this.camera) {
                throw new Error('نظام الكاميرا غير متاح');
            }
            
            this.showToast('جاري فتح الكاميرا...', 'info');
            
            const image = await this.camera.capturePhoto({
                quality: 90,
                resultType: 'base64',
                width: 1920,
                height: 1080
            });
            
            this.displayCapturedImage(image);
            this.showAnalysisSection();
            
        } catch (error) {
            console.error('Photo capture failed:', error);
            this.showToast('فشل في التقاط الصورة: ' + error.message, 'error');
        }
    }
    
    async selectPhoto() {
        try {
            if (!this.camera) {
                throw new Error('نظام اختيار الصور غير متاح');
            }
            
            this.showToast('جاري فتح معرض الصور...', 'info');
            
            const image = await this.camera.pickImage({
                quality: 90,
                resultType: 'base64'
            });
            
            this.displayCapturedImage(image);
            this.showAnalysisSection();
            
        } catch (error) {
            console.error('Image selection failed:', error);
            this.showToast('فشل في اختيار الصورة: ' + error.message, 'error');
        }
    }
    
    displayCapturedImage(imageData) {
        const preview = this.elements.imagePreview;
        if (!preview) return;
        
        // Create image element
        const img = document.createElement('img');
        img.src = `data:image/jpeg;base64,${imageData}`;
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.alt = 'صورة العينة';
        
        // Store image for analysis
        this.currentImageElement = img;
        
        // Clear preview and add image
        preview.innerHTML = '';
        preview.appendChild(img);
        
        // Update UI
        preview.classList.add('has-image');
    }
    
    showAnalysisSection() {
        document.getElementById('analysis-section')?.classList.remove('hidden');
    }
    
    // Analysis methods
    async startAnalysis() {
        if (!this.currentImageElement || this.isAnalyzing) {
            this.showToast('يرجى اختيار صورة أولاً', 'warning');
            return;
        }
        
        if (!this.analyzer || !this.analyzer.isInitialized) {
            this.showToast('نظام التحليل غير جاهز بعد', 'warning');
            return;
        }
        
        this.isAnalyzing = true;
        
        try {
            // Show progress
            this.showAnalysisProgress();
            
            // Get sample info
            const sampleInfo = this.getSampleInfo();
            
            // Run analysis
            const analysis = await this.analyzer.analyzeImage(this.currentImageElement, {
                sampleInfo
            });
            
            // Display results
            this.displayAnalysisResults(analysis);
            
            // Update statistics
            this.updateStatistics();
            
            this.showToast('تم التحليل بنجاح!', 'success');
            
        } catch (error) {
            console.error('Analysis failed:', error);
            this.showToast('فشل في التحليل: ' + error.message, 'error');
            this.hideAnalysisProgress();
        } finally {
            this.isAnalyzing = false;
        }
    }
    
    getSampleInfo() {
        return {
            patientId: this.elements.patientId?.value || '',
            volume: parseFloat(this.elements.sampleVolume?.value) || 3.5,
            ph: parseFloat(this.elements.samplePh?.value) || 7.2,
            timestamp: new Date().toISOString()
        };
    }
    
    showAnalysisProgress() {
        this.elements.analysisProgress?.classList.remove('hidden');
        this.updateProgress('بدء التحليل...', 0);
    }
    
    hideAnalysisProgress() {
        this.elements.analysisProgress?.classList.add('hidden');
    }
    
    updateProgress(message, percentage) {
        if (this.elements.progressText) {
            this.elements.progressText.textContent = message;
        }
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${percentage}%`;
        }
        if (this.elements.progressPercentage) {
            this.elements.progressPercentage.textContent = `${Math.round(percentage)}%`;
        }
    }
    
    displayAnalysisResults(analysis) {
        this.currentAnalysis = analysis;
        
        // Hide progress and show results
        this.hideAnalysisProgress();
        this.elements.analysisResults?.classList.remove('hidden');
        
        // Update confidence
        if (this.elements.confidenceValue) {
            this.elements.confidenceValue.textContent = `${analysis.summary.confidence}%`;
        }
        
        // Update main metrics
        this.updateResultCard('concentration', analysis.casaMetrics.concentration, 'مليون/مل');
        this.updateResultCard('motility', analysis.casaMetrics.totalMotility, '%');
        this.updateResultCard('morphology', analysis.casaMetrics.normalMorphology, '%');
        this.updateResultCard('viability', analysis.casaMetrics.vitality, '%');
        
        // Update status indicators
        this.updateResultStatus('concentration', analysis.whoCompliance.spermConcentration >= 15);
        this.updateResultStatus('motility', analysis.casaMetrics.totalMotility >= 40);
        this.updateResultStatus('morphology', analysis.casaMetrics.normalMorphology >= 4);
        this.updateResultStatus('viability', analysis.casaMetrics.vitality >= 58);
        
        // Generate and display detailed charts
        this.generateAnalysisCharts(analysis);
    }
    
    updateResultCard(type, value, unit) {
        const valueElement = document.getElementById(`${type}-value`);
        if (valueElement) {
            valueElement.textContent = typeof value === 'number' ? value.toFixed(1) : value;
        }
    }
    
    updateResultStatus(type, isNormal) {
        const statusElement = document.getElementById(`${type}-status`);
        if (statusElement) {
            statusElement.textContent = isNormal ? 'طبيعي' : 'غير طبيعي';
            statusElement.className = `result-status ${isNormal ? 'normal' : 'abnormal'}`;
        }
    }
    
    generateAnalysisCharts(analysis) {
        if (!this.chartManager) return;
        
        // Generate motility pie chart
        this.chartManager.createMotilityChart(analysis.motilityBreakdown);
        
        // Generate velocity chart
        this.chartManager.createVelocityChart(analysis.velocityMetrics);
        
        // Generate morphology chart
        this.chartManager.createMorphologyChart(analysis.morphologyBreakdown);
        
        // Generate WHO compliance chart
        this.chartManager.createWHOComplianceChart(analysis.whoCompliance);
    }
    
    // Result management
    saveCurrentResult() {
        if (!this.currentAnalysis) {
            this.showToast('لا توجد نتائج للحفظ', 'warning');
            return;
        }
        
        // Add to history
        this.appState.analysisHistory.unshift({
            id: 'analysis_' + Date.now(),
            ...this.currentAnalysis,
            savedAt: new Date().toISOString()
        });
        
        // Save to local storage
        this.saveAnalysisHistory();
        
        this.showToast('تم حفظ النتائج بنجاح', 'success');
    }
    
    async shareResult() {
        if (!this.currentAnalysis) {
            this.showToast('لا توجد نتائج للمشاركة', 'warning');
            return;
        }
        
        try {
            // Generate shareable report
            const report = await this.dataExporter.generateShareableReport(this.currentAnalysis);
            
            // Use native sharing if available
            if (navigator.share) {
                await navigator.share({
                    title: 'نتائج تحليل الحيوانات المنوية',
                    text: report.summary,
                    files: report.files
                });
            } else {
                // Fallback to copying to clipboard
                await navigator.clipboard.writeText(report.text);
                this.showToast('تم نسخ النتائج للحافظة', 'success');
            }
            
        } catch (error) {
            console.error('Share failed:', error);
            this.showToast('فشل في مشاركة النتائج', 'error');
        }
    }
    
    startNewAnalysis() {
        // Reset analysis state
        this.currentAnalysis = null;
        this.currentImageElement = null;
        this.isAnalyzing = false;
        
        // Reset UI
        if (this.elements.imagePreview) {
            this.elements.imagePreview.innerHTML = `
                <div class="preview-placeholder">
                    <i class="material-icons">image</i>
                    <p>لا توجد صورة محددة</p>
                </div>
            `;
            this.elements.imagePreview.classList.remove('has-image');
        }
        
        // Hide sections
        document.getElementById('analysis-section')?.classList.add('hidden');
        this.elements.analysisProgress?.classList.add('hidden');
        this.elements.analysisResults?.classList.add('hidden');
        
        // Clear form
        this.clearAnalysisForm();
        
        this.showToast('جاهز لتحليل جديد', 'info');
    }
    
    clearAnalysisForm() {
        if (this.elements.patientId) this.elements.patientId.value = '';
        if (this.elements.sampleVolume) this.elements.sampleVolume.value = '';
        if (this.elements.samplePh) this.elements.samplePh.value = '';
    }
    
    // Statistics and history
    updateStatistics() {
        const history = this.appState.analysisHistory;
        
        // Total analyses
        if (this.elements.totalAnalyses) {
            this.elements.totalAnalyses.textContent = history.length.toString();
        }
        
        // Normal results
        const normalResults = history.filter(a => 
            a.qualityAssessment && a.qualityAssessment.score >= 70
        ).length;
        
        if (this.elements.normalResults) {
            this.elements.normalResults.textContent = normalResults.toString();
        }
        
        // Average time
        if (history.length > 0) {
            const avgTime = history.reduce((sum, a) => sum + (a.processingTime || 0), 0) / history.length;
            if (this.elements.avgTime) {
                this.elements.avgTime.textContent = `${Math.round(avgTime / 1000)}s`;
            }
        }
    }
    
    loadAnalysisHistory() {
        try {
            const saved = localStorage.getItem('sperm_analysis_history');
            if (saved) {
                this.appState.analysisHistory = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load analysis history:', error);
        }
        
        this.displayAnalysisHistory();
    }
    
    saveAnalysisHistory() {
        try {
            localStorage.setItem('sperm_analysis_history', 
                JSON.stringify(this.appState.analysisHistory));
        } catch (error) {
            console.warn('Failed to save analysis history:', error);
        }
    }
    
    displayAnalysisHistory() {
        const historyList = document.getElementById('history-list');
        const emptyHistory = document.getElementById('empty-history');
        
        if (!historyList) return;
        
        if (this.appState.analysisHistory.length === 0) {
            historyList.style.display = 'none';
            if (emptyHistory) emptyHistory.style.display = 'block';
            return;
        }
        
        historyList.style.display = 'block';
        if (emptyHistory) emptyHistory.style.display = 'none';
        
        historyList.innerHTML = this.appState.analysisHistory.map(analysis => 
            this.createHistoryItemHTML(analysis)
        ).join('');
        
        // Add event listeners for history items
        historyList.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const analysisId = item.dataset.analysisId;
                this.viewHistoryItem(analysisId);
            });
        });
    }
    
    createHistoryItemHTML(analysis) {
        const date = new Date(analysis.timestamp).toLocaleDateString('ar-SA');
        const time = new Date(analysis.timestamp).toLocaleTimeString('ar-SA');
        
        return `
            <div class="history-item" data-analysis-id="${analysis.id}">
                <div class="history-item-header">
                    <div class="history-date">${date} - ${time}</div>
                    <div class="history-quality ${analysis.qualityAssessment?.color || 'secondary'}">
                        ${analysis.qualityAssessment?.quality || 'غير محدد'}
                    </div>
                </div>
                <div class="history-item-content">
                    <div class="history-stats">
                        <span class="stat">
                            <strong>العدد:</strong> ${analysis.casaMetrics?.totalCount || 0}
                        </span>
                        <span class="stat">
                            <strong>الحركة:</strong> ${analysis.casaMetrics?.totalMotility?.toFixed(1) || 0}%
                        </span>
                        <span class="stat">
                            <strong>الثقة:</strong> ${analysis.summary?.confidence || 0}%
                        </span>
                    </div>
                    ${analysis.sampleInfo?.patientId ? 
                        `<div class="patient-id">المريض: ${analysis.sampleInfo.patientId}</div>` : ''
                    }
                </div>
                <div class="history-actions">
                    <button class="btn-small primary" onclick="event.stopPropagation(); app.exportAnalysis('${analysis.id}')">
                        <i class="material-icons">file_download</i> تصدير
                    </button>
                    <button class="btn-small secondary" onclick="event.stopPropagation(); app.deleteAnalysis('${analysis.id}')">
                        <i class="material-icons">delete</i> حذف
                    </button>
                </div>
            </div>
        `;
    }
    
    viewHistoryItem(analysisId) {
        const analysis = this.appState.analysisHistory.find(a => a.id === analysisId);
        if (!analysis) return;
        
        // Set as current analysis and show results
        this.currentAnalysis = analysis;
        this.navigateToPage('analyze');
        this.displayAnalysisResults(analysis);
    }
    
    async exportAnalysis(analysisId) {
        const analysis = this.appState.analysisHistory.find(a => a.id === analysisId);
        if (!analysis || !this.dataExporter) return;
        
        try {
            await this.dataExporter.exportToPDF(analysis);
            this.showToast('تم تصدير التحليل بنجاح', 'success');
        } catch (error) {
            console.error('Export failed:', error);
            this.showToast('فشل في تصدير التحليل', 'error');
        }
    }
    
    deleteAnalysis(analysisId) {
        if (confirm('هل أنت متأكد من حذف هذا التحليل؟')) {
            this.appState.analysisHistory = this.appState.analysisHistory.filter(a => a.id !== analysisId);
            this.saveAnalysisHistory();
            this.displayAnalysisHistory();
            this.updateStatistics();
            this.showToast('تم حذف التحليل', 'info');
        }
    }
    
    // Setup pages
    setupAnalyzePage() {
        // Reset analysis state when entering page
        if (!this.currentAnalysis) {
            this.startNewAnalysis();
        }
    }
    
    setupGraphsPage() {
        if (!this.chartManager) return;
        
        // Update chart selector with available analyses
        const selector = document.getElementById('analysis-select');
        if (selector) {
            selector.innerHTML = '<option value="">-- اختر تحليل --</option>' +
                this.appState.analysisHistory.map(analysis => 
                    `<option value="${analysis.id}">
                        ${new Date(analysis.timestamp).toLocaleDateString('ar-SA')} - 
                        ${analysis.qualityAssessment?.quality || 'غير محدد'}
                    </option>`
                ).join('');
            
            selector.addEventListener('change', (e) => {
                if (e.target.value) {
                    this.showAnalysisCharts(e.target.value);
                }
            });
        }
        
        // Show current analysis charts if available
        if (this.currentAnalysis) {
            this.generateAnalysisCharts(this.currentAnalysis);
        }
    }
    
    showAnalysisCharts(analysisId) {
        const analysis = this.appState.analysisHistory.find(a => a.id === analysisId);
        if (analysis && this.chartManager) {
            this.generateAnalysisCharts(analysis);
        }
    }
    
    // Event handlers
    handleInitProgress(detail) {
        // Update splash screen progress
        const progressEl = document.querySelector('.splash-screen .loading-progress');
        if (progressEl) {
            progressEl.textContent = detail.message;
        }
    }
    
    handleAnalysisProgress(detail) {
        this.updateProgress(detail.message, detail.percentage);
    }
    
    handleAnalyzerReady(detail) {
        console.log('Analyzer ready with capabilities:', detail.capabilities);
        this.showToast('نظام التحليل جاهز للاستخدام', 'success');
    }
    
    handleAnalysisError(detail) {
        this.showToast(detail.message, 'error');
        this.hideAnalysisProgress();
    }
    
    handleDeviceReady() {
        console.log('Device ready');
        // Setup device-specific features
    }
    
    handleAppResume() {
        console.log('App resumed');
        // Refresh data if needed
    }
    
    handleAppPause() {
        console.log('App paused');
        // Save current state
        this.saveAnalysisHistory();
    }
    
    // User preferences
    loadUserPreferences() {
        try {
            const saved = localStorage.getItem('sperm_analyzer_preferences');
            return saved ? JSON.parse(saved) : {
                language: 'ar',
                theme: 'auto',
                notifications: true,
                autoSave: true
            };
        } catch {
            return {
                language: 'ar',
                theme: 'auto',
                notifications: true,
                autoSave: true
            };
        }
    }
    
    saveUserPreferences() {
        try {
            localStorage.setItem('sperm_analyzer_preferences', 
                JSON.stringify(this.appState.userPreferences));
        } catch (error) {
            console.warn('Failed to save preferences:', error);
        }
    }
    
    applyUserPreferences() {
        // Apply theme
        if (this.appState.userPreferences.theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else if (this.appState.userPreferences.theme === 'light') {
            document.body.classList.remove('dark-theme');
        }
        
        // Apply language direction
        document.dir = this.appState.userPreferences.language === 'ar' ? 'rtl' : 'ltr';
    }
    
    setupLocalization() {
        // Set up Arabic RTL support
        document.documentElement.lang = 'ar';
        document.documentElement.dir = 'rtl';
    }
    
    // Utility methods
    showToast(message, type = 'info', duration = 3000) {
        if (!this.elements.toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="material-icons">${this.getToastIcon(type)}</i>
                <span>${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="material-icons">close</i>
            </button>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        // Auto remove
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);
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
    
    showError(message) {
        this.showToast(message, 'error', 5000);
    }
}

// Initialize app when script loads
let app;
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        app = new RealSpermApp();
        window.app = app; // Make available globally for debugging
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealSpermApp;
}