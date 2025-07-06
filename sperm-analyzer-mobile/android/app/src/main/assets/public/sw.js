// Service Worker for Sperm Analyzer AI
// Enables offline functionality

const CACHE_NAME = 'sperm-analyzer-v1';
const urlsToCache = [
    './',
    './index.html',
    './css/style.css',
    './css/components.css',
    './js/app.js',
    './js/capacitor.js',
    './js/tf.min.js',
    './js/cv.js',
    './js/camera.js',
    './js/analyzer.js',
    './js/storage.js',
    './js/ui.js',
    './assets/icon/icon.png',
    './assets/icon/logo.png',
    './manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
    console.log('[SW] Install event');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('[SW] Error caching:', error);
            })
    );
    
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activate event');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Claim all clients immediately
    self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension requests
    if (event.request.url.startsWith('chrome-extension://')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version if available
                if (response) {
                    console.log('[SW] Serving from cache:', event.request.url);
                    return response;
                }
                
                // Fallback to network
                console.log('[SW] Fetching from network:', event.request.url);
                return fetch(event.request).then(response => {
                    // Don't cache if not a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
            .catch(error => {
                console.error('[SW] Fetch failed:', error);
                
                // Return offline fallback for navigation requests
                if (event.request.mode === 'navigate') {
                    return caches.match('./index.html');
                }
                
                throw error;
            })
    );
});

// Background sync for analysis results
self.addEventListener('sync', event => {
    console.log('[SW] Background sync event:', event.tag);
    
    if (event.tag === 'sync-analysis') {
        event.waitUntil(syncAnalysisResults());
    }
});

// Sync analysis results when online
async function syncAnalysisResults() {
    try {
        console.log('[SW] Syncing analysis results');
        
        // Get pending analysis results from IndexedDB
        const pendingResults = await getPendingResults();
        
        for (const result of pendingResults) {
            try {
                // Send to server when implementation is available
                console.log('[SW] Would sync result:', result.id);
                // await fetch('/api/sync-result', { method: 'POST', body: JSON.stringify(result) });
                
                // Mark as synced
                await markResultAsSynced(result.id);
                
            } catch (error) {
                console.error('[SW] Failed to sync result:', result.id, error);
            }
        }
        
    } catch (error) {
        console.error('[SW] Sync failed:', error);
    }
}

// IndexedDB helpers (placeholder implementations)
async function getPendingResults() {
    // In a real implementation, this would query IndexedDB
    return [];
}

async function markResultAsSynced(resultId) {
    // In a real implementation, this would update IndexedDB
    console.log('[SW] Marked as synced:', resultId);
}

// Push notification support
self.addEventListener('push', event => {
    console.log('[SW] Push received:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'إشعار من محلل الحيوانات المنوية',
        icon: './assets/icon/icon.png',
        badge: './assets/icon/icon.png',
        vibrate: [200, 100, 200],
        tag: 'sperm-analyzer-notification',
        actions: [
            {
                action: 'open',
                title: 'فتح التطبيق',
                icon: './assets/icon/icon.png'
            },
            {
                action: 'dismiss',
                title: 'إغلاق',
                icon: './assets/icon/icon.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('محلل الحيوانات المنوية', options)
    );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
    console.log('[SW] Notification click:', event);
    
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handler for communication with main thread
self.addEventListener('message', event => {
    console.log('[SW] Message received:', event.data);
    
    switch (event.data.type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;
            
        case 'GET_VERSION':
            event.ports[0].postMessage({ version: CACHE_NAME });
            break;
            
        case 'CACHE_ANALYSIS':
            cacheAnalysisResult(event.data.result);
            break;
    }
});

// Cache analysis result for offline access
async function cacheAnalysisResult(result) {
    try {
        const cache = await caches.open(CACHE_NAME);
        const response = new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' }
        });
        
        await cache.put(`/analysis/${result.id}`, response);
        console.log('[SW] Cached analysis result:', result.id);
        
    } catch (error) {
        console.error('[SW] Failed to cache analysis result:', error);
    }
}