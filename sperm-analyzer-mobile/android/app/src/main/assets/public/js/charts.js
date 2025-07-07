/**
 * Charts Module for Sperm Analyzer Mobile App
 * Handles chart creation, data visualization, and export functionality
 */

class ChartsManager {
    constructor() {
        this.charts = {};
        this.currentAnalysis = null;
        this.availableAnalyses = [];
        this.API_BASE = 'http://localhost:8000/api/v1';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadAvailableAnalyses();
    }

    setupEventListeners() {
        // Chart type selector buttons
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchChartType(e.target.closest('.chart-btn').dataset.chart);
            });
        });

        // Analysis selector
        const analysisSelect = document.getElementById('analysis-select');
        if (analysisSelect) {
            analysisSelect.addEventListener('change', (e) => {
                this.loadAnalysisData(e.target.value);
            });
        }

        // Export buttons
        const exportBtn = document.getElementById('export-chart-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportCurrentChart());
        }

        const shareBtn = document.getElementById('share-chart-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareCurrentChart());
        }
    }

    async loadAvailableAnalyses() {
        try {
            const response = await fetch(`${this.API_BASE}/analyses`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch analyses');
            }

            const data = await response.json();
            this.availableAnalyses = data.analyses.filter(analysis => 
                analysis.status === 'completed' && analysis.casa_metrics
            );

            this.populateAnalysisSelector();

            // Auto-select the most recent analysis
            if (this.availableAnalyses.length > 0) {
                this.loadAnalysisData(this.availableAnalyses[0].analysis_id);
            } else {
                this.showNoDataState();
            }

        } catch (error) {
            console.error('Error loading analyses:', error);
            this.showNoDataState();
        }
    }

    populateAnalysisSelector() {
        const select = document.getElementById('analysis-select');
        if (!select) return;

        // Clear existing options
        select.innerHTML = '<option value="">-- اختر تحليل --</option>';

        // Add analysis options
        this.availableAnalyses.forEach(analysis => {
            const option = document.createElement('option');
            option.value = analysis.analysis_id;
            option.textContent = `${analysis.filename} - ${new Date(analysis.created_at).toLocaleDateString('ar')}`;
            select.appendChild(option);
        });
    }

    async loadAnalysisData(analysisId) {
        if (!analysisId) return;

        try {
            const response = await fetch(`${this.API_BASE}/analysis/${analysisId}/results`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch analysis results');
            }

            this.currentAnalysis = await response.json();
            this.updateAllCharts();
            this.hideNoDataState();

        } catch (error) {
            console.error('Error loading analysis data:', error);
            this.showError('خطأ في تحميل بيانات التحليل');
        }
    }

    updateAllCharts() {
        if (!this.currentAnalysis || !this.currentAnalysis.casa_metrics) return;

        this.createMotilityChart();
        this.createVelocityChart();
        this.createCountChart();
        this.updateMetricValues();
    }

    createMotilityChart() {
        const canvas = document.getElementById('motility-canvas');
        if (!canvas) return;

        // Destroy existing chart
        if (this.charts.motility) {
            this.charts.motility.destroy();
        }

        const metrics = this.currentAnalysis.casa_metrics;
        const ctx = canvas.getContext('2d');

        const data = {
            labels: ['متقدمة', 'غير متقدمة', 'غير متحركة'],
            datasets: [{
                data: [
                    metrics.progressive_motility || 0,
                    metrics.non_progressive_motility || 0,
                    metrics.immotile || 0
                ],
                backgroundColor: ['#4CAF50', '#FF9800', '#F44336'],
                borderColor: ['#4CAF50', '#FF9800', '#F44336'],
                borderWidth: 2
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.formattedValue + '%';
                        }
                    }
                }
            }
        };

        this.charts.motility = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: options
        });

        // Update legend values
        document.getElementById('progressive-value').textContent = 
            `${metrics.progressive_motility?.toFixed(1) || '0.0'}%`;
        document.getElementById('non-progressive-value').textContent = 
            `${metrics.non_progressive_motility?.toFixed(1) || '0.0'}%`;
        document.getElementById('immotile-value').textContent = 
            `${metrics.immotile?.toFixed(1) || '0.0'}%`;
    }

    createVelocityChart() {
        const canvas = document.getElementById('velocity-canvas');
        if (!canvas) return;

        // Destroy existing chart
        if (this.charts.velocity) {
            this.charts.velocity.destroy();
        }

        const metrics = this.currentAnalysis.casa_metrics;
        const ctx = canvas.getContext('2d');

        const data = {
            labels: ['VCL', 'VSL', 'VAP'],
            datasets: [{
                label: 'السرعة (μm/s)',
                data: [
                    metrics.vcl_mean || 0,
                    metrics.vsl_mean || 0,
                    metrics.vap_mean || 0
                ],
                backgroundColor: ['#2196F3', '#9C27B0', '#4CAF50'],
                borderColor: ['#1976D2', '#7B1FA2', '#388E3C'],
                borderWidth: 2
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'السرعة (μm/s)'
                    }
                }
            }
        };

        this.charts.velocity = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options
        });

        // Update velocity values
        document.getElementById('vcl-value').textContent = 
            `${metrics.vcl_mean?.toFixed(1) || '0.0'} μm/s`;
        document.getElementById('vsl-value').textContent = 
            `${metrics.vsl_mean?.toFixed(1) || '0.0'} μm/s`;
        document.getElementById('vap-value').textContent = 
            `${metrics.vap_mean?.toFixed(1) || '0.0'} μm/s`;
    }

    createCountChart() {
        const canvas = document.getElementById('count-canvas');
        if (!canvas) return;

        // Destroy existing chart
        if (this.charts.count) {
            this.charts.count.destroy();
        }

        const ctx = canvas.getContext('2d');
        let chartData = { labels: [], datasets: [] };

        // Use video metrics if available, otherwise create sample data
        if (this.currentAnalysis.video_metrics && this.currentAnalysis.video_metrics.count_over_time) {
            const timeData = this.currentAnalysis.video_metrics.count_over_time;
            
            chartData = {
                labels: timeData.map(d => `${d.time.toFixed(1)}s`),
                datasets: [{
                    label: 'عدد الحيوانات المنوية',
                    data: timeData.map(d => d.count),
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            };
        } else {
            // Create sample data based on total count
            const totalCount = this.currentAnalysis.casa_metrics.total_count || 0;
            const samplePoints = 10;
            
            chartData = {
                labels: Array.from({length: samplePoints}, (_, i) => `${(i * 0.5).toFixed(1)}s`),
                datasets: [{
                    label: 'عدد الحيوانات المنوية',
                    data: Array.from({length: samplePoints}, () => 
                        Math.max(0, totalCount + Math.random() * 10 - 5)
                    ),
                    borderColor: '#2196F3',
                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            };
        }

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'العدد'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'الزمن'
                    }
                }
            }
        };

        this.charts.count = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: options
        });

        // Update count statistics
        if (this.currentAnalysis.video_metrics) {
            const videoMetrics = this.currentAnalysis.video_metrics;
            const countData = videoMetrics.count_over_time || [];
            
            const avgCount = countData.length > 0 
                ? countData.reduce((sum, d) => sum + d.count, 0) / countData.length
                : this.currentAnalysis.casa_metrics.total_count || 0;
            
            const maxCount = countData.length > 0 
                ? Math.max(...countData.map(d => d.count))
                : this.currentAnalysis.casa_metrics.total_count || 0;
            
            document.getElementById('avg-count-value').textContent = avgCount.toFixed(1);
            document.getElementById('max-count-value').textContent = maxCount.toString();
            document.getElementById('duration-value').textContent = 
                `${videoMetrics.duration?.toFixed(1) || '0.0'} ثانية`;
        } else {
            const totalCount = this.currentAnalysis.casa_metrics.total_count || 0;
            document.getElementById('avg-count-value').textContent = totalCount.toString();
            document.getElementById('max-count-value').textContent = totalCount.toString();
            document.getElementById('duration-value').textContent = 'صورة ثابتة';
        }
    }

    updateMetricValues() {
        if (!this.currentAnalysis || !this.currentAnalysis.casa_metrics) return;

        const metrics = this.currentAnalysis.casa_metrics;
        
        // Update result cards if they exist
        const concentrationValue = document.getElementById('concentration-value');
        if (concentrationValue) {
            concentrationValue.textContent = metrics.concentration?.toFixed(1) || '0.0';
        }

        const motilityValue = document.getElementById('motility-value');
        if (motilityValue) {
            motilityValue.textContent = 
                `${(metrics.progressive_motility + metrics.non_progressive_motility)?.toFixed(1) || '0.0'}`;
        }

        const morphologyValue = document.getElementById('morphology-value');
        if (morphologyValue) {
            morphologyValue.textContent = metrics.morphology_normal?.toFixed(1) || '0.0';
        }
    }

    switchChartType(chartType) {
        // Update button states
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-chart="${chartType}"]`).classList.add('active');

        // Show/hide chart sections
        document.querySelectorAll('.chart-section').forEach(section => {
            section.classList.remove('active');
        });
        document.getElementById(`${chartType}-chart`).classList.add('active');
    }

    async exportCurrentChart() {
        const activeChart = document.querySelector('.chart-section.active');
        if (!activeChart) return;

        const canvas = activeChart.querySelector('canvas');
        if (!canvas) return;

        try {
            // Convert canvas to blob
            canvas.toBlob((blob) => {
                if (!blob) return;

                // Create download link
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `sperm-analysis-chart-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                this.showToast('تم تصدير الرسم البياني بنجاح', 'success');
            }, 'image/png');

        } catch (error) {
            console.error('Export error:', error);
            this.showToast('خطأ في تصدير الرسم البياني', 'error');
        }
    }

    async shareCurrentChart() {
        const activeChart = document.querySelector('.chart-section.active');
        if (!activeChart) return;

        const canvas = activeChart.querySelector('canvas');
        if (!canvas) return;

        try {
            if (navigator.share && navigator.canShare) {
                canvas.toBlob(async (blob) => {
                    if (!blob) return;

                    const file = new File([blob], 'sperm-analysis-chart.png', { type: 'image/png' });
                    
                    if (navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: 'نتائج تحليل الحيوانات المنوية',
                            text: 'الرسم البياني لنتائج التحليل',
                            files: [file]
                        });
                    }
                }, 'image/png');
            } else {
                // Fallback: export the chart
                this.exportCurrentChart();
            }

        } catch (error) {
            console.error('Share error:', error);
            this.showToast('خطأ في مشاركة الرسم البياني', 'error');
        }
    }

    showNoDataState() {
        const chartContainer = document.getElementById('chart-container');
        const noDataState = document.getElementById('no-graph-data');
        const graphActions = document.getElementById('graph-actions');
        const analysisSelector = document.getElementById('analysis-selector');

        if (chartContainer) chartContainer.style.display = 'none';
        if (noDataState) noDataState.style.display = 'block';
        if (graphActions) graphActions.style.display = 'none';
        if (analysisSelector) analysisSelector.style.display = 'none';
    }

    hideNoDataState() {
        const chartContainer = document.getElementById('chart-container');
        const noDataState = document.getElementById('no-graph-data');
        const graphActions = document.getElementById('graph-actions');
        const analysisSelector = document.getElementById('analysis-selector');

        if (chartContainer) chartContainer.style.display = 'block';
        if (noDataState) noDataState.style.display = 'none';
        if (graphActions) graphActions.style.display = 'flex';
        if (analysisSelector) analysisSelector.style.display = 'block';
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showToast(message, type = 'info') {
        // Use existing toast system if available
        if (window.showToast) {
            window.showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }

    // Public method to refresh charts when new analysis is completed
    refresh() {
        this.loadAvailableAnalyses();
    }

    // Public method to destroy all charts (for cleanup)
    destroy() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// Initialize charts manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash === '#graphs' || 
        document.getElementById('graphs-page')) {
        window.chartsManager = new ChartsManager();
    }
});

// Export for global access
window.ChartsManager = ChartsManager;