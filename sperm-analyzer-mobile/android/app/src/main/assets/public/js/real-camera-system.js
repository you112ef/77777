/**
 * Real Camera System - Advanced camera integration for sperm analysis
 * Supports Capacitor Camera plugin and web fallbacks
 */

class RealCameraSystem {
    constructor() {
        this.isInitialized = false;
        this.hasPermissions = false;
        this.supportedModes = {
            camera: false,
            gallery: false,
            video: false
        };
        
        this.cameraSettings = {
            quality: 90,
            width: 1920,
            height: 1080,
            format: 'jpeg',
            correctOrientation: true,
            saveToGallery: false
        };
        
        this.initializeCamera();
    }
    
    async initializeCamera() {
        try {
            console.log('📷 Initializing camera system...');
            
            // Check if running in Capacitor
            if (window.Capacitor) {
                await this.initializeCapacitorCamera();
            } else {
                await this.initializeWebCamera();
            }
            
            this.isInitialized = true;
            console.log('✅ Camera system initialized successfully');
            
        } catch (error) {
            console.error('❌ Camera initialization failed:', error);
            // Continue with limited functionality
            this.isInitialized = true;
        }
    }
    
    async initializeCapacitorCamera() {
        const { Camera } = window.Capacitor.Plugins;
        
        if (!Camera) {
            throw new Error('Camera plugin not available');
        }
        
        try {
            // Check permissions
            const permissions = await Camera.checkPermissions();
            
            if (permissions.camera === 'granted') {
                this.hasPermissions = true;
                this.supportedModes.camera = true;
                this.supportedModes.gallery = true;
            } else if (permissions.camera === 'prompt') {
                // Request permissions
                const result = await Camera.requestPermissions();
                if (result.camera === 'granted') {
                    this.hasPermissions = true;
                    this.supportedModes.camera = true;
                    this.supportedModes.gallery = true;
                }
            }
            
            console.log('📱 Capacitor camera available:', this.supportedModes);
            
        } catch (error) {
            console.warn('Capacitor camera setup failed:', error);
        }
    }
    
    async initializeWebCamera() {
        try {
            // Check if getUserMedia is available
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                this.supportedModes.camera = true;
                console.log('🌐 Web camera available');
            }
            
            // Check if file input is supported
            if (window.File && window.FileReader) {
                this.supportedModes.gallery = true;
                console.log('📁 File selection available');
            }
            
        } catch (error) {
            console.warn('Web camera setup failed:', error);
        }
    }
    
    async capturePhoto(options = {}) {
        if (!this.isInitialized) {
            throw new Error('Camera system not initialized');
        }
        
        const settings = { ...this.cameraSettings, ...options };
        
        try {
            if (window.Capacitor && this.supportedModes.camera) {
                return await this.captureWithCapacitor(settings);
            } else if (this.supportedModes.camera) {
                return await this.captureWithWeb(settings);
            } else {
                throw new Error('Camera not available');
            }
        } catch (error) {
            console.error('Photo capture failed:', error);
            throw new Error(`فشل في التقاط الصورة: ${error.message}`);
        }
    }
    
    async captureWithCapacitor(settings) {
        const { Camera, CameraResultType, CameraSource } = window.Capacitor.Plugins;
        
        const image = await Camera.getPhoto({
            quality: settings.quality,
            allowEditing: false,
            resultType: CameraResultType.Base64,
            source: CameraSource.Camera,
            width: settings.width,
            height: settings.height,
            correctOrientation: settings.correctOrientation,
            saveToGallery: settings.saveToGallery
        });
        
        return image.base64String;
    }
    
    async captureWithWeb(settings) {
        return new Promise((resolve, reject) => {
            // Create video element for camera preview
            const video = document.createElement('video');
            video.autoplay = true;
            video.muted = true;
            video.playsInline = true;
            
            // Create canvas for capture
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Create capture modal
            const modal = this.createCaptureModal(video, canvas, ctx, resolve, reject);
            document.body.appendChild(modal);
            
            // Start camera stream
            navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: settings.width },
                    height: { ideal: settings.height },
                    facingMode: 'environment' // Use back camera if available
                }
            }).then(stream => {
                video.srcObject = stream;
                
                // Setup canvas size when video loads
                video.addEventListener('loadedmetadata', () => {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                });
                
            }).catch(error => {
                document.body.removeChild(modal);
                reject(new Error(`فشل في الوصول للكاميرا: ${error.message}`));
            });
        });
    }
    
    createCaptureModal(video, canvas, ctx, resolve, reject) {
        const modal = document.createElement('div');
        modal.className = 'camera-modal';
        modal.innerHTML = `
            <div class="camera-modal-content">
                <div class="camera-header">
                    <h3>التقاط صورة العينة</h3>
                    <button class="close-camera" title="إغلاق">
                        <i class="material-icons">close</i>
                    </button>
                </div>
                <div class="camera-preview">
                    <div class="video-container"></div>
                </div>
                <div class="camera-controls">
                    <button class="capture-btn">
                        <i class="material-icons">camera_alt</i>
                        <span>التقاط</span>
                    </button>
                </div>
            </div>
        `;
        
        // Add video to preview
        modal.querySelector('.video-container').appendChild(video);
        
        // Handle capture
        modal.querySelector('.capture-btn').addEventListener('click', () => {
            this.captureFrame(video, canvas, ctx).then(base64 => {
                this.closeCameraModal(modal, video);
                resolve(base64);
            }).catch(error => {
                reject(error);
            });
        });
        
        // Handle close
        modal.querySelector('.close-camera').addEventListener('click', () => {
            this.closeCameraModal(modal, video);
            reject(new Error('تم إلغاء التقاط الصورة'));
        });
        
        return modal;
    }
    
    async captureFrame(video, canvas, ctx) {
        try {
            // Draw video frame to canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Convert to base64
            const base64 = canvas.toDataURL('image/jpeg', 0.9);
            
            // Remove data URL prefix
            return base64.split(',')[1];
            
        } catch (error) {
            throw new Error(`فشل في معالجة الصورة: ${error.message}`);
        }
    }
    
    closeCameraModal(modal, video) {
        // Stop camera stream
        if (video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
        
        // Remove modal
        if (modal.parentElement) {
            modal.parentElement.removeChild(modal);
        }
    }
    
    async pickImage(options = {}) {
        if (!this.isInitialized) {
            throw new Error('Camera system not initialized');
        }
        
        const settings = { ...this.cameraSettings, ...options };
        
        try {
            if (window.Capacitor && this.supportedModes.gallery) {
                return await this.pickWithCapacitor(settings);
            } else if (this.supportedModes.gallery) {
                return await this.pickWithWeb(settings);
            } else {
                throw new Error('Image selection not available');
            }
        } catch (error) {
            console.error('Image selection failed:', error);
            throw new Error(`فشل في اختيار الصورة: ${error.message}`);
        }
    }
    
    async pickWithCapacitor(settings) {
        const { Camera, CameraResultType, CameraSource } = window.Capacitor.Plugins;
        
        const image = await Camera.getPhoto({
            quality: settings.quality,
            allowEditing: false,
            resultType: CameraResultType.Base64,
            source: CameraSource.Photos,
            correctOrientation: settings.correctOrientation
        });
        
        return image.base64String;
    }
    
    async pickWithWeb(settings) {
        return new Promise((resolve, reject) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.capture = false; // Don't force camera, allow gallery
            
            input.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (!file) {
                    reject(new Error('لم يتم اختيار صورة'));
                    return;
                }
                
                // Validate file type
                if (!file.type.startsWith('image/')) {
                    reject(new Error('يرجى اختيار ملف صورة صحيح'));
                    return;
                }
                
                // Validate file size (max 10MB)
                if (file.size > 10 * 1024 * 1024) {
                    reject(new Error('حجم الصورة كبير جداً (الحد الأقصى 10 ميجا)'));
                    return;
                }
                
                this.processImageFile(file, settings).then(resolve).catch(reject);
            });
            
            input.click();
        });
    }
    
    async processImageFile(file, settings) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const img = new Image();
                
                img.onload = () => {
                    try {
                        // Create canvas for processing
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Calculate dimensions maintaining aspect ratio
                        const { width, height } = this.calculateDimensions(
                            img.width, img.height, settings.width, settings.height
                        );
                        
                        canvas.width = width;
                        canvas.height = height;
                        
                        // Draw and resize image
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Apply image enhancements for microscopy
                        this.enhanceForMicroscopy(ctx, width, height);
                        
                        // Convert to base64
                        const base64 = canvas.toDataURL('image/jpeg', settings.quality / 100);
                        resolve(base64.split(',')[1]);
                        
                    } catch (error) {
                        reject(new Error(`فشل في معالجة الصورة: ${error.message}`));
                    }
                };
                
                img.onerror = () => {
                    reject(new Error('فشل في تحميل الصورة'));
                };
                
                img.src = event.target.result;
            };
            
            reader.onerror = () => {
                reject(new Error('فشل في قراءة الملف'));
            };
            
            reader.readAsDataURL(file);
        });
    }
    
    calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
        let { width, height } = { width: originalWidth, height: originalHeight };
        
        // Scale down if too large
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }
        
        return { width, height };
    }
    
    enhanceForMicroscopy(ctx, width, height) {
        try {
            // Get image data for processing
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            
            // Apply contrast enhancement
            const contrast = 1.2;
            const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
            
            for (let i = 0; i < data.length; i += 4) {
                // Apply contrast to RGB channels
                data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));     // Red
                data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)); // Green
                data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)); // Blue
                // Alpha channel remains unchanged
            }
            
            // Apply sharpening filter
            this.applySharpeningFilter(data, width, height);
            
            // Put processed data back
            ctx.putImageData(imageData, 0, 0);
            
        } catch (error) {
            console.warn('Image enhancement failed:', error);
            // Continue without enhancement
        }
    }
    
    applySharpeningFilter(data, width, height) {
        // Simple sharpening kernel
        const kernel = [
            0, -1, 0,
            -1, 5, -1,
            0, -1, 0
        ];
        
        const tempData = new Uint8ClampedArray(data);
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                for (let c = 0; c < 3; c++) { // RGB channels only
                    let sum = 0;
                    
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const idx = ((y + ky) * width + (x + kx)) * 4 + c;
                            const kernelIdx = (ky + 1) * 3 + (kx + 1);
                            sum += tempData[idx] * kernel[kernelIdx];
                        }
                    }
                    
                    const idx = (y * width + x) * 4 + c;
                    data[idx] = Math.min(255, Math.max(0, sum));
                }
            }
        }
    }
    
    async recordVideo(options = {}) {
        if (!this.supportedModes.video) {
            throw new Error('Video recording not supported');
        }
        
        // Implementation for video recording would go here
        // This is a placeholder for future video analysis features
        throw new Error('Video recording feature coming soon');
    }
    
    // Utility methods
    getCapabilities() {
        return {
            camera: this.supportedModes.camera,
            gallery: this.supportedModes.gallery,
            video: this.supportedModes.video,
            hasPermissions: this.hasPermissions,
            isInitialized: this.isInitialized,
            platform: window.Capacitor ? 'native' : 'web'
        };
    }
    
    async requestPermissions() {
        if (window.Capacitor) {
            const { Camera } = window.Capacitor.Plugins;
            const result = await Camera.requestPermissions();
            this.hasPermissions = result.camera === 'granted';
            return this.hasPermissions;
        } else {
            // For web, permissions are requested when accessing camera
            return true;
        }
    }
    
    updateSettings(newSettings) {
        this.cameraSettings = { ...this.cameraSettings, ...newSettings };
    }
    
    // Image validation and analysis helpers
    validateImageForAnalysis(imageElement) {
        const validationResult = {
            isValid: true,
            warnings: [],
            errors: [],
            suggestions: []
        };
        
        // Check image dimensions
        const width = imageElement.width || imageElement.naturalWidth;
        const height = imageElement.height || imageElement.naturalHeight;
        
        if (width < 640 || height < 480) {
            validationResult.warnings.push('الصورة صغيرة الحجم - قد تؤثر على دقة التحليل');
            validationResult.suggestions.push('استخدم صورة بدقة أعلى (1920x1080 أو أكثر)');
        }
        
        if (width / height < 1.2 || width / height > 2.0) {
            validationResult.warnings.push('نسبة العرض إلى الارتفاع غير مثالية للتحليل');
            validationResult.suggestions.push('استخدم صورة بنسبة عرض إلى ارتفاع 16:9 أو 4:3');
        }
        
        // Check if image appears to be microscopy image
        if (!this.isMicroscopyImage(imageElement)) {
            validationResult.warnings.push('الصورة قد لا تكون من المجهر');
            validationResult.suggestions.push('تأكد من استخدام صور المجهر للحصول على أفضل النتائج');
        }
        
        return validationResult;
    }
    
    isMicroscopyImage(imageElement) {
        // Simple heuristic to check if image looks like microscopy
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 100;
        canvas.height = 100;
        
        ctx.drawImage(imageElement, 0, 0, 100, 100);
        
        const imageData = ctx.getImageData(0, 0, 100, 100);
        const data = imageData.data;
        
        let totalBrightness = 0;
        let darkPixels = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            totalBrightness += brightness;
            
            if (brightness < 50) {
                darkPixels++;
            }
        }
        
        const avgBrightness = totalBrightness / (data.length / 4);
        const darkPixelRatio = darkPixels / (data.length / 4);
        
        // Microscopy images typically have:
        // - Medium brightness (not too bright, not too dark)
        // - Some dark areas (background)
        return avgBrightness > 50 && avgBrightness < 200 && darkPixelRatio > 0.1;
    }
    
    // Image metadata extraction
    extractImageMetadata(file) {
        return new Promise((resolve) => {
            const metadata = {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: new Date(file.lastModified),
                exif: null
            };
            
            // Try to extract EXIF data if available
            if (window.EXIF && window.EXIF.getData) {
                window.EXIF.getData(file, function() {
                    metadata.exif = {
                        make: window.EXIF.getTag(this, "Make"),
                        model: window.EXIF.getTag(this, "Model"),
                        orientation: window.EXIF.getTag(this, "Orientation"),
                        dateTime: window.EXIF.getTag(this, "DateTime"),
                        software: window.EXIF.getTag(this, "Software")
                    };
                    resolve(metadata);
                });
            } else {
                resolve(metadata);
            }
        });
    }
}

// Export for global use
window.RealCameraSystem = RealCameraSystem;