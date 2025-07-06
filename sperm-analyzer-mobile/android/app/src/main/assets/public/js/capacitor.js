// Capacitor Core and Plugins
// This file handles Capacitor initialization and plugin management

// Mock Capacitor for web fallback
if (!window.Capacitor) {
    window.Capacitor = {
        isNativePlatform: () => false,
        getPlatform: () => 'web',
        Plugins: {
            Camera: {
                getPhoto: async (options) => {
                    // Web fallback for camera
                    return new Promise((resolve, reject) => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        
                        if (options.source === 'camera') {
                            input.capture = 'environment';
                        }
                        
                        input.onchange = (e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                    const base64 = e.target.result.split(',')[1];
                                    resolve({
                                        base64String: base64,
                                        format: file.type.split('/')[1],
                                        path: URL.createObjectURL(file),
                                        webPath: URL.createObjectURL(file)
                                    });
                                };
                                reader.onerror = () => reject(new Error('Failed to read file'));
                                reader.readAsDataURL(file);
                            } else {
                                reject(new Error('No file selected'));
                            }
                        };
                        
                        input.click();
                    });
                }
            },
            
            StatusBar: {
                setBackgroundColor: async (options) => {
                    console.log('StatusBar setBackgroundColor (web fallback):', options);
                    // Set meta theme-color for web
                    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
                    if (!metaThemeColor) {
                        metaThemeColor = document.createElement('meta');
                        metaThemeColor.name = 'theme-color';
                        document.head.appendChild(metaThemeColor);
                    }
                    metaThemeColor.content = options.color;
                },
                
                setStyle: async (options) => {
                    console.log('StatusBar setStyle (web fallback):', options);
                }
            },
            
            SplashScreen: {
                hide: async () => {
                    console.log('SplashScreen hide (web fallback)');
                    // Hide any splash screen element
                    const splash = document.getElementById('splash-screen');
                    if (splash) {
                        splash.style.display = 'none';
                    }
                }
            },
            
            Haptics: {
                impact: async (options) => {
                    console.log('Haptics impact (web fallback):', options);
                    // Web vibration API fallback
                    if (navigator.vibrate) {
                        const patterns = {
                            light: [50],
                            medium: [100],
                            heavy: [200]
                        };
                        navigator.vibrate(patterns[options.style] || [100]);
                    }
                }
            },
            
            Toast: {
                show: async (options) => {
                    console.log('Toast show (web fallback):', options);
                    // Use the app's toast system
                    if (window.app && typeof window.app.showToast === 'function') {
                        window.app.showToast(options.text, 'info', options.duration || 3000);
                    }
                }
            },
            
            Device: {
                getInfo: async () => {
                    const userAgent = navigator.userAgent;
                    const platform = navigator.platform;
                    
                    return {
                        model: 'Unknown',
                        platform: 'web',
                        operatingSystem: platform,
                        osVersion: 'Unknown',
                        manufacturer: 'Unknown',
                        isVirtual: false,
                        webViewVersion: 'Unknown'
                    };
                }
            },
            
            Filesystem: {
                writeFile: async (options) => {
                    console.log('Filesystem writeFile (web fallback):', options);
                    // Use IndexedDB or localStorage for web storage
                    localStorage.setItem(options.path, options.data);
                    return { uri: options.path };
                },
                
                readFile: async (options) => {
                    console.log('Filesystem readFile (web fallback):', options);
                    const data = localStorage.getItem(options.path);
                    if (!data) {
                        throw new Error('File not found');
                    }
                    return { data };
                },
                
                deleteFile: async (options) => {
                    console.log('Filesystem deleteFile (web fallback):', options);
                    localStorage.removeItem(options.path);
                }
            }
        }
    };
}

// Capacitor ready event
document.addEventListener('DOMContentLoaded', () => {
    console.log('Capacitor: DOM loaded');
    
    // Emit deviceready event for compatibility
    setTimeout(() => {
        const event = new CustomEvent('deviceready');
        document.dispatchEvent(event);
        console.log('Capacitor: deviceready event dispatched');
    }, 100);
});

// Helper functions for Capacitor plugins
window.CapacitorHelper = {
    // Check if running on native platform
    isNative: () => {
        return window.Capacitor && Capacitor.isNativePlatform();
    },
    
    // Get platform info
    getPlatform: () => {
        if (window.Capacitor) {
            return Capacitor.getPlatform();
        }
        return 'web';
    },
    
    // Safe plugin access
    getPlugin: (pluginName) => {
        if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins[pluginName]) {
            return Capacitor.Plugins[pluginName];
        }
        return null;
    },
    
    // Check if plugin is available
    isPluginAvailable: (pluginName) => {
        return !!window.CapacitorHelper.getPlugin(pluginName);
    },
    
    // Safe method call with fallback
    callMethod: async (pluginName, methodName, options = {}) => {
        const plugin = window.CapacitorHelper.getPlugin(pluginName);
        if (plugin && typeof plugin[methodName] === 'function') {
            try {
                return await plugin[methodName](options);
            } catch (error) {
                console.error(`Capacitor ${pluginName}.${methodName} error:`, error);
                throw error;
            }
        } else {
            console.warn(`Capacitor plugin ${pluginName}.${methodName} not available`);
            throw new Error(`Plugin ${pluginName} not available`);
        }
    }
};

// Extend console for better debugging
if (window.CapacitorHelper.isNative()) {
    console.log('Capacitor: Running on native platform');
} else {
    console.log('Capacitor: Running on web with fallbacks');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Capacitor: window.Capacitor, CapacitorHelper: window.CapacitorHelper };
}