/**
 * Real Data Exporter - Advanced data export system for sperm analysis
 * Supports PDF, CSV, JSON, and image exports with Arabic RTL formatting
 */

class RealDataExporter {
    constructor() {
        this.isInitialized = false;
        this.exportFormats = {
            pdf: true,
            csv: true,
            json: true,
            excel: false, // Future enhancement
            docx: false   // Future enhancement
        };
        
        this.templates = {
            arabic: {
                direction: 'rtl',
                language: 'ar',
                fontFamily: 'Cairo, Arial, sans-serif'
            },
            english: {
                direction: 'ltr',
                language: 'en',
                fontFamily: 'Arial, sans-serif'
            }
        };
        
        this.initializeExporter();
    }
    
    async initializeExporter() {
        try {
            console.log('📤 Initializing data exporter...');
            
            // Check available export libraries
            this.checkAvailableLibraries();
            
            this.isInitialized = true;
            console.log('✅ Data exporter initialized successfully');
            
        } catch (error) {
            console.error('❌ Data exporter initialization failed:', error);
        }
    }
    
    checkAvailableLibraries() {
        // Check for jsPDF
        if (typeof window.jsPDF !== 'undefined') {
            this.exportFormats.pdf = true;
            console.log('📄 PDF export available');
        }
        
        // Check for html2canvas
        if (typeof window.html2canvas !== 'undefined') {
            console.log('🖼️ Canvas to image export available');
        }
        
        // Check for file system APIs
        if ('showSaveFilePicker' in window) {
            console.log('💾 Native file picker available');
        }
    }
    
    async exportToPDF(analysisData, options = {}) {
        if (!this.exportFormats.pdf) {
            throw new Error('PDF export not available');
        }
        
        try {
            const { jsPDF } = window;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            // Configure for Arabic RTL
            this.setupPDFForArabic(doc);
            
            // Generate PDF content
            await this.generatePDFContent(doc, analysisData, options);
            
            // Save or return PDF
            const fileName = this.generateFileName(analysisData, 'pdf');
            
            if (options.returnBlob) {
                return doc.output('blob');
            } else {
                doc.save(fileName);
                return fileName;
            }
            
        } catch (error) {
            console.error('PDF export failed:', error);
            throw new Error(`فشل في تصدير PDF: ${error.message}`);
        }
    }
    
    setupPDFForArabic(doc) {
        // Set up Arabic support
        doc.setLanguage('ar');
        doc.setFontSize(12);
        
        // Add Arabic font if available
        if (doc.getFontList().includes('Cairo')) {
            doc.setFont('Cairo');
        } else {
            doc.setFont('helvetica');
        }
    }
    
    async generatePDFContent(doc, analysisData, options) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let currentY = margin;
        
        // Header
        currentY = await this.addPDFHeader(doc, analysisData, currentY, pageWidth, margin);
        
        // Patient info
        currentY = await this.addPDFPatientInfo(doc, analysisData, currentY, pageWidth, margin);
        
        // Analysis results
        currentY = await this.addPDFAnalysisResults(doc, analysisData, currentY, pageWidth, margin);
        
        // Charts
        if (options.includeCharts !== false) {
            currentY = await this.addPDFCharts(doc, analysisData, currentY, pageWidth, margin);
        }
        
        // WHO compliance
        currentY = await this.addPDFWHOCompliance(doc, analysisData, currentY, pageWidth, margin);
        
        // Recommendations
        currentY = await this.addPDFRecommendations(doc, analysisData, currentY, pageWidth, margin);
        
        // Footer
        this.addPDFFooter(doc, analysisData, pageHeight, pageWidth, margin);
    }
    
    async addPDFHeader(doc, analysisData, startY, pageWidth, margin) {
        const centerX = pageWidth / 2;
        
        // Title
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('تقرير تحليل الحيوانات المنوية', centerX, startY, { align: 'center' });
        
        // Subtitle
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('تحليل بالذكاء الاصطناعي - نظام CASA', centerX, startY + 10, { align: 'center' });
        
        // Date and time
        const analysisDate = new Date(analysisData.timestamp).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        doc.text(`تاريخ التحليل: ${analysisDate}`, pageWidth - margin, startY + 20, { align: 'right' });
        
        // Separator line
        doc.setLineWidth(0.5);
        doc.line(margin, startY + 30, pageWidth - margin, startY + 30);
        
        return startY + 40;
    }
    
    async addPDFPatientInfo(doc, analysisData, startY, pageWidth, margin) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('معلومات العينة:', pageWidth - margin, startY, { align: 'right' });
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        
        let currentY = startY + 10;
        
        if (analysisData.sampleInfo?.patientId) {
            doc.text(`معرف المريض: ${analysisData.sampleInfo.patientId}`, pageWidth - margin, currentY, { align: 'right' });
            currentY += 7;
        }
        
        if (analysisData.sampleInfo?.volume) {
            doc.text(`حجم العينة: ${analysisData.sampleInfo.volume} مل`, pageWidth - margin, currentY, { align: 'right' });
            currentY += 7;
        }
        
        if (analysisData.sampleInfo?.ph) {
            doc.text(`درجة الحموضة: ${analysisData.sampleInfo.ph}`, pageWidth - margin, currentY, { align: 'right' });
            currentY += 7;
        }
        
        doc.text(`مدة التحليل: ${Math.round(analysisData.processingTime / 1000)} ثانية`, pageWidth - margin, currentY, { align: 'right' });
        currentY += 7;
        
        doc.text(`درجة الثقة: ${analysisData.summary.confidence}%`, pageWidth - margin, currentY, { align: 'right' });
        
        return currentY + 15;
    }
    
    async addPDFAnalysisResults(doc, analysisData, startY, pageWidth, margin) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('نتائج التحليل الرئيسية:', pageWidth - margin, startY, { align: 'right' });
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        
        let currentY = startY + 15;
        
        // Create results table
        const tableData = [
            ['المعيار', 'القيمة', 'الوحدة', 'المعدل المرجعي', 'الحالة'],
            [
                'العدد الإجمالي',
                analysisData.casaMetrics.totalCount.toString(),
                'حيوان منوي',
                '≥ 39 مليون',
                analysisData.casaMetrics.totalCount >= 39 ? 'طبيعي' : 'أقل من الطبيعي'
            ],
            [
                'التركيز',
                analysisData.casaMetrics.concentration.toFixed(1),
                'مليون/مل',
                '≥ 15',
                analysisData.whoCompliance.spermConcentration >= 15 ? 'طبيعي' : 'أقل من الطبيعي'
            ],
            [
                'الحركة التقدمية',
                analysisData.casaMetrics.progressiveMotility.toFixed(1),
                '%',
                '≥ 32%',
                analysisData.casaMetrics.progressiveMotility >= 32 ? 'طبيعي' : 'أقل من الطبيعي'
            ],
            [
                'إجمالي الحركة',
                analysisData.casaMetrics.totalMotility.toFixed(1),
                '%',
                '≥ 40%',
                analysisData.casaMetrics.totalMotility >= 40 ? 'طبيعي' : 'أقل من الطبيعي'
            ],
            [
                'الشكل الطبيعي',
                analysisData.casaMetrics.normalMorphology.toFixed(1),
                '%',
                '≥ 4%',
                analysisData.casaMetrics.normalMorphology >= 4 ? 'طبيعي' : 'أقل من الطبيعي'
            ],
            [
                'الحيوية',
                analysisData.casaMetrics.vitality.toFixed(1),
                '%',
                '≥ 58%',
                analysisData.casaMetrics.vitality >= 58 ? 'طبيعي' : 'أقل من الطبيعي'
            ]
        ];
        
        currentY = this.addPDFTable(doc, tableData, currentY, pageWidth, margin);
        
        return currentY + 10;
    }
    
    addPDFTable(doc, tableData, startY, pageWidth, margin) {
        const tableWidth = pageWidth - 2 * margin;
        const colWidth = tableWidth / tableData[0].length;
        const rowHeight = 8;
        
        let currentY = startY;
        
        tableData.forEach((row, rowIndex) => {
            const isHeader = rowIndex === 0;
            
            if (isHeader) {
                doc.setFont(undefined, 'bold');
                doc.setFillColor(240, 240, 240);
            } else {
                doc.setFont(undefined, 'normal');
                doc.setFillColor(255, 255, 255);
            }
            
            // Draw row background
            doc.rect(margin, currentY, tableWidth, rowHeight, 'F');
            
            // Draw cell borders and text
            row.forEach((cell, colIndex) => {
                const x = margin + colIndex * colWidth;
                
                // Draw cell border
                doc.rect(x, currentY, colWidth, rowHeight);
                
                // Add text (right-aligned for Arabic)
                doc.text(cell, x + colWidth - 2, currentY + 5, { align: 'right' });
            });
            
            currentY += rowHeight;
        });
        
        return currentY;
    }
    
    async addPDFCharts(doc, analysisData, startY, pageWidth, margin) {
        // This would integrate with the chart manager to add chart images
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('الرسوم البيانية:', pageWidth - margin, startY, { align: 'right' });
        
        // Placeholder for chart integration
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('(سيتم إضافة الرسوم البيانية في الإصدار المطور)', pageWidth - margin, startY + 10, { align: 'right' });
        
        return startY + 25;
    }
    
    async addPDFWHOCompliance(doc, analysisData, startY, pageWidth, margin) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('التوافق مع معايير منظمة الصحة العالمية (WHO 2010):', pageWidth - margin, startY, { align: 'right' });
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        
        let currentY = startY + 10;
        
        const quality = analysisData.qualityAssessment.quality;
        const score = analysisData.qualityAssessment.score;
        
        doc.text(`التقييم الشامل: ${quality} (${score}%)`, pageWidth - margin, currentY, { align: 'right' });
        currentY += 10;
        
        // Color code for quality
        if (score >= 80) {
            doc.setTextColor(0, 128, 0); // Green
        } else if (score >= 60) {
            doc.setTextColor(255, 165, 0); // Orange
        } else {
            doc.setTextColor(255, 0, 0); // Red
        }
        
        doc.text(analysisData.qualityAssessment.summary, pageWidth - margin, currentY, { 
            align: 'right',
            maxWidth: pageWidth - 2 * margin
        });
        
        // Reset color
        doc.setTextColor(0, 0, 0);
        
        return currentY + 20;
    }
    
    async addPDFRecommendations(doc, analysisData, startY, pageWidth, margin) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('التوصيات:', pageWidth - margin, startY, { align: 'right' });
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        
        let currentY = startY + 10;
        
        analysisData.qualityAssessment.recommendations.forEach((recommendation, index) => {
            doc.text(`${index + 1}. ${recommendation}`, pageWidth - margin, currentY, { 
                align: 'right',
                maxWidth: pageWidth - 2 * margin
            });
            currentY += 7;
        });
        
        // Medical disclaimer
        currentY += 10;
        doc.setFontSize(10);
        doc.setFont(undefined, 'italic');
        doc.text(
            'تنبيه: هذا التقرير للأغراض التعليمية والبحثية فقط. يُنصح بمراجعة طبيب مختص للتشخيص الطبي.',
            pageWidth - margin,
            currentY,
            { 
                align: 'right',
                maxWidth: pageWidth - 2 * margin
            }
        );
        
        return currentY + 15;
    }
    
    addPDFFooter(doc, analysisData, pageHeight, pageWidth, margin) {
        const footerY = pageHeight - margin;
        
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        
        // Footer text
        doc.text('محلل الحيوانات المنوية بالذكاء الاصطناعي', margin, footerY);
        doc.text(`تم الإنتاج في: ${new Date().toLocaleDateString('ar-SA')}`, pageWidth - margin, footerY, { align: 'right' });
        
        // Version info
        doc.text(`نسخة النموذج: ${analysisData.technicalDetails.modelVersion}`, margin, footerY - 5);
        doc.text(`معالج: ${analysisData.technicalDetails.processingBackend}`, pageWidth - margin, footerY - 5, { align: 'right' });
    }
    
    async exportToCSV(analysisData, options = {}) {
        try {
            const csvData = this.generateCSVData(analysisData);
            const csvContent = this.arrayToCSV(csvData);
            
            const fileName = this.generateFileName(analysisData, 'csv');
            
            if (options.returnString) {
                return csvContent;
            } else {
                this.downloadFile(csvContent, fileName, 'text/csv');
                return fileName;
            }
            
        } catch (error) {
            console.error('CSV export failed:', error);
            throw new Error(`فشل في تصدير CSV: ${error.message}`);
        }
    }
    
    generateCSVData(analysisData) {
        const data = [
            ['المعيار', 'القيمة', 'الوحدة'],
            ['تاريخ التحليل', new Date(analysisData.timestamp).toLocaleDateString('ar-SA'), ''],
            ['معرف المريض', analysisData.sampleInfo?.patientId || '', ''],
            ['العدد الإجمالي', analysisData.casaMetrics.totalCount, 'حيوان منوي'],
            ['التركيز', analysisData.casaMetrics.concentration.toFixed(1), 'مليون/مل'],
            ['الحركة التقدمية', analysisData.casaMetrics.progressiveMotility.toFixed(1), '%'],
            ['إجمالي الحركة', analysisData.casaMetrics.totalMotility.toFixed(1), '%'],
            ['الشكل الطبيعي', analysisData.casaMetrics.normalMorphology.toFixed(1), '%'],
            ['الحيوية', analysisData.casaMetrics.vitality.toFixed(1), '%'],
            ['درجة الثقة', analysisData.summary.confidence, '%'],
            ['التقييم الشامل', analysisData.qualityAssessment.quality, ''],
            ['النتيجة', analysisData.qualityAssessment.score, '%']
        ];
        
        // Add velocity metrics
        if (analysisData.velocityMetrics) {
            data.push(
                ['السرعة المنحنية (VCL)', analysisData.velocityMetrics.vcl.mean.toFixed(1), 'μm/s'],
                ['السرعة المستقيمة (VSL)', analysisData.velocityMetrics.vsl.mean.toFixed(1), 'μm/s'],
                ['متوسط السرعة (VAP)', analysisData.velocityMetrics.vap.mean.toFixed(1), 'μm/s']
            );
        }
        
        return data;
    }
    
    arrayToCSV(data) {
        return data.map(row => 
            row.map(field => {
                // Escape quotes and wrap in quotes if needed
                const stringField = String(field);
                if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
                    return '"' + stringField.replace(/"/g, '""') + '"';
                }
                return stringField;
            }).join(',')
        ).join('\n');
    }
    
    async exportToJSON(analysisData, options = {}) {
        try {
            const jsonData = {
                ...analysisData,
                exportedAt: new Date().toISOString(),
                exportFormat: 'json',
                version: '1.0'
            };
            
            const jsonString = JSON.stringify(jsonData, null, options.pretty ? 2 : 0);
            const fileName = this.generateFileName(analysisData, 'json');
            
            if (options.returnObject) {
                return jsonData;
            } else if (options.returnString) {
                return jsonString;
            } else {
                this.downloadFile(jsonString, fileName, 'application/json');
                return fileName;
            }
            
        } catch (error) {
            console.error('JSON export failed:', error);
            throw new Error(`فشل في تصدير JSON: ${error.message}`);
        }
    }
    
    async generateShareableReport(analysisData) {
        try {
            const summary = `
📊 تقرير تحليل الحيوانات المنوية

📅 التاريخ: ${new Date(analysisData.timestamp).toLocaleDateString('ar-SA')}
🔬 العدد الإجمالي: ${analysisData.casaMetrics.totalCount}
📈 التركيز: ${analysisData.casaMetrics.concentration.toFixed(1)} مليون/مل
🏃 الحركة الإجمالية: ${analysisData.casaMetrics.totalMotility.toFixed(1)}%
🎯 الشكل الطبيعي: ${analysisData.casaMetrics.normalMorphology.toFixed(1)}%
💪 الحيوية: ${analysisData.casaMetrics.vitality.toFixed(1)}%
✅ التقييم: ${analysisData.qualityAssessment.quality} (${analysisData.qualityAssessment.score}%)

⚕️ تنبيه: هذا التقرير للأغراض التعليمية فقط
            `.trim();
            
            return {
                summary,
                text: summary,
                files: [] // Could include chart images in the future
            };
            
        } catch (error) {
            console.error('Shareable report generation failed:', error);
            throw error;
        }
    }
    
    downloadFile(content, fileName, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
    
    generateFileName(analysisData, format) {
        const date = new Date(analysisData.timestamp);
        const dateString = date.toISOString().split('T')[0];
        const timeString = date.toTimeString().split(' ')[0].replace(/:/g, '-');
        
        const patientId = analysisData.sampleInfo?.patientId || 'sample';
        
        return `sperm_analysis_${patientId}_${dateString}_${timeString}.${format}`;
    }
    
    // Batch export functionality
    async exportMultipleAnalyses(analysisArray, format = 'pdf') {
        if (!analysisArray || analysisArray.length === 0) {
            throw new Error('لا توجد تحاليل للتصدير');
        }
        
        const results = [];
        
        for (const analysis of analysisArray) {
            try {
                let result;
                
                switch (format) {
                    case 'pdf':
                        result = await this.exportToPDF(analysis);
                        break;
                    case 'csv':
                        result = await this.exportToCSV(analysis);
                        break;
                    case 'json':
                        result = await this.exportToJSON(analysis);
                        break;
                    default:
                        throw new Error(`تنسيق غير مدعوم: ${format}`);
                }
                
                results.push({
                    analysisId: analysis.id,
                    fileName: result,
                    success: true
                });
                
            } catch (error) {
                results.push({
                    analysisId: analysis.id,
                    error: error.message,
                    success: false
                });
            }
        }
        
        return results;
    }
    
    // Statistical summary export
    async exportStatisticalSummary(analysisArray, format = 'pdf') {
        if (!analysisArray || analysisArray.length === 0) {
            throw new Error('لا توجد تحاليل للإحصائيات');
        }
        
        const stats = this.calculateStatistics(analysisArray);
        
        switch (format) {
            case 'pdf':
                return await this.exportStatsToPDF(stats);
            case 'csv':
                return await this.exportStatsToCSV(stats);
            case 'json':
                return await this.exportToJSON(stats);
            default:
                throw new Error(`تنسيق غير مدعوم: ${format}`);
        }
    }
    
    calculateStatistics(analysisArray) {
        const totalCount = analysisArray.length;
        
        const stats = {
            summary: {
                totalAnalyses: totalCount,
                dateRange: {
                    start: new Date(Math.min(...analysisArray.map(a => new Date(a.timestamp)))),
                    end: new Date(Math.max(...analysisArray.map(a => new Date(a.timestamp))))
                }
            },
            averages: {
                concentration: 0,
                totalMotility: 0,
                progressiveMotility: 0,
                normalMorphology: 0,
                vitality: 0,
                processingTime: 0
            },
            ranges: {
                concentration: { min: Infinity, max: -Infinity },
                totalMotility: { min: Infinity, max: -Infinity },
                progressiveMotility: { min: Infinity, max: -Infinity },
                normalMorphology: { min: Infinity, max: -Infinity },
                vitality: { min: Infinity, max: -Infinity }
            },
            qualityDistribution: {
                excellent: 0,
                good: 0,
                fair: 0,
                poor: 0
            }
        };
        
        // Calculate averages and ranges
        analysisArray.forEach(analysis => {
            const metrics = analysis.casaMetrics;
            
            stats.averages.concentration += metrics.concentration;
            stats.averages.totalMotility += metrics.totalMotility;
            stats.averages.progressiveMotility += metrics.progressiveMotility;
            stats.averages.normalMorphology += metrics.normalMorphology;
            stats.averages.vitality += metrics.vitality;
            stats.averages.processingTime += analysis.processingTime;
            
            // Update ranges
            Object.keys(stats.ranges).forEach(key => {
                const value = metrics[key === 'progressiveMotility' ? 'progressiveMotility' : key];
                stats.ranges[key].min = Math.min(stats.ranges[key].min, value);
                stats.ranges[key].max = Math.max(stats.ranges[key].max, value);
            });
            
            // Quality distribution
            const score = analysis.qualityAssessment.score;
            if (score >= 85) stats.qualityDistribution.excellent++;
            else if (score >= 70) stats.qualityDistribution.good++;
            else if (score >= 55) stats.qualityDistribution.fair++;
            else stats.qualityDistribution.poor++;
        });
        
        // Finalize averages
        Object.keys(stats.averages).forEach(key => {
            stats.averages[key] /= totalCount;
        });
        
        return stats;
    }
    
    async exportStatsToPDF(stats) {
        // Implementation for statistical PDF export
        // This would create a comprehensive statistical report
        throw new Error('Statistical PDF export not yet implemented');
    }
    
    async exportStatsToCSV(stats) {
        const data = [
            ['إحصائية', 'قيمة', 'وحدة'],
            ['إجمالي التحاليل', stats.summary.totalAnalyses, ''],
            ['متوسط التركيز', stats.averages.concentration.toFixed(1), 'مليون/مل'],
            ['متوسط إجمالي الحركة', stats.averages.totalMotility.toFixed(1), '%'],
            ['متوسط الحركة التقدمية', stats.averages.progressiveMotility.toFixed(1), '%'],
            ['متوسط الشكل الطبيعي', stats.averages.normalMorphology.toFixed(1), '%'],
            ['متوسط الحيوية', stats.averages.vitality.toFixed(1), '%'],
            ['متوسط وقت المعالجة', Math.round(stats.averages.processingTime), 'مللي ثانية']
        ];
        
        const csvContent = this.arrayToCSV(data);
        const fileName = `sperm_analysis_statistics_${new Date().toISOString().split('T')[0]}.csv`;
        
        this.downloadFile(csvContent, fileName, 'text/csv');
        return fileName;
    }
    
    // Utility methods
    getAvailableFormats() {
        return Object.keys(this.exportFormats).filter(format => this.exportFormats[format]);
    }
    
    isFormatSupported(format) {
        return this.exportFormats[format] === true;
    }
}

// Export for global use
window.RealDataExporter = RealDataExporter;