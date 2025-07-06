// Camera and Image Utilities
// Handles camera access, image capture, and basic processing

class CameraManager {
    constructor() {
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.isInitialized = false;
        this.settings = {
            width: 1920,
            height: 1080,
            facingMode: 'environment', // Back camera
            quality: 0.9
        };
    }

    async initialize() {
        try {
            console.log('Initializing Camera Manager...');
            
            // Check for camera permissions
            if (navigator.permissions) {
                const permission = await navigator.permissions.query({ name: 'camera' });
                console.log('Camera permission:', permission.state);
            }

            this.isInitialized = true;
            console.log('Camera Manager initialized');

        } catch (error) {
            console.error('Error initializing camera:', error);
            throw error;
        }
    }

    async startCamera(videoElement, options = {}) {
        try {
            const constraints = {
                video: {
                    width: { ideal: options.width || this.settings.width },
                    height: { ideal: options.height || this.settings.height },
                    facingMode: options.facingMode || this.settings.facingMode,
                    aspectRatio: { ideal: 16/9 }
                }
            };

            // Request camera access
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            if (videoElement) {
                videoElement.srcObject = this.stream;
                this.video = videoElement;
                
                return new Promise((resolve, reject) => {
                    videoElement.onloadedmetadata = () => {
                        videoElement.play();
                        resolve(this.stream);
                    };
                    videoElement.onerror = reject;
                });
            }

            return this.stream;

        } catch (error) {
            console.error('Error starting camera:', error);
            throw this.handleCameraError(error);
        }
    }

    stopCamera() {
        try {
            if (this.stream) {
                this.stream.getTracks().forEach(track => {
                    track.stop();
                });
                this.stream = null;
            }

            if (this.video) {
                this.video.srcObject = null;
                this.video = null;
            }

            console.log('Camera stopped');

        } catch (error) {
            console.error('Error stopping camera:', error);
        }
    }

    async capturePhoto(sourceElement, options = {}) {
        try {
            const canvas = this.createCanvas();
            const ctx = canvas.getContext('2d');
            
            let source = sourceElement || this.video;
            if (!source) {
                throw new Error('No video source available');
            }

            // Set canvas dimensions
            const width = options.width || source.videoWidth || source.width || 1920;
            const height = options.height || source.videoHeight || source.height || 1080;
            
            canvas.width = width;
            canvas.height = height;

            // Draw the current frame
            ctx.drawImage(source, 0, 0, width, height);

            // Apply any filters or enhancements
            if (options.enhance) {
                this.enhanceImage(ctx, canvas);
            }

            // Convert to base64
            const quality = options.quality || this.settings.quality;
            const format = options.format || 'image/jpeg';
            const dataURL = canvas.toDataURL(format, quality);
            
            return {
                dataURL: dataURL,
                base64: dataURL.split(',')[1],
                width: width,
                height: height,
                format: format,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error capturing photo:', error);
            throw error;
        }
    }

    async loadImageFromFile(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                reject(new Error('Invalid file type'));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    const canvas = this.createCanvas();
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    const dataURL = canvas.toDataURL('image/jpeg', 0.9);
                    
                    resolve({
                        dataURL: dataURL,
                        base64: dataURL.split(',')[1],
                        width: img.width,
                        height: img.height,
                        format: 'image/jpeg',
                        originalFile: file,
                        timestamp: new Date().toISOString()
                    });
                };
                
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    createCanvas() {
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
        }
        return this.canvas;
    }

    enhanceImage(ctx, canvas) {
        try {
            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Apply contrast and brightness enhancement
            const contrast = 1.2;
            const brightness = 10;
            
            for (let i = 0; i < data.length; i += 4) {
                // Red
                data[i] = Math.max(0, Math.min(255, (data[i] - 128) * contrast + 128 + brightness));
                // Green  
                data[i + 1] = Math.max(0, Math.min(255, (data[i + 1] - 128) * contrast + 128 + brightness));
                // Blue
                data[i + 2] = Math.max(0, Math.min(255, (data[i + 2] - 128) * contrast + 128 + brightness));
                // Alpha unchanged
            }

            // Put the enhanced image data back
            ctx.putImageData(imageData, 0, 0);

        } catch (error) {
            console.warn('Error enhancing image:', error);
        }
    }

    async resizeImage(imageData, maxWidth = 1920, maxHeight = 1080, quality = 0.9) {
        try {
            const img = new Image();
            
            return new Promise((resolve, reject) => {
                img.onload = () => {
                    const canvas = this.createCanvas();
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate new dimensions
                    let { width, height } = this.calculateDimensions(
                        img.width, 
                        img.height, 
                        maxWidth, 
                        maxHeight
                    );
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Use high-quality scaling
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // Draw resized image
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const dataURL = canvas.toDataURL('image/jpeg', quality);
                    
                    resolve({
                        dataURL: dataURL,
                        base64: dataURL.split(',')[1],
                        width: width,
                        height: height,
                        originalWidth: img.width,
                        originalHeight: img.height
                    });
                };
                
                img.onerror = () => reject(new Error('Failed to load image for resizing'));
                img.src = imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`;
            });

        } catch (error) {
            console.error('Error resizing image:', error);
            throw error;
        }
    }

    calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
        let width = originalWidth;
        let height = originalHeight;
        
        // Calculate scaling factor
        const scaleX = maxWidth / width;
        const scaleY = maxHeight / height;
        const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
        
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        
        return { width, height };
    }

    async compressImage(imageData, quality = 0.8, maxSizeKB = 500) {
        try {
            let currentQuality = quality;
            let result = null;
            let attempts = 0;
            const maxAttempts = 5;
            
            while (attempts < maxAttempts) {
                const img = new Image();
                
                result = await new Promise((resolve, reject) => {
                    img.onload = () => {
                        const canvas = this.createCanvas();
                        const ctx = canvas.getContext('2d');
                        
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        
                        const dataURL = canvas.toDataURL('image/jpeg', currentQuality);
                        const sizeKB = (dataURL.length * 0.75) / 1024; // Approximate size
                        
                        resolve({
                            dataURL: dataURL,
                            base64: dataURL.split(',')[1],
                            sizeKB: sizeKB,
                            quality: currentQuality
                        });
                    };
                    
                    img.onerror = () => reject(new Error('Failed to load image for compression'));
                    img.src = imageData.startsWith('data:') ? imageData : `data:image/jpeg;base64,${imageData}`;
                });
                
                if (result.sizeKB <= maxSizeKB || currentQuality <= 0.1) {
                    break;
                }
                
                // Reduce quality for next attempt
                currentQuality -= 0.1;
                attempts++;
            }
            
            return result;

        } catch (error) {
            console.error('Error compressing image:', error);
            throw error;
        }
    }

    async getCameraCapabilities() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getSupportedConstraints) {
                return null;
            }

            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            const capabilities = {
                supportedConstraints: navigator.mediaDevices.getSupportedConstraints(),
                videoDevices: videoDevices.map(device => ({
                    deviceId: device.deviceId,
                    label: device.label,
                    groupId: device.groupId
                })),
                hasBackCamera: videoDevices.some(device => 
                    device.label.toLowerCase().includes('back') || 
                    device.label.toLowerCase().includes('rear')
                ),
                hasFrontCamera: videoDevices.some(device => 
                    device.label.toLowerCase().includes('front') || 
                    device.label.toLowerCase().includes('user')
                )
            };

            return capabilities;

        } catch (error) {
            console.error('Error getting camera capabilities:', error);
            return null;
        }
    }

    async switchCamera() {
        try {
            if (!this.stream) {
                throw new Error('No active camera stream');
            }

            // Toggle between front and back camera
            const currentFacingMode = this.settings.facingMode;
            const newFacingMode = currentFacingMode === 'environment' ? 'user' : 'environment';
            
            this.stopCamera();
            
            this.settings.facingMode = newFacingMode;
            
            if (this.video) {
                await this.startCamera(this.video);
            }

            return newFacingMode;

        } catch (error) {
            console.error('Error switching camera:', error);
            throw error;
        }
    }

    handleCameraError(error) {
        let userMessage = 'حدث خطأ في الوصول للكاميرا';
        
        switch (error.name) {
            case 'NotAllowedError':
                userMessage = 'تم رفض الإذن للوصول للكاميرا';
                break;
            case 'NotFoundError':
                userMessage = 'لم يتم العثور على كاميرا';
                break;
            case 'NotReadableError':
                userMessage = 'الكاميرا قيد الاستخدام من تطبيق آخر';
                break;
            case 'OverconstrainedError':
                userMessage = 'إعدادات الكاميرا غير مدعومة';
                break;
            case 'SecurityError':
                userMessage = 'خطأ أمني في الوصول للكاميرا';
                break;
            default:
                userMessage = `خطأ في الكاميرا: ${error.message}`;
        }
        
        return new Error(userMessage);
    }

    // Utility methods
    base64ToBlob(base64, mimeType = 'image/jpeg') {
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    }

    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    validateImage(imageData) {
        const validation = {
            isValid: true,
            warnings: [],
            errors: []
        };

        try {
            // Check if it's a valid base64 image
            if (!imageData || typeof imageData !== 'string') {
                validation.errors.push('Invalid image data');
                validation.isValid = false;
                return validation;
            }

            // Check size (approximate)
            const sizeKB = (imageData.length * 0.75) / 1024;
            
            if (sizeKB > 5000) { // 5MB
                validation.warnings.push('Image size is very large (>5MB)');
            }
            
            if (sizeKB < 10) { // 10KB
                validation.warnings.push('Image size is very small (<10KB)');
            }

            return validation;

        } catch (error) {
            validation.errors.push('Error validating image: ' + error.message);
            validation.isValid = false;
            return validation;
        }
    }

    getSettings() {
        return { ...this.settings };
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
    }

    // Cleanup
    destroy() {
        this.stopCamera();
        
        if (this.canvas) {
            this.canvas = null;
        }
        
        this.isInitialized = false;
    }
}

// Export for use in main app
window.CameraManager = CameraManager;

// Initialize global camera manager
window.cameraManager = new CameraManager();

console.log('Camera Manager module loaded');