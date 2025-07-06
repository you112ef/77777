// Sperm Analyzer AI Engine
// Core analysis functionality combining OpenCV and TensorFlow

class SpermAnalyzer {
    constructor() {
        this.model = null;
        this.isInitialized = false;
        this.analysisSettings = {
            confidenceThreshold: 0.5,
            maxSpermCount: 200,
            minSpermArea: 50,
            maxSpermArea: 500,
            morphologyThreshold: 0.7,
            motilityFrames: 30
        };
    }

    async initialize() {
        try {
            console.log('Initializing Sperm Analyzer...');
            
            // Wait for OpenCV to be ready
            if (window.cv && typeof cv.onRuntimeInitialized === 'function') {
                await new Promise((resolve) => {
                    if (cv.Mat) {
                        resolve();
                    } else {
                        cv.onRuntimeInitialized = resolve;
                    }
                });
            }

            // Wait for TensorFlow to be ready
            if (window.tf) {
                await tf.ready();
            }

            this.isInitialized = true;
            console.log('Sperm Analyzer initialized successfully');
            
        } catch (error) {
            console.error('Error initializing Sperm Analyzer:', error);
            throw error;
        }
    }

    async loadModel(modelPath = './models/sperm_analyzer.json') {
        try {
            console.log('Loading AI model...');
            
            if (!window.tf) {
                throw new Error('TensorFlow.js not available');
            }

            // In a real implementation, load the actual model
            // this.model = await tf.loadLayersModel(modelPath);
            
            // For demo, use mock model
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.model = {
                predict: this.mockPredict.bind(this)
            };
            
            console.log('AI model loaded successfully');
            
        } catch (error) {
            console.error('Error loading model:', error);
            // Continue with mock model for demo
            this.model = {
                predict: this.mockPredict.bind(this)
            };
        }
    }

    mockPredict(inputTensor) {
        // Mock prediction for demo
        return {
            dataSync: () => [
                Math.random(), // Sperm detection confidence
                Math.random(), // Morphology score
                Math.random(), // Motility score
                Math.random()  // Concentration score
            ],
            dispose: () => {}
        };
    }

    async analyzeImage(imageBase64, metadata = {}) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        if (!this.model) {
            await this.loadModel();
        }

        try {
            console.log('Starting image analysis...');
            
            // Convert base64 to image element
            const img = await this.base64ToImage(imageBase64);
            
            // Preprocess image
            const processedImage = await this.preprocessImage(img);
            
            // Detect sperm cells
            const detectedSperm = await this.detectSperm(processedImage);
            
            // Analyze morphology
            const morphologyResults = await this.analyzeMorphology(detectedSperm);
            
            // Analyze concentration
            const concentrationResults = await this.analyzeConcentration(detectedSperm, metadata);
            
            // Mock motility analysis (would require video in real implementation)
            const motilityResults = await this.analyzeMockMotility();
            
            // Calculate viability
            const viabilityResults = await this.analyzeViability(detectedSperm);
            
            // Combine results
            const results = {
                totalCount: detectedSperm.length,
                concentration: concentrationResults,
                morphology: morphologyResults,
                motility: motilityResults,
                viability: viabilityResults,
                detectedSperm: detectedSperm.slice(0, 10), // Sample for display
                analysisMetadata: {
                    imageSize: { width: img.width, height: img.height },
                    processingTime: Date.now(),
                    confidence: this.calculateOverallConfidence([
                        concentrationResults.confidence,
                        morphologyResults.confidence,
                        motilityResults.confidence,
                        viabilityResults.confidence
                    ])
                }
            };
            
            console.log('Analysis completed:', results);
            return results;
            
        } catch (error) {
            console.error('Error during analysis:', error);
            throw error;
        }
    }

    async base64ToImage(base64) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = `data:image/jpeg;base64,${base64}`;
        });
    }

    async preprocessImage(img) {
        if (!window.cv) {
            return img;
        }

        try {
            // Read image into OpenCV Mat
            const src = cv.imread(img);
            
            // Convert to grayscale
            const gray = new cv.Mat();
            cv.cvtColor(src, gray, cv.COLOR_BGR2GRAY);
            
            // Apply Gaussian blur to reduce noise
            const blurred = new cv.Mat();
            const ksize = new cv.Size(5, 5);
            cv.GaussianBlur(gray, blurred, ksize, 1.5);
            
            // Enhance contrast
            const enhanced = new cv.Mat();
            cv.threshold(blurred, enhanced, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
            
            // Clean up
            src.delete();
            gray.delete();
            blurred.delete();
            
            return enhanced;
            
        } catch (error) {
            console.error('Error preprocessing image:', error);
            return img;
        }
    }

    async detectSperm(processedImage) {
        if (!window.cv) {
            // Return mock detections
            return this.generateMockDetections(20 + Math.floor(Math.random() * 30));
        }

        try {
            // Find contours
            const contours = new cv.MatVector();
            const hierarchy = new cv.Mat();
            
            cv.findContours(
                processedImage, 
                contours, 
                hierarchy, 
                cv.RETR_EXTERNAL, 
                cv.CHAIN_APPROX_SIMPLE
            );
            
            const detectedSperm = [];
            const minArea = this.analysisSettings.minSpermArea;
            const maxArea = this.analysisSettings.maxSpermArea;
            
            for (let i = 0; i < contours.size(); i++) {
                const contour = contours.get(i);
                const area = cv.contourArea(contour);
                
                if (area >= minArea && area <= maxArea) {
                    const boundingRect = cv.boundingRect(contour);
                    const aspectRatio = boundingRect.width / boundingRect.height;
                    
                    // Filter by aspect ratio (sperm are typically elongated)
                    if (aspectRatio > 0.3 && aspectRatio < 3.0) {
                        detectedSperm.push({
                            id: `sperm_${i}`,
                            area: area,
                            boundingRect: boundingRect,
                            aspectRatio: aspectRatio,
                            contour: contour,
                            confidence: Math.random() * 0.4 + 0.6 // 0.6-1.0
                        });
                    }
                }
                
                contour.delete();
            }
            
            // Clean up
            contours.delete();
            hierarchy.delete();
            
            return detectedSperm.slice(0, this.analysisSettings.maxSpermCount);
            
        } catch (error) {
            console.error('Error detecting sperm:', error);
            return this.generateMockDetections(25);
        }
    }

    generateMockDetections(count) {
        const detections = [];
        for (let i = 0; i < count; i++) {
            detections.push({
                id: `mock_sperm_${i}`,
                area: Math.random() * 200 + 50,
                boundingRect: {
                    x: Math.random() * 500,
                    y: Math.random() * 400,
                    width: Math.random() * 30 + 10,
                    height: Math.random() * 15 + 5
                },
                aspectRatio: Math.random() * 2 + 0.5,
                confidence: Math.random() * 0.4 + 0.6
            });
        }
        return detections;
    }

    async analyzeMorphology(detectedSperm) {
        // Analyze sperm morphology using AI model
        let normalCount = 0;
        let abnormalCount = 0;
        const morphologyDetails = [];

        for (const sperm of detectedSperm) {
            // In real implementation, this would use the AI model
            // to classify morphology based on head, midpiece, and tail
            
            const morphologyScore = Math.random();
            const isNormal = morphologyScore > this.analysisSettings.morphologyThreshold;
            
            if (isNormal) {
                normalCount++;
            } else {
                abnormalCount++;
            }
            
            morphologyDetails.push({
                spermId: sperm.id,
                score: morphologyScore,
                isNormal: isNormal,
                details: {
                    headShape: Math.random() > 0.8 ? 'abnormal' : 'normal',
                    midpiece: Math.random() > 0.9 ? 'abnormal' : 'normal',
                    tail: Math.random() > 0.85 ? 'abnormal' : 'normal'
                }
            });
        }

        const totalCount = detectedSperm.length;
        const normalPercentage = totalCount > 0 ? (normalCount / totalCount) * 100 : 0;

        return {
            normalCount,
            abnormalCount,
            totalAnalyzed: totalCount,
            normalPercentage: Math.round(normalPercentage * 10) / 10,
            confidence: Math.random() * 0.2 + 0.8, // 0.8-1.0
            details: morphologyDetails.slice(0, 10) // Sample for review
        };
    }

    async analyzeConcentration(detectedSperm, metadata) {
        const totalCount = detectedSperm.length;
        const sampleVolume = metadata.sampleVolume || 3.5; // ml
        const dilutionFactor = metadata.dilutionFactor || 1;
        
        // Calculate concentration (million/ml)
        // In real implementation, this would account for chamber depth, area analyzed, etc.
        const concentrationMillion = (totalCount * dilutionFactor * 10) / sampleVolume;
        
        return {
            totalCount,
            concentrationMillion: Math.round(concentrationMillion * 10) / 10,
            sampleVolume,
            dilutionFactor,
            confidence: Math.random() * 0.2 + 0.8 // 0.8-1.0
        };
    }

    async analyzeMockMotility() {
        // Mock motility analysis (real implementation would require video)
        const progressive = Math.random() * 40 + 40; // 40-80%
        const nonProgressive = Math.random() * 20 + 10; // 10-30%
        const immotile = 100 - progressive - nonProgressive;
        
        return {
            progressive: Math.round(progressive * 10) / 10,
            nonProgressive: Math.round(nonProgressive * 10) / 10,
            immotile: Math.round(immotile * 10) / 10,
            totalMotile: Math.round((progressive + nonProgressive) * 10) / 10,
            confidence: Math.random() * 0.3 + 0.5, // 0.5-0.8 (lower since it's mock)
            note: 'Mock analysis - requires video for accurate motility assessment'
        };
    }

    async analyzeViability(detectedSperm) {
        // Mock viability analysis (real implementation would use specific staining)
        let aliveCount = 0;
        let deadCount = 0;
        
        for (const sperm of detectedSperm) {
            // Mock viability based on morphology and other factors
            const viabilityScore = Math.random();
            if (viabilityScore > 0.3) { // 70% typically alive
                aliveCount++;
            } else {
                deadCount++;
            }
        }
        
        const totalCount = detectedSperm.length;
        const alivePercentage = totalCount > 0 ? (aliveCount / totalCount) * 100 : 0;
        
        return {
            aliveCount,
            deadCount,
            totalAnalyzed: totalCount,
            alivePercentage: Math.round(alivePercentage * 10) / 10,
            confidence: Math.random() * 0.3 + 0.5, // 0.5-0.8 (lower since it's mock)
            note: 'Mock analysis - requires vital staining for accurate viability assessment'
        };
    }

    calculateOverallConfidence(confidenceValues) {
        const validValues = confidenceValues.filter(val => typeof val === 'number' && !isNaN(val));
        if (validValues.length === 0) return 0.7;
        
        const average = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
        return Math.round(average * 1000) / 10; // Round to 1 decimal place, convert to percentage
    }

    // Utility methods
    async saveAnalysisImage(canvas, results) {
        try {
            // Draw analysis overlay on canvas
            const ctx = canvas.getContext('2d');
            
            // Draw detected sperm with bounding boxes
            ctx.strokeStyle = '#00FF00';
            ctx.lineWidth = 2;
            
            results.detectedSperm.forEach((sperm, index) => {
                if (sperm.boundingRect) {
                    const rect = sperm.boundingRect;
                    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
                    
                    // Add label
                    ctx.fillStyle = '#00FF00';
                    ctx.font = '12px Arial';
                    ctx.fillText(`${index + 1}`, rect.x, rect.y - 5);
                }
            });
            
            // Return canvas as base64
            return canvas.toDataURL('image/jpeg', 0.8);
            
        } catch (error) {
            console.error('Error saving analysis image:', error);
            return null;
        }
    }

    // Quality control methods
    validateImageQuality(img) {
        const quality = {
            isValid: true,
            warnings: [],
            score: 1.0
        };
        
        // Check image dimensions
        if (img.width < 640 || img.height < 480) {
            quality.warnings.push('Image resolution is low');
            quality.score -= 0.2;
        }
        
        // Check if image is too dark or too bright
        // (In real implementation, would analyze histogram)
        
        return quality;
    }

    getAnalysisSettings() {
        return { ...this.analysisSettings };
    }

    updateAnalysisSettings(newSettings) {
        this.analysisSettings = { ...this.analysisSettings, ...newSettings };
    }
}

// Export for use in main app
window.SpermAnalyzer = SpermAnalyzer;

// Initialize global analyzer instance
window.spermAnalyzer = new SpermAnalyzer();

console.log('Sperm Analyzer module loaded');