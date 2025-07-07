/**
 * Modern Sperm Analyzer Mobile App
 * Enhanced JavaScript with Bottom Navigation & State Management
 */

class SpermAnalyzerApp {
    constructor() {
        this.currentPage = 'home';
        this.isAnalyzing = false;
        this.analysisData = null;
        this.history = [];
        this.settings = {
            darkMode: false,
            notifications: true,
            language: 'ar'
        };
        
        this.init();
    }

    init() {
        this.initEventListeners();
        this.loadSettings();
        this.loadHistory();
        this.updateStats();
        this.showSplashScreen();
    }

    // Splash Screen Management
    showSplashScreen() {
        const splashScreen = document.getElementById('splash-screen');
        const mainApp = document.getElementById('main-app');
        
        // Simulate app loading
        setTimeout(() => {
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.style.display = 'none';
                mainApp.classList.remove('hidden');
                this.initializeApp();
            }, 300);
        }, 2000);
    }

    initializeApp() {
        // Initialize PWA features
        this.registerServiceWorker();
        
        // Setup navigation
        this.setupBottomNavigation();
        
        // Setup page functionality
        this.setupPageHandlers();
        
        // Show initial page
        this.navigateTo('home');
        
        console.log('📱 Sperm Analyzer App initialized successfully');
    }

    // Event Listeners Setup
    initEventListeners() {
        // Header buttons
        this.addClickListener('profile-btn', () => this.showProfile());
        this.addClickListener('notifications-btn', () => this.showNotifications());
        this.addClickListener('settings-btn', () => this.navigateTo('settings'));

        // Camera controls
        this.addClickListener('take-photo-btn', () => this.takePhoto());
        this.addClickListener('select-photo-btn', () => this.selectPhoto());
        this.addClickListener('start-analysis-btn', () => this.startAnalysis());

        // Result actions
        this.addClickListener('save-result-btn', () => this.saveResult());
        this.addClickListener('share-result-btn', () => this.shareResult());
        this.addClickListener('generate-report-btn', () => this.generateReport());

        // Settings toggles
        this.addChangeListener('dark-mode-toggle', (e) => this.toggleDarkMode(e.target.checked));
        this.addChangeListener('notifications-toggle', (e) => this.toggleNotifications(e.target.checked));

        // FAB button
        this.addClickListener('fab-analyze', () => this.navigateTo('analyze'));

        // Window events
        window.addEventListener('beforeunload', () => this.saveSettings());
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    addClickListener(id, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', handler);
        }
    }

    addChangeListener(id, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', handler);
        }
    }

    // Bottom Navigation Setup
    setupBottomNavigation() {
        const navItems = document.querySelectorAll('.nav-item[data-page]');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.navigateTo(page);
            });
        });
    }

    // Page Navigation
    navigateTo(page) {
        // Hide current page
        const currentPageElement = document.querySelector('.page.active');
        if (currentPageElement) {
            currentPageElement.classList.remove('active');
        }

        // Show new page
        const newPageElement = document.getElementById(`${page}-page`);
        if (newPageElement) {
            newPageElement.classList.add('active');
        }

        // Update navigation
        this.updateNavigation(page);
        
        // Update current page
        this.currentPage = page;

        // Handle page-specific logic
        this.handlePageLoad(page);

        // Update FAB visibility
        this.updateFABVisibility(page);

        console.log(`📄 Navigated to: ${page}`);
    }

    updateNavigation(activePage) {
        const navItems = document.querySelectorAll('.nav-item[data-page]');
        
        navItems.forEach(item => {
            const page = item.dataset.page;
            if (page === activePage) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    updateFABVisibility(page) {
        const fab = document.getElementById('fab-analyze');
        if (fab) {
            if (page === 'analyze') {
                fab.classList.add('hidden');
            } else {
                fab.classList.remove('hidden');
            }
        }
    }

    handlePageLoad(page) {
        switch (page) {
            case 'home':
                this.updateStats();
                break;
            case 'analyze':
                this.resetAnalysis();
                break;
            case 'history':
                this.loadHistoryPage();
                break;
            case 'reports':
                this.loadReportsPage();
                break;
            case 'settings':
                this.loadSettingsPage();
                break;
        }
    }

    // Analysis Functions
    async takePhoto() {
        try {
            this.showLoading('جاري تشغيل الكاميرا...');
            
            // Check if camera is available
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('الكاميرا غير متاحة');
            }

            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            
            this.hideLoading();
            this.showCameraInterface(stream);
            
        } catch (error) {
            this.hideLoading();
            this.showToast('خطأ في تشغيل الكاميرا: ' + error.message, 'error');
        }
    }

    selectPhoto() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processSelectedImage(file);
            }
        };
        
        input.click();
    }

    processSelectedImage(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const imageData = e.target.result;
            this.displayPreviewImage(imageData);
            this.showSampleForm();
        };
        
        reader.readAsDataURL(file);
    }

    displayPreviewImage(imageData) {
        const preview = document.getElementById('image-preview');
        const placeholder = preview.querySelector('.preview-placeholder');
        
        // Create image element
        const img = document.createElement('img');
        img.src = imageData;
        img.className = 'preview-image';
        img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: var(--radius-xl);';
        
        // Replace placeholder with image
        preview.innerHTML = '';
        preview.appendChild(img);
    }

    showSampleForm() {
        const form = document.getElementById('sample-form');
        form.classList.remove('hidden');
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async startAnalysis() {
        const patientId = document.getElementById('patient-id').value;
        const volume = document.getElementById('sample-volume').value;
        const ph = document.getElementById('sample-ph').value;
        const temp = document.getElementById('sample-temp').value;

        if (!patientId.trim()) {
            this.showToast('يرجى إدخال معرف المريض', 'warning');
            return;
        }

        this.isAnalyzing = true;
        this.showAnalysisProgress();
        
        try {
            // Simulate AI analysis process
            await this.simulateAnalysis();
            
            // Generate mock results
            const results = this.generateMockResults();
            
            // Show results
            this.showAnalysisResults(results);
            
        } catch (error) {
            this.showToast('حدث خطأ أثناء التحليل: ' + error.message, 'error');
        } finally {
            this.isAnalyzing = false;
        }
    }

    async simulateAnalysis() {
        const steps = [
            { step: 1, text: 'تحضير الصورة...', duration: 1000 },
            { step: 2, text: 'تحليل بالذكاء الاصطناعي...', duration: 2000 },
            { step: 3, text: 'حساب النتائج...', duration: 1500 },
            { step: 4, text: 'إنتاج التقرير...', duration: 500 }
        ];

        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const progressPercentage = document.getElementById('progress-percentage');
        
        let totalProgress = 0;
        
        for (let i = 0; i < steps.length; i++) {
            const step = steps[i];
            
            // Update step status
            this.updateAnalysisStep(step.step);
            
            // Update progress text
            progressText.textContent = step.text;
            
            // Animate progress
            const startProgress = totalProgress;
            const endProgress = ((i + 1) / steps.length) * 100;
            
            await this.animateProgress(progressFill, progressPercentage, startProgress, endProgress, step.duration);
            
            totalProgress = endProgress;
        }
    }

    updateAnalysisStep(activeStep) {
        const steps = document.querySelectorAll('.step');
        steps.forEach((step, index) => {
            if (index + 1 <= activeStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    animateProgress(fillElement, percentageElement, start, end, duration) {
        return new Promise(resolve => {
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const current = start + (end - start) * this.easeOutCubic(progress);
                
                fillElement.style.width = current + '%';
                percentageElement.textContent = Math.round(current) + '%';
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            animate();
        });
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    generateMockResults() {
        return {
            confidence: 92.5,
            concentration: {
                value: Math.floor(Math.random() * 200) + 15,
                unit: 'مليون/مل',
                status: 'normal'
            },
            motility: {
                value: Math.floor(Math.random() * 40) + 40,
                unit: '%',
                status: 'normal'
            },
            morphology: {
                value: Math.floor(Math.random() * 10) + 4,
                unit: '%',
                status: 'normal'
            },
            viability: {
                value: Math.floor(Math.random() * 20) + 70,
                unit: '%',
                status: 'normal'
            },
            timestamp: new Date(),
            patientId: document.getElementById('patient-id').value
        };
    }

    showAnalysisProgress() {
        document.getElementById('sample-form').classList.add('hidden');
        document.getElementById('analysis-progress').classList.remove('hidden');
    }

    showAnalysisResults(results) {
        // Hide progress
        document.getElementById('analysis-progress').classList.add('hidden');
        
        // Show results
        const resultsCard = document.getElementById('analysis-results');
        resultsCard.classList.remove('hidden');
        
        // Update confidence
        document.getElementById('confidence-value').textContent = results.confidence + '%';
        
        // Update individual results
        this.updateResultValue('concentration', results.concentration);
        this.updateResultValue('motility', results.motility);
        this.updateResultValue('morphology', results.morphology);
        this.updateResultValue('viability', results.viability);
        
        // Store results
        this.analysisData = results;
        
        // Scroll to results
        resultsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        this.showToast('تم التحليل بنجاح! 🎉', 'success');
    }

    updateResultValue(type, data) {
        document.getElementById(`${type}-value`).textContent = data.value;
        const statusElement = document.getElementById(`${type}-status`);
        statusElement.textContent = data.status === 'normal' ? 'طبيعي' : 'غير طبيعي';
        statusElement.className = `result-status ${data.status}`;
    }

    // Utility Functions
    showLoading(message = 'جاري التحميل...') {
        const overlay = document.getElementById('loading-overlay');
        const text = overlay.querySelector('p');
        text.textContent = message;
        overlay.classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">
                <span class="material-icons-round">close</span>
            </button>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }

    // Data Management
    saveResult() {
        if (!this.analysisData) return;
        
        this.history.push({
            ...this.analysisData,
            id: Date.now().toString()
        });
        
        this.saveHistory();
        this.updateStats();
        
        this.showToast('تم حفظ النتيجة بنجاح ✅', 'success');
    }

    shareResult() {
        if (!this.analysisData) return;
        
        const shareData = {
            title: 'نتائج تحليل الحيوانات المنوية',
            text: this.formatResultsForSharing(),
            url: window.location.href
        };
        
        if (navigator.share) {
            navigator.share(shareData);
        } else {
            // Fallback to copying to clipboard
            navigator.clipboard.writeText(shareData.text).then(() => {
                this.showToast('تم نسخ النتائج للحافظة 📋', 'success');
            });
        }
    }

    formatResultsForSharing() {
        const data = this.analysisData;
        return `
نتائج تحليل الحيوانات المنوية
معرف المريض: ${data.patientId}
التاريخ: ${data.timestamp.toLocaleDateString('ar')}

النتائج:
• التركيز: ${data.concentration.value} ${data.concentration.unit}
• الحركة: ${data.motility.value}${data.motility.unit}
• الشكل الطبيعي: ${data.morphology.value}${data.morphology.unit}
• الحيوية: ${data.viability.value}${data.viability.unit}

درجة الثقة: ${data.confidence}%
        `.trim();
    }

    resetAnalysis() {
        // Reset image preview
        const preview = document.getElementById('image-preview');
        preview.innerHTML = `
            <div class="preview-placeholder">
                <div class="placeholder-icon">
                    <span class="material-icons-round">add_photo_alternate</span>
                </div>
                <h3>إضافة صورة</h3>
                <p>التقط صورة أو اختر من المعرض</p>
            </div>
        `;
        
        // Hide other sections
        document.getElementById('sample-form').classList.add('hidden');
        document.getElementById('analysis-progress').classList.add('hidden');
        document.getElementById('analysis-results').classList.add('hidden');
        
        // Clear form
        document.getElementById('patient-id').value = '';
        document.getElementById('sample-volume').value = '';
        document.getElementById('sample-ph').value = '';
        document.getElementById('sample-temp').value = '';
        
        this.analysisData = null;
    }

    // Settings Management
    loadSettings() {
        const saved = localStorage.getItem('sperm-analyzer-settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
        
        this.applySettings();
    }

    saveSettings() {
        localStorage.setItem('sperm-analyzer-settings', JSON.stringify(this.settings));
    }

    applySettings() {
        // Apply dark mode
        document.documentElement.setAttribute('data-theme', this.settings.darkMode ? 'dark' : 'light');
        
        // Update toggles
        const darkModeToggle = document.getElementById('dark-mode-toggle');
        const notificationsToggle = document.getElementById('notifications-toggle');
        
        if (darkModeToggle) darkModeToggle.checked = this.settings.darkMode;
        if (notificationsToggle) notificationsToggle.checked = this.settings.notifications;
    }

    toggleDarkMode(enabled) {
        this.settings.darkMode = enabled;
        this.applySettings();
        this.saveSettings();
    }

    toggleNotifications(enabled) {
        this.settings.notifications = enabled;
        this.saveSettings();
    }

    // History Management
    loadHistory() {
        const saved = localStorage.getItem('sperm-analyzer-history');
        if (saved) {
            this.history = JSON.parse(saved);
        }
    }

    saveHistory() {
        localStorage.setItem('sperm-analyzer-history', JSON.stringify(this.history));
    }

    updateStats() {
        const totalAnalyses = this.history.length;
        const normalResults = this.history.filter(item => 
            item.concentration.status === 'normal' && 
            item.motility.status === 'normal'
        ).length;
        
        document.getElementById('total-analyses').textContent = totalAnalyses;
        document.getElementById('normal-results').textContent = normalResults;
        
        if (totalAnalyses > 0) {
            const avgTime = '15-30'; // Mock average time
            document.getElementById('avg-time').textContent = avgTime;
        }
    }

    // Page-specific handlers
    setupPageHandlers() {
        // History page handlers
        const timeFilter = document.getElementById('time-filter');
        const statusFilter = document.getElementById('status-filter');
        
        if (timeFilter) timeFilter.addEventListener('change', () => this.filterHistory());
        if (statusFilter) statusFilter.addEventListener('change', () => this.filterHistory());
    }

    loadHistoryPage() {
        this.renderHistory();
    }

    loadReportsPage() {
        this.renderCharts();
    }

    loadSettingsPage() {
        // Settings page is already handled by toggles
    }

    renderHistory() {
        const container = document.getElementById('history-list');
        const emptyState = document.getElementById('empty-history');
        
        if (this.history.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'flex';
            return;
        }
        
        emptyState.style.display = 'none';
        
        container.innerHTML = this.history.map(item => `
            <div class="history-item" onclick="app.showHistoryDetails('${item.id}')">
                <div class="history-header">
                    <h4>المريض: ${item.patientId}</h4>
                    <span class="history-date">${new Date(item.timestamp).toLocaleDateString('ar')}</span>
                </div>
                <div class="history-results">
                    <div class="history-metric">
                        <span class="label">التركيز:</span>
                        <span class="value">${item.concentration.value} ${item.concentration.unit}</span>
                    </div>
                    <div class="history-metric">
                        <span class="label">الحركة:</span>
                        <span class="value">${item.motility.value}${item.motility.unit}</span>
                    </div>
                </div>
                <div class="confidence-badge">
                    <span class="material-icons-round">verified</span>
                    <span>${item.confidence}%</span>
                </div>
            </div>
        `).join('');
    }

    filterHistory() {
        // Implementation for filtering history
        this.renderHistory();
    }

    renderCharts() {
        // Mock chart rendering
        console.log('📊 Rendering charts...');
    }

    // Network handlers
    handleOnline() {
        this.showToast('تم الاتصال بالإنترنت 🌐', 'success');
    }

    handleOffline() {
        this.showToast('لا يوجد اتصال بالإنترنت 📱', 'warning');
    }

    // PWA Support
    registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                    console.log('✅ Service Worker registered successfully');
                })
                .catch(error => {
                    console.log('❌ Service Worker registration failed:', error);
                });
        }
    }
}

// Global navigation function
function navigateTo(page) {
    if (window.app) {
        window.app.navigateTo(page);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new SpermAnalyzerApp();
});

// Export for modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpermAnalyzerApp;
}