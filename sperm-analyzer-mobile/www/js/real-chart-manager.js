/**
 * Real Chart Manager - Advanced chart visualization for sperm analysis
 * Creates interactive charts using Chart.js with Arabic RTL support
 */

class RealChartManager {
    constructor() {
        this.charts = {};
        this.chartConfigs = {};
        this.isInitialized = false;
        
        // Chart themes and colors
        this.themes = {
            motility: {
                progressive: '#4CAF50',
                nonProgressive: '#FF9800',
                immotile: '#F44336'
            },
            morphology: {
                normal: '#2196F3',
                headDefect: '#9C27B0',
                tailDefect: '#FF5722',
                otherDefect: '#607D8B'
            },
            velocity: {
                vcl: '#3F51B5',
                vsl: '#009688',
                vap: '#795548'
            },
            quality: {
                excellent: '#4CAF50',
                good: '#8BC34A',
                fair: '#FFC107',
                poor: '#FF5722'
            }
        };
        
        this.arabicLabels = {
            progressive: 'متقدمة',
            nonProgressive: 'غير متقدمة',
            immotile: 'غير متحركة',
            normal: 'طبيعي',
            headDefect: 'عيب في الرأس',
            tailDefect: 'عيب في الذيل',
            otherDefect: 'عيوب أخرى',
            vcl: 'السرعة المنحنية (VCL)',
            vsl: 'السرعة المستقيمة (VSL)',
            vap: 'متوسط السرعة (VAP)',
            concentration: 'التركيز',
            motility: 'الحركة',
            morphology: 'الشكل',
            vitality: 'الحيوية'
        };
        
        this.initializeChartManager();
    }
    
    async initializeChartManager() {
        try {
            console.log('📊 Initializing chart manager...');
            
            // Setup Chart.js defaults for RTL and Arabic
            this.setupChartDefaults();
            
            // Initialize chart containers
            this.initializeChartContainers();
            
            this.isInitialized = true;
            console.log('✅ Chart manager initialized successfully');
            
        } catch (error) {
            console.error('❌ Chart manager initialization failed:', error);
        }
    }
    
    setupChartDefaults() {
        if (typeof Chart !== 'undefined') {
            // Configure Chart.js defaults for Arabic RTL
            Chart.defaults.font.family = "'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
            Chart.defaults.font.size = 12;
            Chart.defaults.responsive = true;
            Chart.defaults.maintainAspectRatio = false;
            Chart.defaults.plugins.legend.rtl = true;
            Chart.defaults.plugins.legend.textDirection = 'rtl';
            
            // Register custom plugins for Arabic support
            Chart.register({
                id: 'arabicRTL',
                beforeDraw: (chart) => {
                    const ctx = chart.ctx;
                    ctx.textAlign = 'right';
                    ctx.direction = 'rtl';
                }
            });
        }
    }
    
    initializeChartContainers() {
        // Initialize all chart containers
        this.chartContainers = {
            motility: document.getElementById('motility-canvas'),
            velocity: document.getElementById('velocity-canvas'),
            count: document.getElementById('count-canvas'),
            morphology: document.getElementById('morphology-canvas'),
            who: document.getElementById('who-compliance-canvas'),
            timeline: document.getElementById('timeline-canvas')
        };
    }
    
    initializeCharts() {
        // Create initial empty charts
        this.createMotilityChart({});
        this.createVelocityChart({});
        this.createMorphologyChart({});
    }
    
    createMotilityChart(motilityData) {
        const canvas = this.chartContainers.motility;
        if (!canvas) return;
        
        // Destroy existing chart
        if (this.charts.motility) {
            this.charts.motility.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        
        // Prepare data
        const data = {
            labels: [
                this.arabicLabels.progressive,
                this.arabicLabels.nonProgressive,
                this.arabicLabels.immotile
            ],
            datasets: [{
                data: [
                    motilityData.percentages?.progressive || 0,
                    motilityData.percentages?.nonProgressive || 0,
                    motilityData.percentages?.immotile || 0
                ],
                backgroundColor: [
                    this.themes.motility.progressive,
                    this.themes.motility.nonProgressive,
                    this.themes.motility.immotile
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };
        
        const config = {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        rtl: true,
                        textDirection: 'rtl',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 14,
                                family: 'Cairo'
                            },
                            generateLabels: (chart) => {
                                const data = chart.data;
                                return data.labels.map((label, i) => ({
                                    text: `${label}: ${data.datasets[0].data[i].toFixed(1)}%`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    strokeStyle: data.datasets[0].borderColor,
                                    lineWidth: data.datasets[0].borderWidth,
                                    pointStyle: 'circle'
                                }));
                            }
                        }
                    },
                    tooltip: {
                        rtl: true,
                        textDirection: 'rtl',
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                return `${label}: ${value.toFixed(1)}%`;
                            }
                        }
                    }
                },
                cutout: '50%',
                animation: {
                    animateRotate: true,
                    duration: 1500
                }
            }
        };
        
        this.charts.motility = new Chart(ctx, config);
        this.chartConfigs.motility = config;
    }
    
    createVelocityChart(velocityData) {
        const canvas = this.chartContainers.velocity;
        if (!canvas) return;
        
        // Destroy existing chart
        if (this.charts.velocity) {
            this.charts.velocity.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        
        const data = {
            labels: [
                this.arabicLabels.vcl,
                this.arabicLabels.vsl,
                this.arabicLabels.vap
            ],
            datasets: [{
                label: 'μm/s',
                data: [
                    velocityData.vcl?.mean || 0,
                    velocityData.vsl?.mean || 0,
                    velocityData.vap?.mean || 0
                ],
                backgroundColor: [
                    this.themes.velocity.vcl + '80',
                    this.themes.velocity.vsl + '80',
                    this.themes.velocity.vap + '80'
                ],
                borderColor: [
                    this.themes.velocity.vcl,
                    this.themes.velocity.vsl,
                    this.themes.velocity.vap
                ],
                borderWidth: 2,
                borderRadius: 8
            }]
        };
        
        const config = {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        rtl: true,
                        textDirection: 'rtl',
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.parsed.y.toFixed(1)} μm/s`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'السرعة (μm/s)',
                            font: {
                                family: 'Cairo',
                                size: 14
                            }
                        },
                        grid: {
                            color: '#e0e0e0'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'أنواع السرعة',
                            font: {
                                family: 'Cairo',
                                size: 14
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                }
            }
        };
        
        this.charts.velocity = new Chart(ctx, config);
        this.chartConfigs.velocity = config;
    }
    
    createMorphologyChart(morphologyData) {
        const canvas = this.chartContainers.morphology;
        if (!canvas) return;
        
        // Destroy existing chart
        if (this.charts.morphology) {
            this.charts.morphology.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        
        const data = {
            labels: [
                this.arabicLabels.normal,
                this.arabicLabels.headDefect,
                this.arabicLabels.tailDefect,
                this.arabicLabels.otherDefect
            ],
            datasets: [{
                data: [
                    morphologyData.percentages?.normal || 0,
                    morphologyData.percentages?.headDefect || 0,
                    morphologyData.percentages?.tailDefect || 0,
                    morphologyData.percentages?.otherDefect || 0
                ],
                backgroundColor: [
                    this.themes.morphology.normal,
                    this.themes.morphology.headDefect,
                    this.themes.morphology.tailDefect,
                    this.themes.morphology.otherDefect
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        };
        
        const config = {
            type: 'pie',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        rtl: true,
                        textDirection: 'rtl',
                        labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                                size: 12,
                                family: 'Cairo'
                            },
                            generateLabels: (chart) => {
                                const data = chart.data;
                                return data.labels.map((label, i) => ({
                                    text: `${label}: ${data.datasets[0].data[i].toFixed(1)}%`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    strokeStyle: data.datasets[0].borderColor,
                                    lineWidth: data.datasets[0].borderWidth,
                                    pointStyle: 'circle'
                                }));
                            }
                        }
                    },
                    tooltip: {
                        rtl: true,
                        textDirection: 'rtl',
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                return `${label}: ${value.toFixed(1)}%`;
                            }
                        }
                    }
                },
                animation: {
                    animateRotate: true,
                    duration: 1500
                }
            }
        };
        
        this.charts.morphology = new Chart(ctx, config);
        this.chartConfigs.morphology = config;
    }
    
    createWHOComplianceChart(whoData) {
        const canvas = this.chartContainers.who;
        if (!canvas) return;
        
        // Destroy existing chart
        if (this.charts.who) {
            this.charts.who.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        
        // WHO compliance data
        const parameters = [
            { name: 'التركيز', value: whoData.spermConcentration || 0, reference: 15, unit: 'مليون/مل' },
            { name: 'الحركة التقدمية', value: whoData.progressiveMotility || 0, reference: 32, unit: '%' },
            { name: 'إجمالي الحركة', value: whoData.totalMotility || 0, reference: 40, unit: '%' },
            { name: 'الشكل الطبيعي', value: whoData.normalMorphology || 0, reference: 4, unit: '%' },
            { name: 'الحيوية', value: whoData.vitality || 0, reference: 58, unit: '%' }
        ];
        
        const data = {
            labels: parameters.map(p => p.name),
            datasets: [
                {
                    label: 'القيمة الفعلية',
                    data: parameters.map(p => p.value),
                    backgroundColor: parameters.map(p => 
                        p.value >= p.reference ? this.themes.quality.excellent + '80' : this.themes.quality.poor + '80'
                    ),
                    borderColor: parameters.map(p => 
                        p.value >= p.reference ? this.themes.quality.excellent : this.themes.quality.poor
                    ),
                    borderWidth: 2
                },
                {
                    label: 'المعدل المرجعي (WHO)',
                    data: parameters.map(p => p.reference),
                    backgroundColor: '#9E9E9E40',
                    borderColor: '#9E9E9E',
                    borderWidth: 2,
                    borderDash: [5, 5]
                }
            ]
        };
        
        const config = {
            type: 'bar',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true,
                        textDirection: 'rtl',
                        labels: {
                            font: {
                                family: 'Cairo',
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        rtl: true,
                        textDirection: 'rtl',
                        callbacks: {
                            label: function(context) {
                                const param = parameters[context.dataIndex];
                                const value = context.parsed.y;
                                return `${context.dataset.label}: ${value.toFixed(1)} ${param.unit}`;
                            },
                            afterLabel: function(context) {
                                const param = parameters[context.dataIndex];
                                const isNormal = param.value >= param.reference;
                                return isNormal ? '✅ ضمن المعدل الطبيعي' : '⚠️ أقل من المعدل الطبيعي';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'القيم',
                            font: {
                                family: 'Cairo',
                                size: 14
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'المعايير',
                            font: {
                                family: 'Cairo',
                                size: 14
                            }
                        }
                    }
                },
                animation: {
                    duration: 1500,
                    easing: 'easeInOutQuart'
                }
            }
        };
        
        this.charts.who = new Chart(ctx, config);
        this.chartConfigs.who = config;
    }
    
    createTimelineChart(analysisHistory) {
        const canvas = this.chartContainers.timeline;
        if (!canvas || !analysisHistory || analysisHistory.length === 0) return;
        
        // Destroy existing chart
        if (this.charts.timeline) {
            this.charts.timeline.destroy();
        }
        
        const ctx = canvas.getContext('2d');
        
        // Prepare timeline data (last 10 analyses)
        const recentAnalyses = analysisHistory.slice(0, 10).reverse();
        
        const data = {
            labels: recentAnalyses.map((analysis, index) => {
                const date = new Date(analysis.timestamp);
                return date.toLocaleDateString('ar-SA', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }),
            datasets: [
                {
                    label: 'التركيز',
                    data: recentAnalyses.map(a => a.casaMetrics?.concentration || 0),
                    borderColor: this.themes.velocity.vcl,
                    backgroundColor: this.themes.velocity.vcl + '20',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'الحركة الإجمالية (%)',
                    data: recentAnalyses.map(a => a.casaMetrics?.totalMotility || 0),
                    borderColor: this.themes.motility.progressive,
                    backgroundColor: this.themes.motility.progressive + '20',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                },
                {
                    label: 'الشكل الطبيعي (%)',
                    data: recentAnalyses.map(a => a.casaMetrics?.normalMorphology || 0),
                    borderColor: this.themes.morphology.normal,
                    backgroundColor: this.themes.morphology.normal + '20',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        };
        
        const config = {
            type: 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true,
                        textDirection: 'rtl',
                        labels: {
                            font: {
                                family: 'Cairo',
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        rtl: true,
                        textDirection: 'rtl'
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'التاريخ والوقت',
                            font: {
                                family: 'Cairo'
                            }
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: 'التركيز (مليون/مل)',
                            font: {
                                family: 'Cairo'
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: {
                            display: true,
                            text: 'النسبة المئوية (%)',
                            font: {
                                family: 'Cairo'
                            }
                        },
                        grid: {
                            drawOnChartArea: false,
                        },
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                }
            }
        };
        
        this.charts.timeline = new Chart(ctx, config);
        this.chartConfigs.timeline = config;
    }
    
    // Advanced chart creation methods
    createComparisonChart(analyses) {
        // Create a comparison chart between multiple analyses
        if (!analyses || analyses.length < 2) return;
        
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        
        const ctx = canvas.getContext('2d');
        
        const data = {
            labels: ['التركيز', 'الحركة التقدمية', 'إجمالي الحركة', 'الشكل الطبيعي', 'الحيوية'],
            datasets: analyses.map((analysis, index) => ({
                label: `تحليل ${index + 1} - ${new Date(analysis.timestamp).toLocaleDateString('ar-SA')}`,
                data: [
                    analysis.casaMetrics?.concentration || 0,
                    analysis.casaMetrics?.progressiveMotility || 0,
                    analysis.casaMetrics?.totalMotility || 0,
                    analysis.casaMetrics?.normalMorphology || 0,
                    analysis.casaMetrics?.vitality || 0
                ],
                backgroundColor: `hsl(${index * 60}, 70%, 50%, 0.2)`,
                borderColor: `hsl(${index * 60}, 70%, 50%)`,
                borderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }))
        };
        
        const config = {
            type: 'radar',
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                        rtl: true,
                        textDirection: 'rtl'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        pointLabels: {
                            font: {
                                family: 'Cairo',
                                size: 12
                            }
                        }
                    }
                }
            }
        };
        
        return new Chart(ctx, config);
    }
    
    // Utility methods
    exportChart(chartName, format = 'png') {
        const chart = this.charts[chartName];
        if (!chart) {
            throw new Error(`Chart ${chartName} not found`);
        }
        
        const canvas = chart.canvas;
        const dataURL = canvas.toDataURL(`image/${format}`, 1.0);
        
        // Create download link
        const link = document.createElement('a');
        link.download = `sperm_analysis_${chartName}_${new Date().toISOString().split('T')[0]}.${format}`;
        link.href = dataURL;
        link.click();
    }
    
    updateChart(chartName, newData) {
        const chart = this.charts[chartName];
        if (!chart) return;
        
        // Update chart data
        switch (chartName) {
            case 'motility':
                this.createMotilityChart(newData);
                break;
            case 'velocity':
                this.createVelocityChart(newData);
                break;
            case 'morphology':
                this.createMorphologyChart(newData);
                break;
            case 'who':
                this.createWHOComplianceChart(newData);
                break;
        }
    }
    
    destroyChart(chartName) {
        if (this.charts[chartName]) {
            this.charts[chartName].destroy();
            delete this.charts[chartName];
        }
    }
    
    destroyAllCharts() {
        Object.keys(this.charts).forEach(chartName => {
            this.destroyChart(chartName);
        });
    }
    
    getChartImage(chartName, format = 'png', quality = 1.0) {
        const chart = this.charts[chartName];
        if (!chart) return null;
        
        return chart.canvas.toDataURL(`image/${format}`, quality);
    }
    
    // Chart styling and themes
    setTheme(themeName) {
        // Implementation for different chart themes
        switch (themeName) {
            case 'dark':
                this.applyDarkTheme();
                break;
            case 'light':
                this.applyLightTheme();
                break;
            case 'medical':
                this.applyMedicalTheme();
                break;
        }
    }
    
    applyDarkTheme() {
        Chart.defaults.color = '#ffffff';
        Chart.defaults.backgroundColor = '#2d3748';
        Chart.defaults.borderColor = '#4a5568';
    }
    
    applyLightTheme() {
        Chart.defaults.color = '#2d3748';
        Chart.defaults.backgroundColor = '#ffffff';
        Chart.defaults.borderColor = '#e2e8f0';
    }
    
    applyMedicalTheme() {
        // Medical-specific color scheme
        this.themes.motility = {
            progressive: '#0066cc',
            nonProgressive: '#ff8800',
            immotile: '#cc0000'
        };
    }
    
    // Print and export functionality
    preparePrintableCharts(analysisData) {
        const printContainer = document.createElement('div');
        printContainer.className = 'print-charts';
        printContainer.style.display = 'none';
        
        // Create print-optimized charts
        const charts = ['motility', 'velocity', 'morphology', 'who'];
        
        charts.forEach(chartType => {
            const chartDiv = document.createElement('div');
            chartDiv.className = 'print-chart';
            
            const canvas = document.createElement('canvas');
            canvas.width = 400;
            canvas.height = 300;
            
            chartDiv.appendChild(canvas);
            printContainer.appendChild(chartDiv);
            
            // Create chart with print-friendly settings
            this.createPrintChart(canvas, chartType, analysisData);
        });
        
        document.body.appendChild(printContainer);
        return printContainer;
    }
    
    createPrintChart(canvas, chartType, analysisData) {
        const ctx = canvas.getContext('2d');
        
        // Configure for printing
        const printConfig = {
            ...this.chartConfigs[chartType],
            options: {
                ...this.chartConfigs[chartType].options,
                responsive: false,
                animation: false,
                plugins: {
                    ...this.chartConfigs[chartType].options.plugins,
                    legend: {
                        ...this.chartConfigs[chartType].options.plugins.legend,
                        labels: {
                            ...this.chartConfigs[chartType].options.plugins.legend.labels,
                            font: {
                                size: 10,
                                family: 'Cairo'
                            }
                        }
                    }
                }
            }
        };
        
        return new Chart(ctx, printConfig);
    }
}

// Export for global use
window.RealChartManager = RealChartManager;