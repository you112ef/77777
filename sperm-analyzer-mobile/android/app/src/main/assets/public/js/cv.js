// OpenCV.js Mock for Computer Vision Processing
// This provides image processing capabilities for sperm analysis

window.cv = {
    // Mock OpenCV ready state
    onRuntimeInitialized: () => {
        console.log('OpenCV.js Mock: Runtime initialized');
    },
    
    // Image reading and processing
    imread: (imageElement) => {
        console.log('OpenCV.js: Reading image');
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = imageElement.width || imageElement.naturalWidth || 640;
        canvas.height = imageElement.height || imageElement.naturalHeight || 480;
        
        try {
            ctx.drawImage(imageElement, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            return {
                data: imageData.data,
                rows: canvas.height,
                cols: canvas.width,
                channels: 4,
                type: () => 24, // CV_8UC4
                size: () => ({ width: canvas.width, height: canvas.height }),
                clone: function() { return this; },
                delete: () => {}
            };
        } catch (error) {
            console.error('OpenCV.js: Error reading image:', error);
            return {
                data: new Uint8ClampedArray(640 * 480 * 4),
                rows: 480,
                cols: 640,
                channels: 4,
                type: () => 24,
                size: () => ({ width: 640, height: 480 }),
                clone: function() { return this; },
                delete: () => {}
            };
        }
    },
    
    // Image output
    imshow: (canvasId, mat) => {
        console.log('OpenCV.js: Displaying image on canvas:', canvasId);
        
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.warn('OpenCV.js: Canvas not found:', canvasId);
            return;
        }
        
        const ctx = canvas.getContext('2d');
        const imageData = new ImageData(
            new Uint8ClampedArray(mat.data),
            mat.cols,
            mat.rows
        );
        
        canvas.width = mat.cols;
        canvas.height = mat.rows;
        ctx.putImageData(imageData, 0, 0);
    },
    
    // Color space conversion
    cvtColor: (src, dst, code) => {
        console.log('OpenCV.js: Converting color space, code:', code);
        
        // Mock color conversion
        dst.data = new Uint8ClampedArray(src.data);
        dst.rows = src.rows;
        dst.cols = src.cols;
        dst.channels = code === cv.COLOR_BGR2GRAY ? 1 : 3;
    },
    
    // Gaussian blur
    GaussianBlur: (src, dst, ksize, sigmaX, sigmaY = 0) => {
        console.log('OpenCV.js: Applying Gaussian blur');
        
        // Mock blur - just copy the data
        dst.data = new Uint8ClampedArray(src.data);
        dst.rows = src.rows;
        dst.cols = src.cols;
        dst.channels = src.channels;
    },
    
    // Threshold
    threshold: (src, dst, thresh, maxval, type) => {
        console.log('OpenCV.js: Applying threshold');
        
        // Mock threshold
        dst.data = new Uint8ClampedArray(src.data.length);
        for (let i = 0; i < src.data.length; i++) {
            dst.data[i] = src.data[i] > thresh ? maxval : 0;
        }
        dst.rows = src.rows;
        dst.cols = src.cols;
        dst.channels = src.channels;
        
        return thresh;
    },
    
    // Morphological operations
    morphologyEx: (src, dst, op, kernel) => {
        console.log('OpenCV.js: Applying morphological operation:', op);
        
        // Mock morphology - just copy
        dst.data = new Uint8ClampedArray(src.data);
        dst.rows = src.rows;
        dst.cols = src.cols;
        dst.channels = src.channels;
    },
    
    // Find contours
    findContours: (image, contours, hierarchy, mode, method) => {
        console.log('OpenCV.js: Finding contours');
        
        // Mock contours - generate some random ones
        const numContours = Math.floor(Math.random() * 50) + 10; // 10-60 contours
        
        contours.clear = () => {};
        contours.size = () => numContours;
        contours.get = (i) => ({
            size: () => Math.floor(Math.random() * 20) + 4,
            get: (j) => ({
                x: Math.random() * image.cols,
                y: Math.random() * image.rows
            }),
            delete: () => {}
        });
        
        return numContours;
    },
    
    // Contour area
    contourArea: (contour) => {
        const size = contour.size();
        return Math.random() * 100 + 10; // Random area between 10-110
    },
    
    // Bounding rectangle
    boundingRect: (contour) => {
        return {
            x: Math.random() * 500,
            y: Math.random() * 400,
            width: Math.random() * 50 + 10,
            height: Math.random() * 50 + 10
        };
    },
    
    // Draw contours
    drawContours: (image, contours, contourIdx, color, thickness) => {
        console.log('OpenCV.js: Drawing contours');
        // Mock drawing - no actual drawing in mock
    },
    
    // Rectangle drawing
    rectangle: (img, pt1, pt2, color, thickness) => {
        console.log('OpenCV.js: Drawing rectangle');
        // Mock rectangle drawing
    },
    
    // Circle drawing
    circle: (img, center, radius, color, thickness) => {
        console.log('OpenCV.js: Drawing circle');
        // Mock circle drawing
    },
    
    // Matrix creation
    Mat: class {
        constructor(rows = 0, cols = 0, type = 24, scalar = [0, 0, 0, 0]) {
            this.rows = rows;
            this.cols = cols;
            this.channels = type === 0 ? 1 : (type === 16 ? 3 : 4);
            this.data = new Uint8ClampedArray(rows * cols * this.channels);
            
            if (scalar) {
                for (let i = 0; i < this.data.length; i += this.channels) {
                    for (let c = 0; c < this.channels; c++) {
                        this.data[i + c] = scalar[c] || 0;
                    }
                }
            }
        }
        
        size() {
            return { width: this.cols, height: this.rows };
        }
        
        type() {
            return this.channels === 1 ? 0 : (this.channels === 3 ? 16 : 24);
        }
        
        clone() {
            const cloned = new cv.Mat(this.rows, this.cols, this.type());
            cloned.data = new Uint8ClampedArray(this.data);
            return cloned;
        }
        
        delete() {
            // Mock cleanup
        }
    },
    
    // Scalar creation
    Scalar: class {
        constructor(v0 = 0, v1 = 0, v2 = 0, v3 = 0) {
            this.val = [v0, v1, v2, v3];
        }
    },
    
    // Point creation
    Point: class {
        constructor(x = 0, y = 0) {
            this.x = x;
            this.y = y;
        }
    },
    
    // Size creation
    Size: class {
        constructor(width = 0, height = 0) {
            this.width = width;
            this.height = height;
        }
    },
    
    // Vector classes
    MatVector: class {
        constructor() {
            this._data = [];
        }
        
        size() {
            return this._data.length;
        }
        
        get(index) {
            return this._data[index];
        }
        
        push_back(mat) {
            this._data.push(mat);
        }
        
        clear() {
            this._data = [];
        }
        
        delete() {
            this._data.forEach(mat => mat.delete && mat.delete());
            this._data = [];
        }
    },
    
    // Constants
    COLOR_BGR2GRAY: 6,
    COLOR_BGR2RGB: 4,
    COLOR_GRAY2BGR: 8,
    THRESH_BINARY: 0,
    THRESH_BINARY_INV: 1,
    MORPH_OPEN: 2,
    MORPH_CLOSE: 3,
    MORPH_ELLIPSE: 2,
    RETR_EXTERNAL: 0,
    CHAIN_APPROX_SIMPLE: 2,
    
    // Structural element
    getStructuringElement: (shape, ksize) => {
        return new cv.Mat(ksize.height, ksize.width, 0);
    }
};

// Initialize OpenCV mock
console.log('OpenCV.js Mock loaded');

// Simulate async loading
setTimeout(() => {
    if (cv.onRuntimeInitialized) {
        cv.onRuntimeInitialized();
    }
}, 100);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.cv;
}