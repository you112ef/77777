// Storage Management for Sperm Analyzer
// Handles local storage, IndexedDB, and data synchronization

class StorageManager {
    constructor() {
        this.dbName = 'SpermAnalyzerDB';
        this.dbVersion = 1;
        this.db = null;
        this.stores = {
            analyses: 'analyses',
            images: 'images',
            settings: 'settings',
            cache: 'cache'
        };
    }

    async init() {
        try {
            await this.initIndexedDB();
            await this.initSettings();
            console.log('Storage Manager initialized successfully');
        } catch (error) {
            console.error('Error initializing storage:', error);
            // Fallback to localStorage
            this.useFallback = true;
        }
    }

    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            if (!window.indexedDB) {
                reject(new Error('IndexedDB not supported'));
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create analyses store
                if (!db.objectStoreNames.contains(this.stores.analyses)) {
                    const analysesStore = db.createObjectStore(this.stores.analyses, {
                        keyPath: 'id',
                        autoIncrement: false
                    });
                    analysesStore.createIndex('timestamp', 'timestamp', { unique: false });
                    analysesStore.createIndex('patientId', 'patientId', { unique: false });
                }

                // Create images store
                if (!db.objectStoreNames.contains(this.stores.images)) {
                    const imagesStore = db.createObjectStore(this.stores.images, {
                        keyPath: 'id',
                        autoIncrement: false
                    });
                    imagesStore.createIndex('analysisId', 'analysisId', { unique: false });
                }

                // Create settings store
                if (!db.objectStoreNames.contains(this.stores.settings)) {
                    db.createObjectStore(this.stores.settings, {
                        keyPath: 'key'
                    });
                }

                // Create cache store
                if (!db.objectStoreNames.contains(this.stores.cache)) {
                    const cacheStore = db.createObjectStore(this.stores.cache, {
                        keyPath: 'key'
                    });
                    cacheStore.createIndex('expiry', 'expiry', { unique: false });
                }
            };
        });
    }

    async initSettings() {
        const defaultSettings = {
            language: 'ar',
            theme: 'light',
            notifications: true,
            autoSave: true,
            analysisSettings: {
                confidenceThreshold: 0.5,
                maxSpermCount: 200,
                autoAnalysis: true
            },
            privacy: {
                dataRetention: 90, // days
                anonymizeData: false,
                shareAnalytics: false
            }
        };

        const existing = await this.getSetting('appSettings');
        if (!existing) {
            await this.setSetting('appSettings', defaultSettings);
        }
    }

    // Analysis management
    async saveAnalysis(analysis) {
        try {
            if (this.useFallback) {
                return this.saveAnalysisToLocalStorage(analysis);
            }

            const transaction = this.db.transaction([this.stores.analyses], 'readwrite');
            const store = transaction.objectStore(this.stores.analyses);
            
            // Add metadata
            analysis.savedAt = new Date().toISOString();
            analysis.version = '1.0';
            
            await new Promise((resolve, reject) => {
                const request = store.put(analysis);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            console.log('Analysis saved to IndexedDB:', analysis.id);
            return analysis.id;

        } catch (error) {
            console.error('Error saving analysis:', error);
            throw error;
        }
    }

    async getAnalysis(analysisId) {
        try {
            if (this.useFallback) {
                return this.getAnalysisFromLocalStorage(analysisId);
            }

            const transaction = this.db.transaction([this.stores.analyses], 'readonly');
            const store = transaction.objectStore(this.stores.analyses);

            return new Promise((resolve, reject) => {
                const request = store.get(analysisId);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

        } catch (error) {
            console.error('Error getting analysis:', error);
            return null;
        }
    }

    async getAllAnalyses(limit = 100, offset = 0) {
        try {
            if (this.useFallback) {
                return this.getAllAnalysesFromLocalStorage(limit, offset);
            }

            const transaction = this.db.transaction([this.stores.analyses], 'readonly');
            const store = transaction.objectStore(this.stores.analyses);
            const index = store.index('timestamp');

            const analyses = [];
            let count = 0;
            let skipped = 0;

            return new Promise((resolve, reject) => {
                const request = index.openCursor(null, 'prev'); // newest first

                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor && count < limit) {
                        if (skipped < offset) {
                            skipped++;
                            cursor.continue();
                            return;
                        }

                        analyses.push(cursor.value);
                        count++;
                        cursor.continue();
                    } else {
                        resolve(analyses);
                    }
                };

                request.onerror = () => reject(request.error);
            });

        } catch (error) {
            console.error('Error getting all analyses:', error);
            return [];
        }
    }

    async deleteAnalysis(analysisId) {
        try {
            if (this.useFallback) {
                return this.deleteAnalysisFromLocalStorage(analysisId);
            }

            const transaction = this.db.transaction([this.stores.analyses, this.stores.images], 'readwrite');
            
            // Delete analysis
            const analysesStore = transaction.objectStore(this.stores.analyses);
            await new Promise((resolve, reject) => {
                const request = analysesStore.delete(analysisId);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

            // Delete associated images
            const imagesStore = transaction.objectStore(this.stores.images);
            const imagesIndex = imagesStore.index('analysisId');
            
            await new Promise((resolve, reject) => {
                const request = imagesIndex.openCursor(IDBKeyRange.only(analysisId));
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        cursor.continue();
                    } else {
                        resolve();
                    }
                };
                request.onerror = () => reject(request.error);
            });

            console.log('Analysis deleted:', analysisId);

        } catch (error) {
            console.error('Error deleting analysis:', error);
            throw error;
        }
    }

    // Image management
    async saveImage(imageData, analysisId, type = 'original') {
        try {
            const imageRecord = {
                id: `${analysisId}_${type}_${Date.now()}`,
                analysisId: analysisId,
                type: type, // 'original', 'processed', 'annotated'
                data: imageData,
                timestamp: new Date().toISOString(),
                size: imageData.length
            };

            if (this.useFallback) {
                // Don't save large images to localStorage
                console.warn('Image not saved - using localStorage fallback');
                return imageRecord.id;
            }

            const transaction = this.db.transaction([this.stores.images], 'readwrite');
            const store = transaction.objectStore(this.stores.images);

            await new Promise((resolve, reject) => {
                const request = store.put(imageRecord);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

            return imageRecord.id;

        } catch (error) {
            console.error('Error saving image:', error);
            throw error;
        }
    }

    async getImage(imageId) {
        try {
            if (this.useFallback) {
                return null;
            }

            const transaction = this.db.transaction([this.stores.images], 'readonly');
            const store = transaction.objectStore(this.stores.images);

            return new Promise((resolve, reject) => {
                const request = store.get(imageId);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

        } catch (error) {
            console.error('Error getting image:', error);
            return null;
        }
    }

    // Settings management
    async setSetting(key, value) {
        try {
            const setting = { key, value, timestamp: new Date().toISOString() };

            if (this.useFallback) {
                localStorage.setItem(`setting_${key}`, JSON.stringify(setting));
                return;
            }

            const transaction = this.db.transaction([this.stores.settings], 'readwrite');
            const store = transaction.objectStore(this.stores.settings);

            await new Promise((resolve, reject) => {
                const request = store.put(setting);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

        } catch (error) {
            console.error('Error setting value:', error);
            throw error;
        }
    }

    async getSetting(key) {
        try {
            if (this.useFallback) {
                const stored = localStorage.getItem(`setting_${key}`);
                return stored ? JSON.parse(stored).value : null;
            }

            const transaction = this.db.transaction([this.stores.settings], 'readonly');
            const store = transaction.objectStore(this.stores.settings);

            const result = await new Promise((resolve, reject) => {
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });

            return result ? result.value : null;

        } catch (error) {
            console.error('Error getting setting:', error);
            return null;
        }
    }

    // Cache management
    async setCache(key, value, ttl = 3600000) { // 1 hour default
        try {
            const cacheItem = {
                key,
                value,
                timestamp: Date.now(),
                expiry: Date.now() + ttl
            };

            if (this.useFallback) {
                localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
                return;
            }

            const transaction = this.db.transaction([this.stores.cache], 'readwrite');
            const store = transaction.objectStore(this.stores.cache);

            await new Promise((resolve, reject) => {
                const request = store.put(cacheItem);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

        } catch (error) {
            console.error('Error setting cache:', error);
        }
    }

    async getCache(key) {
        try {
            let cacheItem;

            if (this.useFallback) {
                const stored = localStorage.getItem(`cache_${key}`);
                cacheItem = stored ? JSON.parse(stored) : null;
            } else {
                const transaction = this.db.transaction([this.stores.cache], 'readonly');
                const store = transaction.objectStore(this.stores.cache);

                cacheItem = await new Promise((resolve, reject) => {
                    const request = store.get(key);
                    request.onsuccess = () => resolve(request.result);
                    request.onerror = () => reject(request.error);
                });
            }

            if (!cacheItem) return null;

            // Check expiry
            if (Date.now() > cacheItem.expiry) {
                await this.deleteCache(key);
                return null;
            }

            return cacheItem.value;

        } catch (error) {
            console.error('Error getting cache:', error);
            return null;
        }
    }

    async deleteCache(key) {
        try {
            if (this.useFallback) {
                localStorage.removeItem(`cache_${key}`);
                return;
            }

            const transaction = this.db.transaction([this.stores.cache], 'readwrite');
            const store = transaction.objectStore(this.stores.cache);

            await new Promise((resolve, reject) => {
                const request = store.delete(key);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });

        } catch (error) {
            console.error('Error deleting cache:', error);
        }
    }

    // Cleanup methods
    async clearExpiredCache() {
        try {
            if (this.useFallback) {
                // Clean localStorage cache
                const keys = Object.keys(localStorage);
                for (const key of keys) {
                    if (key.startsWith('cache_')) {
                        const item = JSON.parse(localStorage.getItem(key));
                        if (Date.now() > item.expiry) {
                            localStorage.removeItem(key);
                        }
                    }
                }
                return;
            }

            const transaction = this.db.transaction([this.stores.cache], 'readwrite');
            const store = transaction.objectStore(this.stores.cache);
            const index = store.index('expiry');

            const range = IDBKeyRange.upperBound(Date.now());
            const request = index.openCursor(range);

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };

        } catch (error) {
            console.error('Error clearing expired cache:', error);
        }
    }

    async getStorageUsage() {
        try {
            if (navigator.storage && navigator.storage.estimate) {
                const estimate = await navigator.storage.estimate();
                return {
                    used: estimate.usage,
                    available: estimate.quota,
                    percentage: (estimate.usage / estimate.quota) * 100
                };
            }
            
            return { used: 0, available: 0, percentage: 0 };

        } catch (error) {
            console.error('Error getting storage usage:', error);
            return { used: 0, available: 0, percentage: 0 };
        }
    }

    // localStorage fallback methods
    saveAnalysisToLocalStorage(analysis) {
        try {
            const analyses = JSON.parse(localStorage.getItem('analyses') || '[]');
            analyses.unshift(analysis);
            
            // Keep only last 50 analyses in localStorage
            if (analyses.length > 50) {
                analyses.splice(50);
            }
            
            localStorage.setItem('analyses', JSON.stringify(analyses));
            return analysis.id;

        } catch (error) {
            console.error('Error saving to localStorage:', error);
            throw error;
        }
    }

    getAnalysisFromLocalStorage(analysisId) {
        try {
            const analyses = JSON.parse(localStorage.getItem('analyses') || '[]');
            return analyses.find(a => a.id === analysisId) || null;

        } catch (error) {
            console.error('Error getting from localStorage:', error);
            return null;
        }
    }

    getAllAnalysesFromLocalStorage(limit = 100, offset = 0) {
        try {
            const analyses = JSON.parse(localStorage.getItem('analyses') || '[]');
            return analyses.slice(offset, offset + limit);

        } catch (error) {
            console.error('Error getting all from localStorage:', error);
            return [];
        }
    }

    deleteAnalysisFromLocalStorage(analysisId) {
        try {
            const analyses = JSON.parse(localStorage.getItem('analyses') || '[]');
            const filtered = analyses.filter(a => a.id !== analysisId);
            localStorage.setItem('analyses', JSON.stringify(filtered));

        } catch (error) {
            console.error('Error deleting from localStorage:', error);
            throw error;
        }
    }

    // Export/Import functionality
    async exportAnalyses(analysisIds = null) {
        try {
            let analyses;
            
            if (analysisIds) {
                analyses = await Promise.all(
                    analysisIds.map(id => this.getAnalysis(id))
                );
                analyses = analyses.filter(Boolean);
            } else {
                analyses = await this.getAllAnalyses();
            }

            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                analysisCount: analyses.length,
                analyses: analyses
            };

            return JSON.stringify(exportData, null, 2);

        } catch (error) {
            console.error('Error exporting analyses:', error);
            throw error;
        }
    }

    async importAnalyses(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (!data.analyses || !Array.isArray(data.analyses)) {
                throw new Error('Invalid import data format');
            }

            let imported = 0;
            const errors = [];

            for (const analysis of data.analyses) {
                try {
                    // Generate new ID to avoid conflicts
                    analysis.id = this.generateId();
                    analysis.imported = true;
                    analysis.importDate = new Date().toISOString();
                    
                    await this.saveAnalysis(analysis);
                    imported++;

                } catch (error) {
                    errors.push({ analysis: analysis.id, error: error.message });
                }
            }

            return { imported, errors, total: data.analyses.length };

        } catch (error) {
            console.error('Error importing analyses:', error);
            throw error;
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Export for use in main app
window.StorageManager = StorageManager;

// Initialize global storage manager
window.storageManager = new StorageManager();

console.log('Storage Manager module loaded');