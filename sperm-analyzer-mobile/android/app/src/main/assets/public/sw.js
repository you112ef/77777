// Service Worker for Offline Sperm Analyzer

const CACHE_NAME = 'sperm-analyzer-v1.0.0';
const OFFLINE_URL = '/index-offline.html';

// Files to cache for offline functionality
const FILES_TO_CACHE = [
  '/',
  '/index-offline.html',
  '/css/unified-styles.css',
  '/css/offline-styles.css',
  '/js/local-ai-processor.js',
  '/js/app-offline.js',
  '/logo.svg',
  '/icon-simple.svg',
  '/manifest-improved.json',
  '/assets/models/sperm_detector.tflite',
  '/assets/models/model_metadata.json',
  '/assets/models/model_info.json',
  '/assets/icons/icon-128x128.png',
  '/assets/icons/icon-192x192.png',
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.15.0/dist/tf.min.js',
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4.15.0/dist/tf-backend-webgl.min.js',
  'https://fonts.googleapis.com/icon?family=Material+Icons'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching files');
        return cache.addAll(FILES_TO_CACHE);
      })
      .then(() => {
        console.log('[SW] Files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Caching failed:', error);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Handle different types of requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then((cache) => {
              return cache.match(OFFLINE_URL);
            });
        })
    );
    return;
  }
  
  // Handle TensorFlow.js and model files
  if (event.request.url.includes('tensorflow') || 
      event.request.url.includes('.tflite') ||
      event.request.url.includes('model_')) {
    event.respondWith(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.match(event.request)
            .then((response) => {
              if (response) {
                console.log('[SW] Serving from cache:', event.request.url);
                return response;
              }
              
              return fetch(event.request)
                .then((response) => {
                  // Cache successful responses
                  if (response.status === 200) {
                    cache.put(event.request, response.clone());
                  }
                  return response;
                })
                .catch(() => {
                  console.log('[SW] Failed to fetch:', event.request.url);
                  return new Response('Offline - Resource not available', {
                    status: 503,
                    statusText: 'Service Unavailable'
                  });
                });
            });
        })
    );
    return;
  }
  
  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request)
          .then((response) => {
            // Don't cache POST requests or non-successful responses
            if (event.request.method === 'GET' && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
            }
            return response;
          })
          .catch(() => {
            // Return offline page for navigation requests
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_URL);
            }
            
            // Return empty response for other requests
            return new Response('', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Background sync for analysis results
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-analysis') {
    event.waitUntil(syncAnalysisResults());
  }
});

async function syncAnalysisResults() {
  try {
    // Get pending analysis results from IndexedDB
    const pendingResults = await getPendingAnalysisResults();
    
    for (const result of pendingResults) {
      try {
        // Try to sync with server when online
        await syncResultWithServer(result);
        await removePendingResult(result.id);
      } catch (error) {
        console.log('[SW] Failed to sync result:', error);
        // Keep for next sync attempt
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push notifications for analysis completion
self.addEventListener('push', (event) => {
  const options = {
    body: 'تم اكتمال تحليل العينة',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-128x128.png',
    tag: 'analysis-complete',
    requireInteraction: true,
    actions: [
      {
        action: 'view-results',
        title: 'عرض النتائج'
      },
      {
        action: 'dismiss',
        title: 'إغلاق'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('محلل الحيوانات المنوية', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view-results') {
    event.waitUntil(
      clients.openWindow('/#results')
    );
  }
});

// IndexedDB helper functions for offline storage
async function getPendingAnalysisResults() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SpermAnalyzerDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingResults'], 'readonly');
      const store = transaction.objectStore('pendingResults');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingResults')) {
        db.createObjectStore('pendingResults', { keyPath: 'id' });
      }
    };
  });
}

async function syncResultWithServer(result) {
  // Placeholder for server sync logic
  // In a real implementation, this would send data to your backend
  return fetch('/api/sync-analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(result)
  });
}

async function removePendingResult(id) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SpermAnalyzerDB', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['pendingResults'], 'readwrite');
      const store = transaction.objectStore('pendingResults');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    };
  });
}

// Update cache when new version is available
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] Service Worker loaded successfully');